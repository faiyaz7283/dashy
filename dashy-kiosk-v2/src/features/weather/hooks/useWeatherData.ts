/**
 * Hook for fetching weather data via the API.
 *
 * Uses the useApi hook with silent background refresh.
 * Returns current conditions and daily forecast from the weather endpoint.
 */

import { useApi } from '@/shared/hooks/useApi'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { WeatherResponse } from '@/types/weather'

/**
 * Fetches and manages weather data.
 *
 * @returns Current weather, forecast, loading states, and error info.
 */
export function useWeatherData() {
  const { data, isLoading, isRefreshing, error, lastRefresh } = useApi<WeatherResponse>(
    async () => {
      const response = await fetch(ENDPOINTS.weather.url)
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`)
      }
      return response.json()
    },
    {
      refetchInterval: ENDPOINTS.weather.refreshInterval,
    },
  )

  return {
    current: data?.current ?? null,
    forecast: data?.forecast ?? [],
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
  }
}
