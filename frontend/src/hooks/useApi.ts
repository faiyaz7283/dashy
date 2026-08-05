import { useState, useEffect, useCallback, useRef } from 'react'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface UseApiOptions {
  refetchInterval?: number // milliseconds, 0 = no auto-refresh
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  _deps: unknown[] = [],
  options: UseApiOptions = {},
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  // Auto-refresh interval
  useEffect(() => {
    if (!options.refetchInterval || options.refetchInterval <= 0) {
      return
    }

    const interval = setInterval(() => {
      fetchData()
    }, options.refetchInterval)

    return () => clearInterval(interval)
  }, [fetchData, options.refetchInterval])

  return { data, loading, error, refetch: fetchData }
}
