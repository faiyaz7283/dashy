/**
 * Tests for useTheme hook.
 *
 * Validates theme mode management with localStorage persistence and system preference detection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to auto mode', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('auto')
  })

  it('resolves theme based on system preference in auto mode', () => {
    // Mock prefers-color-scheme: dark
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    const { result } = renderHook(() => useTheme())
    expect(result.current.resolvedTheme).toBe('dark')

    vi.unstubAllGlobals()
  })

  it('loads saved mode from localStorage', () => {
    localStorage.setItem('dashy-theme-mode', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('persists mode changes to localStorage', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setMode('light')
    })

    expect(result.current.mode).toBe('light')
    expect(localStorage.getItem('dashy-theme-mode')).toBe('light')
  })

  it('applies dark class to document in dark mode', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setMode('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class from document in light mode', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setMode('light')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('cycles through modes: light → dark → auto → light', () => {
    const { result } = renderHook(() => useTheme())

    // Start at auto (default)
    expect(result.current.mode).toBe('auto')

    act(() => {
      result.current.cycleMode()
    })
    expect(result.current.mode).toBe('light')

    act(() => {
      result.current.cycleMode()
    })
    expect(result.current.mode).toBe('dark')

    act(() => {
      result.current.cycleMode()
    })
    expect(result.current.mode).toBe('auto')
  })

  it('setMode overrides localStorage value', () => {
    localStorage.setItem('dashy-theme-mode', 'dark')
    const { result } = renderHook(() => useTheme())

    expect(result.current.mode).toBe('dark')

    act(() => {
      result.current.setMode('light')
    })

    expect(result.current.mode).toBe('light')
    expect(localStorage.getItem('dashy-theme-mode')).toBe('light')
  })
})
