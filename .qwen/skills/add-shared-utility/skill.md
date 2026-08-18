---
name: add-shared-utility
description: Add a shared utility function used across multiple features — pure functions with TSDoc, co-located tests, and proper placement in the dependency graph.
---

# Add Shared Utility

Add a shared utility function used across multiple features in the Dashy frontend.

## When to use

- A pure function is needed by 2+ features (e.g., date formatting, color calculations)
- Extracting duplicated logic from multiple components into a reusable function
- Adding a new general-purpose helper (string formatting, math, data transformation)

## When NOT to use

- The function is only used by one feature → put it in that feature's directory instead
- The function has side effects (API calls, DOM manipulation, React hooks) → it doesn't belong in `shared/utils/`
- The function is React-specific → put it in `shared/hooks/` instead

## Prerequisites

- Confirm the utility is truly shared (used by 2+ features)
- Review existing utilities in `shared/utils/` for patterns and naming conventions
- Check that the function doesn't already exist in a utility file

## Directory structure

```
shared/utils/
├── dateFormat.ts       # Date formatting, week calculation
├── dateFormat.test.ts  # Co-located test
├── density.ts          # Density calculations
├── density.test.ts
├── recurrence.ts       # RRULE humanization
├── recurrence.test.ts
├── memberColors.ts     # Member color palette utilities
└── memberColors.test.ts
```

## Conventions

- **camelCase filename** (e.g., `dateFormat.ts`, not `date-format.ts`)
- **Pure functions only** — no React, no side effects, no I/O, no external dependencies beyond stdlib
- **TSDoc on every exported function** with `@param`, `@returns`, and `@example`
- **Co-located test file** — `dateFormat.test.ts` next to `dateFormat.ts`
- **Import path**: components import from `@/shared/utils/<filename>`
- **No feature-specific dependencies** — `shared/` is below `features/` in the dependency graph; it must never import from `features/` or `domain/`

## Steps

### 1. Determine if the utility belongs in shared/

Ask: **Is this function used by 2+ features?**

| Scenario | Location |
|----------|----------|
| Used by calendar + weather + dashboard | `shared/utils/` ✓ |
| Used only by calendar components | `features/calendar/utils/` |
| React hook used by multiple features | `shared/hooks/` |
| API fetch function | `shared/services/api.ts` |

If only one feature uses it, place it in that feature's directory. You can always move it to `shared/` later if a second feature needs it.

### 2. Create or update the utility file

If adding to an existing file, append the function. If creating a new file:

```typescript
// shared/utils/newUtility.ts

/**
 * Brief description of what this module provides.
 *
 * One or two sentences about the purpose of these utilities.
 */
```

### 3. Write the function with TSDoc

Follow the `dateFormat.ts` pattern — every exported function gets full TSDoc:

```typescript
/**
 * Returns the ordinal suffix for a given day number.
 *
 * @param day - The day of the month (1–31).
 * @returns The ordinal suffix string ('st', 'nd', 'rd', or 'th').
 *
 * @example
 * ```ts
 * getOrdinalSuffix(1);  // 'st'
 * getOrdinalSuffix(11); // 'th'
 * getOrdinalSuffix(22); // 'nd'
 * ```
 */
export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}
```

**TSDoc requirements:**

- One-line description of what the function does
- `@param` for each parameter with type and description
- `@returns` describing the return value
- `@example` with at least one code block showing input → output
- If the function throws, add `@throws` describing when

### 4. Create the co-located test file

Follow the `recurrence.test.ts` pattern:

```typescript
// shared/utils/newUtility.test.ts

import { describe, it, expect } from 'vitest'
import { yourFunction } from './newUtility'

describe('yourFunction', () => {
  it('handles the normal case', () => {
    expect(yourFunction('input')).toBe('expected')
  })

  it('handles edge case A', () => {
    expect(yourFunction('')).toBe('default')
  })

  it('handles edge case B', () => {
    expect(yourFunction(null)).toBeUndefined()
  })
})
```

**Test guidelines:**

- Cover the happy path and all edge cases
- Test each branch of conditional logic
- Use descriptive `it` messages that explain what's being tested
- No snapshots — use explicit `expect().toBe()` assertions

### 5. Import from components

Components import shared utilities using the `@/` alias:

```typescript
import { getOrdinalSuffix } from '@/shared/utils/dateFormat'
import { formatRecurrenceRule } from '@/shared/utils/recurrence'
```

### 6. Run quality gate

```bash
make lint
make typecheck
make test
make build
```

All four must pass before declaring the task complete.

## Checklist

- [ ] Confirmed the utility is shared (used by 2+ features)
- [ ] Created/updated file in `shared/utils/` with camelCase filename
- [ ] Function is pure (no React, no side effects, no I/O)
- [ ] Added TSDoc with `@param`, `@returns`, and `@example`
- [ ] Created co-located test file
- [ ] Tests cover happy path and edge cases
- [ ] No imports from `features/` or `domain/` (shared is below them)
- [ ] `make lint` passes
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] `make build` passes

## Example: Adding a temperature formatting utility

Scenario: Both the weather feature and a new "comfort index" component need to format temperatures.

1. **Create** `shared/utils/temperature.ts`:
   ```typescript
   /**
    * Temperature formatting and conversion utilities.
    *
    * Used by the weather feature and comfort index display.
    */

   /**
    * Formats a temperature value with degree symbol and unit.
    *
    * @param temp - Temperature value in the specified unit.
    * @param unit - Temperature unit ('F' or 'C'). Defaults to 'F'.
    * @returns Formatted string like "72°F" or "22°C".
    *
    * @example
    * ```ts
    * formatTemperature(72);     // '72°F'
    * formatTemperature(22, 'C'); // '22°C'
    * ```
    */
   export function formatTemperature(temp: number, unit: 'F' | 'C' = 'F'): string {
     return `${Math.round(temp)}°${unit}`
   }

   /**
    * Converts Celsius to Fahrenheit.
    *
    * @param celsius - Temperature in degrees Celsius.
    * @returns Temperature in degrees Fahrenheit.
    *
    * @example
    * ```ts
    * celsiusToFahrenheit(0);   // 32
    * celsiusToFahrenheit(100); // 212
    * ```
    */
   export function celsiusToFahrenheit(celsius: number): number {
     return (celsius * 9) / 5 + 32
   }
   ```

2. **Create** `shared/utils/temperature.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { formatTemperature, celsiusToFahrenheit } from './temperature'

   describe('formatTemperature', () => {
     it('formats Fahrenheit by default', () => {
       expect(formatTemperature(72)).toBe('72°F')
     })

     it('formats Celsius when specified', () => {
       expect(formatTemperature(22, 'C')).toBe('22°C')
     })

     it('rounds to nearest integer', () => {
       expect(formatTemperature(72.6)).toBe('73°F')
       expect(formatTemperature(72.4)).toBe('72°F')
     })
   })

   describe('celsiusToFahrenheit', () => {
     it('converts freezing point', () => {
       expect(celsiusToFahrenheit(0)).toBe(32)
     })

     it('converts boiling point', () => {
       expect(celsiusToFahrenheit(100)).toBe(212)
     })

     it('converts negative temperatures', () => {
       expect(celsiusToFahrenheit(-40)).toBe(-40)
     })
   })
   ```

3. **Import** in components:
   ```typescript
   import { formatTemperature } from '@/shared/utils/temperature'
   ```

4. **Run** `make lint && make typecheck && make test && make build`.

## Example: Adding to an existing utility file

Scenario: `dateFormat.ts` needs a new `formatRelativeDate` function.

1. **Open** `shared/utils/dateFormat.ts`
2. **Add** the function with TSDoc at the end of the file
3. **Add** tests to `shared/utils/dateFormat.test.ts`
4. **Run** quality gate

## Notes

- `shared/utils/` must never import from `features/`, `domain/`, or `shared/hooks/` — it's at the bottom of the dependency graph
- If a function needs React (e.g., uses `useState`), it belongs in `shared/hooks/`, not `shared/utils/`
- If a function needs to call an API, it belongs in `shared/services/api.ts`
- Keep utility files focused — `dateFormat.ts` is for dates, `recurrence.ts` is for RRULE parsing; don't mix concerns
- If a utility grows beyond ~150 lines, consider splitting it into a subdirectory: `shared/utils/date/` with `format.ts`, `calculate.ts`, etc.
- Pure functions are trivially testable — if testing is hard, the function probably has hidden dependencies
