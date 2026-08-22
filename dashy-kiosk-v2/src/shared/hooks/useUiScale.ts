/**
 * Hook for uniform UI scaling based on viewport width.
 *
 * Applies CSS `zoom` to the root element so the entire UI scales proportionally
 * on larger displays. Never scales down below 1.0 — the design baseline (1920px)
 * renders at 1:1, and wider viewports scale up uniformly.
 *
 * The scale factor is `max(1, viewportWidth / designWidth)`.
 */

import { useEffect, useState } from 'react'
import { layout } from '@/theme/tokens'

/**
 * Calculates and applies a CSS zoom factor to the root element.
 *
 * Listens for viewport resize events and updates the zoom in real time.
 * The zoom is applied to `document.documentElement` so all descendants
 * inherit the scaling.
 *
 * @returns The current scale factor (useful for floating layers that need
 *   to apply the scale manually since they portal to document.body).
 *
 * @example
 * ```ts
 * const scale = useUiScale()
 * // On a 2560px wide display: scale === 1.333
 * // On a 1920px display: scale === 1
 * // On a 1280px display: scale === 1 (never scales down)
 * ```
 */
export function useUiScale(): number {
  const [scale, setScale] = useState(() =>
    Math.max(1, window.innerWidth / layout.designWidth),
  )

  useEffect(() => {
    function updateScale() {
      const newScale = Math.max(1, window.innerWidth / layout.designWidth)
      setScale(newScale)
      document.documentElement.style.zoom = String(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  return scale
}
