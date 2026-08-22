# Dashy Kiosk v2 — Implementation Plan

> **Status:** In Progress — Phases 0-4 implemented, under review. Phases 3, 5, 6, 7 pending.
> **Created:** 2026-08-21
> **Last Updated:** 2026-08-22
> **Prerequisites:** All 14 mockups approved, mockup files renamed to living references

---

## Tech Stack & Tools (Latest Stable)

**All dependencies pinned to latest stable versions. No drift allowed.**

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| **Framework** | react | ^19.2.8 | UI library |
| | react-dom | ^19.2.8 | React DOM renderer |
| **Build** | vite | ^8.2.1 | Build tool + dev server |
| | @vitejs/plugin-react | ^6.0.5 | React plugin for Vite |
| | @tailwindcss/vite | ^4.3.3 | Tailwind v4 Vite plugin |
| **Styling** | tailwindcss | ^4.3.3 | Utility-first CSS framework |
| **UI Primitives** | @headlessui/react | ^2.2.10 | Unstyled accessible components |
| **Icons** | lucide-react | ^1.33.0 | SVG icon library |
| **Language** | typescript | ^7.0.2 | Type system |
| **Package Manager** | pnpm | 11.22.0 | Sole package manager (no npm/yarn) |
| **Linting** | oxlint | ^1.79.0 | Linter (replaces ESLint) |
| **Formatting** | oxfmt | ^0.64.0 | Formatter (replaces Prettier) |
| **Testing** | vitest | ^4.1.11 | Test runner |
| | @testing-library/react | ^16.3.2 | Component testing |
| | @testing-library/jest-dom | ^7.0.1 | DOM matchers |
| | @testing-library/user-event | ^14.6.5 | User interaction simulation |
| | jsdom | ^30.0.1 | DOM environment for tests |
| **Date/Time** | @js-temporal/polyfill | ^0.5.1 | Temporal API polyfill |
| **Git Hooks** | husky | ^9.1.7 | Pre-commit hooks |
| | lint-staged | ^17.3.0 | Run linters on staged files |

**Mockup CDN:** `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` (v4 only)

**Dark mode:** `@custom-variant dark (&:where(.dark, .dark *))` in `@theme` block

**Future:** When `vite-plus` reaches stable (currently v0.2.9), migrate to unified toolchain (Vite + Vitest + Oxlint + Oxfmt + Rolldown in one `vp` CLI).

---

## Reusable Business Logic from v1

**v1's domain layer and shared utilities are pure TypeScript — no React/UI dependencies. These are 100% reusable in v2.**

### Reusable (copy to v2)

| Category | Files | What |
|----------|-------|------|
| **Domain types** | `src/domain/calendar/types.ts`, `src/domain/chores/types.ts`, `src/domain/family/types.ts`, `src/domain/weather/types.ts` | CalendarEvent, ChoreInstance, MasterChore, FamilyMember — pure interfaces |
| **Domain utils** | `src/domain/calendar/utils.ts`, `src/domain/chores/utils.ts`, `src/domain/weather/utils.ts` | `getEventsForDate()`, `isOpenPoolInstance()`, `getStatusColor()`, `formatDifficulty()` |
| **Density utils** | `src/shared/utils/density.ts` | `getRelativeDensity()`, `getAbsoluteDensity()`, `getEventCountsByDay/Week/Month()` |
| **Date utilities** | `src/shared/date/` (calendar.ts, format.ts, parse.ts) | `today()`, `getWeekDays()`, `getMonthGridDates()`, `eventDate()`, `formatRelativeDay()` — Temporal API |
| **Theme config** | `src/theme/tokens.ts`, `src/theme/config.ts` | Colors, spacing, layout, density thresholds — already in v2's `index.css` |
| **useApi hook** | `src/shared/hooks/useApi.ts` | Generic data fetching with auto-refresh, error retry |
| **useViewNavigation** | `src/shared/hooks/useViewNavigation.ts` | Calendar prev/next/today navigation |
| **API endpoints** | `src/shared/api/endpoints.ts` | Endpoint registry with refresh intervals |

### NOT Reusable (old UI patterns)

- All React components (inline styles, `const styles` objects, CSS Modules)
- AppShell (monolithic 280+ lines)
- Test infrastructure (needs vitest + testing-library setup)
- ThemeContext/ThemeToggle components (replaced by useTheme hook)

### Migration Strategy

1. **Phase 0** copies reusable domain types, utils, and hooks directly into v2's structure
2. **No rewriting** of business logic — only UI components are built from scratch
3. **API integration** uses existing `useApi` hook pattern — no mock data in frontend

---

## API Mock Data Strategy

**Frontend never has mock data. All data comes from the API.**

The API (`dashy-api`) has mock adapters for all domains, controlled by environment variables:

```env
# .env.dev (already configured)
WEATHER_USE_MOCK=true
CALENDAR_USE_MOCK=true
CHORES_USE_MOCK=true
```

**How it works:**
- API serves mock data when `*_USE_MOCK=true`
- Frontend fetches from API endpoints (same contract as production)
- Switching to real data = change env vars, no frontend changes
- Mock adapters: `app/infrastructure/{weather,calendar,chores}/mock_adapter.py`

**Frontend responsibility:**
- Define TypeScript types matching API response shapes
- Use `useApi` hook for all data fetching
- Handle loading/error states
- Never hardcode mock data in components or hooks

---

## Overview

This plan covers two tracks:
1. **Implementation** — Build all 14 approved mockups as React components in `dashy-kiosk-v2/`
2. **Swap** — Replace the `dashy-kiosk` submodule with v2 content, tag v1.0.0/v2.0.0

Implementation must complete and pass all quality gates before the swap begins.

---

## Track 1: Implementation

### Phase 0 — Foundation

**Goal:** Set up the scaffolding everything else depends on. Copy reusable business logic from v1 and verify TS 7 compatibility.

**Migration reality check:** v1 uses TypeScript 6.x, v2 uses TypeScript 7.x. The `tsconfig` strictness settings are identical, but language-level breaking changes in TS 7 may require adjustments. The domain logic is sound — only type compatibility needs verification.

**Approach:** Copy first, typecheck immediately, fix iteratively. TypeScript's error messages will identify every incompatibility precisely.

| Step | What | Output |
|------|------|--------|
| 0.1 | **Copy domain types from v1** — Port `src/domain/{calendar,chores,family,weather}/types.ts` to v2's `src/types/`. | `src/types/calendar.ts`, `src/types/chores.ts`, `src/types/family.ts`, `src/types/weather.ts` |
| 0.2 | **Copy domain utils from v1** — Port `src/domain/{calendar,chores,weather}/utils.ts` to v2's `src/shared/utils/`. | `src/shared/utils/calendar.ts`, `src/shared/utils/chores.ts`, `src/shared/utils/weather.ts` |
| 0.3 | **Copy density utils from v1** — Port `src/shared/utils/density.ts` to v2. | `src/shared/utils/density.ts` |
| 0.4 | **Copy date utilities from v1** — Port `src/shared/date/` (calendar.ts, format.ts, parse.ts) to v2. | `src/shared/date/` directory |
| 0.5 | **Copy theme config from v1** — Port `src/theme/tokens.ts` and `src/theme/config.ts` to v2's `src/theme/`. | `src/theme/tokens.ts`, `src/theme/config.ts` |
| 0.6 | **Copy and fix useApi hook from v1** — Port `src/shared/hooks/useApi.ts` but **fix the loading behavior**. v1 sets `loading = true` on every background refresh, causing skeleton flashes and UI flicker mid-interaction. v2 splits into `isLoading` (initial load only) and `isRefreshing` (background, silent). Background refreshes update `data` in place — no skeleton flash, no component unmount, no user interaction interrupted. Error during refresh keeps last successful `data` visible. | `src/shared/hooks/useApi.ts` + test |
| 0.7 | **Copy API endpoints from v1** — Port `src/shared/api/endpoints.ts` to v2. | `src/shared/api/endpoints.ts` |
| 0.8 | **️ Typecheck gate** — Run `make typecheck-kiosk-v2`. Fix all TS 7 incompatibilities. Common issues: Temporal API global declarations, discriminated union narrowing, `Record<string, N>` indexed access with `noUncheckedIndexedAccess`. Iterate until zero errors. | Zero type errors |
| 0.9 | **useUiScale hook** — CSS `zoom` at app root. `scale = max(1, viewportWidth / 1920)`. Never scales down. | `src/shared/hooks/useUiScale.ts` + test |
| 0.10 | **useTheme hook** — light/dark/auto toggle, persists to localStorage, respects system preference in auto mode. | `src/shared/hooks/useTheme.ts` + test |
| 0.11 | **AppShell layout** — Full viewport layout from mockup `layout-shell.html`. Header + sidebar + status bar + content area. All sections use `useUiScale`. Auto-hide stubs (Phase 1 adds real behavior). | `src/features/shell/AppShell.tsx` + test |
| 0.12 | **Test infrastructure** — Verify `vitest.config.ts`, `src/test/setup.ts`, and a smoke test pass. | `make test-kiosk-v2` passes |

**Quality gate:** `make lint-kiosk-v2 && make typecheck-kiosk-v2 && make test-kiosk-v2 && make build-kiosk-v2`

**Realistic timeline:** 4–8 hours depending on TS 7 breaking changes. Domain logic is correct — only type compatibility needs work.

#### Phase 0 Completion Summary

**Status:** 🔄 Under Review

**What was delivered:**
- All domain types ported from v1 (`calendar.ts`, `chores.ts`, `family.ts`, `weather.ts`)
- All domain utils ported (`calendar.ts`, `chores.ts`, `weather.ts`, `density.ts`)
- Date utilities ported with Temporal API (`calendar.ts`, `format.ts`, `parse.ts`)
- Theme config ported (`tokens.ts`, `config.ts`)
- `useApi` hook rewritten with `isLoading`/`isRefreshing` split (silent background refresh)
- API endpoints ported (`endpoints.ts`)
- `useUiScale` hook created (CSS zoom scaling, never below 1.0)
- `useTheme` hook created (light/dark/auto with localStorage persistence)
- `AppShell` layout created (full viewport, header + sidebar + status bar + content area)
- Test infrastructure verified (`vitest.config.ts`, `test/setup.ts`)

**Tech Stack Usage:**
| Package | Usage |
|---------|-------|
| **React 19** | Component structure, hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) |
| **TypeScript 7** | All files, strict mode, type-safe domain layer |
| **Tailwind CSS v4** | `@theme` block for design tokens, utility classes throughout |
| **@js-temporal/polyfill** | Temporal API for date/time operations (polyfill for tests) |
| **vitest** | Test runner for unit tests |
| **@testing-library/react** | Component rendering in tests |
| **oxlint** | Linting (replaces ESLint) |
| **oxfmt** | Formatting (replaces Prettier) |

**Key Decisions:**
- Split `useApi` loading into `isLoading` (initial) vs `isRefreshing` (background, silent) — fixes v1's skeleton flash bug
- Temporal polyfill requires explicit calendar in locale strings: `'en-US-u-ca-iso8601'` (not `'en-US'`)

**Issues Resolved:**
- TS 7 compatibility: Temporal API global declarations, indexed access with `noUncheckedIndexedAccess`
- Test setup: Added Temporal polyfill global, `matchMedia` mock, `fetch` mock

---

### Phase 1 — Shell & Navigation

**Goal:** Build the interactive shell. Everything in this phase is visible on every screen.

| Step | What | Mockup | Output |
|------|------|--------|--------|
| 1.1 | **Header** — Date, clock, weather summary, family pills with event counts, density badge, view switcher (Day/Week/Month/Year), Today button, calendar icon (date picker placeholder). | `header.html` | `src/features/shell/Header.tsx` + test |
| 1.2 | **Sidebar** — Calendar nav item (refresh icon), Chores nav item (add icon). Collapsed (icon-only) vs expanded states. Toggle button. | `sidebar.html` | `src/features/shell/Sidebar.tsx` + test |
| 1.3 | **Status bar** — Settings icon (left), calendar+weather countdowns (center), theme toggle light/dark/auto (right). Feature-scoped center content. | `status-bar.html` | `src/features/shell/StatusBar.tsx` + test |
| 1.4 | **useAutoHide hook** — Edge-triggered show/hide with 15px threshold, 3s delay, hover-pinned behavior. Independent per edge (top/left/bottom). | — | `src/shared/hooks/useAutoHide.ts` + test |
| 1.5 | **Wire auto-hide** — Apply `useAutoHide` to Header (top), Sidebar (left), StatusBar (bottom). 0.4s ease transitions via HeadlessUI `Transition`. | — | Updated AppShell |
| 1.6 | **useSidebarState hook** — Expanded/collapsed state, toggle, collapse-button debounce to prevent immediate auto-hide. | — | `src/shared/hooks/useSidebarState.ts` + test |
| 1.7 | **View switcher integration** — `Tab.Group` from HeadlessUI. Switching views updates active feature in content area. Active state persists. | — | `src/features/shell/ViewSwitcher.tsx` + test |

**Quality gate:** All Phase 0 + 1 gates pass. Dev server shows full shell with working auto-hide, sidebar toggle, theme toggle, and view switcher (content area shows placeholder per view).

#### Phase 1 Completion Summary

**Status:** 🔄 Under Review

**What was delivered:**
- `Header` component — date, clock, weather summary, family pills with event counts, density badge, view switcher, Today button, calendar icon
- `Sidebar` component — Calendar/Chores nav items, collapsed/expanded states, toggle button
- `StatusBar` component — settings icon, refresh countdowns, theme toggle
- `useAutoHide` hook — edge-triggered show/hide (15px threshold, 3s delay, hover-pinned)
- Auto-hide wired to Header (top), Sidebar (left), StatusBar (bottom) with 0.4s transitions
- `useSidebarState` hook — expanded/collapsed state with debounce
- `ViewSwitcher` component — HeadlessUI `Tab.Group` for Day/Week/Month/Year switching

**Tech Stack Usage:**
| Package | Usage |
|---------|-------|
| **React 19** | Component composition, custom hooks, state management |
| **TypeScript 7** | Type-safe props, hook return types, event handlers |
| **Tailwind CSS v4** | All styling via utility classes, `dark:` variant for theme toggle, `Transition` for auto-hide animations |
| **@headlessui/react** | `Tab.Group` for view switcher, `Transition` for auto-hide animations |
| **lucide-react** | Icons: `Calendar`, `CheckSquare`, `Settings`, `Sun`, `Moon`, `Monitor`, `ChevronLeft`, `ChevronRight`, `Plus`, `RefreshCw` |
| **vitest** | Unit tests for hooks (`useAutoHide`, `useSidebarState`) |
| **@testing-library/react** | Component tests for Header, Sidebar, StatusBar, ViewSwitcher |

**Key Decisions:**
- Auto-hide uses edge detection (15px threshold) rather than hover-only — prevents accidental triggers
- Sidebar collapse debounced to prevent immediate auto-hide conflict
- View switcher uses HeadlessUI `Tab.Group` for accessible keyboard navigation

**Issues Resolved:**
- TS2532 in ViewSwitcher onChange: added null check `const view = VIEWS[idx]; if (view) onViewChange(view.key)`
- Auto-hide transition timing: settled on 0.4s ease for smooth but responsive feel

---

### Phase 2 — Calendar Feature

**Goal:** Full calendar functionality across all four views with popups and navigation.

| Step | What | Mockup | Output |
|------|------|--------|--------|
| 2.1 | **Copy useViewNavigation from v1** — Port `src/shared/hooks/useViewNavigation.ts` to v2. Prev/next/today navigation. Shares selected-date state with header's date picker. | — | `src/shared/hooks/useViewNavigation.ts` + test |
| 2.2 | **Day view** — Single column, time slots, event cards, scrollable. Sub-hour compact cards. | `calendar-day-view.html` | `src/features/calendar/views/DayView.tsx` + test |
| 2.3 | **Week view** — 7-day grid, colored top borders per member (density heatmap), event cards, weather per day. Dynamic "+N more" overflow via `useEventOverflow` hook. | `calendar-week-view.html` | `src/features/calendar/views/WeekView.tsx`, `src/shared/hooks/useEventOverflow.ts` + tests |
| 2.4 | **Month view** — Full grid, day cells with event dots/counts, density-colored week indicators. Fits viewport. | `calendar-month-view.html` | `src/features/calendar/views/MonthView.tsx` + test |
| 2.5 | **Year view** — 12-month grid, day indicators, member-colored dots, weekly + monthly density heatmap. | `calendar-year-view.html` | `src/features/calendar/views/YearView.tsx` + test |
| 2.6 | **Event popup** — Hover popup: title, time, location, description, recurrence, attendees (2-col grid). Content-sized height. No redundant labels. | `event-popup.html` | `src/features/calendar/components/EventPopup.tsx` + test |
| 2.7 | **Weather popup** — Current conditions, hourly chart (days 1-2), detail grid, astronomy row. Full and compact variations. | `weather-popup.html` | `src/features/weather/components/WeatherPopup.tsx` + test |
| 2.8 | **Date picker** — ISO 8601 calendar grid (Mon–Sun), month + year navigation (`<` `>` `<<` `>>`), today highlight, selected date, Today/Close footer. `w-72`. Suppresses header auto-hide while open. | `date-picker.html` | `src/features/calendar/components/DatePicker.tsx` + test |
| 2.9 | **Content card wrapper** — Standardized card: outer `p-2 bg-bg`, inner `rounded-lg bg-white dark:bg-bg shadow-xs ring-1 ring-border overflow-hidden flex flex-col`. Used by all views. | — | `src/shared/components/ContentCard.tsx` + test |
| 2.10 | **Navigation arrows** — Fixed-position prev/next buttons overlaying content area. Transparent until hover. Centered vertically. | — | `src/shared/components/NavArrows.tsx` + test |

**Quality gate:** All previous gates pass. Calendar feature fully functional: all 4 views render with mock data, navigation works, popups appear on hover, date picker integrates with header.

#### Phase 2 Completion Summary

**Status:** 🔄 Under Review

**What was delivered:**
- `useViewNavigation` hook — prev/next/today navigation, shared selected-date state
- `DayView` — single column, time slots, event cards, scrollable, sub-hour compact cards
- `WeekView` — 4×2 grid layout (not 7 columns), density-colored top borders, event cards, weather per day
- `MonthView` — full grid, day cells with event dots/counts, density-colored week indicators
- `YearView` — 12-month grid, day indicators, member-colored dots, weekly + monthly density heatmap
- `EventPopup` — hover popup with title, time, location, description, recurrence, attendees (2-col grid)
- `WeatherPopup` — current conditions, hourly chart, detail grid, astronomy row
- `DatePicker` — ISO 8601 calendar grid (Mon–Sun), month + year navigation, today highlight, `w-72`
- `ContentCard` wrapper — standardized card for all views
- `NavArrows` — fixed-position prev/next buttons, transparent until hover
- `memberColors` utility — static lookup maps for member color Tailwind classes

**Tech Stack Usage:**
| Package | Usage |
|---------|-------|
| **React 19** | Component composition, conditional rendering, hover state management |
| **TypeScript 7** | Temporal API types (`PlainDate`, `PlainDateTime`, `PlainTime`, `PlainYearMonth`), discriminated unions for view types |
| **Tailwind CSS v4** | All styling via utility classes, static lookup maps for dynamic classes (member colors, density borders), `dark:` variant |
| **@headlessui/react** | `Popover` for EventPopup/WeatherPopup, `Transition` for popup animations |
| **lucide-react** | Icons: `ChevronLeft`, `ChevronRight`, `ChevronsLeft`, `ChevronsRight`, `Calendar`, `Clock`, `MapPin`, `Users`, `Repeat`, `Sun`, `Moon`, `Cloud`, `CloudRain`, `CloudSnow` |
| **@js-temporal/polyfill** | All date/time operations, calendar grid generation, date arithmetic |
| **vitest** | Unit tests for views and components |
| **@testing-library/react** | Component tests for popups, date picker, navigation |

**Key Decisions:**
- **Static lookup maps for dynamic Tailwind classes** — Tailwind cannot detect `bg-${color}/10` at build time. Created `memberColors.ts` with static maps (`memberBgClasses`, `memberBgOpacityClasses`, `memberBorderClasses`, `memberTextClasses`, `memberRingClasses`). This is the canonical pattern — never use inline styles as a workaround.
- **Week view 4×2 grid** — Changed from 7-column grid to match mockup. Density heatmap uses top borders with static lookup maps.
- **Temporal locale strings require explicit calendar** — All `toLocaleString` calls use `'en-US-u-ca-iso8601'` (not `'en-US'`). The Temporal polyfill is strict about calendar matching. Without this, `RangeError: Mismatched calendars` crashes the component tree.
- **Content area fills entire viewport** — Shell elements (header, sidebar, status bar) are absolute overlays. No gap between sidebar and content.

**Issues Resolved:**
- **White screen bug** — `RangeError: Mismatched calendars` at `YearView.tsx:106`. Root cause: `yearMonth.toLocaleString('en-US', { month: 'long' })` failed because Temporal polyfill requires explicit calendar. Fix: changed to `'en-US-u-ca-iso8601'` across all files (`YearView.tsx`, `DatePicker.tsx`, `calendar.ts`, `format.ts`).
- **Dynamic Tailwind classes not detected** — Initially used inline styles as workaround. Corrected to static lookup maps pattern per AGENTS.md. Created `memberColors.ts` utility.
- **formatTime expects PlainTime not PlainDateTime** — Fixed by calling `.toPlainTime()` before passing to `formatTime`.
- **getShortWeekday import path** — Moved from `@/shared/date/format` to `@/shared/date/calendar`.
- **Unused imports/variables** — Removed `formatRelativeDay` from WeatherPopup, `getEventCountsByDay` from YearView, `dayCount` variable.
- **global.fetch not recognized by TypeScript** — Changed to `globalThis.fetch` in test setup.

---

### Phase 3 — Chores Feature

**Goal:** Full chores board with create/edit modals.

| Step | What | Mockup | Output |
|------|------|--------|--------|
| 3.1 | **Chores board** — Metrics row, member columns + open pool column, `+` add-chore icon per column (right-aligned), member name in member-color pill, chore cards with status colors. | `chores-board.html` | `src/features/chores/views/ChoresBoard.tsx` + test |
| 3.2 | **Chore create modal** — 3 entry-point variations: (1) Member column `+` → assigned-to locked, (2) Open Pool `+` → no assigned-to, (3) Sidebar `+` → assigned-to editable. Combobox category with dynamic "+ Create", tag input with hover popup + removable chips, difficulty slider with `[N]` badge, date+time combined, frequency dropdown, est. minutes, when overdue. `w-[28rem]`. | `chore-create-modal.html` | `src/features/chores/components/ChoreCreateModal.tsx` + test |
| 3.3 | **Chore edit modal** — Tabbed "This Instance" / "Template" UX. Instance tab: status dropdown, assignment segmented control (Open/Claimed/Assigned), completed by, signed off by, period read-only, timestamps. Template tab: all master chore fields. Both tabs: Delete + Cancel/Save footer. | `chore-edit-modal.html` | `src/features/chores/components/ChoreEditModal.tsx` + test |
| 3.4 | **Shared form components** — Combobox with dynamic create, tag input with chip popup, difficulty slider with numeric badge, segmented control, date+time picker (reuses DatePicker from Phase 2). | — | `src/shared/components/Combobox.tsx`, `TagInput.tsx`, `DifficultySlider.tsx`, `SegmentedControl.tsx` + tests |
| 3.5 | **Chore card component** — Reusable card for board columns. Status-colored left border, title, tags, assignee avatar, due time. | — | `src/features/chores/components/ChoreCard.tsx` + test |

**Quality gate:** All previous gates pass. Chores board renders with mock data, create/edit modals work with all 3 entry points, form components are reusable.

#### Phase 3 Completion Summary

**Status:** 🔄 Under Review

**What was delivered:**
- `ChoresBoard` — metrics row (Pending, In Progress, Completed, Overdue, This Week) + member columns + open pool column
- `ChoreCard` — status-colored left border, title, category tag, frequency, difficulty dots, estimated time, assignment info
- `ChoreCreateModal` — 3 entry-point variations (member column, open pool, sidebar) with adaptive assigned-to behavior
- `ChoreEditModal` — tabbed "This Instance" / "Template" UX with status dropdown, assignment segmented control, completed by, signed off by
- `useChoresData` hook — fetches chores data via API with silent background refresh
- `useChoreActions` hook — mutation wrappers with automatic refetch after each action
- `choresApi.ts` — all CRUD operations (fetchChores, createMasterChore, updateMasterChore, deleteMasterChore, claimInstance, assignInstance, updateInstanceStatus, createCategory, createTag, approveMasterChore)
- `Combobox` — searchable dropdown with "+ Create" option for dynamic category creation
- `TagInput` — tag input with removable chips and hover popup showing available tags
- `DifficultySlider` — range slider (1-5) with numeric badge showing current value
- `SegmentedControl` — mutually exclusive option buttons (Open/Claimed/Assigned)
- `ChoresView` — top-level view composing ChoresBoard + modals with modal state management
- Feature routing in AppShell — calendar vs chores switching via sidebar navigation

**Tech Stack Usage:**
| Package | Usage |
|---------|-------|
| **React 19** | Component composition, hooks (`useState`, `useCallback`, `useEffect`, `useRef`), modal state management |
| **TypeScript 7** | Type-safe props, discriminated unions for entry points (`CreateEntryPoint`), interface definitions |
| **Tailwind CSS v4** | All styling via utility classes, `dark:` variant for theme support, status colors (`bg-chores-pending`, `bg-chores-completed`, etc.) |
| **lucide-react** | Icons: `Plus`, `X`, `Trash2`, `Clock`, `AlertTriangle`, `CheckCircle`, `Play`, `Pause`, `ChevronDown` |
| **vitest** | Test infrastructure (no Phase 3-specific tests written yet) |

**Key Decisions:**
- **Live API data, no mock data** — Chores connect directly to local database via dashy-api. `CHORES_USE_MOCK=false` in `.env`. Same API URL as v1 (`https://api.dashy.local`).
- **3 entry-point variations for create modal** — Member column locks assigned-to, open pool shows info banner, sidebar shows editable dropdown. Single component handles all 3 via `CreateEntryPoint` discriminated union.
- **Tabbed edit modal** — "This Instance" tab for per-instance changes (status, assignment, completion), "Template" tab for master chore fields. Prevents accidental template edits when updating a single instance.
- **Automatic refetch after mutations** — `useChoreActions` wraps all API calls with `refetch()` to keep board in sync without manual refresh.
- **Static lookup maps for status colors** — `statusIconClasses` map in ChoreCard for Tailwind class detection at build time.

**Issues Resolved:**
- **CORS policy error** — API was blocking requests from `dashy-v2.local`. Fixed by adding `https://dashy-v2.local` to `CORS_ORIGINS` in `dashy-api/app/config.py`.
- **TS2551 Property 'category_id' does not exist** — MasterChore has `category` object, not `category_id`. Fixed to use `masterChore.category.id`.
- **TS2532 Object is possibly 'undefined'** — Added null check `(instance.claimed_by ?? instance.assigned_to ?? '?').charAt(0).toUpperCase()`.
- **Import path error** — `ChoreCard` import in ChoresBoard changed from `'./ChoreCard'` to `'../components/ChoreCard'`.
- **API returning HTML instead of JSON** — Multiple failed attempts (Vite proxy, nginx proxy, new API URL). User insisted on using existing `api.dashy.local` with proper cert-based solution. Final fix: CORS configuration.

---

### Phase 4 — Calendar Feature Wiring

**Goal:** Wire all calendar dynamic content — API data, navigation, popups, date picker. Verify everything works end-to-end for the calendar feature.

**Prerequisites:** Phase 2 (Calendar UI) complete. API running with `CALENDAR_USE_MOCK=true`.

| Step | What | Mockup | Output |
|------|------|--------|--------|
| 4.1 | **Calendar data wiring** — Connect `useCalendarData` hook to all 4 views. Verify events render from API (mock or real). Handle loading/error states. | — | Verified DayView, WeekView, MonthView, YearView |
| 4.2 | **Navigation wiring** — Verify prev/next/today buttons work in all views. Date state shared across views via `useViewNavigation`. | — | Verified navigation |
| 4.3 | **Event popup wiring** — Hover popup shows event details from API data. Verify all fields populate correctly. | `event-popup.html` | Verified EventPopup |
| 4.4 | **Weather popup wiring** — Weather summary in header links to weather popup. Hourly chart, detail grid, astronomy row populate from API. | `weather-popup.html` | Verified WeatherPopup |
| 4.5 | **Date picker wiring** — Calendar icon in header opens date picker. Selection updates all views. Today button resets to current day. Suppresses header auto-hide while open. | `date-picker.html` | Verified DatePicker |
| 4.6 | **Year view indicators** — Member-colored triangle indicators render on days with events. Density badges show per-month counts. | `calendar-year-view.html` | Verified YearView indicators |
| 4.7 | **Calendar smoke test** — Render all 4 views, navigate, open popups, use date picker. No crashes. All data from API. | — | `src/features/calendar/__tests__/integration.test.tsx` |

**Quality gate:** All previous gates pass. Calendar feature fully functional with live API data. All views render, navigation works, popups populate, date picker integrates.

**Status:**  Pending

---

### Phase 5 — Chores Feature Wiring

**Goal:** Wire all chores dynamic content — API data, CRUD operations, modal flows. Verify everything works end-to-end for the chores feature.

**Prerequisites:** Phase 3 (Chores UI) complete. API running with `CHORES_USE_MOCK=false`.

| Step | What | Mockup | Output |
|------|------|--------|--------|
| 5.1 | **Chores data wiring** — Connect `useChoresData` hook to ChoresBoard. Verify master chores, instances, categories, tags render from API. Handle loading/error states. | — | Verified ChoresBoard |
| 5.2 | **Create modal wiring** — All 3 entry points (member column, open pool, sidebar) open ChoreCreateModal. Form submits to API, board refreshes. | `chore-create-modal.html` | Verified ChoreCreateModal |
| 5.3 | **Edit modal wiring** — Clicking chore card opens ChoreEditModal. Instance/Template tabs populate correctly. Saves update API, board refreshes. | `chore-edit-modal.html` | Verified ChoreEditModal |
| 5.4 | **CRUD operations** — Create, update, delete, claim, assign, status changes all work. Board refreshes after each mutation. | — | Verified useChoreActions |
| 5.5 | **Chores smoke test** — Render board, create chore, edit chore, delete chore. No crashes. All data from API. | — | `src/features/chores/__tests__/integration.test.tsx` |

**Quality gate:** All previous gates pass. Chores feature fully functional with live API data. Board renders, modals work, CRUD operations succeed.

**Status:** ⏳ Pending

---

### Phase 6 — Shell Feature-Awareness

**Goal:** Make shell components (Header, StatusBar, Sidebar) adapt to the active feature. Create mockups for each feature state.

**Prerequisites:** Phases 4 and 5 complete. Both features fully wired.

**Mockup updates required:**
- `header.html` — Add feature toggle button to show Calendar vs Chores state
- `status-bar.html` — Add feature toggle button to show Calendar vs Chores state
- `sidebar.html` — Verify action icons ("+" for Chores, refresh for Calendar) are clickable and wired

| Step | What | Mockup | Output |
|------|------|--------|--------|
| 6.1 | **Header mockup update** — Update `header.html` to show both Calendar state (family pills, view switcher, date picker) and Chores state (feature title, no calendar controls). Add mock feature toggle. | `header.html` (updated) | Updated mockup |
| 6.2 | **StatusBar mockup update** — Update `status-bar.html` to show both Calendar state (refresh countdowns) and Chores state (chores status). Add mock feature toggle. | `status-bar.html` (updated) | Updated mockup |
| 6.3 | **Sidebar action wiring** — Wire "+" icon in Chores nav item to open ChoreCreateModal. Wire refresh icon in Calendar nav item to trigger data refresh. | `sidebar.html` | Updated Sidebar |
| 6.4 | **Header feature-awareness** — Header renders Calendar-specific UI when calendar active, Chores-specific UI when chores active. | `header.html` (updated) | Updated Header |
| 6.5 | **StatusBar feature-awareness** — StatusBar renders Calendar-specific content when calendar active, Chores-specific content when chores active. | `status-bar.html` (updated) | Updated StatusBar |
| 6.6 | **Shell smoke test** — Switch between Calendar and Chores via sidebar. Header and StatusBar adapt correctly. No stale UI. | — | `src/features/shell/__tests__/integration.test.tsx` |

**Quality gate:** All previous gates pass. Shell components adapt to active feature. Mockups updated and approved.

**Status:** ⏳ Pending

---

### Phase 7 — Integration & Polish

**Goal:** Cross-feature concerns, end-to-end testing, final polish.

**Prerequisites:** Phases 4, 5, 6 complete.

| Step | What | Output |
|------|------|--------|
| 7.1 | **Cross-feature date state** — Date picker selection in Calendar updates all calendar views. Today button resets to current day. | Verified useViewNavigation |
| 7.2 | **Auto-hide across features** — Auto-hide behavior consistent in both Calendar and Chores. No conflicts with modals or popups. | Verified useAutoHide |
| 7.3 | **Theme consistency** — Theme toggle works in both features. Dark mode applies consistently. | Verified useTheme |
| 7.4 | **End-to-end smoke test** — Render AppShell, switch features, switch views, open popups, open modals. No crashes. | `src/App.test.tsx` |
| 7.5 | **Performance check** — No unnecessary re-renders. Background refresh silent. No skeleton flashes. | Manual verification |
| 7.6 | **Final quality gate** — Full `make lint && make typecheck && make test && make build` passes. Dev server shows complete working app. | All gates pass |

**Quality gate:** Full `make lint-kiosk-v2 && make typecheck-kiosk-v2 && make test-kiosk-v2 && make build-kiosk-v2` passes. Dev server at `dashy-v2.local` shows complete working app.

**Status:** ⏳ Pending

---

## Track 2: Repo Swap

**Prerequisite:** Phase 7 quality gate passes.

### Step-by-step

| Step | Action | Details |
|------|--------|---------|
| S.1 | **Tag v1 in dashy-kiosk** | `cd dashy-kiosk && git tag v1.0.0 HEAD && git push origin v1.0.0` |
| S.2 | **Copy v2 → v1** | Copy all content from `dashy-kiosk-v2/` into `dashy-kiosk/` (replacing old files). Preserve `.git` directory. |
| S.3 | **Update package name** | Change `package.json` name from `dashy-kiosk-v2` to `dashy-kiosk`. |
| S.4 | **Update AGENTS.md** | Remove section 0 (NO OLD CODE RULE). Update all `make *-v2` references to `make *`. Remove v2-specific language. |
| S.5 | **Commit in submodule** | `cd dashy-kiosk && git add -A && git commit -m "feat: kiosk v2.0.0 — full rewrite with approved mockups"` |
| S.6 | **Tag v2** | `cd dashy-kiosk && git tag v2.0.0 HEAD && git push origin v2.0.0` |
| S.7 | **Update orchestrator compose** | Edit `compose/docker-compose.dev.yml`: build context `../dashy-kiosk-v2` → `../dashy-kiosk`, container name `dashy-dev-kiosk-v2` → `dashy-dev-kiosk`, hostname `dashy-v2.local` → `dashy.local`, volume path updated. |
| S.8 | **Delete v2 compose** | Remove `compose/docker-compose.dev-v2.yml`. |
| S.9 | **Clean up Makefile** | Remove all `*-v2` targets. The main targets (`dev-up`, `lint-kiosk`, `test-kiosk`, etc.) now serve v2 automatically. Remove v2 section from `clean` target. Update help text. |
| S.10 | **Delete v2 directory** | Remove `dashy-kiosk-v2/` from orchestrator repo. |
| S.11 | **Update README.md** | Remove v1/v2 distinctions. Update architecture section. |
| S.12 | **Commit orchestrator** | `git add -A && git commit -m "feat: swap kiosk submodule to v2.0.0"` |
| S.13 | **Verify** | `make dev-up` → serves v2 at `dashy.local`. `make lint && make typecheck && make test && make build` → all pass. |

### Rollback

If anything goes wrong after swap:
- `cd dashy-kiosk && git checkout v1.0.0` — restores old code
- Orchestrator: `git revert <swap-commit>` — restores old compose/Makefile

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **No router library** — Feature switching via React state in AppShell | Only 2 features (Calendar, Chores). URL routing adds complexity without benefit for a kiosk app. |
| **API-first data fetching** — All data from API, no frontend mock data | API has mock adapters (`WEATHER_USE_MOCK`, `CALENDAR_USE_MOCK`, `CHORES_USE_MOCK`). Frontend uses same contract for dev and production. |
| **Silent background refresh (NON-NEGOTIABLE)** | API auto-refresh must never interrupt user interaction. `useApi` splits loading into `isLoading` (initial, shows skeleton) and `isRefreshing` (background, silent). Background fetches update `data` in place via React reconciliation — no skeleton flash, no component unmount, no page reload. Error during refresh keeps last successful data visible. This was a critical UX bug in v1. |
| **Reuse v1 business logic** — Domain types, utils, hooks copied from v1 | Pure TypeScript, no React dependencies. No rewriting — only UI components built from scratch. |
| **HeadlessUI for primitives** — Menu, Dialog, Popover, Tab.Group, Transition | Matches mockup patterns. Accessible. Unstyled (we control all visual design via Tailwind). |
| **lucide-react for icons** — All UI icons | Consistent SVG icon set. Tree-shakeable. No emoji. |
| **Custom SVG for domain icons** — Weather, chore status indicators | Theme-aware, detailed illustrations. See memory: "SVG Icon Strategy". |
| **Feature-scoped directories** — `src/features/calendar/`, `src/features/chores/`, `src/features/shell/` | Each feature owns its views, components, hooks, types, and tests. Shared logic goes in `src/shared/`. |
| **No CSS Modules or styled-components** — Tailwind utility classes only | AGENTS.md rule. Mockup classes transfer directly to React. |
| **useUiScale for all scaling** — CSS `zoom` at root | Uniform scaling. No responsive breakpoints for layout. Matches current Dashy behavior. |

---

## File Structure (Target)

```
src/
├── features/
│   ├── shell/           # AppShell, Header, Sidebar, StatusBar, ViewSwitcher
│   ├── calendar/
│   │   ├── views/       # DayView, WeekView, MonthView, YearView
│   │   ├── components/  # EventPopup, DatePicker, ChoreCard (shared with chores)
│   │   ├── hooks/       # useCalendarData, useEventOverflow
│   │   ├── api/         # Calendar API endpoints
│   │   └── types.ts
│   ├── chores/
│   │   ├── views/       # ChoresBoard
│   │   ├── components/  # ChoreCreateModal, ChoreEditModal, ChoreCard
│   │   ├── hooks/       # useChoresData
│   │   ├── api/         # Chores API endpoints
│   │   └── types.ts
│   └── weather/
│       ├── components/  # WeatherPopup
│       ├── hooks/       # useWeatherData
│       ├── api/         # Weather API endpoints
│       ── types.ts
├── shared/
│   ├── components/      # ContentCard, NavArrows, Combobox, TagInput, DifficultySlider, SegmentedControl
│   ├── hooks/           # useUiScale, useTheme, useAutoHide, useSidebarState, useViewNavigation, useApi
│   ├── utils/           # density.ts, api.ts, date.ts
│   └── test/            # setup.ts, test-utils.tsx
├── theme/
│   └── tokens.ts        # Design token constants
├── types/
│   └── index.ts         # Cross-feature types (FamilyMember, ViewType, Theme)
├── App.tsx              # Root with useUiScale
├── App.test.tsx         # End-to-end smoke test
├── index.css            # Tailwind @theme + base styles
└── main.tsx             # Entry point
```

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| **API contract mismatch** | Frontend types must match API response shapes exactly. API has mock adapters — test against real API responses. |
| **useUiScale edge cases** | Test at 1920px (scale=1), 2560px (scale=1.33), 1280px (scale=1). Verify no layout breakage. |
| **Auto-hide conflicts with popups** | Date picker suppresses header auto-hide (sticky decision). Event/weather popups are inside content area — no conflict. |
| **Chore modal complexity** | 3 entry points + tabbed edit modal = many state combinations. Build shared form components first (Step 3.4), then compose into modals. |
| **Swap breaks dev environment** | Tag v1.0.0 before swap. Rollback is `git checkout v1.0.0` + revert orchestrator commit. |
| **v1 business logic incompatibility** | Domain types/utils are pure TypeScript — no React dependencies. If adaptation needed, isolate changes in v2's wrapper layer. |
| **Background refresh UX regression** | v1's `useApi` caused skeleton flashes on every refresh. v2's split `isLoading`/`isRefreshing` pattern prevents this. Enforced by quality gate — any component that shows skeleton on `isRefreshing` is a bug. |

---

## Out of Scope

- **Backend changes** — API is built separately in `dashy-api/`. Mock adapters already exist for all domains. This plan covers frontend only.
- **Deployment** — Swap happens after implementation. Deploy to Pi is a separate step.
- **Additional features** — Only Calendar and Chores. Future features (settings, etc.) follow the same pattern.
- **Performance optimization** — Build correct first. Optimize only if profiling shows issues.
- **Browser compatibility** — Target Chromium on Raspberry Pi (kiosk mode). No IE/Safari concerns.
- **Rewriting business logic** — v1's domain types, utils, and hooks are copied as-is. Only UI components are built from scratch.
