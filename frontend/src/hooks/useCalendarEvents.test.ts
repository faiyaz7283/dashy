import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCalendarEvents } from './useCalendarEvents'
import type { CalendarView } from '../types'
import * as api from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  getCalendar: vi.fn(),
}))

const mockGetCalendar = api.getCalendar as ReturnType<typeof vi.fn>

describe('useCalendarEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockEvents = [
    {
      id: '1',
      title: 'Test Event',
      start: '2026-08-10T09:00:00',
      end: '2026-08-10T10:00:00',
      all_day: false,
      members: ['faiyaz'],
    },
  ]

  const mockResponse = {
    data: {
      week_start: '2026-08-10',
      week_end: '2026-08-16',
      events: mockEvents,
    },
    cached: false,
  }

  it('fetches events on mount', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCalendarEvents('week', new Date('2026-08-12')))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.events).toEqual(mockEvents)
    expect(mockGetCalendar).toHaveBeenCalled()
  })

  it('computes correct date range for day view', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const date = new Date('2026-08-15')
    renderHook(() => useCalendarEvents('day', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-15', '2026-08-15')
    })
  })

  it('computes correct date range for week view', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    // Wednesday Aug 12, 2026 -> week is Mon Aug 10 to Sun Aug 16
    const date = new Date('2026-08-12')
    renderHook(() => useCalendarEvents('week', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-10', '2026-08-16')
    })
  })

  it('computes correct date range for month view', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const date = new Date('2026-08-15')
    renderHook(() => useCalendarEvents('month', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-01', '2026-08-31')
    })
  })

  it('computes correct date range for year view', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const date = new Date('2026-08-15')
    renderHook(() => useCalendarEvents('year', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-01-01', '2026-12-31')
    })
  })

  it('refetches when view changes', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const { rerender } = renderHook(
      ({ view }: { view: CalendarView }) => useCalendarEvents(view, new Date('2026-08-12')),
      { initialProps: { view: 'day' as CalendarView } },
    )

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalled()
    })

    // Change to week view - should trigger new fetch with different range
    rerender({ view: 'week' as CalendarView })

    // Verify it was called with week range (may take a moment)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-10', '2026-08-16')
  })

  it('refetches when date changes', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const { rerender } = renderHook(({ date }) => useCalendarEvents('day', date), {
      initialProps: { date: new Date('2026-08-12') },
    })

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-12', '2026-08-12')
    })

    // Change date
    await act(async () => {
      rerender({ date: new Date('2026-08-13') })
    })

    // Should have been called with new date
    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-13', '2026-08-13')
    })
  })

  it('handles fetch error', async () => {
    mockGetCalendar.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCalendarEvents('week', new Date('2026-08-12')))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.events).toEqual([])
  })

  it('exposes refetch function', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCalendarEvents('week', new Date('2026-08-12')))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify refetch function exists
    expect(typeof result.current.refetch).toBe('function')
  })
})
