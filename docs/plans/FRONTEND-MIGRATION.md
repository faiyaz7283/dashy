# Frontend Migration Plan

> Status: **COMPLETE** ✅
> Created: 2026-08-16
> Completed: 2026-08-17
> Scope: Restructure frontend for configuration-driven design, unified styling, feature-based organization, decomposed god-components, and clean domain separation.

### Implementation Status (as of 2026-08-17)

| Phase | Status | Summary |
|-------|--------|---------|
| F1: Foundation | ✅ Complete | Path aliases, strict TS, error boundary, loading skeleton, dead code removal, locale centralization |
| F2: Unified Styling | ✅ Complete | CSS custom properties, Tailwind theme integration, migrated Sidebar/StatusBar to tokens, replaced all e.currentTarget.style mutations with CSS hover classes, fixed EventPopup viewport overflow with dynamic height measurement |
| F3: Extract Domain Logic | ✅ Complete | Created domain/calendar, domain/weather, domain/family directories with types.ts and utils.ts. Extracted getEventsForDate, getTimedEventsForDate, getAllDayEventsForDate, getWeatherForDate. Refactored DayView, WeekGrid, MonthView, YearView to use shared domain utils. Updated types/index.ts as barrel re-export |
| F4: Decompose App.tsx | ✅ Complete | Created useViewNavigation hook (view state + date navigation), AppShell component (layout orchestrator), extracted DatePicker from DateDisplay. App.tsx reduced from ~300 lines to 22 lines. Extracted density calculation to domain/calendar/density.ts |
| F5: Feature-Based Reorganization | ✅ Complete | Moved all components/hooks/utils/services to feature-based structure (features/calendar, features/weather, features/navigation, features/dashboard, features/kiosk, shared/). Updated all imports to @/ paths. Created barrel exports |
| F6: API Layer Cleanup | ✅ Complete | Endpoint registry, config-driven refresh intervals, dynamic member colors, config-driven nav items |
| F7: Extract WeatherTooltip Icons | ✅ Complete | Extracted 11 SVG icon components to icons/ directory (ThermometerIcon, FeelsLikeFaceIcon, HumidityIcon, WindIcon, UVIcon, PrecipIcon, PressureIcon, SunriseIcon, SunsetIcon, MoonIcon, TempChart). WeatherTooltip reduced from 968 lines to 359 lines |

**Platform compatibility note:** Temporal API requires Chromium 144+. The kiosk runs Chromium 151.0.7922.108 (verified via SSH to `r4pi` on 2026-08-17). No polyfill needed.

---

## Guiding Principles

### Modern Best Practices Over Legacy Patterns

This project is being built for longevity. Every decision should reflect current best practices, not outdated patterns.

**Rules:**
- **Always use latest stable package versions** — design around current APIs, not legacy ones
- **Verify package versions at implementation time** — check npm/pnpm registry for latest stable before adding any dependency
- **pnpm only** — no npm, no yarn. `pnpm-lock.yaml` committed. `"packageManager": "pnpm@<version>"` in `package.json`. CI uses `pnpm install`
- **TypeScript strict mode** — `strict: true` in tsconfig, no `any` types (enforced via `@typescript-eslint/no-explicit-any`)
- **Discard anything deprecated** — if a pattern uses deprecated APIs, find the modern equivalent
- **Functional over imperative** — no direct DOM mutation (`e.currentTarget.style.*`), no `querySelectorAll` hacks. React state or CSS only
- **Feature-based architecture** — co-locate components, hooks, and types by feature, not by technical role
- **Configuration-driven** — refresh intervals, member colors, nav items, endpoints all come from config/API, not hardcoded

### Documentation Standard — TSDoc (Mandatory)

All TypeScript code **must** follow TSDoc conventions. This is the frontend equivalent of the backend's Google-style docstrings.

**Convention:** [TSDoc Standard](https://tsdoc.org/)

**Rules:**
- **Every** exported function, component, hook, type, and interface gets a TSDoc comment
- Private helpers (`_prefixed` or module-internal) get comments when the logic is non-obvious
- Component comments describe purpose, props, and usage — not "Component that renders..."
- Hook comments describe what the hook does, its parameters, and return value
- Summary line: one line, imperative mood (`/** Fetch weather data for the given location. */`)
- Blank line between summary and `@param`/`@returns` tags
- Use `@param`, `@returns`, `@throws`, `@example`, `@see` as applicable
- Use `@remarks` for extended discussion that doesn't belong in the summary

**Example:**
```typescript
/**
 * Fetches weather data for the dashboard.
 *
 * Retrieves current conditions and forecast from the API,
 * applying unit conversion and caching per the configured refresh interval.
 *
 * @param units - Temperature unit system (`metric` | `imperial`).
 * @returns Parsed weather response with current conditions and daily forecast.
 * @throws {ApiError} When the weather API returns a non-2xx response.
 *
 * @example
 * ```ts
 * const weather = await fetchWeather('imperial');
 * console.log(weather.current.temperature); // 72
 * ```
 */
export async function fetchWeather(units: UnitSystem): Promise<WeatherResponse> { ... }
```

**Component example:**
```typescript
/**
 * Displays a single calendar event with optional member pills and location icon.
 *
 * Renders within a DayCard. Clicking opens the EventPopup with full details.
 * Recurring events show a repeat icon; events with location show a map pin icon.
 *
 * @param props.event - The calendar event to display.
 * @param props.isRecurring - Whether to show the recurring indicator.
 * @param props.onClick - Callback when the event is clicked.
 */
function EventItem({ event, isRecurring, onClick }: EventItemProps) { ... }
```

**Enforcement:**
- ESLint `eslint-plugin-tsdoc` rule enabled
- `make lint` must pass — TSDoc violations are lint failures
- All new code must comply; existing code upgraded during migration phases

**Why:** Consistent, readable documentation across the codebase. TSDoc comments power IDE tooltips, generated documentation, and help new contributors (or future-you) understand intent without reading implementation.

### Testing Strategy

#### Three-Tier Testing Approach

```
tests/
├── unit/                      # Pure logic tests (no DOM, no I/O)
│   ├── hooks/                 # Hook logic with mocked dependencies
│   ├── utils/                 # dateFormat, density, recurrence
│   └── domain/                # Calendar/weather utility functions
│
├── components/                # Component rendering + interaction tests
│   ├── DayCard.test.tsx
│   ├── EventItem.test.tsx
│   └── ...
│
└── integration/               # Full feature tests (API → render)
    ├── calendar-flow.test.tsx # Fetch → render → interact
    └── weather-flow.test.tsx
```

#### Test Tooling

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (Vite-native, fast, compatible with existing config) |
| **@testing-library/react** | Component rendering + user interaction |
| **@testing-library/user-event** | Realistic user events (click, type, hover) |
| **MSW (Mock Service Worker)** | API mocking at the network level (intercepts fetch) |
| **jsdom** | DOM environment for component tests |

#### Mocking Strategy

| Layer | What to Mock | How |
|-------|--------------|-----|
| **Unit** | Hooks, API calls | `vi.mock()` for modules, manual mocks for hooks |
| **Component** | API responses | MSW handlers for specific endpoints |
| **Integration** | Full API | MSW with realistic response scenarios |

#### Test Conventions

- **Co-locate tests** — `DayCard.test.tsx` lives next to `DayCard.tsx` (not in a separate `__tests__/` directory)
- **Name pattern** — `*.test.ts` / `*.test.tsx`
- **Arrange-Act-Assert** — every test follows this structure
- **No snapshot tests** — they're brittle and don't catch real regressions. Use explicit assertions
- **Test behavior, not implementation** — assert on visible output, not internal state
- **Coverage target** — 80% for utils/hooks, 70% for components (measured by Vitest)

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        'src/utils/**': { lines: 80, branches: 80 },
        'src/hooks/**': { lines: 80, branches: 80 },
        'src/**': { lines: 70, branches: 60 },
      },
    },
  },
});
```

### Type Checking Strategy

**Rule:** TypeScript strict mode is non-negotiable. The type system is the first line of defense against bugs.

**Configuration:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Rules:**
- **No `any`** — use `unknown` + type narrowing, or define proper types
- **No `@ts-ignore`** — use `@ts-expect-error` with a comment explaining why (rare exceptions only)
- **Explicit return types** on exported functions and hooks (helps catch accidental API changes)
- **Discriminated unions** over optional fields for variant types (e.g., `{ status: 'loading' } | { status: 'success', data: T } | { status: 'error', error: Error }`)
- **Path aliases** — `@/` maps to `src/` (configured in both tsconfig and Vite)

**Enforcement:**
- `make typecheck` runs `tsc --noEmit` — zero errors allowed
- ESLint `@typescript-eslint` ruleset with strict type-checking
- CI blocks merge on type errors

### Error Handling Strategy

**Rule:** Every failure mode has a defined user-facing behavior. No unhandled promise rejections, no blank screens, no silent failures.

#### Error Categories

| Category | Handling | Example |
|----------|----------|---------|
| **Render crash** | `<ErrorBoundary>` with fallback UI | Component throws during render |
| **API failure** | Retry (configurable), then error state with message | Weather API timeout |
| **Config failure** | Startup validation, show error screen | Missing API URL |
| **Network offline** | Show cached data + offline indicator | Pi loses internet |

#### Error Boundary Strategy

```
<App>
  <ErrorBoundary fallback={<AppErrorFallback />}>
    <AppShell>
      <ErrorBoundary fallback={<WidgetErrorFallback />}>
        <WeatherWidget />
      </ErrorBoundary>
      <ErrorBoundary fallback={<WidgetErrorFallback />}>
        <CalendarView />
      </ErrorBoundary>
    </AppShell>
  </ErrorBoundary>
</App>
```

- **Outer boundary** — catches fatal crashes, shows full-screen fallback with reload button
- **Per-widget boundaries** — one widget crashes, rest of dashboard still works
- **Error fallback** — shows error message + "Retry" button, logs error for debugging

#### API Error Handling Pattern

```typescript
// core/api/client.ts
interface ApiResult<T> {
  data: T | null;
  error: ApiError | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

// All fetch hooks return this shape — consistent error handling everywhere
function useDataFetcher<T>(endpoint: string): ApiResult<T> { ... }
```

- **No silent fallback to mock data** — show the error, let the user decide
- **Retry with backoff** — configurable per endpoint (weather: 3 retries, calendar: 2)
- **Stale-while-revalidate** — show cached data immediately, refresh in background

### Data Fetching Pattern

**Rule:** One unified data fetching pattern. No duplicated fetch logic across hooks.

#### Architecture

```
core/api/
├── client.ts          # Fetch client — retry, timeout, error mapping
├── endpoints.ts       # Endpoint registry — single source of truth
└── types.ts           # API request/response types (shared contract with backend)
```

#### Unified Fetch Hook

All data fetching goes through `useDataFetcher` — no component should call `fetch()` directly.

```typescript
// core/hooks/useDataFetcher.ts
interface UseDataFetcherOptions<T> {
  endpoint: string;
  transform?: (raw: unknown) => T;
  refreshInterval?: number;  // seconds, 0 = no auto-refresh
  staleTime?: number;        // seconds before data is considered stale
}

function useDataFetcher<T>(options: UseDataFetcherOptions<T>): ApiResult<T> { ... }
```

#### Caching Strategy (aligned with backend TTLs)

| Data | Backend Cache TTL | Frontend Refresh | Frontend Stale Time |
|------|-------------------|------------------|---------------------|
| Weather | 10 min (Redis) | 600s | 300s (show cached, refresh at 5 min) |
| Calendar | 2 min (Redis) | 120s | 60s |
| Family | No cache (SQLite) | On mount only | Never stale |

#### Endpoint Registry

```typescript
// core/api/endpoints.ts
export const ENDPOINTS = {
  weather: { url: '/api/v1/weather', method: 'GET', refreshInterval: 600 },
  calendar: { url: '/api/v1/calendar', method: 'GET', refreshInterval: 120 },
  family: { url: '/api/v1/family', method: 'GET', refreshInterval: 0 },
  health: { url: '/health', method: 'GET', refreshInterval: 0 },
} as const;
```

Adding a new endpoint requires only: add entry here + define response type in `core/api/types.ts`.

---

## Current State Audit

### Directory Structure
```
frontend/src/
├── App.tsx                    # ~300 lines — GOD COMPONENT
├── main.tsx                   # React root mount
├── index.css                  # Tailwind import + 4 custom CSS vars
│
├── components/                # 20 component folders (flat structure)
│   ├── Clock/
│   ├── DateDisplay/           # Contains hand-rolled date picker (~300 lines)
│   ├── DayCard/
│   ├── DayIndicator/
│   ├── DayView/
│   ├── DensityBadge/
│   ├── EventItem/             # Has sub-components: MapPinIcon, RecurringIcon
│   ├── EventModal/
│   ├── EventPopup/
│   ├── FamilyPills/
│   ├── Header/
│   ├── MonthView/
│   ├── Sidebar/               # Uses Tailwind (inconsistent with rest)
│   ├── SideNav/
│   ├── StatusBar/             # Uses Tailwind (inconsistent with rest)
│   ├── StickyArea/
│   ├── ViewSwitcher/
│   ├── WeatherTooltip/        # 967 LINES — contains ~15 inline SVG icons
│   ├── WeatherWidget/         # Has sub-component: WeatherIcon
│   ├── WeekGrid/
│   └── YearView/
│
├── data/
│   └── mockData.ts            # DEAD CODE — not imported anywhere
│
├── hooks/                     # 10 custom hooks (well-factored, good tests)
│   ├── useApi.ts              # Generic fetch wrapper
│   ├── useCalendarEvents.ts   # Duplicates useApi logic
│   ├── useEdgeProximity.ts    # macOS-Dock-style auto-hide
│   ├── useEventInteraction.ts # Unified popup/modal state
│   ├── useIdleCursor.ts       # Kiosk cursor auto-hide
│   ├── useOrientation.ts      # Landscape/portrait detection
│   ├── useSidebar.ts          # Sidebar state machine
│   ├── useUiScale.ts          # CSS zoom scale factor
│   ├── useViewportWidth.ts    # Responsive breakpoint driver
│   └── useWeatherTooltip.ts   # Weather tooltip state
│
├── services/
│   └── api.ts                 # Fetch layer with retry + cache
│
├── theme/                     # Well-structured design token system
│   ├── tokens.ts              # Colors, spacing, layout, radii, typography, etc.
│   ├── config.ts              # Semantic theme config
│   └── index.ts               # Barrel re-export
│
├── types/
│   └── index.ts               # All TypeScript interfaces in one file
│
└── utils/
    ├── dateFormat.ts           # Date formatting, week calculation
    ├── density.ts              # Density calculations (NO TESTS)
    └── recurrence.ts           # RRULE humanization
```

### Critical Issues Found

| # | Issue | Impact |
|---|-------|--------|
| 1 | `App.tsx` is a 300-line god-component | Owns view state, date nav, 3 data fetches, density calc, layout |
| 2 | Styling split — 17 inline styles, 3 Tailwind | No single source of truth at CSS level |
| 3 | Tokens not connected to Tailwind | Two parallel styling universes |
| 4 | Direct DOM mutation for hover effects | `e.currentTarget.style.*` in 6+ components — bypasses React |
| 5 | Duplicated `getEventsForDate`/`getWeatherForDate` | Copy-pasted across 4 view components |
| 6 | Duplicated popup/modal rendering | ~20 lines copy-pasted per view (4 views) |
| 7 | `WeatherTooltip.tsx` is 967 lines | Contains ~15 inline SVG icons |
| 8 | `useCalendarEvents` reimplements `useApi` | Duplicated loading/error/refresh logic |
| 9 | No path aliases | Deep `../../theme/tokens` imports everywhere |
| 10 | `memberColors` hardcoded in tokens | Adding a member requires code changes |
| 11 | Mock data is dead code | `mockData.ts` not imported anywhere |
| 12 | No error boundaries | Any render crash kills the entire app |
| 13 | No loading skeletons | Full-viewport "Loading..." text |
| 14 | Sidebar nav items hardcoded | 6 items, only Calendar functional |
| 15 | Hardcoded locale strings | `'en-US'` in 8+ files |
| 16 | No `strict: true` in tsconfig | Allows subtle null/undefined bugs |
| 17 | Date picker hand-rolled in DateDisplay | Complex widget, not extracted |
| 18 | `Sidebar.tsx` mixes Tailwind + DOM manipulation | Fragile `querySelectorAll` for label opacity |
| 19 | `useApi` has unused `_deps` parameter | Dead API surface |
| 20 | Refresh intervals hardcoded | 120s calendar, 600s weather in multiple files |

### What Works Well (preserve these)
- Clean hook layer — single-responsibility, well-tested
- Comprehensive design token system (`tokens.ts` + `config.ts`)
- Consistent component folder structure with barrel exports
- Lean dependency tree (only react, react-dom, tailwindcss)
- Good type coverage matching backend models
- Well-considered kiosk-specific features (auto-hide, cursor hiding, UI scaling)

---

## Target Architecture

```
frontend/src/
├── main.tsx                       # React root mount
├── App.tsx                        # Thin — just <ErrorBoundary><AppShell /></ErrorBoundary>
│
├── core/                          # Cross-cutting infrastructure
│   ├── config.ts                  # App configuration (from API or env)
│   ├── api/
│   │   ├── client.ts              # Fetch client with retry, timeout, error handling
│   │   ├── endpoints.ts           # Endpoint registry — single source of truth
│   │   └── types.ts               # API request/response types (shared contract)
│   ├── errors/
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   └── ErrorFallback.tsx      # Fallback UI for crashes
│   └── hooks/
│       ├── useDataFetcher.ts      # Unified data fetch hook (replaces useApi + useCalendarEvents)
│       └── useAutoRefresh.ts      # Extracted auto-refresh logic
│
├── domain/                        # Domain models + business logic
│   ├── weather/
│   │   ├── types.ts               # Weather-specific types
│   │   └── utils.ts               # Unit conversion, condition mapping
│   ├── calendar/
│   │   ├── types.ts               # Calendar-specific types
│   │   └── utils.ts               # getEventsForDate, date range computation
│   └── family/
│       └── types.ts               # Family member types
│
├── features/                      # Feature modules (replaces flat components/)
│   ├── calendar/
│   │   ├── views/
│   │   │   ├── DayView/
│   │   │   ├── WeekView/          # (renamed from WeekGrid)
│   │   │   ├── MonthView/
│   │   │   └── YearView/
│   │   ├── components/
│   │   │   ├── DayCard/
│   │   │   ├── EventItem/
│   │   │   ├── EventPopup/
│   │   │   ├── EventModal/
│   │   │   └── DateDisplay/       # Includes extracted DatePicker
│   │   ├── hooks/
│   │   │   ├── useCalendarEvents.ts
│   │   │   ├── useEventInteraction.ts
│   │   │   └── useViewNavigation.ts  # Extracted from App.tsx
│   │   └── index.ts
│   ├── weather/
│   │   ├── components/
│   │   │   ├── WeatherWidget/
│   │   │   ├── WeatherTooltip/
│   │   │   └── icons/             # Extracted from 967-line WeatherTooltip
│   │   ├── hooks/
│   │   │   └── useWeatherTooltip.ts
│   │   └── index.ts
│   ├── navigation/
│   │   ├── Sidebar/
│   │   ├── SideNav/
│   │   ├── ViewSwitcher/
│   │   └── StatusBar/
│   ├── dashboard/
│   │   ├── AppShell.tsx           # Layout orchestrator (replaces god App.tsx)
│   │   ├── Header/
│   │   ├── Clock/
│   │   ├── FamilyPills/
│   │   └── DensityBadge/
│   └── kiosk/
│       ├── hooks/
│       │   ├── useEdgeProximity.ts
│       │   ├── useIdleCursor.ts
│       │   ├── useOrientation.ts
│       │   └── useUiScale.ts
│       └── StickyArea/
│
├── theme/                         # Unchanged — already well-structured
│   ├── tokens.ts
│   ├── config.ts
│   └── index.ts
│
├── shared/                        # Shared UI primitives
│   ├── components/
│   │   ├── LoadingSkeleton/       # Replace "Loading..." text
│   │   └── Icon/                  # Shared SVG icon wrapper
│   └── utils/
│       ├── dateFormat.ts
│       ├── density.ts
│       └── recurrence.ts
│
└── types/                         # Global shared types (barrel re-export)
    └── index.ts
```

---

## Migration Phases

### Phase F1: Foundation (no behavior changes)

Fix the easy issues. No restructuring.

| Step | What | Why |
|------|------|-----|
| F1.1 | Migrate to pnpm | Remove `package-lock.json`, add `pnpm-lock.yaml`, set `"packageManager"` in `package.json`, update CI to use `pnpm install` |
| F1.2 | Add path aliases | `@/` → `src/` in Vite config + tsconfig |
| F1.3 | Enable `strict: true` in tsconfig | Catch null/undefined bugs at compile time. Also add `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| F1.4 | Set up test infrastructure | Add Vitest, Testing Library, MSW, jsdom. Create `vitest.config.ts`, `tests/setup.ts`. Migrate any existing tests |
| F1.5 | Add TSDoc linting | Add `eslint-plugin-tsdoc`, `@typescript-eslint`. Upgrade existing doc comments to TSDoc format |
| F1.6 | Add error boundary | Wrap app in `<ErrorBoundary>` with fallback UI |
| F1.7 | Add loading skeleton component | Replace full-viewport "Loading..." text |
| F1.8 | Remove dead code | Delete `mockData.ts`, remove non-functional sidebar nav items, remove unused `_deps` parameter from `useApi` |
| F1.9 | Centralize locale | Single `LOCALE` constant, replace all hardcoded `'en-US'` |

**Testing for F1:**
- [ ] Vitest runs and passes with existing code
- [ ] Error boundary catches a thrown error in a test component
- [ ] Loading skeleton renders correctly
- [ ] TSDoc lint passes on all existing exported symbols
- [ ] pnpm install works, `pnpm-lock.yaml` committed
- [ ] `make lint && make typecheck && make test && make build` — all pass

**Verification:** `make lint && make typecheck && make test && make build` — all pass. No behavior changes.

---

### Phase F2: Unified Styling

Pick one styling approach and migrate everything to it.

**Decision needed**: Go all-in on **Tailwind with token-based CSS vars** or all-in on **inline styles with tokens**?

**Recommendation**: Tailwind with token-based CSS vars.
- Tokens become CSS custom properties → single source of truth
- Tailwind reads from CSS vars → consistent values
- Hover/focus/responsive work without JS
- Removes the need for `e.currentTarget.style.*` mutations

| Step | What | Why |
|------|------|-----|
| F2.1 | Connect tokens to Tailwind | Export tokens as CSS custom properties, configure Tailwind theme to read them |
| F2.2 | Migrate Sidebar + StatusBar | Convert from Tailwind utilities to token-based approach (or vice versa) |
| F2.3 | Fix hover effects | Replace `e.currentTarget.style.*` mutations with CSS `:hover` or React state |

**Components using direct DOM mutation** (must fix):
- `YearView.tsx`
- `DayCard.tsx`
- `SideNav.tsx`
- `DateDisplay.tsx`
- `WeatherTooltip.tsx`
- `MonthView.tsx`

**Verification:** Visual regression test — app looks identical. No `e.currentTarget.style` in codebase.

**Additional UX fixes discovered during visual testing (2026-08-17):**
- EventPopup viewport overflow: Popup was bleeding outside bottom edge. Fixed by measuring actual popup height dynamically instead of using hardcoded estimate
- MonthView popup behavior: Hovering a day showed all events for that day. Changed to show only the specific hovered event
- MonthView grid layout: Last row was shrinking when status bar appeared. Fixed by using `repeat(6, 1fr)` for equal row heights
- YearView mini-calendars: Months had uneven sizing. Fixed by using `minmax(auto, 1fr)` for grid rows and ensuring all months use 6 rows
- Scrollable event lists: DayCard and MonthView event lists now have proper flex layout with `overflow-y: auto` and padding to maintain whitespace from card edges

---

### Phase F3: Extract Domain Logic

Move duplicated business logic into shared domain utilities.

| Step | What | Why |
|------|------|-----|
| F3.1 | Create `domain/calendar/utils.ts` | Extract `getEventsForDate` from 4 views into one shared function |
| F3.2 | Create `domain/weather/utils.ts` | Extract `getWeatherForDate` + unit conversion |
| F3.3 | Create `domain/calendar/types.ts` | Move calendar-specific types from `types/index.ts` |
| F3.4 | Create `domain/weather/types.ts` | Move weather-specific types |
| F3.5 | Keep `types/index.ts` as barrel | Re-exports from domain type files |

**Functions to extract:**
```typescript
// domain/calendar/utils.ts
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[]
export function getWeatherForDate(forecast: DailyForecast[], date: Date): DailyForecast | undefined
export function computeDateRange(view: CalendarView, date: Date): { start: string, end: string }

// domain/weather/utils.ts
export function celsiusToFahrenheit(c: number): number
export function mapCondition(condition: string): WeatherCondition
```

**Verification:** All 4 views import from domain utils. No duplicated functions. Tests pass.

---

### Phase F4: Decompose App.tsx

Break the god-component into focused pieces.

| Step | What | Why |
|------|------|-----|
| F4.1 | Create `useViewNavigation` hook | Extract view state + date navigation from App.tsx |
| F4.2 | Create `AppShell.tsx` | Layout orchestrator — composes header, sidebar, main content, status bar |
| F4.3 | Slim down `App.tsx` | Just `<ErrorBoundary><AppShell /></ErrorBoundary>` |
| F4.4 | Extract date picker from DateDisplay | Complex hand-rolled widget → its own component `DatePicker/` |

**What App.tsx currently owns** (must extract):
- `currentView` state + localStorage persistence
- `currentDate` state + navigation (prev/next/today)
- Weather data fetching (`useApi` for weather)
- Family members fetching (`useApi` for family)
- Density calculation
- Responsive breakpoint logic (`useViewportWidth`)
- Layout composition (header, sidebar, main, status bar)
- `useEdgeProximity` for header, sidebar, status bar

**Target App.tsx:**
```tsx
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <AppShell />
    </ErrorBoundary>
  );
}
```

**Verification:** App looks and behaves identically. App.tsx is <20 lines.

---

### Phase F5: Feature-Based Reorganization

Move from flat `components/` to feature-based `features/` structure.

| Step | What | Why |
|------|------|-----|
| F5.1 | Create `features/calendar/` | Move DayView, WeekGrid, MonthView, YearView, DayCard, EventItem, EventPopup, EventModal, DateDisplay |
| F5.2 | Create `features/weather/` | Move WeatherWidget, WeatherTooltip + extract 15 SVG icons to `icons/` |
| F5.3 | Create `features/navigation/` | Move Sidebar, SideNav, ViewSwitcher, StatusBar |
| F5.4 | Create `features/dashboard/` | Move Header, Clock, FamilyPills, DensityBadge + add AppShell |
| F5.5 | Create `features/kiosk/` | Move StickyArea + all kiosk hooks (useEdgeProximity, useIdleCursor, useOrientation, useUiScale) |
| F5.6 | Create `shared/` | Move LoadingSkeleton, shared Icon wrapper, utility functions |
| F5.7 | Update all imports | Fix import paths after moves |

**Verification:** `make lint && make typecheck && make test && make build` — all pass. App looks identical.

---

### Phase F6: API Layer Cleanup

Make the API layer configuration-driven.

| Step | What | Why |
|------|------|-----|
| F6.1 | Create `core/api/endpoints.ts` | Endpoint registry — single source of truth for all API calls |
| F6.2 | Unify `useCalendarEvents` with `useApi` | Compose `useApi` internally, don't reimplement |
| F6.3 | Make member colors config-driven | Remove hardcoded `memberColors` from tokens — use API response |
| F6.4 | Make nav items config-driven | Sidebar reads from config/API, not hardcoded array |
| F6.5 | Make refresh intervals configurable | Move from hardcoded constants to config |

**Endpoint registry:**
```typescript
// core/api/endpoints.ts
export const ENDPOINTS = {
  weather: { url: '/api/v1/weather', method: 'GET' },
  calendar: { url: '/api/v1/calendar', method: 'GET' },
  family: { url: '/api/v1/family', method: 'GET' },
  health: { url: '/health', method: 'GET' },
} as const;
```

**Verification:** Changing refresh interval in config works. Adding a new endpoint requires only one registry entry.

---

### Phase F7: Extract WeatherTooltip Icons

Break up the 967-line monolith.

| Step | What | Why |
|------|------|-----|
| F7.1 | Extract 15 SVG icons from WeatherTooltip.tsx | Each icon → `features/weather/icons/` |
| F7.2 | Reduce WeatherTooltip to ~100 lines | Layout + data display only, icons imported |

**Icons to extract:**
- ThermometerIcon
- FeelsLikeFaceIcon
- HumidityIcon
- WindIcon
- UVIcon
- PrecipIcon
- PressureIcon
- SunriseIcon
- SunsetIcon
- MoonIcon
- TempChart (SVG chart component)
- + others

**Verification:** WeatherTooltip.tsx is <150 lines. All icons are separate files. Visual regression test passes.

---

## Execution Order

```
F1 (Foundation) → F2 (Styling) → F3 (Domain) → F4 (Decompose App) → F5 (Features) → F6 (API) → F7 (WeatherTooltip)
```

Each phase is independently deployable. No phase requires a later phase to be complete.

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Styling approach** | Tailwind + CSS custom properties | Single source of truth — tokens become CSS vars, Tailwind reads from them. Eliminates `e.currentTarget.style.*` mutations. Hover/focus/responsive work without JS |
| **State management** | Zustand | ~1KB, zero boilerplate, `persist` middleware for localStorage, TypeScript-first, selector-based subscriptions prevent re-renders. Prop-drilling is the problem we're solving by decomposing App.tsx |
| **Date library** | Temporal API (native) | Zero dependencies — native browser API. Shipped in Chromium 144+ (Jan 2026). Kiosk runs Chromium 151. Immutable by design, proper timezone handling via `Temporal.ZonedDateTime`, replaces hand-rolled `dateFormat.ts` entirely |
| **Icon system** | lucide-react | Tree-shakeable, 1400+ consistent stroke-based icons, TypeScript types included, customizable via props. Kills the 967-line WeatherTooltip monolith immediately |
| **Component library** | Radix UI (selective) | Unstyled accessible primitives for Dialog (EventModal), Popover (EventPopup), Tooltip (WeatherTooltip). All branded/visual components stay hand-rolled with Tailwind + tokens. No design override fights |
| **Package manager** | pnpm only | User requirement. No npm, no yarn. `pnpm-lock.yaml` committed, `"packageManager"` field in `package.json` |
| **Documentation** | TSDoc | Frontend equivalent of backend's Google-style docstrings. Enforced via ESLint |
| **TypeScript** | `strict: true` + extras | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, no `any`, no `@ts-ignore` |
| **Test runner** | Vitest | Vite-native, fast, compatible with existing Vite config |
| **API mocking** | MSW (Mock Service Worker) | Network-level interception, realistic, reusable across test tiers |
| **Path aliases** | `@/` → `src/` | Eliminates deep `../../theme/tokens` imports |

---

## Dependencies to Add

| Package | Purpose | Phase |
|---------|---------|-------|
| `zustand` | Global state management (view state, date, data) | F4 |
| `lucide-react` | Icon library — replaces inline SVGs | F7 |
| `@radix-ui/react-dialog` | Accessible modal primitive (EventModal) | F5 |
| `@radix-ui/react-popover` | Accessible popover primitive (EventPopup) | F5 |
| `@radix-ui/react-tooltip` | Accessible tooltip primitive (WeatherTooltip) | F7 |
| `vitest` | Test runner | F1 |
| `@testing-library/react` | Component testing | F1 |
| `@testing-library/user-event` | Realistic user events in tests | F1 |
| `msw` | API mocking for tests | F1 |
| `jsdom` | DOM environment for component tests | F1 |
| `eslint-plugin-tsdoc` | TSDoc lint enforcement | F1 |
| `@typescript-eslint/eslint-plugin` | Strict TypeScript linting | F1 |

## Dependencies to Remove

| Package | Why | Phase |
|---------|-----|-------|
| `npm` / `package-lock.json` | Replaced by pnpm | F1 |

## Dependencies NOT Needed

| Package | Why Not |
|---------|---------|
| `date-fns` / `dayjs` | Temporal API is native — no library needed |
| `redux` / `mobx` | Zustand is sufficient for this scale |
| `react-query` / `swr` | Custom `useDataFetcher` is simpler for 3 endpoints |
| Full component library (MUI, Ant) | Fights the custom design token system |
