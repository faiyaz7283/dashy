import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { useUiScale } from './useUiScale'
import { layout } from '../theme/tokens'

const originalWidth = window.innerWidth

describe('useUiScale', () => {
  afterEach(() => {
    window.innerWidth = originalWidth
  })

  it('returns 1 on the design baseline width', () => {
    window.innerWidth = layout.designWidth
    const { result } = renderHook(() => useUiScale())
    expect(result.current).toBe(1)
  })

  it('never scales down on smaller widths', () => {
    window.innerWidth = 1366 // Pi TV class
    const { result } = renderHook(() => useUiScale())
    expect(result.current).toBe(1)
  })

  it('scales up on wider monitors', () => {
    window.innerWidth = 2560
    const { result } = renderHook(() => useUiScale())
    expect(result.current).toBeCloseTo(2560 / layout.designWidth)
  })

  it('recomputes on window resize', () => {
    window.innerWidth = layout.designWidth
    const { result } = renderHook(() => useUiScale())
    expect(result.current).toBe(1)

    act(() => {
      window.innerWidth = 3840
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(2)
  })
})
