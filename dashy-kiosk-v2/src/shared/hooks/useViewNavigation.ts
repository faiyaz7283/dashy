/**
 * Hook for managing calendar view state and date navigation.
 *
 * Encapsulates view switching (day/week/month/year), date navigation
 * (previous/next/today), and localStorage persistence. Extracted from
 * App.tsx to separate navigation concerns from layout orchestration.
 *
 * Uses Temporal.PlainDate for immutable date state — no more mutable Date
 * objects or month-overflow bugs.
 */

import { useState, useCallback, useEffect } from 'react'
import type { CalendarView } from '@/types/calendar'
import { today } from '@/shared/date'

const VIEW_STORAGE_KEY = 'dashy-calendar-view'
const VIEW_STORAGE_VERSION_KEY = 'dashy-calendar-view-version'
const CURRENT_VIEW_STORAGE_VERSION = '2'

/** Return type of the useViewNavigation hook. */
export interface UseViewNavigationResult {
  /** The active calendar view (day/week/month/year). */
  currentView: CalendarView
  /** The currently selected date (PlainDate — immutable). */
  currentDate: Temporal.PlainDate
  /** Switch to a different view. */
  setCurrentView: (view: CalendarView) => void
  /** Navigate to a specific date. */
  setCurrentDate: (date: Temporal.PlainDate) => void
  /** Navigate to the previous period (day/week/month/year). */
  navigatePrevious: () => void
  /** Navigate to the next period (day/week/month/year). */
  navigateNext: () => void
  /** Navigate to today. */
  navigateToday: () => void
  /** Handle day click (navigates to day view). */
  handleDayClick: (date: Temporal.PlainDate) => void
  /** Handle month click (navigates to month view). */
  handleMonthClick: (yearMonth: Temporal.PlainYearMonth) => void
}

/**
 * Manages calendar view state and date navigation.
 *
 * Persists the active view to localStorage so it survives page reloads.
 * Bumps the storage version when the default view changes so existing
 * users automatically pick up the new default.
 *
 * @returns View state, navigation handlers, and setters.
 */
export function useViewNavigation(): UseViewNavigationResult {
  // View state with localStorage persistence.
  // Bump CURRENT_VIEW_STORAGE_VERSION when the default changes so existing
  // users automatically pick up the new default on next load.
  const [currentView, setCurrentView] = useState<CalendarView>(() => {
    const savedVersion = localStorage.getItem(VIEW_STORAGE_VERSION_KEY)
    if (savedVersion !== CURRENT_VIEW_STORAGE_VERSION) {
      localStorage.removeItem(VIEW_STORAGE_KEY)
      localStorage.setItem(VIEW_STORAGE_VERSION_KEY, CURRENT_VIEW_STORAGE_VERSION)
      return 'month'
    }
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    return (saved as CalendarView) || 'month'
  })

  const [currentDate, setCurrentDate] = useState<Temporal.PlainDate>(() => today())

  // Persist view changes
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, currentView)
  }, [currentView])

  /**
   * Navigate to the previous period based on the current view.
   *
   * Uses Temporal arithmetic — immutable, no overflow bugs.
   */
  const navigatePrevious = useCallback(() => {
    setCurrentDate((prev) => {
      switch (currentView) {
        case 'day':
          return prev.subtract({ days: 1 })
        case 'week':
          return prev.subtract({ days: 7 })
        case 'month':
          return prev.subtract({ months: 1 })
        case 'year':
          return prev.subtract({ years: 1 })
      }
    })
  }, [currentView])

  /**
   * Navigate to the next period based on the current view.
   *
   * Uses Temporal arithmetic — immutable, no overflow bugs.
   */
  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      switch (currentView) {
        case 'day':
          return prev.add({ days: 1 })
        case 'week':
          return prev.add({ days: 7 })
        case 'month':
          return prev.add({ months: 1 })
        case 'year':
          return prev.add({ years: 1 })
      }
    })
  }, [currentView])

  /**
   * Navigate to today.
   */
  const navigateToday = useCallback(() => {
    setCurrentDate(today())
  }, [])

  /**
   * Handle day click — navigate to day view for the clicked date.
   *
   * @param date - The clicked date (PlainDate).
   */
  const handleDayClick = useCallback((date: Temporal.PlainDate) => {
    setCurrentDate(date)
    setCurrentView('day')
  }, [])

  /**
   * Handle month click — navigate to month view for the clicked month.
   *
   * @param yearMonth - The clicked month as PlainYearMonth (1-based month, no overflow).
   */
  const handleMonthClick = useCallback((yearMonth: Temporal.PlainYearMonth) => {
    setCurrentDate(
      Temporal.PlainDate.from({
        year: yearMonth.year,
        month: yearMonth.month,
        day: 1,
      }),
    )
    setCurrentView('month')
  }, [])

  return {
    currentView,
    currentDate,
    setCurrentView,
    setCurrentDate,
    navigatePrevious,
    navigateNext,
    navigateToday,
    handleDayClick,
    handleMonthClick,
  }
}
