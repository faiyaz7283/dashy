import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEdgeProximity } from './useEdgeProximity'

function moveMouse(x: number, y: number) {
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }))
}

describe('useEdgeProximity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts visible and hides after the delay when the mouse is away', () => {
    const { result } = renderHook(() => useEdgeProximity({ edge: 'top', hideDelay: 3000 }))
    expect(result.current).toBe(true)

    act(() => {
      moveMouse(500, 500) // away from every edge
    })
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current).toBe(false)
  })

  it('shows immediately when the mouse nears the watched edge', () => {
    const { result } = renderHook(() =>
      useEdgeProximity({ edge: 'left', triggerZone: 60, hideDelay: 3000 }),
    )

    act(() => {
      moveMouse(500, 500)
      vi.advanceTimersByTime(3000)
    })
    expect(result.current).toBe(false)

    act(() => {
      moveMouse(10, 500) // near left edge
    })
    expect(result.current).toBe(true)
  })

  it('does not show when the mouse nears a different edge', () => {
    const { result } = renderHook(() =>
      useEdgeProximity({ edge: 'left', triggerZone: 60, hideDelay: 3000 }),
    )

    act(() => {
      moveMouse(500, 500)
      vi.advanceTimersByTime(3000)
    })
    act(() => {
      moveMouse(500, 10) // near top edge, not left
      vi.advanceTimersByTime(3000)
    })
    expect(result.current).toBe(false)
  })

  it('cancels the hide timer when the mouse re-enters the zone', () => {
    const { result } = renderHook(() =>
      useEdgeProximity({ edge: 'bottom', triggerZone: 60, hideDelay: 3000 }),
    )

    act(() => {
      moveMouse(500, 500)
      vi.advanceTimersByTime(2000)
    })
    act(() => {
      moveMouse(500, window.innerHeight - 10) // near bottom edge
      vi.advanceTimersByTime(2000)
    })
    // Timer was cancelled at 2s in, so still visible after total 4s
    expect(result.current).toBe(true)
  })
})
