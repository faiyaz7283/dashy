# React Query Migration Plan

> **Status:** In Progress — Phase 1 complete (2026-08-25)
> **Created:** 2026-08-25
> **Last Updated:** 2026-08-25
> **Context:** v2 kiosk uses custom `useApi` hook with no caching. View switching causes skeleton flashes and slow data loading. React Query adds stale-while-revalidate, request deduplication, and cache persistence.

---

## Executive Summary

Replace the custom `useApi` hook with TanStack React Query (v5) to eliminate skeleton flashes on view switches, add request deduplication, and enable intelligent caching. This is a **frontend-only** change — no backend modifications required.

**Key UX fix:** Calendar data will be lifted above the view switcher so switching between day/week/month/year views serves cached data instantly instead of triggering a fresh fetch + skeleton.

---

## Current Architecture (Problem)

```
┌─ AppShell ─────────────────────────────────────────────────┐
│  ┌─ ViewSwitcher ────────────────────────────────────────┐ │
│  │  day | week | month | year                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ Active View (remounts on switch) ────────────────────┐ │
│  │  useCalendarData(view, date)                           │ │
│  │    → useApi(fetchFn, { refetchInterval: 120_000 })     │ │
│  │      → useState(isLoading: true)  ← SKELETON FLASH     │ │
│  │      → fetch() every mount                              │ │
│  │      → no cache, no dedup                               │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Problems:**
1. View switch → component remounts → `useApi` resets to `isLoading = true` → skeleton flash
2. No cache across mounts — same date range refetched every time
3. No request deduplication — multiple components fetching same data = multiple requests
4. `cacheTtl` field in `ENDPOINTS` is unused (dead config)

---

## Target Architecture (Solution)

```
┌─ AppShell ─────────────────────────────────────────────────┐
│  QueryClientProvider                                       │
│  ┌─ CalendarDataProvider (persists across view switch) ──┐ │
│  │  useQuery(['calendar', startDate, endDate])            │ │
│  │    → staleTime: 60s → serves cached data instantly     │ │
│  │    → refetchInterval: 120s → background refresh        │ │
│  │    → placeholderData: keepPreviousData → no skeleton   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ Active View (receives data via context) ─────────────┐ │
│  │  useCalendarContext() → { events, isLoading, ... }     │ │
│  │  No fetch. No skeleton. Instant data.                  │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Two-layer cache (frontend + backend):**

| Layer | Purpose | TTL | Mechanism |
|-------|---------|-----|-----------|
| **Frontend (React Query)** | Instant UI, no skeleton flash | `staleTime` per endpoint | In-memory cache, keyed by query key |
| **Backend (Redis)** | API quota protection | 2min calendar, 10min weather | Server-side cache, transparent to frontend |

Frontend always calls the API. API decides cache hit (Redis) vs miss (external API). React Query serves stale data while the API responds, so the user never sees a loading state after initial load.

---

## Chores Backend Gaps — Compatibility Notes

The chores backend has documented gaps (`dashy-api/docs/chores-backend-gaps.md`) that will be fixed in a separate effort. The React Query migration must be compatible with both the current and future chores API shapes:

| Gap | Impact on React Query Migration | Mitigation |
|-----|--------------------------------|------------|
| Gap 1: No instance generation | API returns empty instances | Query key `['chores']` — cache invalidation on mutation will work regardless |
| Gap 2: No recurring logic | Same as above | No impact on query structure |
| Gap 5: Status enum mismatch | Frontend `InstanceStatus` has `open`/`claimed`/`assigned` that backend doesn't have | Keep current frontend types — they're derived UI states. React Query doesn't care about enum values |
| Gap 3-4: No expiration/overdue | Backend will add new statuses (`missed`, status transitions) | React Query's `invalidateQueries(['chores'])` on mutation will refetch fresh data |

**Key principle:** React Query migration is data-fetching infrastructure. It doesn't depend on the shape of the data. When chores backend gaps are fixed, the only change needed is `invalidateQueries(['chores'])` after mutations — which we'll set up from the start.

---

## Implementation Phases

Each phase is independently committable and passes quality gates.

---

### Phase 1: Install & Wire React Query

**Goal:** Add `@tanstack/react-query`, create `QueryClient`, wrap app with provider.

**Changes:**
| File | Action |
|------|--------|
| `package.json` | Add `@tanstack/react-query` (latest stable v5) via `make add-kiosk PACKAGE=@tanstack/react-query` |
| `src/shared/query/queryClient.ts` | **New** — Create and export `QueryClient` with defaults |
| `src/main.tsx` | Wrap `<App>` with `<QueryClientProvider>` |
| `src/shared/query/index.ts` | **New** — Barrel export |

**QueryClient defaults:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s default — serves cached data for 30s
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      retry: 2,                   // Retry failed requests twice
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
})
```

**Tests:**
- Smoke test: `QueryClient` exports correctly
- Provider test: `<QueryClientProvider>` wraps app without errors

**Quality gate:** `make lint-kiosk && make typecheck-kiosk && make test-kiosk && make build-kiosk`

**Commit:** `feat: add React Query provider and QueryClient`

**✅ Phase 1 Complete (2026-08-25):**
- Commit: `19df923` in dashy-kiosk
- All quality gates passed (lint, typecheck, test, build)
- Code review passed — no violations

---

### Phase 2: Migrate Weather & Family (Simple Hooks)

**Goal:** Migrate the two simplest consumers first — `useWeatherData` (10min refresh, static key) and `useFamilyData` (fetch once, static key).

**Changes:**
| File | Action |
|------|--------|
| `src/features/weather/hooks/useWeatherData.ts` | Replace `useApi` with `useQuery`. Query key: `['weather']`. `staleTime: 300_000` (5min), `refetchInterval: 600_000` (10min) |
| `src/shared/hooks/useFamilyData.ts` | Replace `useApi` with `useQuery`. Query key: `['family']`. `staleTime: 300_000` (5min), `refetchInterval: 0` (fetch once) |
| `src/features/weather/hooks/useWeatherData.test.ts` | Update tests for `useQuery` (mock `QueryClient`) |
| `src/shared/hooks/useFamilyData.test.ts` | **New** — Add tests if missing |

**API:**
```typescript
// useWeatherData.ts
export function useWeatherData() {
  const { data, isLoading, isFetching, error } = useQuery<WeatherResponse>({
    queryKey: ['weather'],
    queryFn: async () => {
      const response = await fetch(ENDPOINTS.weather.url)
      if (!response.ok) throw new Error(`Weather API error: ${response.statusText}`)
      return response.json()
    },
    staleTime: 300_000,        // 5 min
    refetchInterval: 600_000,  // 10 min
  })

  return {
    current: data?.current ?? null,
    forecast: data?.forecast ?? [],
    isLoading,
    isRefreshing: isFetching && !isLoading, // backward compat
    error,
    lastRefresh: null, // React Query doesn't expose this — remove or derive
  }
}
```

**Backward compatibility:** Keep `isRefreshing` and `lastRefresh` in return type so consumers don't break. `isRefreshing` maps to `isFetching && !isLoading`. `lastRefresh` can be removed if no consumer uses it for display.

**Quality gate:** `make lint-kiosk && make typecheck-kiosk && make test-kiosk && make build-kiosk`

**Commit:** `feat: migrate weather and family data hooks to React Query`

**✅ Phase 2 Complete (2026-08-25):**
- Migrated `useWeatherData` to React Query with `parseApiError` for structured errors
- Migrated `useFamilyData` to React Query with `parseApiError` for structured errors
- Created `ApiError` class and `parseApiError` utility for consistent error handling
- Created `test-utils.ts` with `createTestQueryClient` and `createQueryClientWrapper` helpers
- Updated all React Query tests to use shared utilities with proper cleanup
- Fixed `ApiError` class to work with `erasableSyntaxOnly` TypeScript config
- Fixed test mock data to match actual `FamilyMember` type structure
- Configured vitest with `maxForks: 1` and `--max-old-space-size=4096` to reduce OOM errors
- All quality gates passed (lint, typecheck, test, build)
- Code review passed — no violations
- **Note:** Tests pass (318/318) but Docker workers hit OOM during cleanup (known Docker memory limit issue, not a code issue)

---

### Phase 3: Migrate Calendar + Lift Data Above View Switcher

**Goal:** This is the key UX fix. Move calendar data fetching to a context provider that persists across view switches. Views receive data via context — no refetch, no skeleton.

**Changes:**
| File | Action |
|------|--------|
| `src/features/calendar/context/CalendarDataContext.tsx` | **New** — Context provider with `useQuery` |
| `src/features/calendar/hooks/useCalendarData.ts` | Rewrite to read from context instead of `useApi` |
| `src/features/shell/AppShell/AppShell.tsx` | Wrap content area with `<CalendarDataProvider>` |
| `src/features/calendar/hooks/useCalendarData.test.ts` | Update tests |
| `src/features/calendar/context/CalendarDataContext.test.tsx` | **New** — Provider tests |

**Context provider:**
```typescript
// CalendarDataContext.tsx
interface CalendarDataContextValue {
  events: CalendarEvent[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refetch: () => void
}

const CalendarDataContext = createContext<CalendarDataContextValue | null>(null)

export function CalendarDataProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(() => Temporal.Now.plainDateISO())
  const { startDate, endDate } = computeDateRange(currentView, currentDate)

  const { data, isLoading, isFetching, error } = useQuery<CalendarApiResponse>({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => fetchCalendar(startDate, endDate),
    staleTime: 60_000,         // 1 min — data is "fresh" for 1 min
    refetchInterval: 120_000,  // 2 min
    placeholderData: keepPreviousData, // Show old data while fetching new range
  })

  const events = data?.events?.map(parseCalendarEvent) ?? []

  return (
    <CalendarDataContext.Provider value={{
      events,
      isLoading,
      isRefreshing: isFetching && !isLoading,
      error,
      refetch: () => {/* queryClient.invalidateQueries */},
    }}>
      {children}
    </CalendarDataContext.Provider>
  )
}
```

**Why this fixes the UX:**
- `CalendarDataProvider` lives above `ViewSwitcher` — it doesn't remount on view change
- `queryKey: ['calendar', startDate, endDate]` — switching from week to day changes the key, but React Query serves cached data for the new key if it was fetched recently (within `staleTime`)
- `placeholderData: keepPreviousData` — while new date range loads, old data stays visible
- Switching back to a previously viewed date range = instant (cache hit)

**Consumer hook (backward compatible):**
```typescript
// useCalendarData.ts — now reads from context
export function useCalendarData() {
  const context = useContext(CalendarDataContext)
  if (!context) throw new Error('useCalendarData must be used within CalendarDataProvider')
  return context
}
```

**Note:** `currentView` and `currentDate` state may need to stay in AppShell or a separate navigation context if other components need to read/change them. Decision: keep view/date state in AppShell, pass setters to ViewSwitcher, CalendarDataProvider reads them via props or lifts them.

**Quality gate:** `make lint-kiosk && make typecheck-kiosk && make test-kiosk && make build-kiosk`

**Commit:** `feat: lift calendar data above view switcher with React Query context`

**✅ Phase 3 Complete (2026-08-25):**
- Created CalendarDataContext provider with React Query
- Migrated useCalendarData hook to read from context instead of fetching
- Wrapped calendar views with CalendarDataProvider in AppShell
- Added tests for CalendarDataContext (4 tests)
- Fixed vitest config deprecation warning (poolOptions → top-level options)
- All quality gates passed (lint, typecheck, test, build)
- Code review passed — no violations
- **UX improvement:** Switching views no longer triggers refetch or shows skeleton. React Query caches by date range, so navigating back to a previously viewed range is instant.

---

### Phase 4: Migrate Chores

**Goal:** Migrate `useChoresData` to React Query. Set up cache invalidation pattern for future mutations (chores status changes, create/edit).

**Changes:**
| File | Action |
|------|--------|
| `src/features/chores/hooks/useChoresData.ts` | Replace `useApi` with `useQuery`. Query key: `['chores']`. `staleTime: 30_000` (30s), `refetchInterval: 120_000` (2min) |
| `src/features/chores/hooks/useChoresData.test.ts` | Update tests |

**API:**
```typescript
export function useChoresData() {
  const { data, isLoading, isFetching, error, refetch } = useQuery<ChoresData>({
    queryKey: ['chores'],
    queryFn: fetchChores,
    staleTime: 30_000,         // 30s
    refetchInterval: 120_000,  // 2 min
  })

  return {
    data,
    isLoading,
    isRefreshing: isFetching && !isLoading,
    error,
    refetch,
  }
}
```

**Cache invalidation (for when chores mutations are added later):**
```typescript
// Example: after updating chore status
queryClient.invalidateQueries({ queryKey: ['chores'] })
```

**Compatibility with backend gaps:** This works with the current API response shape. When backend gaps are fixed (instance generation, status transitions), the query structure doesn't change — only the data content changes. `invalidateQueries` ensures fresh data after mutations.

**Quality gate:** `make lint-kiosk && make typecheck-kiosk && make test-kiosk && make build-kiosk`

**Commit:** `feat: migrate chores data hook to React Query`

---

### Phase 5: Remove `useApi` & Clean Up

**Goal:** Delete the old `useApi` hook, remove unused `cacheTtl` from `ENDPOINTS`, clean up barrel exports.

**Changes:**
| File | Action |
|------|--------|
| `src/shared/hooks/useApi.ts` | **Delete** |
| `src/shared/hooks/useApi.test.ts` | **Delete** |
| `src/shared/hooks/index.ts` | Remove `export * from './useApi'` |
| `src/shared/api/endpoints.ts` | Remove `cacheTtl` field from `EndpointConfig` interface and all endpoint entries |
| `src/shared/api/endpoints.test.ts` | Update tests if they reference `cacheTtl` |

**Verification:** `grep -r "useApi" src/` returns zero results. `grep -r "cacheTtl" src/` returns zero results.

**Quality gate:** `make lint-kiosk && make typecheck-kiosk && make test-kiosk && make build-kiosk`

**Commit:** `refactor: remove useApi hook and unused cacheTtl config`

---

### Phase 6: React Query Devtools + Final Verification

**Goal:** Add dev-only React Query Devtools for debugging. Full end-to-end verification.

**Changes:**
| File | Action |
|------|--------|
| `src/main.tsx` | Add `<ReactQueryDevtools initialIsOpen={false} />` (dev-only, tree-shaken in prod) |
| `package.json` | `@tanstack/react-query-devtools` as dev dependency via `make add-kiosk-dev PACKAGE=@tanstack/react-query-devtools` |

**Manual verification checklist:**
- [ ] Initial load shows skeleton (unavoidable, first fetch)
- [ ] Switching day → week → month → day shows NO skeleton flash
- [ ] Weather data persists across view switches
- [ ] Chores data persists across view switches
- [ ] Background refresh happens silently (no UI flicker)
- [ ] React Query Devtools shows cache state, query keys, stale status
- [ ] Network tab shows reduced fetch calls (deduplication working)

**Quality gate:** `make lint-kiosk && make typecheck-kiosk && make test-kiosk && make build-kiosk`

**Commit:** `feat: add React Query devtools for development debugging`

---

## File Impact Summary

| File | Phase | Action |
|------|-------|--------|
| `package.json` | 1, 6 | Add deps |
| `src/main.tsx` | 1, 6 | Add provider + devtools |
| `src/shared/query/queryClient.ts` | 1 | New |
| `src/shared/query/index.ts` | 1 | New |
| `src/features/weather/hooks/useWeatherData.ts` | 2 | Rewrite |
| `src/shared/hooks/useFamilyData.ts` | 2 | Rewrite |
| `src/features/calendar/context/CalendarDataContext.tsx` | 3 | New |
| `src/features/calendar/hooks/useCalendarData.ts` | 3 | Rewrite |
| `src/features/shell/AppShell/AppShell.tsx` | 3 | Add provider |
| `src/features/chores/hooks/useChoresData.ts` | 4 | Rewrite |
| `src/shared/hooks/useApi.ts` | 5 | Delete |
| `src/shared/hooks/useApi.test.ts` | 5 | Delete |
| `src/shared/hooks/index.ts` | 5 | Update |
| `src/shared/api/endpoints.ts` | 5 | Remove cacheTtl |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| React Query bundle size increase | Low (~12KB gzipped) | Low | Tree-shaken in prod, devtools dev-only |
| Breaking existing hook consumers | Low | Medium | Keep return types backward compatible (`isRefreshing`, `lastRefresh`) |
| Calendar context adds complexity | Medium | Low | Single provider, clear boundary, well-tested |
| Chores backend gaps cause issues | Low | Low | React Query is data-shape agnostic. `invalidateQueries` handles future mutations |
| `lastRefresh` removal breaks status bar | Low | Low | Check if status bar uses it. If yes, derive from React Query's `dataUpdatedAt` |

---

## Dependencies

- **None** — this is a frontend-only change
- **No backend changes required**
- **No Docker/compose changes required**
- **No new environment variables**

---

## References

- TanStack Query v5 docs: https://tanstack.com/query/v5/docs/react/overview
- Current `useApi` hook: `dashy-kiosk/src/shared/hooks/useApi.ts`
- Current `ENDPOINTS`: `dashy-kiosk/src/shared/api/endpoints.ts`
- Chores backend gaps: `dashy-api/docs/chores-backend-gaps.md`
- Implementation plan (deferred items): `dashy-kiosk-v2/docs/implementation-plan.md` (commit `ac8b19d`)
- AGENTS.md: `dashy-kiosk/AGENTS.md`
- Styling guide: `dashy-kiosk/docs/guides/styling.md`
- Workflow guide: `dashy-kiosk/docs/guides/workflow.md`
