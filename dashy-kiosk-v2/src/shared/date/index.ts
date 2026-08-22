/**
 * Date infrastructure — barrel export.
 *
 * Re-exports all Temporal-based date utilities for convenient importing.
 * Components and hooks should import from `@/shared/date` rather than
 * reaching into individual modules.
 *
 * @example
 * ```ts
 * import { today, getWeekDays, formatTime, parseCalendarEvent } from '@/shared/date'
 * ```
 */

export {
  parseEventStart,
  parseEventEnd,
  parseForecastDate,
  parseWeatherTime,
  parseQueryDate,
  parseCalendarEvent,
  parseWeekCalendar,
  type RawCalendarEvent,
  type RawWeekCalendar,
} from './parse'

export {
  getOrdinalSuffix,
  formatHeaderDate,
  formatTime,
  formatDateTime,
  formatDateParts,
  formatDateWithOrdinal,
} from './format'

export {
  today,
  now,
  getWeekDays,
  getMonthGridDates,
  getDateKey,
  getMonthKey,
  getWeekKey,
  formatRelativeDay,
  getShortWeekday,
  eventDate,
} from './calendar'
