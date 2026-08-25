# Styling Guide — Dashy Kiosk v2

This guide contains detailed styling rules. For quick reference, see [AGENTS.md](../../AGENTS.md) sections 7, 7b, 7c, and 7d.

## Tailwind Only (NON-NEGOTIABLE)

**Tailwind utility classes only.** No inline `style="..."` with `var(--dt-*)`. No `const styles` objects. No CSS Modules. No styled-components.

**Why:** The frontend architecture audit (`docs/frontend-architecture-audit.md`) found three inconsistent styling patterns (inline styles, const styles objects, Tailwind) used simultaneously. This was resolved: Tailwind is the single approach going forward.

**Rules:**
- All layout, spacing, colors, typography, and hover states use Tailwind utility classes
- Design tokens are consumed via the `@theme` block in `src/index.css` — e.g., `bg-bg`, `text-text-primary`, `border-border`, `bg-primary-light`
- Catalyst UI patterns for primitives (Button, Badge, Dialog, Sidebar, etc.) — copy from `/Users/admin/Downloads/TailwindPLUS/catalyst-ui-kit/typescript/` and adapt colors via the mapping table in the mockup skill
- **Mockups must also use Tailwind classes** — approved mockup classes transfer directly to React implementation. No inline styles in mockups.
- Dark mode: use Tailwind's `dark:` variant. Theme toggling adds/removes the `.dark` class on `<html>`.

**Forbidden patterns:**
```tsx
// FORBIDDEN: inline style with CSS var
<div style={{ background: 'var(--dt-bg)', color: 'var(--dt-text-primary)' }}>

// FORBIDDEN: const styles object
const styles = { card: { background: colors.bg, padding: `${spacing.md}px` } }

// FORBIDDEN: inline style with token import
<div style={{ background: colors.white, padding: `${spacing.lg}px` }}>
```

**Approved pattern:**
```tsx
<div className="bg-bg text-text-primary p-4">
```

## Mockups Are Living References (NON-NEGOTIABLE)

Approved mockup files in `mockups/` are **living design references** — they always reflect the current approved visual design.

- When modifying a component's visual style in React, **update the corresponding mockup to match**
- When the user requests a style change, make it in **both** the React component and the mockup
- Mockups are the source of truth for approved visual design — the React implementation must match
- File naming: `mockups/<component-name>.html` (e.g., `header.html`, `chore-create-modal.html`)
- Legacy reference files prefixed `00-legacy-` are read-only SVG/icon references — do not modify

## No Hardcoded Values — Ask Before Hardcoding (NON-NEGOTIABLE)

**Hardcoding is a code smell. Never hardcode values without explicit user approval.**

If you find yourself about to hardcode a dimension, color, string, or any magic value — **stop and ask the user first**. There is almost always a token, config, or data-driven alternative. If you believe hardcoding is truly unavoidable, explain why and get approval before writing the code.

**Why:** The project uses a token-based design system with CSS zoom scaling. All shell dimensions, colors, spacing, and configuration values are centralized. Hardcoding breaks single-source-of-truth, creates maintenance debt, and can cause inconsistent behavior across screen sizes.

### Dimensions & Layout

All shell dimensions (header height, sidebar width, status bar height, etc.) are defined in `src/theme/tokens.ts` and exposed as CSS custom properties in `src/index.css`.

**Forbidden without approval:**
```tsx
// FORBIDDEN: Hardcoded shell dimensions
<header className="h-[57px]">
<div className="top-[57px]">
<aside className="w-[224px]">
<footer className="h-[28px]">

// FORBIDDEN: Hardcoded spacing that should use tokens
<div className="p-[16px]">  // Should use p-4 or spacing.lg from tokens
<div className="gap-[24px]"> // Should use gap-6 or spacing.xl from tokens
```

**Approved patterns:**
```tsx
// APPROVED: Use CSS custom properties for shell dimensions
<header className="h-[var(--shell-header-height)]">
<div className="top-[var(--shell-header-height)]">
<aside className="w-[var(--shell-sidebar-expanded)]">
<footer className="h-[var(--shell-status-bar-height)]">

// APPROVED: Use Tailwind default scale for standard spacing
<div className="p-4 gap-6">
```

**When adding new shell dimensions:**
1. Add the dimension to `layout` object in `src/theme/tokens.ts`
2. Add corresponding CSS custom property in `src/index.css` under `:root`
3. Reference it via `var(--shell-*)` in components

**Current shell dimensions (defined in tokens.ts):**
- `headerHeight: 57` → `--shell-header-height`
- `statusBarHeight: 28` → `--shell-status-bar-height`
- `sidebarFull: 224` → `--shell-sidebar-expanded`
- `sidebarCollapsed: 64` → `--shell-sidebar-collapsed`

### Other Values That Must Not Be Hardcoded

- **Colors** — use design tokens (`bg-primary`, `text-text-muted`, etc.)
- **API URLs** — use `ENDPOINTS` from `src/shared/api/endpoints.ts`
- **Refresh intervals** — use `ENDPOINTS.*.refreshInterval`
- **Family member names** — use data from `useFamilyData()` hook
- **Feature names/keys** — use types and constants, not string literals scattered across files
- **Z-index values** — use `zIndices` from `src/theme/tokens.ts`
- **Transition durations** — use `transitions` from `src/theme/tokens.ts`

### The Rule

**If you are about to write a magic number, string, or pixel value — stop and ask.** Explain what you're hardcoding and why you believe it can't be tokenized or configured. Wait for approval before proceeding.

**Enforcement:** During code review, reject any PR that introduces hardcoded values for dimensions, colors, or configuration already defined in tokens. This applies to all shell elements and any component that references shell geometry.

## Common Patterns — When to Extract (NON-NEGOTIABLE)

**This section documents when to extract shared components, hooks, and when to use Context API.** These are not suggestions — they are requirements for maintaining DRY code.

### When to Extract a Shared Component

**Rule:** If the same markup appears in 2+ views, extract it to a shared component.

**Location:** `src/shared/components/` or `src/features/{feature}/components/`

**Examples:**

✅ **Extract:** Weather badge appears in WeekView and MonthView
```tsx
// BAD: Duplicated in WeekView.tsx and MonthView.tsx
<div className="flex items-center gap-1 text-xs text-text-muted">
  <WeatherIcon condition={forecast.condition} size="sm" />
  <span>{Math.round(forecast.high)}°</span>
  <span>{Math.round(forecast.low)}°</span>
</div>

// GOOD: Extract to shared component
// src/features/calendar/components/DayWeatherBadge.tsx
<DayWeatherBadge forecast={forecast} isToday={isToday} />
```

✅ **Extract:** Event card appears in DayView, WeekView, and MonthView
```tsx
// Already done: src/features/calendar/components/EventCard/EventCard.tsx
// Used in all 3 views with size prop: size="sm" | "md" | "lg"
```

✅ **Extract:** Content card wrapper used by all views
```tsx
// Already done: src/shared/components/ContentCard.tsx
```

### When to Extract a Shared Hook

**Rule:** If the same state logic or data transformation appears in 2+ components, extract it to a shared hook.

**Location:** `src/shared/hooks/` or `src/features/{feature}/hooks/`

**Examples:**

✅ **Extract:** Forecast map creation (Map<string, DailyForecast>)
```tsx
// BAD: Duplicated in WeekView.tsx and MonthView.tsx
const forecastByDate = useMemo(() => {
  const map = new Map<string, DailyForecast>()
  for (const day of forecast) {
    map.set(day.date, day)
  }
  return map
}, [forecast])

// GOOD: Extract to shared hook
// src/features/weather/hooks/useForecastMap.ts
const forecastByDate = useForecastMap(forecast)
```

✅ **Extract:** Event popup hover state management
```tsx
// Already done: src/features/calendar/hooks/useEventPopup.ts
// Used in DayView, WeekView, and MonthView
```

✅ **Extract:** UI scaling, theme management, auto-hide behavior
```tsx
// Already done: src/shared/hooks/useUiScale.ts, useTheme.ts, useAutoHide.ts
```

### When to Use Context API

**Rule:** If props are passed through 3+ component levels, use Context API instead.

**Location:** Define context in the hook file or `src/shared/context/`

**Examples:**

✅ **Use Context:** Event popup handlers (View → DayCard → EventCard)
```tsx
// BAD: Prop drilling through 3 levels
function WeekView() {
  const { handleMouseEnter, handleMouseMove, handleMouseLeave } = useEventPopup()
  return (
    <DayCard
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  )
}

function DayCard({ onMouseEnter, onMouseMove, onMouseLeave }) {
  return (
    <EventCard
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    />
  )
}

// GOOD: Context API
// src/features/calendar/hooks/useEventPopup.tsx
function WeekView() {
  const { EventPopupProvider, hoveredEvent, popupPosition } = useEventPopup()
  return (
    <EventPopupProvider>
      <DayCard />  // No handler props needed
      {hoveredEvent && <EventPopup event={hoveredEvent} position={popupPosition} />}
    </EventPopupProvider>
  )
}

function DayCard() {
  return <EventCard />  // No handler props needed
}

function EventCard() {
  const { handleMouseEnter, handleMouseMove, handleMouseLeave } = useEventPopupContext()
  return (
    <div
      onMouseEnter={(e) => handleMouseEnter(e, event)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      ...
    </div>
  )
}
```

✅ **Use Context:** Theme mode (if needed by deeply nested components)
```tsx
// Already done: src/shared/hooks/useTheme.ts provides ThemeContext
```

### Decision Tree

When implementing a feature, use this decision tree:

```
1. Am I writing the same markup in 2+ places?
   YES → Extract to shared component (section 7d)
   NO  → Continue

2. Am I writing the same logic/state in 2+ components?
   YES → Extract to shared hook (section 7d)
   NO  → Continue

3. Am I passing props through 3+ component levels?
   YES → Use Context API (section 7d)
   NO  → Continue

4. Am I hardcoding a value that should be a token?
   YES → Use token or CSS custom property (section 7c)
   NO  → Continue

5. Am I using inline styles instead of Tailwind?
   YES → Convert to Tailwind classes (section 7)
   NO  → Implementation is correct
```

### Enforcement

During code review (section 4b), check for these violations:

- **Duplicated markup** → Extract to shared component
- **Duplicated logic** → Extract to shared hook
- **Prop drilling (3+ levels)** → Use Context API
- **Hardcoded values** → Use tokens (section 7c)
- **Inline styles** → Use Tailwind (section 7)

**If violations are found, they are part of the current phase — do not defer to a separate "cleanup phase."**
