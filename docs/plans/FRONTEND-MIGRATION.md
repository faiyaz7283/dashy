# Frontend Migration Plan

> Status: **DRAFT — awaiting review**
> Created: 2026-08-16
> Scope: Restructure frontend for configuration-driven design, unified styling, feature-based organization, decomposed god-components, and clean domain separation.

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
| F1.1 | Add path aliases | `@/` → `src/` in Vite config + tsconfig |
| F1.2 | Enable `strict: true` in tsconfig | Catch null/undefined bugs at compile time |
| F1.3 | Add error boundary | Wrap app in `<ErrorBoundary>` with fallback UI |
| F1.4 | Add loading skeleton component | Replace full-viewport "Loading..." text |
| F1.5 | Remove dead code | Delete `mockData.ts`, remove non-functional sidebar nav items |
| F1.6 | Centralize locale | Single `LOCALE` constant, replace all hardcoded `'en-US'` |

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

## Open Questions

- [ ] **Styling approach**: Tailwind with CSS vars (recommended) or inline styles with tokens?
- [ ] **State management**: Keep prop-drilling (current) or add Zustand/Jotai for global state?
- [ ] **Date library**: Keep hand-rolled date utils or add `date-fns`/`dayjs`?
- [ ] **Icon system**: Keep inline SVGs or use an icon library (lucide-react, heroicons)?
- [ ] **Component library**: Keep hand-rolled components or adopt a headless UI library (Radix, Headless UI)?

---

## Dependencies to Add

| Package | Purpose | Phase |
|---------|---------|-------|
| `date-fns` | Date manipulation (if chosen over hand-rolled) | F3 |
| `zustand` or `jotai` | Global state management (if chosen) | F4 |
| `lucide-react` | Icon library (if chosen) | F7 |

## Dependencies to Remove

| Package | Why | Phase |
|---------|-----|-------|
| `tailwindcss` | If we go all-in on inline styles (unlikely) | F2 |
