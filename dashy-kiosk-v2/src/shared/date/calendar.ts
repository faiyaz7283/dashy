/**
 * Calendar-specific date helpers built on Temporal types.
 *
 * Provides the date primitives the calendar views need: today's date,
 * week/month grid construction, date comparison, and relative-day labels.
 * All functions are pure and operate on immutable Temporal values.
 *
 * These replace the legacy `shared/utils/dateFormat.ts` helpers that used
 * mutable `Date` objects and 0-based month indexing.
 */

import { themeConfig } from '@/theme/config'

/**
 * Returns today's date as a PlainDate.
 *
 * Uses the system's local ISO calendar. Safe for kiosk use where the
 * display timezone matches the system timezone.
 *
 * @returns The current date.
 */
export function today(): Temporal.PlainDate {
  return Temporal.Now.plainDateISO()
}

/**
 * Returns the current time as a PlainTime.
 *
 * @returns The current local time.
 */
export function now(): Temporal.PlainTime {
  return Temporal.Now.plainTimeISO()
}

/**
 * Returns the 7 dates for the week containing the given date.
 *
 * Weeks start on Monday (ISO week). The returned array always contains
 * exactly 7 PlainDate values.
 *
 * @param date - Any date within the target week.
 * @returns Array of 7 PlainDate values starting from Monday.
 *
 * @example
 * ```ts
 * const week = getWeekDays(Temporal.PlainDate.from('2026-08-12')) // Wednesday
 * week[0] // PlainDate(2026-08-10) — Monday
 * week[6] // PlainDate(2026-08-16) — Sunday
 * ```
 */
export function getWeekDays(date: Temporal.PlainDate): Temporal.PlainDate[] {
  // dayOfWeek: 1=Monday .. 7=Sunday
  const monday = date.subtract({ days: date.dayOfWeek - 1 })
  return Array.from({ length: 7 }, (_, i) => monday.add({ days: i }))
}

/**
 * Returns all dates to display in a month calendar grid.
 *
 * Includes leading days from the previous month and trailing days from the
 * next month to fill complete weeks. Always returns a multiple of 7 dates
 * (either 35 or 42) for consistent grid layout.
 *
 * Weeks start on Monday.
 *
 * @param yearMonth - The year-month to build the grid for.
 * @param minRows - Minimum number of week rows (default 6 for consistent grid height).
 * @returns Array of PlainDate values for the grid cells.
 *
 * @example
 * ```ts
 * const ym = Temporal.PlainYearMonth.from('2026-08')
 * const grid = getMonthGridDates(ym)
 * // 42 dates: Mon Aug 3 (from July) through Sun Sep 13 (from September)
 * ```
 */
export function getMonthGridDates(
  yearMonth: Temporal.PlainYearMonth,
  minRows = 6,
): Temporal.PlainDate[] {
  const first = Temporal.PlainDate.from({
    year: yearMonth.year,
    month: yearMonth.month,
    day: 1,
  })
  // dayOfWeek: 1=Monday .. 7=Sunday; padding = days before the 1st in the first week
  const paddingStart = first.dayOfWeek - 1
  const gridStart = first.subtract({ days: paddingStart })

  const totalDays = minRows * 7
  return Array.from({ length: totalDays }, (_, i) => gridStart.add({ days: i }))
}

/**
 * Returns the date string key for a PlainDate (YYYY-MM-DD).
 *
 * Temporal.PlainDate.toString() already produces ISO 8601 format, so this
 * is a thin alias for readability at call sites.
 *
 * @param date - The PlainDate to convert.
 * @returns The date key string.
 *
 * @example
 * ```ts
 * getDateKey(Temporal.PlainDate.from('2026-08-05')) // "2026-08-05"
 * ```
 */
export function getDateKey(date: Temporal.PlainDate): string {
  return date.toString()
}

/**
 * Returns the month key for a PlainDate (YYYY-MM).
 *
 * @param date - The PlainDate to convert.
 * @returns The month key string.
 *
 * @example
 * ```ts
 * getMonthKey(Temporal.PlainDate.from('2026-08-05')) // "2026-08"
 * ```
 */
export function getMonthKey(date: Temporal.PlainDate): string {
  return `${date.year}-${String(date.month).padStart(2, '0')}`
}

/**
 * Returns the ISO week key for a PlainDate (YYYY-W##).
 *
 * Uses the ISO 8601 week numbering where week 1 contains the first Thursday
 * of the year.
 *
 * @param date - The PlainDate to convert.
 * @returns The ISO week key string.
 *
 * @example
 * ```ts
 * getWeekKey(Temporal.PlainDate.from('2026-08-10')) // "2026-W33"
 * ```
 */
export function getWeekKey(date: Temporal.PlainDate): string {
  const weekOfYear = date.weekOfYear ?? 1
  // Handle year boundary: ISO week 1 may belong to the previous year
  const year = weekOfYear >= 52 && date.month === 1 ? date.year - 1 : date.year
  return `${year}-W${String(weekOfYear).padStart(2, '0')}`
}

/**
 * Formats a forecast date relative to today for the weather tooltip.
 *
 * Returns "Today" or "Tomorrow" for the first two days, otherwise the
 * short weekday name. Always returns the formatted date label (e.g., "Aug 5").
 *
 * @param date - The forecast date to label.
 * @param referenceDate - The date to compare against (defaults to today).
 * @returns Object with dayLabel ("Today"/"Tomorrow"/"Mon") and dateLabel ("Aug 5").
 *
 * @example
 * ```ts
 * formatRelativeDay(Temporal.Now.plainDateISO())
 * // { dayLabel: "Today", dateLabel: "Aug 18" }
 * ```
 */
export function formatRelativeDay(
  date: Temporal.PlainDate,
  referenceDate: Temporal.PlainDate = today(),
): { dayLabel: string; dateLabel: string } {
  const locale = `${themeConfig.dateFormat.locale}-u-ca-iso8601`
  const dateLabel = date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
  })

  if (date.equals(referenceDate)) {
    return { dayLabel: 'Today', dateLabel }
  }
  if (date.equals(referenceDate.add({ days: 1 }))) {
    return { dayLabel: 'Tomorrow', dateLabel }
  }

  const dayLabel = date.toLocaleString(locale, { weekday: 'short' })
  return { dayLabel, dateLabel }
}

/**
 * Returns the short weekday name for a PlainDate.
 *
 * @param date - The PlainDate to format.
 * @returns The short weekday name (e.g., "Mon").
 */
export function getShortWeekday(date: Temporal.PlainDate): string {
  const locale = `${themeConfig.dateFormat.locale}-u-ca-iso8601`
  return date.toLocaleString(locale, { weekday: 'short' })
}

/**
 * Extracts the date portion from an event start value.
 *
 * Handles both all-day events (PlainDate) and timed events (PlainDateTime)
 * by converting to PlainDate. Used for filtering events by calendar day.
 *
 * @param start - The event start (PlainDate or PlainDateTime).
 * @returns The PlainDate for comparison.
 */
export function eventDate(start: Temporal.PlainDate | Temporal.PlainDateTime): Temporal.PlainDate {
  return start instanceof Temporal.PlainDate ? start : start.toPlainDate()
}
