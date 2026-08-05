import { useState, useEffect } from 'react'

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
  deps: unknown[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, deps)

  // Auto-refresh interval
  useEffect(() => {
    if (!options.refetchInterval || options.refetchInterval <= 0) {
      return
    }

    const interval = setInterval(() => {
      fetchData()
    }, options.refetchInterval)

    return () => clearInterval(interval)
  }, [options.refetchInterval])

  return { data, loading, error, refetch: fetchData }
}
