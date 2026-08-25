/**
 * Hook for weather popup positioning and visibility.
 *
 * Uses the shared usePopupPosition hook for mouse-tracked positioning.
 * Provides a simple interface for weather badge components.
 *
 * @example
 * ```tsx
 * const { popupRef, handleMouseEnter, handleMouseMove, handleMouseLeave } = useWeatherPopup()
 *
 * return (
 *   <>
 *     <div
 *       onMouseEnter={handleMouseEnter}
 *       onMouseMove={handleMouseMove}
 *       onMouseLeave={handleMouseLeave}
 *     >
 *       Weather badge
 *     </div>
 *     <div ref={popupRef} className="fixed z-50" style={{ left: -9999, top: -9999, opacity: 0 }}>
 *       <WeatherPopup ... />
 *     </div>
 *   </>
 * )
 * ```
 */

import { usePopupPosition } from '@/shared/hooks/usePopupPosition'

/**
 * Hook for weather popup positioning and visibility.
 *
 * @returns Object with popupRef and mouse event handlers.
 */
export function useWeatherPopup() {
  const { popupRef, handleMouseEnter, handleMouseMove, handleMouseLeave } = usePopupPosition()

  return {
    popupRef,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  }
}
