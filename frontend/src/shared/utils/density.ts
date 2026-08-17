/**
 * Density calculation utilities for calendar views.
 *
 * Provides two density calculation methods:
 * - `getRelativeDensity`: For year/month/week views where density is
 *   calculated relative to other items in the same context (e.g., months
 *   within a year, weeks within a month, days within a week).
 * - `getAbsoluteDensity`: For day view where density is based on a fixed
 *   threshold of event counts.
 *
 * Both methods return a `DensityLevel` ('none' | 'low' | 'medium' | 'high')
 * which maps to colors defined in the theme tokens.
 */

import { themeConfig, type DensityLevel } from '@/theme/config'

/**
 * Calculates relative density level based on a count compared to a set of counts.
 *
 * Used for year view (month counts), month view (weekly counts), and week view
 * (daily counts). The density is determined by where the count falls within
 * the range of non-zero counts in the provided set.
 *
 * Algorithm:
 * 1. Filter to non-zero counts from `allCounts`.
 * 2. Find min and max of those non-zero counts.
 * 3. Calculate ratio: `(count - min) / (max - min)`.
 * 4. Map ratio to density level using configured thresholds.
 *
 * @param count - The count to evaluate (e.g., events in a specific month).
 * @param allCounts - All counts in the same context (e.g., all 12 month counts).
 * @returns The density level for the given count.
 *
 * @example
 * ```ts
 * const monthCounts = [8, 6, 7, 7, 7, 7, 7, 10, 7, 7, 8, 9];
 * getRelativeDensity(10, monthCounts); // 'high' (max)
 * getRelativeDensity(6, monthCounts);  // 'low' (min)
 * getRelativeDensity(0, monthCounts);  // 'none'
 * ```
 */
export function getRelativeDensity(count: number, allCounts: number[]): DensityLevel {
  if (count === 0) return 'none'

  const nonZero = allCounts.filter((c) => c > 0)
  if (nonZero.length === 0) return 'none'

  const min = Math.min(...nonZero)
  const max = Math.max(...nonZero)

  // All non-zero counts are the same — treat as low density.
  if (min === max) return 'low'

  const ratio = (count - min) / (max - min)
  const { relativeLowThreshold, relativeMediumThreshold } = themeConfig.density

  if (ratio < relativeLowThreshold) return 'low'
  if (ratio < relativeMediumThreshold) return 'medium'
  return 'high'
}

/**
 * Calculates absolute density level based on a fixed threshold.
 *
 * Used for day view where density is determined by the raw event count
 * regardless of context. Thresholds are configured in `themeConfig.density`.
 *
 * Default thresholds:
 * - 0 events → 'none'
 * - 1–2 events → 'low'
 * - 3–5 events → 'medium'
 * - 6+ events → 'high'
 *
 * @param count - The event count for the day.
 * @returns The density level for the given count.
 *
 * @example
 * ```ts
 * getAbsoluteDensity(0); // 'none'
 * getAbsoluteDensity(2); // 'low'
 * getAbsoluteDensity(4); // 'medium'
 * getAbsoluteDensity(7); // 'high'
 * ```
 */
export function getAbsoluteDensity(count: number): DensityLevel {
  if (count === 0) return 'none'

  const { absoluteLowMax, absoluteMediumMax } = themeConfig.density

  if (count <= absoluteLowMax) return 'low'
  if (count <= absoluteMediumMax) return 'medium'
  return 'high'
}

/**
 * Extracts event counts per day from a list of calendar events.
 *
 * Groups events by their start date (YYYY-MM-DD) and returns a map
 * of date strings to event counts.
 *
 * @param events - Array of calendar events to count.
 * @returns A record mapping date strings to event counts.
 */
export function getEventCountsByDay(
  events: import('@/types').CalendarEvent[],
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const event of events) {
    const dateKey = new Date(event.start).toISOString().split('T')[0]!
    counts[dateKey] = (counts[dateKey] || 0) + 1
  }

  return counts
}

/**
 * Extracts event counts per week from a list of calendar events.
 *
 * Groups events by ISO week (YYYY-W##) and returns a map of week
 * identifiers to event counts.
 *
 * @param events - Array of calendar events to count.
 * @returns A record mapping week identifiers to event counts.
 */
export function getEventCountsByWeek(
  events: import('@/types').CalendarEvent[],
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const event of events) {
    const date = new Date(event.start)
    const weekKey = getWeekKey(date)
    counts[weekKey] = (counts[weekKey] || 0) + 1
  }

  return counts
}

/**
 * Extracts event counts per month from a list of calendar events.
 *
 * Groups events by month (YYYY-MM) and returns a map of month
 * identifiers to event counts.
 *
 * @param events - Array of calendar events to count.
 * @returns A record mapping month identifiers to event counts.
 */
export function getEventCountsByMonth(
  events: import('@/types').CalendarEvent[],
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const event of events) {
    const date = new Date(event.start)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    counts[monthKey] = (counts[monthKey] || 0) + 1
  }

  return counts
}

/**
 * Returns an ISO week key (YYYY-W##) for a given date.
 *
 * @param date - The date to get the week key for.
 * @returns A string in the format "YYYY-W##".
 */
function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Adjust to nearest Thursday for ISO week calculation.
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const jan4 = new Date(d.getFullYear(), 0, 4)
  const weekNum =
    1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}
