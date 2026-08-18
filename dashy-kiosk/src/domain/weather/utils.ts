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
