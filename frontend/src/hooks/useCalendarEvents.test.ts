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
    vi.useRealTimers()
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

    // Use local timezone construction to avoid UTC offset issues
    const date = new Date(2026, 7, 15) // Aug 15, 2026 (month is 0-indexed)
    renderHook(() => useCalendarEvents('day', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-15', '2026-08-15', expect.any(Object))
    })
  })

  it('computes correct date range for week view', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    // Wednesday Aug 12, 2026 -> week is Mon Aug 10 to Sun Aug 16
    const date = new Date(2026, 7, 12) // Aug 12, 2026 (month is 0-indexed)
    renderHook(() => useCalendarEvents('week', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-10', '2026-08-16', expect.any(Object))
    })
  })

  it('computes correct date range for month view', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const date = new Date(2026, 7, 15) // Aug 15, 2026 (month is 0-indexed)
    renderHook(() => useCalendarEvents('month', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-01', '2026-08-31', expect.any(Object))
    })
  })

  it('computes correct date range for year view', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const date = new Date(2026, 7, 15) // Aug 15, 2026 (month is 0-indexed)
    renderHook(() => useCalendarEvents('year', date))

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-01-01', '2026-12-31', expect.any(Object))
    })
  })

  it('refetches when view changes', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const { rerender } = renderHook(
      ({ view }: { view: CalendarView }) => useCalendarEvents(view, new Date(2026, 7, 12)),
      { initialProps: { view: 'day' as CalendarView } },
    )

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalled()
    })

    // Change to week view - should trigger new fetch with different range
    rerender({ view: 'week' as CalendarView })

    // View changes should still use the cache to avoid redundant API calls
    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenLastCalledWith(
        '2026-08-10',
        '2026-08-16',
        expect.objectContaining({ bypassCache: false }),
      )
    })
  })

  it('refetches when date changes', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const { rerender } = renderHook(({ date }) => useCalendarEvents('day', date), {
      initialProps: { date: new Date(2026, 7, 12) }, // Aug 12, 2026
    })

    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-12', '2026-08-12', expect.any(Object))
    })

    // Change date
    await act(async () => {
      rerender({ date: new Date(2026, 7, 13) }) // Aug 13, 2026
    })

    // Should have been called with new date
    await waitFor(() => {
      expect(mockGetCalendar).toHaveBeenCalledWith('2026-08-13', '2026-08-13', expect.any(Object))
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

  it('forceRefresh bypasses cache and does not toggle loading', async () => {
    mockGetCalendar.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCalendarEvents('week', new Date('2026-08-12')))

    await waitFor(() => expect(result.current.loading).toBe(false))
    const callsBeforeForceRefresh = mockGetCalendar.mock.calls.length
    const firstLastRefresh = result.current.lastRefresh

    act(() => {
      result.current.forceRefresh()
    })

    await waitFor(() =>
      expect(mockGetCalendar.mock.calls.length).toBeGreaterThan(callsBeforeForceRefresh),
    )

    // forceRefresh (used by auto-refresh and the sidebar button) must bypass
    // the cache so the status bar's "refreshing…" state doesn't get stuck.
    expect(mockGetCalendar).toHaveBeenCalledWith(
      '2026-08-10',
      '2026-08-16',
      expect.objectContaining({ bypassCache: true }),
    )
    expect(result.current.lastRefresh).toBeGreaterThanOrEqual(firstLastRefresh!)
    expect(result.current.loading).toBe(false)
  })
})
