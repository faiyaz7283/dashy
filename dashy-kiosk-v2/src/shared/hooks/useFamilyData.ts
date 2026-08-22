/**
 * Hook for fetching family member data via the API.
 *
 * Uses the useApi hook to fetch family members once on mount.
 * Returns typed family member array.
 */

import { useApi } from '@/shared/hooks/useApi'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { FamilyMember } from '@/types'

/**
 * Fetches and manages family member data.
 *
 * @returns Family members array, loading states, error.
 */
export function useFamilyData() {
  const { data, isLoading, error } = useApi<FamilyMember[]>(
    async () => {
      const response = await fetch(ENDPOINTS.family.url)
      if (!response.ok) {
        throw new Error(`Family API error: ${response.statusText}`)
      }
      return response.json()
    },
    {
      refetchInterval: 0, // Fetch once
    },
  )

  return {
    members: data ?? [],
    isLoading,
    error,
  }
}
