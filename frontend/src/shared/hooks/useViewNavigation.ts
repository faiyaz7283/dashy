/**
 * Hook for managing calendar view state and date navigation.
 *
 * Encapsulates view switching (day/week/month/year), date navigation
 * (previous/next/today), and localStorage persistence. Extracted from
 * App.tsx to separate navigation concerns from layout orchestration.
 *
 * @returns View state, navigation handlers, and setters.
 */

import { useState, useCallback, useEffect } from 'react'
import type { CalendarView } from '@/types'

const VIEW_STORAGE_KEY = 'dashy-calendar-view'
const VIEW_STORAGE_VERSION_KEY = 'dashy-calendar-view-version'
const CURRENT_VIEW_STORAGE_VERSION = '2'

export interface UseViewNavigationResult {
  /** The active calendar view (day/week/month/year). */
  currentView: CalendarView
  /** The currently selected date. */
  currentDate: Date
  /** Switch to a different view. */
  setCurrentView: (view: CalendarView) => void
  /** Navigate to a specific date. */
  setCurrentDate: (date: Date) => void
  /** Navigate to the previous period (day/week/month/year). */
  navigatePrevious: () => void
  /** Navigate to the next period (day/week/month/year). */
  navigateNext: () => void
  /** Navigate to today. */
  navigateToday: () => void
  /** Handle day click (navigates to day view). */
  handleDayClick: (date: Date) => void
  /** Handle month click (navigates to month view). */
  handleMonthClick: (month: number) => void
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

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())

  // Persist view changes
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, currentView)
  }, [currentView])

  /**
   * Navigate to the previous period based on the current view.
   */
  const navigatePrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      switch (currentView) {
        case 'day':
          next.setDate(next.getDate() - 1)
          break
        case 'week':
          next.setDate(next.getDate() - 7)
          break
        case 'month':
          next.setMonth(next.getMonth() - 1)
          break
        case 'year':
          next.setFullYear(next.getFullYear() - 1)
          break
      }
      return next
    })
  }, [currentView])

  /**
   * Navigate to the next period based on the current view.
   */
  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      switch (currentView) {
        case 'day':
          next.setDate(next.getDate() + 1)
          break
        case 'week':
          next.setDate(next.getDate() + 7)
          break
        case 'month':
          next.setMonth(next.getMonth() + 1)
          break
        case 'year':
          next.setFullYear(next.getFullYear() + 1)
          break
      }
      return next
    })
  }, [currentView])

  /**
   * Navigate to today.
   */
  const navigateToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  /**
   * Handle day click — navigate to day view for the clicked date.
   *
   * @param date - The clicked date.
   */
  const handleDayClick = useCallback((date: Date) => {
    setCurrentDate(date)
    setCurrentView('day')
  }, [])

  /**
   * Handle month click — navigate to month view for the clicked month.
   *
   * @param month - The clicked month (0-11).
   */
  const handleMonthClick = useCallback((month: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setMonth(month)
      return next
    })
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
