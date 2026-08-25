/**
 * Tests for WeekView component.
 *
 * Validates week view renders with date range, weather, and events.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { WeekView } from './WeekView'

describe('WeekView', () => {
  const mockDate = Temporal.PlainDate.from('2026-08-24')
  const mockOnPrevious = vi.fn()
  const mockOnNext = vi.fn()

  it('renders navigation arrows', async () => {
    await waitFor(() => {
      render(
        <WeekView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    expect(screen.getByTitle('Previous week')).toBeInTheDocument()
    expect(screen.getByTitle('Next week')).toBeInTheDocument()
  })

  it('renders week grid with 7 days', async () => {
    await waitFor(() => {
      render(
        <WeekView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Should show day names
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Wed')).toBeInTheDocument()
    expect(screen.getByText('Thu')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()
    expect(screen.getByText('Sat')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('renders day cards with date numbers', async () => {
    await waitFor(() => {
      render(
        <WeekView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Should show date numbers for the week
    // The week containing Aug 24, 2026 (Monday) would be Aug 24-30
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('26')).toBeInTheDocument()
  })

  it('calls onPrevious when left arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <WeekView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Previous week'))
    expect(mockOnPrevious).toHaveBeenCalled()
  })

  it('calls onNext when right arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <WeekView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Next week'))
    expect(mockOnNext).toHaveBeenCalled()
  })
})
