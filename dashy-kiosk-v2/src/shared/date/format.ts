/**
 * Display formatting for Temporal date/time types.
 *
 * All formatters use the project's configured locale from `themeConfig.dateFormat.locale`
 * and produce human-readable strings for the UI. Uses `Intl.DateTimeFormat` with
 * `formatToParts` for fine-grained control over output (e.g., ordinal suffixes).
 *
 * These functions replace the scattered `toLocaleDateString` / `toLocaleTimeString`
 * calls that were previously duplicated across components.
 */

import { themeConfig } from '@/theme/config'

/**
 * Returns the ordinal suffix for a given day number.
 *
 * @param day - The day of the month (1–31).
 * @returns The ordinal suffix string ('st', 'nd', 'rd', or 'th').
 *
 * @example
 * ```ts
 * getOrdinalSuffix(1)  // 'st'
 * getOrdinalSuffix(2)  // 'nd'
 * getOrdinalSuffix(11) // 'th'
 * getOrdinalSuffix(21) // 'st'
 * ```
 */
export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

/**
 * Formats a PlainDate for the main header display.
 *
 * Produces output like "Wed, Aug 5th" with an ordinal suffix on the day.
 *
 * @param date - The PlainDate to format.
 * @returns The formatted header date string.
 *
 * @example
 * ```ts
 * formatHeaderDate(Temporal.PlainDate.from('2026-08-05'))
 * // "Wed, Aug 5th"
 * ```
 */
export function formatHeaderDate(date: Temporal.PlainDate): string {
  const locale = `${themeConfig.dateFormat.locale}-u-ca-iso8601`
  const formatted = date.toLocaleString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  // Replace the numeric day with an ordinal version
  const day = date.day
  const suffix = getOrdinalSuffix(day)
  return formatted.replace(String(day), `${day}${suffix}`)
}

/**
 * Formats a PlainTime for display.
 *
 * Produces output like "9:00 AM" or "2:30 PM".
 *
 * @param time - The PlainTime to format.
 * @returns The formatted time string.
 *
 * @example
 * ```ts
 * formatTime(Temporal.PlainTime.from('14:30'))
 * // "2:30 PM"
 * ```
 */
export function formatTime(time: Temporal.PlainTime): string {
  const locale = `${themeConfig.dateFormat.locale}-u-ca-iso8601`
  return time.toLocaleString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Formats a PlainDateTime for display with configurable date/time parts.
 *
 * @param dt - The PlainDateTime to format.
 * @param options - Intl.DateTimeFormat options controlling which parts to include.
 * @returns The formatted datetime string.
 *
 * @example
 * ```ts
 * formatDateTime(dt, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
 * // "Wednesday, August 5, 2026"
 * ```
 */
export function formatDateTime(
  dt: Temporal.PlainDateTime,
  options: Intl.DateTimeFormatOptions,
): string {
  const locale = `${themeConfig.dateFormat.locale}-u-ca-iso8601`
  return dt.toLocaleString(locale, options)
}

/**
 * Formats a PlainDate with configurable date parts.
 *
 * General-purpose date formatter for components that need specific date fields
 * (weekday, month, day, year) without time components.
 *
 * @param date - The PlainDate to format.
 * @param options - Intl.DateTimeFormat options controlling which parts to include.
 * @returns The formatted date string.
 *
 * @example
 * ```ts
 * formatDateParts(date, { weekday: 'short', month: 'short', day: 'numeric' })
 * // "Wed, Aug 5"
 * ```
 */
export function formatDateParts(
  date: Temporal.PlainDate,
  options: Intl.DateTimeFormatOptions,
): string {
  const locale = `${themeConfig.dateFormat.locale}-u-ca-iso8601`
  return date.toLocaleString(locale, options)
}

/**
 * Formats a PlainDate with an ordinal suffix on the day.
 *
 * Like {@link formatDateParts} but replaces the numeric day with an ordinal
 * (e.g., "5th" instead of "5"). Use for displays that need the ordinal style.
 *
 * @param date - The PlainDate to format.
 * @param options - Intl.DateTimeFormat options (must include `day` for ordinal to apply).
 * @returns The formatted date string with ordinal day.
 *
 * @example
 * ```ts
 * formatDateWithOrdinal(date, { month: 'short', day: 'numeric' })
 * // "Aug 5th"
 * ```
 */
export function formatDateWithOrdinal(
  date: Temporal.PlainDate,
  options: Intl.DateTimeFormatOptions,
): string {
  const locale = `${themeConfig.dateFormat.locale}-u-ca-iso8601`
  const formatted = date.toLocaleString(locale, options)
  // Replace the numeric day with an ordinal version
  const day = date.day
  const suffix = getOrdinalSuffix(day)
  return formatted.replace(String(day), `${day}${suffix}`)
}
