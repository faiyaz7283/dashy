import { useState, useCallback } from 'react'
import type { Orientation } from './useOrientation'

export type SidebarState = 'full' | 'collapsed' | 'hidden'

const DEFAULT_STATE: Record<Orientation, SidebarState> = {
  landscape: 'collapsed',
  portrait: 'hidden',
}

export function useSidebar(orientation: Orientation) {
  const [state, setState] = useState<SidebarState>(DEFAULT_STATE[orientation])

  const cycle = useCallback(() => {
    setState((prev) => {
      if (prev === 'full') return 'collapsed'
      if (prev === 'collapsed') return 'hidden'
      return 'full'
    })
  }, [])

  const open = useCallback(() => setState('full'), [])

  return { state, cycle, open }
}
