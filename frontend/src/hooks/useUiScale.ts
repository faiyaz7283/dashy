/**
 * useUiScale — uniform UI scale factor based on viewport width.
 *
 * scale = max(1, viewportWidth / layout.designWidth):
 * - 1080p-class displays (Pi kiosk, laptops) → 1 (pixel-perfect, unchanged)
 * - wider / higher-resolution monitors → > 1 (everything scales up uniformly)
 *
 * Applied as CSS `zoom` on the app root (App.tsx): unlike `transform: scale`,
 * zoom reflows layout, so sticky/fixed positioning keeps working and the
 * fluid layout re-fills the viewport edge to edge with no letterboxing.
 * Never scales down — smaller screens keep the design text size (readability
 * was an explicit requirement). Recomputes on window resize.
 */

import { useState, useEffect } from 'react'
import { layout } from '../theme/tokens'

function computeScale(): number {
  return Math.max(1, window.innerWidth / layout.designWidth)
}

/**
 * useUiScale hook.
 *
 * @returns The UI scale factor (>= 1).
 */
export function useUiScale(): number {
  const [scale, setScale] = useState(computeScale)

  useEffect(() => {
    const onResize = () => setScale(computeScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return scale
}
