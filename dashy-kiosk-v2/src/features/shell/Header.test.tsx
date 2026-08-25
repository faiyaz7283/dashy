/**
 * Tests for Header component.
 *
 * Validates header renders with date, clock, weather, and view switcher.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'
import { formatHeaderDate } from '@/shared/date'

// Mock the hooks
vi.mock('@/shared/hooks/useClock', () => ({
  useClock: () => Temporal.PlainTime.from('18:30:00'),
}))

vi.mock('@/features/weather/hooks/useWeatherData', () => ({
  useWeatherData: () => ({
    current: {
      temperature: 72,
      feels_like: 70,
      condition: 'clear',
      humidity: 45,
      wind_speed: 5,
    },
    forecast: [
      {
        date: '2026-08-21',
        high: 75,
        low: 60,
        condition: 'clear',
        icon: 'clear',
      },
    ],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

describe('Header', () => {
  const defaultProps = {
    activeFeature: 'calendar' as const,
    currentView: 'month' as const,
    onViewChange: vi.fn(),
    onToday: vi.fn(),
    members: [
      { key: 'faiyaz', name: 'Faiyaz', initial: 'F', color_key: 'blue', calendar_id: 'cal1', email: 'faiyaz@test.com', color: 'blue', date_of_birth: '1990-01-01', relation: 'father' },
      { key: 'trisha', name: 'Trisha', initial: 'T', color_key: 'pink', calendar_id: 'cal2', email: 'trisha@test.com', color: 'pink', date_of_birth: '1992-01-01', relation: 'mother' },
    ],
    events: [],
    choresData: null,
  }

  it('renders date', () => {
    render(<Header {...defaultProps} />)
    const expectedDate = formatHeaderDate(Temporal.Now.plainDateISO())
    expect(screen.getByText(expectedDate)).toBeInTheDocument()
  })

  it('renders clock', () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText('6:30 PM')).toBeInTheDocument()
  })

  it('renders weather summary', () => {
    render(<Header {...defaultProps} />)
    // Use getAllByText since weather text appears in both header and popup
    expect(screen.getAllByText('72°').length).toBeGreaterThan(0)
    expect(screen.getAllByText('70°').length).toBeGreaterThan(0)
    expect(screen.getAllByText('clear').length).toBeGreaterThan(0)
  })

  it('renders view switcher when calendar feature is active', () => {
    render(<Header {...defaultProps} activeFeature="calendar" />)
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Year')).toBeInTheDocument()
  })

  it('hides view switcher when chores feature is active', () => {
    render(<Header {...defaultProps} activeFeature="chores" />)
    expect(screen.queryByText('Day')).not.toBeInTheDocument()
    expect(screen.queryByText('Week')).not.toBeInTheDocument()
    expect(screen.queryByText('Month')).not.toBeInTheDocument()
    expect(screen.queryByText('Year')).not.toBeInTheDocument()
  })

  it('renders Today button when calendar feature is active', () => {
    render(<Header {...defaultProps} activeFeature="calendar" />)
    const todayButton = screen.getByRole('button', { name: 'Today' })
    expect(todayButton).toBeInTheDocument()
  })

  it('hides Today button when chores feature is active', () => {
    render(<Header {...defaultProps} activeFeature="chores" />)
    // Look for the Today button specifically (not just any text containing "Today")
    const todayButton = screen.queryByRole('button', { name: 'Today' })
    expect(todayButton).not.toBeInTheDocument()
  })

  it('renders date picker button when calendar feature is active', () => {
    render(<Header {...defaultProps} activeFeature="calendar" />)
    expect(screen.getByTitle('Date picker')).toBeInTheDocument()
  })

  it('hides date picker button when chores feature is active', () => {
    render(<Header {...defaultProps} activeFeature="chores" />)
    expect(screen.queryByTitle('Date picker')).not.toBeInTheDocument()
  })
})
