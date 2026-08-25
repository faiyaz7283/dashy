/**
 * Hook for edge-triggered auto-hide behavior.
 *
 * Shows a UI element when the cursor approaches a screen edge,
 * hides it immediately when the cursor moves away. Hovering the element
 * itself pins it visible. Independent per edge (top/left/bottom).
 *
 * Edge threshold scales with viewport size (0.8% of viewport dimension, min 12px)
 * so the trigger zone feels consistent across different screen resolutions.
 *
 * Used by Header (top), Sidebar (left), and StatusBar (bottom) to reduce
 * visual clutter on the kiosk display.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/** Configuration for the auto-hide behavior. */
export interface UseAutoHideOptions {
  /** Which edge to monitor. */
  edge: 'top' | 'left' | 'bottom'
}

/** Return type of the useAutoHide hook. */
export interface UseAutoHideResult {
  /** Whether the element should be visible. */
  isVisible: boolean
  /** Ref to attach to the element for hover detection. */
  elementRef: React.RefObject<HTMLDivElement | null>
  /** Manually show the element (e.g., for date picker suppression). */
  show: () => void
  /** Manually hide the element. */
  hide: () => void
}

/**
 * Calculate edge threshold based on viewport size.
 *
 * Returns 0.8% of the relevant viewport dimension (height for top/bottom,
 * width for left), with a minimum of 12px. This ensures the trigger zone
 * feels consistent across different screen resolutions.
 *
 * @param edge - Which edge to calculate for.
 * @returns Threshold in pixels.
 */
function getEdgeThreshold(edge: 'top' | 'left' | 'bottom'): number {
  const dimension = edge === 'left' ? window.innerWidth : window.innerHeight
  return Math.max(12, Math.round(dimension * 0.008))
}

/**
 * Manages edge-triggered auto-hide behavior for a UI element.
 *
 * @param options - Configuration for edge detection.
 * @returns Visibility state and controls.
 *
 * @example
 * ```ts
 * const { isVisible, elementRef } = useAutoHide({ edge: 'top' })
 * // isVisible === true when cursor is near top edge or hovering the element
 * ```
 */

/** Duration of the CSS transition in ms, plus a small buffer. */
const TRANSITION_DURATION_MS = 450

export function useAutoHide(options: UseAutoHideOptions): UseAutoHideResult {
  const { edge } = options
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement | null>(null)
  /** Prevents hide() during CSS transition — getBoundingClientRect() returns
   *  intermediate positions that cause false bounds-check failures. */
  const isTransitioningRef = useRef(false)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Track hover state in a ref to avoid listener churn in mousemove effect. */
  const isHoveringRef = useRef(false)

  // Show the element immediately; block hide() until transition completes
  const show = useCallback(() => {
    setIsVisible((prev) => {
      // Only update if actually changing state
      if (prev) return prev
      return true
    })
    isTransitioningRef.current = true
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = setTimeout(() => {
      isTransitioningRef.current = false
    }, TRANSITION_DURATION_MS)
  }, [])

  // Hide the element immediately
  const hide = useCallback(() => {
    setIsVisible(false)
  }, [])

  // Track mouse position for edge detection
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const threshold = getEdgeThreshold(edge)
      let nearEdge = false

      switch (edge) {
        case 'top':
          nearEdge = e.clientY < threshold
          break
        case 'left':
          nearEdge = e.clientX < threshold
          break
        case 'bottom':
          nearEdge = e.clientY > window.innerHeight - threshold
          break
      }

      if (nearEdge) {
        show()
      } else if (!isTransitioningRef.current && !isHoveringRef.current) {
        // Check if mouse is within the element's bounds before hiding
        const element = elementRef.current
        if (element) {
          const rect = element.getBoundingClientRect()
          // For sidebar (left edge), only check horizontal bounds
          // For header/status bar (top/bottom), check both dimensions
          let withinBounds = false
          if (edge === 'left') {
            withinBounds = e.clientX >= rect.left && e.clientX <= rect.right
          } else {
            withinBounds =
              e.clientX >= rect.left &&
              e.clientX <= rect.right &&
              e.clientY >= rect.top &&
              e.clientY <= rect.bottom
          }
          if (!withinBounds) {
            hide()
          }
        } else {
          hide()
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [edge, show, hide])

  // Track hover state on the element itself
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    function handleMouseEnter() {
      isHoveringRef.current = true
      show()
    }

    function handleMouseLeave() {
      isHoveringRef.current = false
      // Don't hide here - let mousemove handler decide based on actual bounds
      // This prevents false hides due to z-index layering with header/status bar
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [show])

  // Cleanup transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    }
  }, [])

  return { isVisible, elementRef, show, hide }
}
