/**
 * Tests for useUiScale hook.
 *
 * Validates the UI scaling behavior that adjusts the root font size
 * based on viewport width relative to the design baseline (1920px).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUiScale } from './useUiScale'

describe('useUiScale', () => {
  let originalInnerWidth: number

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    // Reset root zoom before each test
    document.documentElement.style.zoom = ''
  })

  afterEach(() => {
    // Restore original viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    })
    // Clean up root zoom
    document.documentElement.style.zoom = ''
    vi.restoreAllMocks()
  })

  it('sets root zoom to 1 at design baseline (1920px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1920,
    })

    renderHook(() => useUiScale())

    expect(document.documentElement.style.zoom).toBe('1')
  })

  it('scales up zoom for viewports wider than 1920px', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 2560,
    })

    renderHook(() => useUiScale())

    // 2560 / 1920 = 1.333...
    expect(document.documentElement.style.zoom).toBe('1.3333333333333333')
  })

  it('does not scale down below 1 for smaller viewports', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1280,
    })

    renderHook(() => useUiScale())

    // Should stay at minimum 1, not scale down
    expect(document.documentElement.style.zoom).toBe('1')
  })

  it('updates zoom on window resize', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1920,
    })

    renderHook(() => useUiScale())
    expect(document.documentElement.style.zoom).toBe('1')

    // Simulate resize to 2560px
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 2560,
    })
    window.dispatchEvent(new Event('resize'))

    expect(document.documentElement.style.zoom).toBe('1.3333333333333333')
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useUiScale())
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('handles edge case: viewport exactly at minimum threshold', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    renderHook(() => useUiScale())

    // Should be at minimum 1
    expect(document.documentElement.style.zoom).toBe('1')
  })

  it('scales proportionally for intermediate viewport sizes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 2240,
    })

    renderHook(() => useUiScale())

    // 2240 / 1920 = 1.1666...
    expect(document.documentElement.style.zoom).toBe('1.1666666666666667')
  })
})
