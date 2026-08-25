/**
 * Tests for DayView component.
 *
 * Validates day view renders with date, weather, and events.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DayView } from './DayView'

// Mock the hooks
vi.mock('@/features/weather/hooks/useWeatherData', () => ({
  useWeatherData: () => ({
    current: {
      temperature: 83,
      feels_like: 80,
      condition: 'clear',
      humidity: 45,
      wind_speed: 5,
    },
    forecast: [
      {
        date: '2026-08-24',
        high: 83,
        low: 68,
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

vi.mock('@/features/calendar/hooks/useCalendarData', () => ({
  useCalendarData: () => ({
    events: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/shared/hooks/useFamilyData', () => ({
  useFamilyData: () => ({
    members: [],
    isLoading: false,
    error: null,
  }),
}))

describe('DayView', () => {
  const mockDate = Temporal.PlainDate.from('2026-08-24')
  const mockOnPrevious = vi.fn()
  const mockOnNext = vi.fn()

  it('renders navigation arrows', async () => {
    await waitFor(() => {
      render(
        <DayView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    expect(screen.getByTitle('Previous day')).toBeInTheDocument()
    expect(screen.getByTitle('Next day')).toBeInTheDocument()
  })

  it('renders weather summary', async () => {
    await waitFor(() => {
      render(
        <DayView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Use getAllByText since weather text appears in both weather bar and popup
    expect(screen.getAllByText('83°').length).toBeGreaterThan(0)
    expect(screen.getAllByText('68°').length).toBeGreaterThan(0)
  })

  it('renders time grid', async () => {
    await waitFor(() => {
      render(
        <DayView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Time grid should have hour labels
    expect(screen.getByText('9 AM')).toBeInTheDocument()
  })

  it('calls onPrevious when left arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <DayView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Previous day'))
    expect(mockOnPrevious).toHaveBeenCalled()
  })

  it('calls onNext when right arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <DayView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Next day'))
    expect(mockOnNext).toHaveBeenCalled()
  })
})
