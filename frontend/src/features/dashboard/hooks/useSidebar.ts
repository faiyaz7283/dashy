/**
 * useSidebar — sidebar size state with proximity-driven visibility.
 *
 * The sidebar auto-hides when the mouse is away from the left edge (driven
 * by useEdgeProximity in App) and reappears at its last known size state:
 * if it was expanded it reappears expanded, if collapsed it reappears
 * collapsed. Dragging the edge handle switches between full and collapsed.
 */

import { useState, useCallback } from 'react'
import type { Orientation } from '@/features/kiosk/hooks/useOrientation'

export type SidebarState = 'full' | 'collapsed' | 'hidden'

const DEFAULT_STATE: Record<Orientation, SidebarState> = {
  landscape: 'collapsed',
  portrait: 'hidden',
}

/**
 * useSidebar hook.
 *
 * @param orientation - Screen orientation (default state differs).
 * @param visible - Whether the sidebar should be shown (mouse near left edge).
 * @returns The effective sidebar state and a setter for the size state.
 */
export function useSidebar(orientation: Orientation, visible: boolean) {
  const [state, setState] = useState<SidebarState>(DEFAULT_STATE[orientation]!)
  const [lastOpenState, setLastOpenState] = useState<SidebarState>(
    state === 'hidden' ? 'collapsed' : state,
  )

  // Track the last non-hidden size so reappearing restores it
  const setSizeState = useCallback((next: SidebarState) => {
    setState(next)
    if (next !== 'hidden') {
      setLastOpenState(next)
    }
  }, [])

  // When shown, restore the last known size; when hidden, render hidden
  const effectiveState: SidebarState = visible
    ? state === 'hidden'
      ? lastOpenState
      : state
    : 'hidden'

  return { state: effectiveState, setState: setSizeState }
}
