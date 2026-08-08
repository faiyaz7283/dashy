import { useState, useCallback } from 'react'
import type { Orientation } from './useOrientation'

export type SidebarState = 'full' | 'collapsed' | 'hidden'

const DEFAULT_STATE: Record<Orientation, SidebarState> = {
  landscape: 'collapsed',
  portrait: 'hidden',
}

export function useSidebar(orientation: Orientation) {
  const [state, setState] = useState<SidebarState>(DEFAULT_STATE[orientation])

  const open = useCallback(() => setState('full'), [])

  return { state, setState, open }
}
