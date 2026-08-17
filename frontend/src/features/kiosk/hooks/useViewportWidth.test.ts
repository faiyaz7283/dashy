import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { useViewportWidth } from './useViewportWidth'

const originalWidth = window.innerWidth

describe('useViewportWidth', () => {
  afterEach(() => {
    window.innerWidth = originalWidth
  })

  it('returns the current viewport width', () => {
    window.innerWidth = 1440
    const { result } = renderHook(() => useViewportWidth())
    expect(result.current).toBe(1440)
  })

  it('updates on window resize', () => {
    window.innerWidth = 1920
    const { result } = renderHook(() => useViewportWidth())

    act(() => {
      window.innerWidth = 768
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(768)
  })
})
