# Workflow Guide — Dashy Kiosk v2

This guide contains detailed workflow rules. For quick reference, see [AGENTS.md](../../AGENTS.md) sections 3a, 4a, and 4b.

## Pre-Implementation Checklist (NON-NEGOTIABLE)

**Before writing ANY implementation code, explicitly complete this checklist.** This is preventive, not detective — catch violations before they happen.

### AGENTS.md Compliance Check

Before starting implementation, answer these questions:

- [ ] **Which AGENTS.md sections apply to this change?** (Styling? Hardcoded values? Component structure? Testing?)
- [ ] **Am I about to duplicate logic that exists elsewhere?** → Extract to shared hook/component instead
- [ ] **Am I passing props through 3+ component levels?** → Use Context API instead
- [ ] **Am I writing the same markup in 2+ places?** → Extract to shared component
- [ ] **Are there hardcoded px/color values in my plan?** → Use tokens or CSS custom properties
- [ ] **Does this change need tests?** → Plan test coverage before coding

### Example Violations Caught by This Checklist

**Violation 1: Duplicated logic**
```tsx
// BAD: Same forecast map logic in WeekView and MonthView
const forecastByDate = useMemo(() => {
  const map = new Map<string, DailyForecast>()
  for (const day of forecast) {
    map.set(day.date, day)
  }
  return map
}, [forecast])

// GOOD: Extract to shared hook
const forecastByDate = useForecastMap(forecast)
```

**Violation 2: Prop drilling through 3 levels**
```tsx
// BAD: Passing handlers through View → DayCard → EventCard
<DayCard onMouseEnter={...} onMouseMove={...} onMouseLeave={...} />
  <EventCard onMouseEnter={...} onMouseMove={...} onMouseLeave={...} />

// GOOD: Use Context API
<EventPopupProvider>
  <DayCard />  // No handler props
    <EventCard />  // Gets handlers from context
</EventPopupProvider>
```

**Violation 3: Duplicated markup**
```tsx
// BAD: Same weather badge markup in WeekView and MonthView
<div className="flex items-center gap-1 text-xs text-text-muted">
  <WeatherIcon condition={forecast.condition} size="sm" />
  <span>{Math.round(forecast.high)}°</span>
  <span>{Math.round(forecast.low)}°</span>
</div>

// GOOD: Extract to shared component
<DayWeatherBadge forecast={forecast} isToday={isToday} />
```

**Enforcement:** If you skip this checklist and violations are found later, they are part of the current phase — do not defer to a separate "cleanup phase."

## Self-Review Step (NON-NEGOTIABLE)

**Before presenting code to the user, self-review it against AGENTS.md rules.** This is your responsibility — do not wait for the user to catch violations.

**Self-Review Checklist:**

- [ ] **Re-read relevant AGENTS.md sections** (Styling? Hardcoded values? Component structure?)
- [ ] **Search for duplicated logic across views** — if the same logic appears in 2+ places, extract it
- [ ] **Verify no prop drilling** — handlers should not pass through 3+ component levels
- [ ] **Verify no hardcoded values** — search for `px-`, `h-[`, `w-[`, `top-[`, hex colors, etc.
- [ ] **Verify shared components/hooks are used** — don't reinvent existing utilities
- [ ] **Verify tests exist** — new components/hooks need at minimum a render test

**How to search for violations:**

```bash
# Search for hardcoded pixel values
grep -r "h-\[[0-9]" src/
grep -r "w-\[[0-9]" src/
grep -r "top-\[[0-9]" src/
grep -r "bottom-\[[0-9]" src/

# Search for hardcoded colors
grep -r "color=\"#" src/
grep -r "bg-\[#" src/
grep -r "text-\[#" src/

# Search for prop drilling patterns (handlers passed through intermediate components)
grep -r "onMouseEnter.*onMouseEnter" src/
```

**If violations are found:** Fix them before presenting the code. Do not present code with known violations.

## Code Review Gate (Before Quality Gates)

**Before running automated quality gates (lint/typecheck/test/build), perform a manual code review.**

**Code Review Checklist:**

1. **Re-read AGENTS.md sections relevant to this change**
   - Section 7: Styling (Tailwind only)
   - Section 7c: No Hardcoded Values
   - Section 3a: Pre-Implementation Checklist
   - Section 7d: Common Patterns (when to extract)

2. **Check for pattern violations:**
   - Duplicated logic → Should be extracted to shared hook/component
   - Prop drilling → Should use Context API
   - Hardcoded values → Should use tokens or CSS custom properties
   - Inline styles → Should use Tailwind classes

3. **Check for code quality:**
   - Are shared components/hooks used where appropriate?
   - Are there any magic numbers or strings?
   - Is the code DRY (Don't Repeat Yourself)?
   - Are there any TODO comments that should be addressed now?

4. **Fix any violations found** before proceeding to quality gates.

## Quality Gates

For any frontend change (run from the orchestrator `dashy/` directory):

1. `make lint-kiosk-v2`
2. `make typecheck-kiosk-v2`
3. `make test-kiosk-v2`
4. `make build-kiosk-v2`

All four must pass before you tell the user the task is complete.

## Code Quality Audit (Required Before Phase Sign-Off)

After green quality gates, perform a code review pass before declaring a phase complete:

1. **Hardcoded values** — Search for `h-[Npx]`, `w-[Npx]`, `top-[Npx]`, `bottom-[Npx]`, `color="#..."`, `fontSize: 'Npx'`. These should reference tokens or CSS custom properties.
2. **Code duplication** — If the same component or pattern appears in multiple views, extract to a shared component in `src/features/{feature}/components/` or `src/shared/components/`.
3. **Shared behavior** — If the same state management or interaction logic appears in multiple components, extract to a custom hook in `src/features/{feature}/hooks/` or `src/shared/hooks/`.
4. **Prop drilling** — Don't pass callbacks through 2-3 levels of intermediate components. Use custom hooks or lift state to the common ancestor.
5. **Tokenization** — Shell dimensions, layout values, and typography should reference CSS custom properties or design tokens from `src/theme/tokens.ts`.

**If issues are found, they are part of the current phase — do not defer to a separate "cleanup phase."** Fix them before signing off.

**Example:** Phase 4 introduced hardcoded shell dimensions (`h-[57px]`, `w-[224px]`) and duplicated EventCard components across 3 views. These were fixed as part of Phase 4 by:
- Adding CSS custom properties (`--shell-header-height`, etc.) to `src/index.css`
- Extracting shared `EventCard` component with size variants
- Creating `useEventPopup` hook for shared hover state management
