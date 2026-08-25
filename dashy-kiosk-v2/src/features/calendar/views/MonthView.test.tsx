/**
 * Tests for MonthView component.
 *
 * Validates month view renders with calendar grid and events.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MonthView } from './MonthView'

describe('MonthView', () => {
  const mockDate = Temporal.PlainDate.from('2026-08-24')
  const mockOnPrevious = vi.fn()
  const mockOnNext = vi.fn()

  it('renders navigation arrows', async () => {
    await waitFor(() => {
      render(
        <MonthView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    expect(screen.getByTitle('Previous month')).toBeInTheDocument()
    expect(screen.getByTitle('Next month')).toBeInTheDocument()
  })

  it('renders month grid with day headers', async () => {
    await waitFor(() => {
      render(
        <MonthView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Should show day headers
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Wed')).toBeInTheDocument()
    expect(screen.getByText('Thu')).toBeInTheDocument()
    expect(screen.getByText('Fri')).toBeInTheDocument()
    expect(screen.getByText('Sat')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('renders dates for the month', async () => {
    await waitFor(() => {
      render(
        <MonthView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Should show some dates (1-31 range) - use getAllByText since dates may repeat
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('15').length).toBeGreaterThan(0)
  })

  it('calls onPrevious when left arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <MonthView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Previous month'))
    expect(mockOnPrevious).toHaveBeenCalled()
  })

  it('calls onNext when right arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <MonthView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Next month'))
    expect(mockOnNext).toHaveBeenCalled()
  })
})
