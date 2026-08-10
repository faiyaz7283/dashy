/**
 * useViewportWidth — reactive viewport width for responsive chrome layout.
 *
 * Drives the header's progressive compaction tiers (full → compact labels →
 * progressively hiding low-priority items). Recomputes on window resize.
 */

import { useState, useEffect } from 'react'

/**
 * useViewportWidth hook.
 *
 * @returns The current window.innerWidth in pixels.
 */
export function useViewportWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return width
}
