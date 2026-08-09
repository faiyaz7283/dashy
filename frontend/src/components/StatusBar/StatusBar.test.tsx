import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders calendar and weather countdown timers', () => {
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    // Calendar: 2 min interval, just refreshed = "in 2m 00s"
    expect(screen.getByText('in 2m 00s')).toBeTruthy()

    // Weather: 10 min interval, just refreshed = "in 10m 00s"
    expect(screen.getByText('in 10m 00s')).toBeTruthy()
  })

  it('counts down correctly over time', () => {
    vi.useFakeTimers()
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    // Initial state
    expect(screen.getByText('in 2m 00s')).toBeTruthy()

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(screen.getByText('in 1m 30s')).toBeTruthy()
  })

  it('shows refreshing state when countdown reaches 0', () => {
    vi.useFakeTimers()
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    // Advance past the 2-minute calendar interval
    act(() => {
      vi.advanceTimersByTime(120000)
    })

    // Should show "refreshing…" for calendar
    expect(screen.getByText('refreshing…')).toBeTruthy()
  })

  it('renders status dots', () => {
    const { container } = render(
      <StatusBar calendarLastRefresh={Date.now()} weatherLastRefresh={Date.now()} />,
    )

    // Should show green status dots
    const dots = container.querySelectorAll('.bg-emerald-500')
    expect(dots.length).toBe(2)
  })
})
