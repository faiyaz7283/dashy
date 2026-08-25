/**
 * Hook for creating a date-keyed forecast lookup map.
 *
 * Transforms the forecast array from useWeatherData into a Map
 * for O(1) lookup by date string. Shared across calendar views.
 */

import { useMemo } from 'react'
import type { DailyForecast } from '@/types/weather'

/**
 * Creates a forecast lookup map keyed by date string.
 *
 * @param forecast - Array of daily forecasts from useWeatherData.
 * @returns Map with date strings as keys and DailyForecast as values.
 *
 * @example
 * ```tsx
 * const { forecast } = useWeatherData()
 * const forecastMap = useForecastMap(forecast)
 * const todayForecast = forecastMap.get('2026-08-24')
 * ```
 */
export function useForecastMap(forecast: DailyForecast[]): Map<string, DailyForecast> {
  return useMemo(() => {
    const map = new Map<string, DailyForecast>()
    for (const day of forecast) {
      map.set(day.date, day)
    }
    return map
  }, [forecast])
}
