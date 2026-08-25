/**
 * Shared hook for mouse-tracked popup positioning.
 *
 * Provides viewport-aware popup positioning that follows the cursor
 * with smart edge detection (flips direction when near viewport edges).
 *
 * Uses direct DOM manipulation for position updates to avoid React re-renders
 * on every mousemove, ensuring smooth tracking.
 *
 * @example
 * ```tsx
 * const { popupRef, handleMouseEnter, handleMouseMove, handleMouseLeave } = usePopupPosition()
 *
 * return (
 *   <>
 *     <div
 *       onMouseEnter={handleMouseEnter}
 *       onMouseMove={handleMouseMove}
 *       onMouseLeave={handleMouseLeave}
 *     >
 *       Trigger
 *     </div>
 *     <div ref={popupRef} className="fixed z-50" style={{ left: -9999, top: -9999, opacity: 0 }}>
 *       Popup content
 *     </div>
 *   </>
 * )
 * ```
 */

import { useRef, useCallback, useEffect } from 'react'

/** Popup dimensions for viewport calculations. */
const DEFAULT_POPUP_WIDTH = 320
const DEFAULT_POPUP_HEIGHT = 400
const POPUP_OFFSET = 16
const SHOW_DELAY_MS = 150
const HIDE_DELAY_MS = 100

/**
 * Calculates viewport-aware popup position.
 *
 * Positions popup to the right and below cursor by default.
 * Intelligently chooses position based on available space:
 * - If cursor is in the right half, popup goes left
 * - If cursor is in the bottom half, popup goes above
 * - Always keeps popup fully visible within viewport
 *
 * @param mouseX - Mouse clientX coordinate.
 * @param mouseY - Mouse clientY coordinate.
 * @param popupWidth - Popup width in pixels.
 * @param popupHeight - Popup height in pixels.
 * @returns Position object with x and y coordinates.
 */
function calculatePosition(
  mouseX: number,
  mouseY: number,
  popupWidth: number = DEFAULT_POPUP_WIDTH,
  popupHeight: number = DEFAULT_POPUP_HEIGHT,
): { x: number; y: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Determine horizontal position
  // If cursor is in the right half, position popup to the left
  const spaceOnRight = viewportWidth - mouseX
  const spaceOnLeft = mouseX
  let x: number

  if (spaceOnRight >= popupWidth + POPUP_OFFSET) {
    // Enough space on right - position to the right
    x = mouseX + POPUP_OFFSET
  } else if (spaceOnLeft >= popupWidth + POPUP_OFFSET) {
    // Not enough on right, but enough on left - position to the left
    x = mouseX - popupWidth - POPUP_OFFSET
  } else {
    // Neither side has enough space - use the side with more space
    x = spaceOnRight >= spaceOnLeft
      ? viewportWidth - popupWidth - 8
      : 8
  }

  // Determine vertical position
  // If cursor is in the bottom half, position popup above
  const spaceBelow = viewportHeight - mouseY
  const spaceAbove = mouseY
  let y: number

  if (spaceBelow >= popupHeight + POPUP_OFFSET) {
    // Enough space below - position below cursor
    y = mouseY + POPUP_OFFSET
  } else if (spaceAbove >= popupHeight + POPUP_OFFSET) {
    // Not enough below, but enough above - position above cursor
    y = mouseY - popupHeight - POPUP_OFFSET
  } else {
    // Neither has enough space - use the side with more space
    y = spaceBelow >= spaceAbove
      ? viewportHeight - popupHeight - 8
      : 8
  }

  return { x, y }
}

/**
 * Hook for mouse-tracked popup positioning.
 *
 * @returns Object with popupRef and mouse event handlers.
 */
export function usePopupPosition() {
  const popupRef = useRef<HTMLDivElement | null>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVisibleRef = useRef(false)

  /** Clear any pending show/hide timers. */
  const clearTimers = useCallback(() => {
    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  /** Position the popup element directly via DOM (no React re-render). */
  const positionPopup = useCallback((mouseX: number, mouseY: number) => {
    const el = popupRef.current
    if (!el) return
    const { x, y } = calculatePosition(mouseX, mouseY)
    el.style.left = `${x}px`
    el.style.top = `${y}px`
  }, [])

  /** Show the popup — moves it from offscreen to visible. */
  const showPopup = useCallback(() => {
    const el = popupRef.current
    if (!el) return
    isVisibleRef.current = true
    el.style.opacity = '1'
    el.style.pointerEvents = 'none'
  }, [])

  /** Hide the popup — moves it offscreen. */
  const hidePopup = useCallback(() => {
    const el = popupRef.current
    if (!el) return
    isVisibleRef.current = false
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
  }, [])

  /**
   * Mouse enter handler — schedules popup show after delay.
   *
   * @param event - Mouse event from the DOM.
   */
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      clearTimers()

      // Position immediately so popup appears at cursor when it shows
      positionPopup(event.clientX, event.clientY)

      // If already visible (moving between adjacent triggers), update instantly
      if (isVisibleRef.current) {
        return
      }

      // Otherwise, delay show to prevent flicker
      showTimerRef.current = setTimeout(() => {
        showPopup()
      }, SHOW_DELAY_MS)
    },
    [clearTimers, positionPopup, showPopup],
  )

  /**
   * Mouse move handler — repositions popup via direct DOM manipulation.
   *
   * @param event - Mouse event from the DOM.
   */
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      positionPopup(event.clientX, event.clientY)
    },
    [positionPopup],
  )

  /**
   * Mouse leave handler — schedules popup hide after delay.
   */
  const handleMouseLeave = useCallback(() => {
    clearTimers()

    hideTimerRef.current = setTimeout(() => {
      hidePopup()
    }, HIDE_DELAY_MS)
  }, [clearTimers, hidePopup])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  return {
    popupRef,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  }
}
