/**
 * Hook for managing sidebar expanded/collapsed state.
 *
 * Persists the sidebar state to localStorage so it survives page reloads.
 * Provides a toggle function and tracks the last toggle time for debounce logic.
 */

import { useState, useCallback } from 'react'

const SIDEBAR_STORAGE_KEY = 'dashy-sidebar-expanded'

/** Return type of the useSidebarState hook. */
export interface UseSidebarStateResult {
  /** Whether the sidebar is expanded (true) or collapsed (false). */
  isExpanded: boolean
  /** Toggle the sidebar state. */
  toggle: () => void
  /** Set the sidebar state directly. */
  setExpanded: (expanded: boolean) => void
  /** Timestamp of the last manual toggle (for debounce logic). */
  lastToggleTime: number
}

/**
 * Manages sidebar expanded/collapsed state with localStorage persistence.
 *
 * @returns Sidebar state and controls.
 *
 * @example
 * ```ts
 * const { isExpanded, toggle, lastToggleTime } = useSidebarState()
 * // isExpanded === false (collapsed by default)
 * ```
 */
export function useSidebarState(): UseSidebarStateResult {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return saved === 'true'
  })

  const [lastToggleTime, setLastToggleTime] = useState(0)

  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(expanded))
    setLastToggleTime(Date.now())
  }, [])

  const toggle = useCallback(() => {
    setExpanded(!isExpanded)
  }, [isExpanded, setExpanded])

  return { isExpanded, toggle, setExpanded, lastToggleTime }
}
