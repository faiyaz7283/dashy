import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCalendar, clearCalendarCache } from './api'

// Mock fetch to simulate API responses
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('getCalendar', () => {
  beforeEach(() => {
    clearCalendarCache()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockResponse = {
    week_start: '2026-08-10',
    week_end: '2026-08-16',
    events: [
      {
        id: '1',
        title: 'Test Event',
        start: '2026-08-10T09:00:00',
        end: '2026-08-10T10:00:00',
        all_day: false,
        members: ['faiyaz'],
      },
    ],
  }

  it('fetches events for a date range', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await getCalendar('2026-08-10', '2026-08-16')

    expect(result).toEqual({ data: mockResponse, cached: false })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('start_date=2026-08-10'))
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('end_date=2026-08-16'))
  })

  it('returns cached data on second call within TTL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    // First call - fetches from API
    await getCalendar('2026-08-10', '2026-08-16')
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Second call - should use cache
    const result2 = await getCalendar('2026-08-10', '2026-08-16')
    expect(mockFetch).toHaveBeenCalledTimes(1) // Still 1, no new fetch
    expect(result2).toEqual({ data: mockResponse, cached: true })
  })

  it('fetches fresh data after cache expires', async () => {
    vi.useFakeTimers()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    // First call
    await getCalendar('2026-08-10', '2026-08-16')
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Advance time past TTL (2 minutes)
    vi.advanceTimersByTime(120_001)

    // Second call - cache expired, should fetch again
    await getCalendar('2026-08-10', '2026-08-16')
    expect(mockFetch).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('fetches different ranges separately', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    await getCalendar('2026-08-10', '2026-08-16')
    await getCalendar('2026-08-17', '2026-08-23')

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('clears cache when clearCalendarCache is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    // First call
    await getCalendar('2026-08-10', '2026-08-16')
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Clear cache
    clearCalendarCache()

    // Second call - should fetch again
    await getCalendar('2026-08-10', '2026-08-16')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws error on failed fetch', async () => {
    // Mock all 5 retries to fail
    for (let i = 0; i < 5; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    }

    await expect(getCalendar('2026-08-10', '2026-08-16')).rejects.toThrow(
      'API error: 500 Internal Server Error',
    )
  }, 60000)

  it('retries on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await getCalendar('2026-08-10', '2026-08-16')
    expect(result).toEqual({ data: mockResponse, cached: false })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  }, 60000)
})
