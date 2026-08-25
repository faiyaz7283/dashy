/**
 * Tests for useViewNavigation hook.
 *
 * Validates calendar view state management, date navigation, and localStorage persistence.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewNavigation } from './useViewNavigation'

// Mock the today() function
vi.mock('@/shared/date', () => ({
  today: () => Temporal.PlainDate.from('2026-01-15'),
}))

describe('useViewNavigation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('initializes with month view by default', () => {
      const { result } = renderHook(() => useViewNavigation())
      expect(result.current.currentView).toBe('month')
    })

    it('initializes with today\'s date', () => {
      const { result } = renderHook(() => useViewNavigation())
      expect(result.current.currentDate.toString()).toBe('2026-01-15')
    })

    it('restores view from localStorage', () => {
      localStorage.setItem('dashy-calendar-view', 'week')
      localStorage.setItem('dashy-calendar-view-version', '2')

      const { result } = renderHook(() => useViewNavigation())
      expect(result.current.currentView).toBe('week')
    })

    it('resets to month view if storage version is outdated', () => {
      localStorage.setItem('dashy-calendar-view', 'week')
      localStorage.setItem('dashy-calendar-view-version', '1')

      const { result } = renderHook(() => useViewNavigation())
      expect(result.current.currentView).toBe('month')
      expect(localStorage.getItem('dashy-calendar-view-version')).toBe('2')
    })
  })

  describe('view switching', () => {
    it('switches to day view', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.setCurrentView('day')
      })

      expect(result.current.currentView).toBe('day')
      expect(localStorage.getItem('dashy-calendar-view')).toBe('day')
    })

    it('switches to week view', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.setCurrentView('week')
      })

      expect(result.current.currentView).toBe('week')
      expect(localStorage.getItem('dashy-calendar-view')).toBe('week')
    })

    it('switches to year view', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.setCurrentView('year')
      })

      expect(result.current.currentView).toBe('year')
      expect(localStorage.getItem('dashy-calendar-view')).toBe('year')
    })
  })

  describe('navigation - day view', () => {
    beforeEach(() => {
      localStorage.setItem('dashy-calendar-view', 'day')
      localStorage.setItem('dashy-calendar-view-version', '2')
    })

    it('navigates to previous day', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigatePrevious()
      })

      expect(result.current.currentDate.toString()).toBe('2026-01-14')
    })

    it('navigates to next day', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigateNext()
      })

      expect(result.current.currentDate.toString()).toBe('2026-01-16')
    })
  })

  describe('navigation - week view', () => {
    beforeEach(() => {
      localStorage.setItem('dashy-calendar-view', 'week')
      localStorage.setItem('dashy-calendar-view-version', '2')
    })

    it('navigates to previous week', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigatePrevious()
      })

      expect(result.current.currentDate.toString()).toBe('2026-01-08')
    })

    it('navigates to next week', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigateNext()
      })

      expect(result.current.currentDate.toString()).toBe('2026-01-22')
    })
  })

  describe('navigation - month view', () => {
    it('navigates to previous month', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigatePrevious()
      })

      expect(result.current.currentDate.toString()).toBe('2025-12-15')
    })

    it('navigates to next month', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigateNext()
      })

      expect(result.current.currentDate.toString()).toBe('2026-02-15')
    })
  })

  describe('navigation - year view', () => {
    beforeEach(() => {
      localStorage.setItem('dashy-calendar-view', 'year')
      localStorage.setItem('dashy-calendar-view-version', '2')
    })

    it('navigates to previous year', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigatePrevious()
      })

      expect(result.current.currentDate.toString()).toBe('2025-01-15')
    })

    it('navigates to next year', () => {
      const { result } = renderHook(() => useViewNavigation())

      act(() => {
        result.current.navigateNext()
      })

      expect(result.current.currentDate.toString()).toBe('2027-01-15')
    })
  })

  describe('navigateToday', () => {
    it('navigates to today', () => {
      const { result } = renderHook(() => useViewNavigation())

      // First navigate to a different date
      act(() => {
        result.current.navigateNext()
      })
      expect(result.current.currentDate.toString()).toBe('2026-02-15')

      // Then navigate back to today
      act(() => {
        result.current.navigateToday()
      })
      expect(result.current.currentDate.toString()).toBe('2026-01-15')
    })
  })

  describe('handleDayClick', () => {
    it('navigates to clicked day and switches to day view', () => {
      const { result } = renderHook(() => useViewNavigation())
      const clickedDate = Temporal.PlainDate.from('2026-03-20')

      act(() => {
        result.current.handleDayClick(clickedDate)
      })

      expect(result.current.currentDate.toString()).toBe('2026-03-20')
      expect(result.current.currentView).toBe('day')
    })
  })

  describe('handleMonthClick', () => {
    it('navigates to clicked month and switches to month view', () => {
      const { result } = renderHook(() => useViewNavigation())
      const clickedMonth = Temporal.PlainYearMonth.from('2026-05')

      act(() => {
        result.current.handleMonthClick(clickedMonth)
      })

      expect(result.current.currentDate.toString()).toBe('2026-05-01')
      expect(result.current.currentView).toBe('month')
    })
  })

  describe('setCurrentDate', () => {
    it('sets date directly', () => {
      const { result } = renderHook(() => useViewNavigation())
      const newDate = Temporal.PlainDate.from('2026-07-04')

      act(() => {
        result.current.setCurrentDate(newDate)
      })

      expect(result.current.currentDate.toString()).toBe('2026-07-04')
    })
  })
})
