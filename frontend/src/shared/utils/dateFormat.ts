/**
 * Date formatting utilities for calendar views.
 *
 * Provides consistent date formatting across all views, including ordinal
 * suffixes (1st, 2nd, 3rd, etc.).
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
 * getOrdinalSuffix(1);  // 'st'
 * getOrdinalSuffix(2);  // 'nd'
 * getOrdinalSuffix(3);  // 'rd'
 * getOrdinalSuffix(11); // 'th'
 * getOrdinalSuffix(21); // 'st'
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
 * Formats a date for the main header display (e.g., "Wed, Aug 5th").
 *
 * Includes ordinal suffix on the day number.
 *
 * @param date - The date to format.
 * @returns The short date string with ordinal suffix.
 */
export function formatHeaderDate(date: Date): string {
  const { locale } = themeConfig.dateFormat
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' })
  const month = date.toLocaleDateString(locale, { month: 'short' })
  const day = date.getDate()
  const suffix = getOrdinalSuffix(day)
  return `${weekday}, ${month} ${day}${suffix}`
}

/**
 * Checks if two dates are the same calendar day.
 *
 * @param a - First date.
 * @param b - Second date.
 * @returns True if both dates fall on the same day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Returns an array of dates for the week containing the given date.
 *
 * Weeks start on Monday. The returned array always contains 7 dates.
 *
 * @param baseDate - Any date within the target week.
 * @returns Array of 7 Date objects starting from Monday.
 */
export function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/**
 * Returns the date string key for a given date (YYYY-MM-DD).
 *
 * @param date - The date to convert.
 * @returns The date key string.
 */
export function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns the month key for a given date (YYYY-MM).
 *
 * @param date - The date to convert.
 * @returns The month key string.
 */
export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Returns the short weekday name for a date (e.g., "Mon", "Tue").
 *
 * @param date - The date to format.
 * @returns The short weekday name.
 */
export function getShortWeekday(date: Date): string {
  const { locale } = themeConfig.dateFormat
  return date.toLocaleDateString(locale, { weekday: 'short' })
}
