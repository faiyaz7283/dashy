/**
 * Hook for auto-hiding the header based on mouse proximity to the top of the screen.
 *
 * The header is visible when the mouse is within the trigger zone (top 50px).
 * When the mouse leaves the trigger zone, a timer starts. After the delay (3s),
 * the header collapses. Moving the mouse back into the trigger zone immediately
 * shows the header again.
 *
 * @param options - Configuration options.
 * @param options.triggerZone - Pixel distance from top that triggers header visibility (default: 50).
 * @param options.hideDelay - Milliseconds to wait before hiding after mouse leaves trigger zone (default: 3000).
 * @returns Whether the header should be visible.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAutoHideHeaderOptions {
  /** Pixel distance from top that triggers header visibility. */
  triggerZone?: number
  /** Milliseconds to wait before hiding after mouse leaves trigger zone. */
  hideDelay?: number
}

export function useAutoHideHeader(options: UseAutoHideHeaderOptions = {}) {
  const { triggerZone = 50, hideDelay = 3000 } = options

  const [isVisible, setIsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVisibleRef = useRef(true)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const startHideTimer = useCallback(() => {
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false)
      isVisibleRef.current = false
    }, hideDelay)
  }, [hideDelay, clearHideTimer])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= triggerZone) {
        // Mouse is in trigger zone - show header immediately
        if (!isVisibleRef.current) {
          setIsVisible(true)
          isVisibleRef.current = true
        }
        clearHideTimer()
      } else {
        // Mouse left trigger zone - start hide timer
        if (isVisibleRef.current) {
          startHideTimer()
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearHideTimer()
    }
  }, [triggerZone, clearHideTimer, startHideTimer])

  return isVisible
}
