/**
 * Tests for StatusBar component.
 *
 * Validates status bar renders settings, countdowns, and theme toggle.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBar } from './StatusBar'

describe('StatusBar', () => {
  const defaultProps = {
    activeFeature: 'calendar' as const,
    themeMode: 'light' as const,
    onThemeCycle: vi.fn(),
    calendarLastRefresh: Date.now(),
    weatherLastRefresh: Date.now(),
  }

  it('renders settings icon', () => {
    render(<StatusBar {...defaultProps} />)
    expect(screen.getByTitle('Settings')).toBeInTheDocument()
  })

  it('renders theme toggle', () => {
    render(<StatusBar {...defaultProps} themeMode="dark" />)
    // Theme toggle button has title "Theme: dark"
    const themeToggle = screen.getByTitle('Theme: dark')
    expect(themeToggle).toBeInTheDocument()
  })

  it('renders with correct height', () => {
    const { container } = render(<StatusBar {...defaultProps} themeMode="auto" />)
    const statusBar = container.firstElementChild
    expect(statusBar).toHaveStyle({ height: 'var(--shell-status-bar-height)' })
  })

  it('renders countdown timers when calendar feature is active', () => {
    render(<StatusBar {...defaultProps} activeFeature="calendar" />)
    // Should show calendar and weather countdowns — both contain digits
    const countdowns = screen.getAllByText(/\d/)
    expect(countdowns.length).toBeGreaterThanOrEqual(2)
  })

  it('hides countdown timers when chores feature is active', () => {
    render(<StatusBar {...defaultProps} activeFeature="chores" />)
    // Should not show countdown timers
    const countdowns = screen.queryAllByText(/\d/)
    expect(countdowns.length).toBe(0)
  })

  it('shows dash when no refresh timestamp', () => {
    render(<StatusBar {...defaultProps} calendarLastRefresh={null} weatherLastRefresh={null} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
