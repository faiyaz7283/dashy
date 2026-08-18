---
name: add-domain-utility
description: Add domain types and utility functions to the frontend domain layer — types, pure business logic, barrel re-exports, and tests.
---

# Add Domain Utility

Add domain types and utility functions to the frontend domain layer.

## When to use

- Adding new TypeScript types/interfaces to an existing domain (calendar, weather, family)
- Adding pure business logic functions (filtering, formatting, computation) to a domain
- Creating a new frontend domain with types and utilities
- Not for adding React components — those go in `features/`
- Not for adding shared utilities used across domains — those go in `shared/utils/`

## Prerequisites

- Understand the domain's data shape and business rules
- Know whether you're extending an existing domain or creating a new one
- Identify which shared utilities (if any) the new code will import

## Directory structure

```
frontend/src/domain/<domainName>/
├── types.ts      # Domain-specific TypeScript types
├── utils.ts      # Pure business logic functions
└── (optional)    # Specialized utils (e.g., density.ts for calendar)
```

**Current domains:** `calendar`, `weather`, `family`

**Shared utilities available for import:**
- `@/shared/utils/dateFormat` — `isSameDay`, `getWeekDays`, `getDateKey`, `formatHeaderDate`, etc.
- `@/shared/utils/density` — `getRelativeDensity`, `getAbsoluteDensity`, `getEventCountsByDay`, etc.
- `@/shared/utils/memberColors` — `getMemberColorPalette`, `MemberColorPalette`

## Steps

### 1. Determine scope — existing domain or new domain

Check if the types/utils belong to an existing domain:

```bash
ls frontend/src/domain/
```

- If extending an existing domain (calendar, weather, family), add to its `types.ts` and/or `utils.ts`
- If creating a new domain, create the directory and files from scratch

### 2. Add or update types

Edit `frontend/src/domain/<domain>/types.ts`.

**Conventions:**
- Use `export interface` for objects, `export type` for unions/aliases
- TSDoc comment on every exported type and every field
- No framework imports (no React, no fetch) — pure TypeScript only
- Use `snake_case` for field names to match the backend API response

**Example — adding a type to calendar (from `domain/calendar/types.ts`):**

```typescript
/**
 * Calendar domain types.
 *
 * Defines the shape of calendar events, attendees, and view configuration
 * used across all calendar views (day, week, month, year).
 */

/** Available calendar view modes. */
export type CalendarView = 'day' | 'week' | 'month' | 'year'

/** RSVP status for an event attendee (matches backend Attendee model). */
export type AttendeeStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction'

/** An event attendee with resolved display info. */
export interface Attendee {
  /** Family member key, or null for external guests. */
  member_key: string | null
  /** Attendee email address. */
  email: string
  /** Display name from the calendar provider. */
  display_name: string
  /** RSVP status. */
  status: AttendeeStatus
  /** Member color or default grey for external guests. */
  color: string
}

/** A calendar event fetched from the backend. */
export interface CalendarEvent {
  /** Unique event identifier. */
  id: string
  /** Event title. */
  title: string
  /** ISO date string for event start. */
  start: string
  /** ISO date string for event end. */
  end: string
  /** Whether the event spans the full day. */
  all_day?: boolean
  /** Optional event location. */
  location?: string
  /** Family member keys associated with this event. */
  members: string[]
  // ... more fields
}
```

**Example — adding a type to weather (from `domain/weather/types.ts`):**

```typescript
/**
 * All 15 distinct OpenWeatherMap weather.main values.
 *
 * Maps 1:1 to backend condition values — no grouping or aliasing.
 */
export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'mist'
  | 'smoke'
  | 'haze'
  | 'dust'
  | 'fog'
  | 'sand'
  | 'ash'
  | 'squall'
  | 'tornado'

/** Current weather conditions at the configured location. */
export interface WeatherCurrent {
  /** Current temperature in the configured unit. */
  temperature: number
  /** Perceived temperature. */
  feels_like: number
  /** Weather condition category. */
  condition: WeatherCondition
  /** 'd' for day, 'n' for night. */
  icon: string
  /** Whether it is currently nighttime. */
  is_night: boolean
  /** Relative humidity percentage (0–100). */
  humidity: number
  /** Wind speed in the configured unit. */
  wind_speed: number
  /** Maximum wind gust speed. */
  wind_gust?: number | null
  // ... more optional fields
}
```

**Rules:**
- Every field gets a TSDoc comment explaining its purpose and units
- Optional fields use `?: type | null` to match backend nullable responses
- Union types list all valid values explicitly (no `string` catch-all)

### 3. Add or update utility functions

Edit `frontend/src/domain/<domain>/utils.ts` (create if it doesn't exist).

**Conventions:**
- Pure functions only — no side effects, no React imports, no DOM access
- TSDoc on every exported function with `@param` and `@returns`
- Import domain types with relative path: `import type { CalendarEvent } from './types'`
- Import shared utils with alias: `import { isSameDay } from '@/shared/utils/dateFormat'`

**Example — calendar utils (from `domain/calendar/utils.ts`):**

```typescript
/**
 * Calendar domain utilities.
 *
 * Shared functions for filtering events by date, used across all calendar
 * views (day, week, month, year).
 */

import type { CalendarEvent } from './types'
import { isSameDay } from '@/shared/utils/dateFormat'

/**
 * Returns all events occurring on a given date.
 *
 * Compares calendar day only (year/month/date), ignoring time components.
 *
 * @param events - The full list of calendar events.
 * @param date - The date to filter by.
 * @returns Events whose start date falls on the given day.
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date))
}

/**
 * Returns timed (non-all-day) events for a given date.
 *
 * @param events - The full list of calendar events.
 * @param date - The date to filter by.
 * @returns Non-all-day events whose start date falls on the given day.
 */
export function getTimedEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date) && !e.all_day)
}

/**
 * Returns all-day events for a given date.
 *
 * @param events - The full list of calendar events.
 * @param date - The date to filter by.
 * @returns All-day events whose start date falls on the given day.
 */
export function getAllDayEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date) && e.all_day)
}
```

**Example — weather utils (from `domain/weather/utils.ts`):**

```typescript
/**
 * Weather domain utilities.
 *
 * Shared functions for matching weather forecast data to calendar dates,
 * used across calendar views that display weather alongside events.
 */

import type { DailyForecast } from './types'

/**
 * Returns the weather forecast for a given date.
 *
 * Builds a YYYY-MM-DD key from local date components and matches against
 * the forecast's `date` field (backend uses local timezone formatting).
 *
 * @param forecast - Array of daily forecasts, or undefined if not loaded.
 * @param date - The date to look up.
 * @returns The matching daily forecast, or undefined if no match.
 */
export function getWeatherForDate(
  forecast: DailyForecast[] | undefined,
  date: Date,
): DailyForecast | undefined {
  if (!forecast) return undefined
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return forecast.find((f) => f.date === dateStr)
}
```

**Example — specialized domain util (from `domain/calendar/density.ts`):**

When a domain needs a focused set of utilities around a specific concern, create a separate file:

```typescript
/**
 * Density badge info computation for the dashboard header.
 *
 * Calculates event counts and density levels based on the active view
 * and selected date.
 */

import type { CalendarEvent, CalendarView } from '@/types'
import { isSameDay, getWeekDays } from '@/shared/utils/dateFormat'
import { getRelativeDensity, getAbsoluteDensity } from '@/shared/utils/density'
import type { DensityLevel } from '@/theme/config'

/** Density badge information for the header display. */
export interface DensityInfo {
  /** The computed density level (none/low/medium/high). */
  density: DensityLevel
  /** Full text label (e.g., "5 events"). */
  label: string
  /** Compact label for narrow viewports (e.g., "5"). */
  shortLabel: string
}

/**
 * Computes density badge info based on the current view and date.
 *
 * @param view - The active calendar view.
 * @param date - The currently selected date.
 * @param events - All calendar events for the active range.
 * @returns Density info with level, label, and short label.
 */
export function getDensityInfo(
  view: CalendarView,
  date: Date,
  events: CalendarEvent[],
): DensityInfo {
  switch (view) {
    case 'day': {
      const dayEvents = events.filter((e) => isSameDay(new Date(e.start), date))
      const density = getAbsoluteDensity(dayEvents.length)
      return {
        density,
        label: `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`,
        shortLabel: String(dayEvents.length),
      }
    }
    // ... other views
  }
}
```

**Rules:**
- Functions must be pure — same inputs always produce same outputs
- No React imports (`useState`, `useEffect`, etc.)
- No `fetch`, `axios`, or other I/O
- No DOM access (`document`, `window`)
- Import types with `import type` for type-only imports
- Use `@/` path alias for cross-domain and shared imports

### 4. Update the barrel re-export

If you added new types, update `frontend/src/types/index.ts` to re-export them:

```typescript
// Family domain types
export type { FamilyMember } from '@/domain/family/types'

// Calendar domain types
export type {
  CalendarView,
  AttendeeStatus,
  Attendee,
  CalendarEvent,
  WeekCalendar,
} from '@/domain/calendar/types'

// Weather domain types
export type {
  WeatherCondition,
  WeatherCurrent,
  HourlyForecast,
  DailyForecast,
  WeatherResponse,
} from '@/domain/weather/types'

// Add new types here — group by domain
```

**Rules:**
- Use `export type { ... }` (not `export { ... }`) for type-only re-exports
- Group by domain with a comment header
- Keep alphabetical order within each group
- Consumers can `import type { NewType } from '@/types'` for convenience

### 5. Add tests for new utilities

Create or update test files alongside the domain:

```
frontend/src/domain/<domain>/
├── types.ts
├── utils.ts
├── utils.test.ts       # Tests for utils.ts
└── density.test.ts     # Tests for density.ts (if applicable)
```

**Example test (calendar utils):**

```typescript
import { describe, it, expect } from 'vitest'
import { getEventsForDate, getTimedEventsForDate, getAllDayEventsForDate } from './utils'
import type { CalendarEvent } from './types'

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'All Day Event',
    start: '2025-03-15T00:00:00',
    end: '2025-03-15T23:59:59',
    all_day: true,
    members: ['mom'],
  },
  {
    id: '2',
    title: 'Timed Event',
    start: '2025-03-15T10:00:00',
    end: '2025-03-15T11:00:00',
    all_day: false,
    members: ['dad'],
  },
]

describe('getEventsForDate', () => {
  it('returns all events for a matching date', () => {
    const date = new Date(2025, 2, 15) // March 15
    const result = getEventsForDate(mockEvents, date)
    expect(result).toHaveLength(2)
  })

  it('returns empty array for non-matching date', () => {
    const date = new Date(2025, 2, 16) // March 16
    const result = getEventsForDate(mockEvents, date)
    expect(result).toHaveLength(0)
  })
})

describe('getTimedEventsForDate', () => {
  it('excludes all-day events', () => {
    const date = new Date(2025, 2, 15)
    const result = getTimedEventsForDate(mockEvents, date)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Timed Event')
  })
})
```

**Rules:**
- Use `vitest` (`describe`, `it`, `expect`)
- Test both positive and negative cases
- Use realistic mock data that matches the backend response shape
- Test edge cases (empty arrays, undefined inputs, boundary dates)

### 6. Run quality gate

```bash
make lint
make typecheck
make test
make build
```

All four must pass before declaring the task complete.

## Checklist

- [ ] Types added to `domain/<domain>/types.ts` with TSDoc on every type and field
- [ ] Utility functions added to `domain/<domain>/utils.ts` (or specialized file)
- [ ] All functions are pure — no side effects, no React imports, no I/O
- [ ] TSDoc on every exported function with `@param` and `@returns`
- [ ] Barrel re-export updated in `types/index.ts` (if new types added)
- [ ] Tests added for all new utility functions
- [ ] Quality gate passes (`make lint && make typecheck && make test && make build`)

## Example: Adding a "location" field to CalendarEvent

1. Add `location?: string` field to `CalendarEvent` interface in `domain/calendar/types.ts`
2. Add TSDoc: `/** Optional event location. */`
3. No utils change needed (existing `getEventsForDate` already handles it)
4. No barrel change — `CalendarEvent` is already re-exported
5. Quality gate passes

## Example: Adding a new weather utility

1. Create `getWeeklySummary(forecast: DailyForecast[]): string` in `domain/weather/utils.ts`
2. Add TSDoc with `@param` and `@returns`
3. Create `domain/weather/utils.test.ts` with test cases
4. Quality gate passes

## Example: Creating a new "chores" domain

1. Create `domain/chores/types.ts` with `ChoreStatus`, `Chore` interface
2. Create `domain/chores/utils.ts` with `getChoresForDate()`, `getOverdueChores()`
3. Add re-exports to `types/index.ts`
4. Create `domain/chores/utils.test.ts`
5. Quality gate passes

## Notes

- Domain files must never import from `features/` or React — they are pure logic
- Use `import type` for type-only imports to avoid bundling overhead
- When adding to an existing domain, match the existing code style exactly
- Specialized utils (like `density.ts`) are fine when a concern is large enough to warrant its own file
- Shared utilities in `@/shared/utils/` are fair game for domain utils to import
- The family domain currently has no `utils.ts` — create one if family-specific logic is needed
