import { useState, useEffect, useCallback, useRef } from 'react'
import type { CalendarEvent, CalendarView } from '../types'
import { getCalendar } from '../services/api'
import { getWeekDays } from '../utils/dateFormat'

interface UseCalendarEventsResult {
  events: CalendarEvent[]
  loading: boolean
  error: string | null
  lastRefresh: number | null
  refetch: () => void
}

/**
 * Formats a Date to ISO date string (YYYY-MM-DD).
 */
function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Computes the start and end dates for a given view and current date.
 *
 * @param view - The calendar view type.
 * @param currentDate - The currently selected date.
 * @returns An object with startDate and endDate as ISO date strings.
 */
function computeDateRange(
  view: CalendarView,
  currentDate: Date,
): { startDate: string; endDate: string } {
  switch (view) {
    case 'day': {
      // Single day
      const iso = toIsoDate(currentDate)
      return { startDate: iso, endDate: iso }
    }
    case 'week': {
      // Monday to Sunday of the current week
      const weekDays = getWeekDays(currentDate)
      return {
        startDate: toIsoDate(weekDays[0]),
        endDate: toIsoDate(weekDays[6]),
      }
    }
    case 'month': {
      // 1st to last day of the current month
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      return {
        startDate: toIsoDate(firstDay),
        endDate: toIsoDate(lastDay),
      }
    }
    case 'year': {
      // Jan 1 to Dec 31 of the current year
      const year = currentDate.getFullYear()
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      }
    }
  }
}

/**
 * Hook for fetching calendar events based on the active view and selected date.
 *
 * Computes the appropriate date range for the current view (day/week/month/year),
 * fetches events from the backend, and uses an in-memory cache to prevent
 * redundant API calls within a 2-minute window.
 *
 * Re-fetches when the view type or selected date changes.
 *
 * @param currentView - The active calendar view.
 * @param currentDate - The currently selected date.
 * @returns Object with events, loading state, error, lastRefresh timestamp, and refetch function.
 */
export function useCalendarEvents(
  currentView: CalendarView,
  currentDate: Date,
): UseCalendarEventsResult {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)
  const isMountedRef = useRef(true)

  // Track mount state for cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { startDate, endDate } = computeDateRange(currentView, currentDate)
      const data = await getCalendar(startDate, endDate)

      if (isMountedRef.current) {
        setEvents(data.events)
        setLastRefresh(Date.now())
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [currentView, currentDate])

  // Fetch when view or date changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { events, loading, error, lastRefresh, refetch: fetchData }
}
