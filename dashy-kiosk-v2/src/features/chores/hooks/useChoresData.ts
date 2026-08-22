/**
 * Hook for fetching chores data via the API.
 *
 * Uses the useApi hook with silent background refresh to avoid UI flicker.
 * Returns categories, tags, master chores, and instances.
 */

import { useApi } from '@/shared/hooks/useApi'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { fetchChores } from '../api/choresApi'
import type { ChoresData } from '@/types/chores'

/**
 * Fetches and manages chores data.
 *
 * @returns Chores data, loading states, error, and refetch trigger.
 */
export function useChoresData() {
  const { data, isLoading, isRefreshing, error, refetch, lastRefresh } =
    useApi<ChoresData>(fetchChores, {
      refetchInterval: ENDPOINTS.chores.refreshInterval,
    })

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch,
    lastRefresh,
  }
}
