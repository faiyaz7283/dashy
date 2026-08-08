import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders calendar and weather indicators', () => {
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    // Should show calendar icon (SVG path)
    const calendarIcon = document.querySelector('svg path[d*="M8 7V3"]')
    expect(calendarIcon).toBeTruthy()

    // Should show weather icon (SVG path)
    const weatherIcon = document.querySelector('svg path[d*="M12 3v1"]')
    expect(weatherIcon).toBeTruthy()
  })

  it('shows countdown text in correct format', () => {
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    // Calendar: 2 min interval, just refreshed = "in 2m 00s"
    const calendarText = screen.getByText('in 2m 00s')
    expect(calendarText).toBeTruthy()

    // Weather: 10 min interval, just refreshed = "in 10m 00s"
    const weatherText = screen.getByText('in 10m 00s')
    expect(weatherText).toBeTruthy()
  })

  it('counts down correctly over time', () => {
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    // Initial state
    expect(screen.getByText('in 2m 00s')).toBeTruthy()

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(screen.getByText('in 1m 30s')).toBeTruthy()

    // Advance another 30 seconds (total 60s = 1 min)
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(screen.getByText('in 1m 00s')).toBeTruthy()

    // Advance another 45 seconds (total 105s)
    act(() => {
      vi.advanceTimersByTime(45000)
    })
    expect(screen.getByText('in 15s')).toBeTruthy()
  })

  it('shows refreshing state when countdown reaches 0', () => {
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    // Advance past the 2-minute calendar interval
    act(() => {
      vi.advanceTimersByTime(120000)
    })

    // Should show "refreshing…" for calendar
    expect(screen.getByText('refreshing…')).toBeTruthy()
  })

  it('toggles visibility when button is clicked', () => {
    const now = Date.now()
    render(<StatusBar calendarLastRefresh={now} weatherLastRefresh={now} />)

    const toggleButton = screen.getByTitle('Toggle status bar')

    // Initially visible (should have h-7 class)
    const statusBar = toggleButton.previousElementSibling
    expect(statusBar?.className).toContain('h-7')

    // Click to hide
    fireEvent.click(toggleButton)
    expect(statusBar?.className).toContain('h-0')

    // Click to show again
    fireEvent.click(toggleButton)
    expect(statusBar?.className).toContain('h-7')
  })

  it('handles null lastRefresh values', () => {
    render(<StatusBar calendarLastRefresh={null} weatherLastRefresh={null} />)

    // Should show full interval countdown when no refresh yet
    expect(screen.getByText('in 2m 00s')).toBeTruthy()
    expect(screen.getByText('in 10m 00s')).toBeTruthy()
  })

  it('calculates countdown based on elapsed time', () => {
    const now = Date.now()
    // Simulate calendar was refreshed 90 seconds ago
    render(<StatusBar calendarLastRefresh={now - 90000} weatherLastRefresh={now} />)

    // Calendar: 120s interval - 90s elapsed = 30s remaining
    expect(screen.getByText('in 30s')).toBeTruthy()

    // Weather: just refreshed
    expect(screen.getByText('in 10m 00s')).toBeTruthy()
  })

  it('renders toggle button', () => {
    render(<StatusBar calendarLastRefresh={Date.now()} weatherLastRefresh={Date.now()} />)

    const toggleButton = screen.getByTitle('Toggle status bar')
    expect(toggleButton).toBeTruthy()
  })
})
