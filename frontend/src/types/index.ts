/**
 * Global type barrel.
 *
 * Re-exports domain-specific types from their respective modules.
 * Import from `\@/types` for convenience, or import directly from
 * `\@/domain/calendar/types` or `\@/domain/weather/types` for domain-specific code.
 */

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
