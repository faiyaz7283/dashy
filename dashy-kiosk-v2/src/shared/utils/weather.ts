/**
 * Weather domain utilities.
 *
 * Shared functions for matching weather forecast data to calendar dates,
 * used across calendar views that display weather alongside events.
 */

import type { DailyForecast } from '@/types/weather'

/**
 * Returns the weather forecast for a given date.
 *
 * Matches the forecast's `date` field (YYYY-MM-DD) against the PlainDate.
 *
 * @param forecast - Array of daily forecasts, or undefined if not loaded.
 * @param date - The date to look up (PlainDate).
 * @returns The matching daily forecast, or undefined if no match.
 */
export function getWeatherForDate(
  forecast: DailyForecast[] | undefined,
  date: Temporal.PlainDate,
): DailyForecast | undefined {
  if (!forecast) return undefined
  const dateStr = date.toString() // YYYY-MM-DD
  return forecast.find((f) => f.date === dateStr)
}
