/**
 * Tests for useSidebarState hook.
 *
 * Validates sidebar state management with localStorage persistence.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSidebarState } from './useSidebarState'

describe('useSidebarState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with collapsed state by default', () => {
    const { result } = renderHook(() => useSidebarState())
    expect(result.current.isExpanded).toBe(false)
  })

  it('initializes from localStorage if saved', () => {
    localStorage.setItem('dashy-sidebar-expanded', 'true')
    const { result } = renderHook(() => useSidebarState())
    expect(result.current.isExpanded).toBe(true)
  })

  it('toggles sidebar state', () => {
    const { result } = renderHook(() => useSidebarState())

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isExpanded).toBe(true)
    expect(localStorage.getItem('dashy-sidebar-expanded')).toBe('true')

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isExpanded).toBe(false)
    expect(localStorage.getItem('dashy-sidebar-expanded')).toBe('false')
  })

  it('sets expanded state directly', () => {
    const { result } = renderHook(() => useSidebarState())

    act(() => {
      result.current.setExpanded(true)
    })

    expect(result.current.isExpanded).toBe(true)
    expect(localStorage.getItem('dashy-sidebar-expanded')).toBe('true')

    act(() => {
      result.current.setExpanded(false)
    })

    expect(result.current.isExpanded).toBe(false)
    expect(localStorage.getItem('dashy-sidebar-expanded')).toBe('false')
  })

  it('updates lastToggleTime on toggle', () => {
    const { result } = renderHook(() => useSidebarState())
    const initialTime = result.current.lastToggleTime

    act(() => {
      result.current.toggle()
    })

    expect(result.current.lastToggleTime).toBeGreaterThan(initialTime)
  })

  it('updates lastToggleTime on setExpanded', () => {
    const { result } = renderHook(() => useSidebarState())
    const initialTime = result.current.lastToggleTime

    act(() => {
      result.current.setExpanded(true)
    })

    expect(result.current.lastToggleTime).toBeGreaterThan(initialTime)
  })
})
