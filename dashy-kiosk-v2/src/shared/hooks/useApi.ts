/**
 * Generic data fetching hook with auto-refresh and silent background updates.
 *
 * v2 improvement over v1: splits loading into two states:
 * - `isLoading` — true only during the initial fetch (shows skeleton)
 * - `isRefreshing` — true during background refreshes (silent, no skeleton flash)
 *
 * Background refreshes update `data` in place via React reconciliation —
 * no component unmount, no user interaction interrupted. Errors during
 * refresh keep the last successful `data` visible.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/** Return type of the useApi hook. */
export interface UseApiResult<T> {
  /** Fetched data, or null if not yet loaded. */
  data: T | null
  /** True only during the initial fetch (first load). */
  isLoading: boolean
  /** True during background refreshes (silent — data stays visible). */
  isRefreshing: boolean
  /** Error message from the last failed fetch, or null. */
  error: string | null
  /** Manually trigger a refetch. */
  refetch: () => void
  /** Timestamp (ms) of the last successful fetch. */
  lastRefresh: number | null
}

/** Configuration options for the useApi hook. */
export interface UseApiOptions {
  /** Auto-refresh interval in milliseconds. 0 = no auto-refresh. */
  refetchInterval?: number
  /** Retry interval when in error state (default: 10s). */
  errorRetryInterval?: number
}

/**
 * Generic data fetching hook with auto-refresh and silent background updates.
 *
 * @param fetchFn - Async function that returns the data.
 * @param options - Configuration for refresh intervals.
 * @returns Data, loading states, error, and refetch trigger.
 *
 * @example
 * ```ts
 * const { data, isLoading, isRefreshing, error } = useApi(
 *   () => fetch('/api/v1/weather').then(r => r.json()),
 *   { refetchInterval: 600_000 }
 * )
 * ```
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  options: UseApiOptions = {},
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)
  const fetchFnRef = useRef(fetchFn)
  const isFirstLoad = useRef(true)

  // Keep ref in sync with latest fetchFn
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  const fetchData = useCallback(async () => {
    const isInitial = isFirstLoad.current

    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const result = await fetchFnRef.current()
      setData(result)
      setError(null)
      setLastRefresh(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      // On error during refresh, keep last successful data visible
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      isFirstLoad.current = false
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh interval (faster retry when in error state)
  useEffect(() => {
    const errorRetry = options.errorRetryInterval ?? 10_000
    const normalInterval = options.refetchInterval ?? 0

    // When in error state, retry more aggressively
    const intervalMs = error ? errorRetry : normalInterval
    if (!intervalMs || intervalMs <= 0) {
      return
    }

    const interval = setInterval(() => {
      fetchData()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [fetchData, options.refetchInterval, options.errorRetryInterval, error])

  return { data, isLoading, isRefreshing, error, refetch: fetchData, lastRefresh }
}
