/**
 * Tests for DatePicker component.
 *
 * Validates date picker renders calendar grid and handles date selection.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from './DatePicker'

describe('DatePicker', () => {
  const mockSelectedDate = Temporal.PlainDate.from('2026-01-15')
  const mockOnDateSelect = vi.fn()
  const mockOnClose = vi.fn()

  it('renders month and year navigation', () => {
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('2026')).toBeInTheDocument()
  })

  it('shows day-of-week labels', () => {
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )
    expect(screen.getByText('Mo')).toBeInTheDocument()
    expect(screen.getByText('Tu')).toBeInTheDocument()
    expect(screen.getByText('We')).toBeInTheDocument()
    expect(screen.getByText('Th')).toBeInTheDocument()
    expect(screen.getByText('Fr')).toBeInTheDocument()
    expect(screen.getByText('Sa')).toBeInTheDocument()
    expect(screen.getByText('Su')).toBeInTheDocument()
  })

  it('renders calendar grid with dates', () => {
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )
    // Should show dates from the month (use getAllByText since dates may repeat)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('highlights selected date', () => {
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )
    const selectedDateButton = screen.getByText('15').closest('button')
    expect(selectedDateButton).toHaveClass('bg-primary')
  })

  it('calls onDateSelect when date clicked', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )

    await user.click(screen.getByText('20'))
    expect(mockOnDateSelect).toHaveBeenCalledWith(
      Temporal.PlainDate.from('2026-01-20')
    )
  })

  it('navigates to previous month', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )

    const prevMonthButton = screen.getByTitle('Previous month')
    await user.click(prevMonthButton)

    expect(screen.getByText('December')).toBeInTheDocument()
    expect(screen.getByText('2025')).toBeInTheDocument()
  })

  it('navigates to next month', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )

    const nextMonthButton = screen.getByTitle('Next month')
    await user.click(nextMonthButton)

    expect(screen.getByText('February')).toBeInTheDocument()
    expect(screen.getByText('2026')).toBeInTheDocument()
  })

  it('navigates to previous year', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )

    const prevYearButton = screen.getByTitle('Previous year')
    await user.click(prevYearButton)

    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('2025')).toBeInTheDocument()
  })

  it('navigates to next year', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )

    const nextYearButton = screen.getByTitle('Next year')
    await user.click(nextYearButton)

    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('2027')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )

    await user.click(screen.getByText('Close'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows today button', () => {
    render(
      <DatePicker
        selectedDate={mockSelectedDate}
        onDateSelect={mockOnDateSelect}
        onClose={mockOnClose}
      />
    )
    expect(screen.getByText('Today')).toBeInTheDocument()
  })
})
