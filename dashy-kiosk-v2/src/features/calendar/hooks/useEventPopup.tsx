/**
 * Hook and Context for managing event popup hover state.
 *
 * Uses the shared usePopupPosition hook for mouse-tracked positioning,
 * and adds event-specific state management (which event is hovered).
 *
 * Eliminates prop drilling by making handlers available via Context
 * to any EventCard component.
 *
 * @example
 * ```tsx
 * // In parent view (DayView/WeekView/MonthView)
 * const { EventPopupProvider, hoveredEvent, popupRef } = useEventPopup()
 *
 * return (
 *   <EventPopupProvider>
 *     <DayCard ... />
 *     <div ref={popupRef} className="fixed z-50" style={{ left: -9999, top: -9999, opacity: 0 }}>
 *       {hoveredEvent && <EventPopup event={hoveredEvent} />}
 *     </div>
 *   </EventPopupProvider>
 * )
 *
 * // In EventCard component
 * const { handleMouseEnter, handleMouseMove, handleMouseLeave } = useEventPopupContext()
 *
 * return (
 *   <div
 *     onMouseEnter={(e) => handleMouseEnter(e, event)}
 *     onMouseMove={handleMouseMove}
 *     onMouseLeave={handleMouseLeave}
 *   >
 *     ...
 *   </div>
 * )
 * ```
 */

import { useState, useCallback, createContext, useContext } from 'react'
import { usePopupPosition } from '@/shared/hooks/usePopupPosition'
import type { CalendarEvent } from '@/types/calendar'

/** Context type for event popup handlers. */
interface EventPopupContextType {
  handleMouseEnter: (event: React.MouseEvent, calendarEvent: CalendarEvent) => void
  handleMouseMove: (event: React.MouseEvent) => void
  handleMouseLeave: () => void
}

/** Context for sharing event popup handlers without prop drilling. */
const EventPopupContext = createContext<EventPopupContextType | null>(null)

/**
 * Hook to access event popup handlers from context.
 *
 * @returns Object with handleMouseEnter, handleMouseMove, and handleMouseLeave.
 * @throws Error if used outside of EventPopupProvider.
 */
export function useEventPopupContext(): EventPopupContextType {
  const context = useContext(EventPopupContext)
  if (!context) {
    throw new Error('useEventPopupContext must be used within EventPopupProvider')
  }
  return context
}

/**
 * Manages event popup hover state and mouse tracking.
 *
 * @returns Object with hoveredEvent, popupRef, and EventPopupProvider.
 */
export function useEventPopup() {
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null)
  const { popupRef, handleMouseEnter: baseEnter, handleMouseMove, handleMouseLeave: baseLeave } = usePopupPosition()

  /**
   * Mouse enter handler — sets the hovered event and triggers popup show.
   *
   * @param event - Mouse event from the DOM.
   * @param calendarEvent - The calendar event being hovered.
   */
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent, calendarEvent: CalendarEvent) => {
      setHoveredEvent(calendarEvent)
      baseEnter(event)
    },
    [baseEnter],
  )

  /**
   * Mouse leave handler — clears the hovered event and triggers popup hide.
   */
  const handleMouseLeave = useCallback(() => {
    setHoveredEvent(null)
    baseLeave()
  }, [baseLeave])

  /**
   * Context provider component for event popup handlers.
   */
  const EventPopupProvider = useCallback(
    ({ children }: { children: React.ReactNode }) => (
      <EventPopupContext.Provider
        value={{ handleMouseEnter, handleMouseMove, handleMouseLeave }}
      >
        {children}
      </EventPopupContext.Provider>
    ),
    [handleMouseEnter, handleMouseMove, handleMouseLeave],
  )

  return {
    hoveredEvent,
    popupRef,
    EventPopupProvider,
  }
}
