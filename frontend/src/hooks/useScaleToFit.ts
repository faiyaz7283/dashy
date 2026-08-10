/**
 * useScaleToFit — uniform scale factor that fits the fixed design canvas
 * (layout.designWidth × layout.designHeight, the 1080p kiosk baseline) into
 * the actual viewport.
 *
 * scale = min(vw / designWidth, vh / designHeight):
 * - 1080p Pi kiosk  → 1 (pixel-perfect)
 * - larger / higher-DPI monitors → > 1 (scales up, fills the screen)
 * - smaller windows → < 1 (scales down, everything stays visible)
 *
 * Recomputes on window resize, so rotating or moving the window between
 * displays adjusts live.
 */

import { useState, useEffect } from 'react'
import { layout } from '../theme/tokens'

function computeScale(): number {
  return Math.min(window.innerWidth / layout.designWidth, window.innerHeight / layout.designHeight)
}

/**
 * useScaleToFit hook.
 *
 * @returns The uniform scale factor for the design canvas.
 */
export function useScaleToFit(): number {
  const [scale, setScale] = useState(computeScale)

  useEffect(() => {
    const onResize = () => setScale(computeScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return scale
}
