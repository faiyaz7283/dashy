import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useSidebar } from './useSidebar'

describe('useSidebar', () => {
  it('renders hidden when not visible, regardless of state', () => {
    const { result } = renderHook(() => useSidebar('landscape', false))
    expect(result.current.state).toBe('hidden')
  })

  it('shows the current state when visible', () => {
    const { result } = renderHook(() => useSidebar('landscape', true))
    expect(result.current.state).toBe('collapsed') // landscape default
  })

  it('restores the last known size state when reappearing', () => {
    const { result, rerender } = renderHook(({ visible }) => useSidebar('landscape', visible), {
      initialProps: { visible: true },
    })

    // User expands to full
    act(() => {
      result.current.setState('full')
    })
    expect(result.current.state).toBe('full')

    // Mouse leaves — sidebar hides
    rerender({ visible: false })
    expect(result.current.state).toBe('hidden')

    // Mouse returns — sidebar reappears at last known state (full)
    rerender({ visible: true })
    expect(result.current.state).toBe('full')
  })
})
