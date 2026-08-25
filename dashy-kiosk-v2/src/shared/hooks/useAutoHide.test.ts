/**
 * Tests for useAutoHide hook.
 *
 * Validates edge-triggered auto-hide behavior with hover pinning.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoHide } from './useAutoHide'

describe('useAutoHide', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts hidden', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'top' }))
    expect(result.current.isVisible).toBe(false)
  })

  it('show() makes element visible', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'top' }))

    act(() => {
      result.current.show()
    })

    expect(result.current.isVisible).toBe(true)
  })

  it('hide() hides element', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'top' }))

    act(() => {
      result.current.show()
    })
    expect(result.current.isVisible).toBe(true)

    act(() => {
      result.current.hide()
    })
    expect(result.current.isVisible).toBe(false)
  })

  it('detects mouse near top edge', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'top' }))

    // Mock viewport height
    vi.stubGlobal('innerHeight', 1080)

    // Simulate mouse near top edge (within 0.8% threshold = ~8px)
    act(() => {
      const event = new MouseEvent('mousemove', { clientY: 5 })
      window.dispatchEvent(event)
    })

    expect(result.current.isVisible).toBe(true)
  })

  it('detects mouse near left edge', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'left' }))

    // Mock viewport width
    vi.stubGlobal('innerWidth', 1920)

    // Simulate mouse near left edge (within 0.8% threshold = ~15px)
    act(() => {
      const event = new MouseEvent('mousemove', { clientX: 10 })
      window.dispatchEvent(event)
    })

    expect(result.current.isVisible).toBe(true)
  })

  it('detects mouse near bottom edge', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'bottom' }))

    // Mock viewport height
    vi.stubGlobal('innerHeight', 1080)

    // Simulate mouse near bottom edge (within 0.8% threshold = ~8px)
    act(() => {
      const event = new MouseEvent('mousemove', { clientY: 1075 })
      window.dispatchEvent(event)
    })

    expect(result.current.isVisible).toBe(true)
  })

  it('hides when mouse moves away from edge', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'top' }))

    vi.stubGlobal('innerHeight', 1080)

    // Show by moving near edge
    act(() => {
      const event = new MouseEvent('mousemove', { clientY: 5 })
      window.dispatchEvent(event)
    })
    expect(result.current.isVisible).toBe(true)

    // Wait for transition to complete
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Hide by moving away from edge (and not hovering element)
    act(() => {
      const event = new MouseEvent('mousemove', { clientY: 500 })
      window.dispatchEvent(event)
    })

    expect(result.current.isVisible).toBe(false)
  })

  it('provides elementRef for hover detection', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'top' }))
    expect(result.current.elementRef).toBeDefined()
    expect(result.current.elementRef.current).toBeNull() // Not attached yet
  })

  it('show() is idempotent', () => {
    const { result } = renderHook(() => useAutoHide({ edge: 'top' }))

    act(() => {
      result.current.show()
    })
    expect(result.current.isVisible).toBe(true)

    act(() => {
      result.current.show()
    })
    expect(result.current.isVisible).toBe(true)
  })
})
