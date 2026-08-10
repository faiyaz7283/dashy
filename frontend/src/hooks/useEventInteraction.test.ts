import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useEventInteraction } from './useEventInteraction'
import type { CalendarEvent } from '../types'

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: '2026-08-10T09:00:00',
    end: '2026-08-10T09:30:00',
    all_day: false,
    members: ['faiyaz'],
  },
]

/** Minimal MouseEvent stub — the hook only reads clientX/clientY. */
function mouseEvent(x: number, y: number): React.MouseEvent {
  return { clientX: x, clientY: y } as React.MouseEvent
}

describe('useEventInteraction', () => {
  it('starts with hidden popup and no selection', () => {
    const { result } = renderHook(() => useEventInteraction(mockEvents))
    expect(result.current.popupState.visible).toBe(false)
    expect(result.current.selectedEvent).toBeNull()
  })

  it('shows popup when hovering a day with events', () => {
    const { result } = renderHook(() => useEventInteraction(mockEvents))
    // Local timezone construction to avoid UTC offset issues
    const date = new Date(2026, 7, 10) // Aug 10, 2026

    act(() => {
      result.current.handleDayMouseEnter(mouseEvent(100, 200), date)
    })

    expect(result.current.popupState).toEqual({ visible: true, x: 100, y: 200, date })
  })

  it('hides popup when hovering a day with no events', () => {
    const { result } = renderHook(() => useEventInteraction(mockEvents))

    act(() => {
      result.current.handleDayMouseEnter(mouseEvent(100, 200), new Date(2026, 7, 10))
    })
    act(() => {
      result.current.handleDayMouseEnter(mouseEvent(150, 250), new Date(2026, 7, 11))
    })

    expect(result.current.popupState.visible).toBe(false)
    expect(result.current.popupState.date).toBeNull()
  })

  it('tracks the cursor while the popup is visible', () => {
    const { result } = renderHook(() => useEventInteraction(mockEvents))

    act(() => {
      result.current.handleDayMouseEnter(mouseEvent(100, 200), new Date(2026, 7, 10))
    })
    act(() => {
      result.current.handleMouseMove(mouseEvent(120, 220))
    })

    expect(result.current.popupState.x).toBe(120)
    expect(result.current.popupState.y).toBe(220)
  })

  it('ignores mouse move when the popup is hidden', () => {
    const { result } = renderHook(() => useEventInteraction(mockEvents))

    act(() => {
      result.current.handleMouseMove(mouseEvent(120, 220))
    })

    expect(result.current.popupState.visible).toBe(false)
  })

  it('hides the popup on mouse leave', () => {
    const { result } = renderHook(() => useEventInteraction(mockEvents))

    act(() => {
      result.current.handleDayMouseEnter(mouseEvent(100, 200), new Date(2026, 7, 10))
    })
    act(() => {
      result.current.handleMouseLeave()
    })

    expect(result.current.popupState.visible).toBe(false)
    expect(result.current.popupState.date).toBeNull()
  })

  it('opens and closes the event modal selection', () => {
    const { result } = renderHook(() => useEventInteraction(mockEvents))

    act(() => {
      result.current.openEvent(mockEvents[0])
    })
    expect(result.current.selectedEvent).toEqual(mockEvents[0])

    act(() => {
      result.current.closeEvent()
    })
    expect(result.current.selectedEvent).toBeNull()
  })
})
