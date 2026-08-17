import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIdleCursor } from './useIdleCursor'

describe('useIdleCursor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.body.style.cursor = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.style.cursor = ''
  })

  it('hides the cursor immediately on mount', () => {
    renderHook(() => useIdleCursor({ idleMs: 2000 }))
    expect(document.body.style.cursor).toBe('none')
  })

  it('shows the cursor on mousemove and hides again after idle', () => {
    renderHook(() => useIdleCursor({ idleMs: 2000 }))
    expect(document.body.style.cursor).toBe('none')

    window.dispatchEvent(new MouseEvent('mousemove'))
    expect(document.body.style.cursor).toBe('')

    vi.advanceTimersByTime(2000)
    expect(document.body.style.cursor).toBe('none')
  })

  it('resets the idle timer on activity', () => {
    renderHook(() => useIdleCursor({ idleMs: 2000 }))

    window.dispatchEvent(new MouseEvent('mousemove'))
    vi.advanceTimersByTime(1000)
    window.dispatchEvent(new MouseEvent('mousemove'))
    vi.advanceTimersByTime(1500)
    expect(document.body.style.cursor).toBe('')

    vi.advanceTimersByTime(1000)
    expect(document.body.style.cursor).toBe('none')
  })

  it('restores the cursor on unmount', () => {
    const { unmount } = renderHook(() => useIdleCursor({ idleMs: 2000 }))
    expect(document.body.style.cursor).toBe('none')
    unmount()
    expect(document.body.style.cursor).toBe('')
  })
})
