import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
  lastRefresh: number | null
}

interface UseApiOptions {
  refetchInterval?: number // milliseconds, 0 = no auto-refresh
  errorRetryInterval?: number // milliseconds, retry faster on error (default: 10s)
}

export function useApi<T>(fetchFn: () => Promise<T>, options: UseApiOptions = {}): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number | null>(null)
  const fetchFnRef = useRef(fetchFn)

  // Keep ref in sync with latest fetchFn
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFnRef.current()
      setData(result)
      setLastRefresh(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
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

  return { data, loading, error, refetch: fetchData, lastRefresh }
}
