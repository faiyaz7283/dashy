/**
 * useEdgeProximity — auto-hide UI chrome based on mouse proximity to a screen edge.
 *
 * Generalizes the original useAutoHideHeader to any edge, macOS-Dock style:
 * the element starts visible; when the mouse leaves the trigger zone a timer
 * starts, and after `hideDelay` it hides. Moving the mouse back within
 * `triggerZone` pixels of the edge shows it again immediately.
 *
 * Used for the header (top), sidebar (left), and status bar (bottom).
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export type Edge = 'top' | 'bottom' | 'left' | 'right'

interface UseEdgeProximityOptions {
  /** Which screen edge to watch. */
  edge: Edge
  /** Pixel distance from the edge that counts as "near" (default: 60). */
  triggerZone?: number
  /** Milliseconds to wait before hiding after the mouse leaves (default: 3000). */
  hideDelay?: number
}

/**
 * useEdgeProximity hook.
 *
 * @param options - Configuration options.
 * @returns Whether the chrome for this edge should be visible.
 */
export function useEdgeProximity(options: UseEdgeProximityOptions): boolean {
  const { edge, triggerZone = 60, hideDelay = 3000 } = options

  const [isVisible, setIsVisible] = useState(true)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVisibleRef = useRef(true)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const startIdleTimer = useCallback(() => {
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      setIsVisible(false)
      isVisibleRef.current = false
    }, hideDelay)
  }, [hideDelay, clearIdleTimer])

  useEffect(() => {
    const inZone = (e: MouseEvent): boolean => {
      switch (edge) {
        case 'top':
          return e.clientY <= triggerZone
        case 'bottom':
          return window.innerHeight - e.clientY <= triggerZone
        case 'left':
          return e.clientX <= triggerZone
        case 'right':
          return window.innerWidth - e.clientX <= triggerZone
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (inZone(e)) {
        if (!isVisibleRef.current) {
          setIsVisible(true)
          isVisibleRef.current = true
        }
      }
      startIdleTimer()
    }

    window.addEventListener('mousemove', handleMouseMove)
    // Start the idle timer on mount so stationary mice (e.g. a mouse resting
    // on top of a wall-mounted display) do not keep the chrome visible forever.
    startIdleTimer()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearIdleTimer()
    }
  }, [edge, triggerZone, clearIdleTimer, startIdleTimer])

  return isVisible
}
