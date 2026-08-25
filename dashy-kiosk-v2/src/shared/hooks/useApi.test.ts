/**
 * Tests for useApi hook.
 *
 * Validates data fetching with loading states, error handling, and auto-refresh.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useApi } from './useApi'

describe('useApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in loading state', () => {
    const fetchFn = vi.fn(() => new Promise(() => {})) // Never resolves
    const { result } = renderHook(() => useApi(fetchFn))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isRefreshing).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('transitions to success state after fetch', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ data: 'test' }))
    const { result } = renderHook(() => useApi(fetchFn))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({ data: 'test' })
    expect(result.current.error).toBeNull()
    expect(result.current.isRefreshing).toBe(false)
  })

  it('transitions to error state on fetch failure', async () => {
    const fetchFn = vi.fn(() => Promise.reject(new Error('Network error')))
    const { result } = renderHook(() => useApi(fetchFn))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('manual refetch updates data', async () => {
    let callCount = 0
    const fetchFn = vi.fn(() => {
      callCount++
      return Promise.resolve({ count: callCount })
    })

    const { result } = renderHook(() => useApi(fetchFn))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({ count: 1 })

    await act(async () => {
      result.current.refetch()
    })

    expect(result.current.data).toEqual({ count: 2 })
  })

  it('auto-refresh triggers periodic fetches', async () => {
    vi.useFakeTimers()
    let callCount = 0
    const fetchFn = vi.fn(() => {
      callCount++
      return Promise.resolve({ count: callCount })
    })

    renderHook(() =>
      useApi(fetchFn, { refetchInterval: 5000 })
    )

    // Initial fetch happens immediately
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Advance time to trigger auto-refresh
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    expect(fetchFn).toHaveBeenCalledTimes(2)

    // Advance again for another refresh
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    expect(fetchFn).toHaveBeenCalledTimes(3)

    vi.useRealTimers()
  })

  it('error retry uses shorter interval', async () => {
    vi.useFakeTimers()
    const fetchFn = vi.fn(() => Promise.reject(new Error('Fail')))
    const { result } = renderHook(() =>
      useApi(fetchFn, { errorRetryInterval: 2000 })
    )

    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(result.current.error).toBe('Fail')

    // Advance to error retry interval
    await act(async () => {
      vi.advanceTimersByTime(2000)
      await Promise.resolve()
    })

    expect(fetchFn).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it('lastRefresh timestamp is set on success', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ data: 'test' }))
    const { result } = renderHook(() => useApi(fetchFn))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.lastRefresh).toBeTypeOf('number')
    expect(result.current.lastRefresh).toBeGreaterThan(0)
  })

  it('keeps data visible on refresh error', async () => {
    let shouldFail = false
    const fetchFn = vi.fn(() => {
      if (shouldFail) {
        return Promise.reject(new Error('Refresh failed'))
      }
      return Promise.resolve({ data: 'initial' })
    })

    const { result } = renderHook(() => useApi(fetchFn))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({ data: 'initial' })

    // Make next fetch fail
    shouldFail = true

    await act(async () => {
      result.current.refetch()
    })

    // Data should still be visible
    expect(result.current.data).toEqual({ data: 'initial' })
    expect(result.current.error).toBe('Refresh failed')
  })
})
