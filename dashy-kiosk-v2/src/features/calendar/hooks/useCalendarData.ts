/**
 * Hook for fetching calendar data via the API.
 *
 * Uses the useApi hook with silent background refresh to avoid UI flicker.
 * Returns calendar events for the currently selected date range.
 */

import { useApi } from '@/shared/hooks/useApi'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { parseCalendarEvent, type RawCalendarEvent } from '@/shared/date/parse'
import type { CalendarEvent } from '@/types/calendar'

/** Calendar API response shape. */
interface CalendarApiResponse {
  events: RawCalendarEvent[]
}

/**
 * Fetches and manages calendar event data.
 *
 * @returns Calendar events, loading states, and error info.
 */
export function useCalendarData() {
  const { data, isLoading, isRefreshing, error, lastRefresh } = useApi<CalendarApiResponse>(
    async () => {
      const response = await fetch(ENDPOINTS.calendar.url)
      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`)
      }
      return response.json()
    },
    {
      refetchInterval: ENDPOINTS.calendar.refreshInterval,
    },
  )

  // Parse raw events into typed CalendarEvent objects
  const events: CalendarEvent[] = data?.events?.map(parseCalendarEvent) ?? []

  return {
    events,
    isLoading,
    isRefreshing,
    error,
    lastRefresh,
  }
}
