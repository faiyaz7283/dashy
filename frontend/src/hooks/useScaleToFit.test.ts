import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { useScaleToFit } from './useScaleToFit'
import { layout } from '../theme/tokens'

const originalWidth = window.innerWidth
const originalHeight = window.innerHeight

function setViewport(width: number, height: number) {
  window.innerWidth = width
  window.innerHeight = height
}

describe('useScaleToFit', () => {
  afterEach(() => {
    setViewport(originalWidth, originalHeight)
  })

  it('returns 1 on the 1080p design baseline', () => {
    setViewport(1920, 1080)
    const { result } = renderHook(() => useScaleToFit())
    expect(result.current).toBe(1)
  })

  it('scales up on larger viewports', () => {
    setViewport(2560, 1440)
    const { result } = renderHook(() => useScaleToFit())
    expect(result.current).toBeCloseTo(2560 / layout.designWidth)
  })

  it('scales down on smaller viewports', () => {
    setViewport(1280, 800)
    const { result } = renderHook(() => useScaleToFit())
    expect(result.current).toBeCloseTo(1280 / layout.designWidth)
  })

  it('is limited by the tighter dimension (wide-but-short window)', () => {
    setViewport(3840, 1080)
    const { result } = renderHook(() => useScaleToFit())
    expect(result.current).toBe(1) // height is the limiting dimension
  })

  it('recomputes on window resize', () => {
    setViewport(1920, 1080)
    const { result } = renderHook(() => useScaleToFit())
    expect(result.current).toBe(1)

    act(() => {
      setViewport(2560, 1440)
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBeCloseTo(2560 / layout.designWidth)
  })
})
