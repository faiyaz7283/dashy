/**
 * useEventInteraction — unified popup/modal interaction state for calendar views.
 *
 * Consolidates the hover-popup state previously duplicated in MonthView and
 * YearView, plus the modal selection state from DayView. All views share one
 * interaction rule: hovering a day/event shows the EventPopup, clicking an
 * event opens the EventModal.
 */

import { useState, useCallback } from 'react'
import type { CalendarEvent } from '../types'
import { isSameDay } from '../utils/dateFormat'

interface PopupState {
  visible: boolean
  x: number
  y: number
  date: Date | null
}

const HIDDEN_POPUP: PopupState = { visible: false, x: 0, y: 0, date: null }

/**
 * useEventInteraction hook.
 *
 * @param events - Calendar events (used to decide whether a hovered day has events).
 * @returns Popup/modal state and handlers.
 */
export function useEventInteraction(events: CalendarEvent[]) {
  const [popupState, setPopupState] = useState<PopupState>(HIDDEN_POPUP)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  /** Show the popup when the hovered day has events, hide otherwise. */
  const handleDayMouseEnter = useCallback(
    (e: React.MouseEvent, date: Date) => {
      const hasEvents = events.some((ev) => isSameDay(new Date(ev.start), date))
      setPopupState(hasEvents ? { visible: true, x: e.clientX, y: e.clientY, date } : HIDDEN_POPUP)
    },
    [events],
  )

  /** Track the cursor while the popup is visible. */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPopupState((prev) => (prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev))
  }, [])

  /** Hide the popup. */
  const handleMouseLeave = useCallback(() => {
    setPopupState(HIDDEN_POPUP)
  }, [])

  /** Open the event detail modal. */
  const openEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
  }, [])

  /** Close the event detail modal. */
  const closeEvent = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  return {
    popupState,
    selectedEvent,
    handleDayMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    openEvent,
    closeEvent,
  }
}
