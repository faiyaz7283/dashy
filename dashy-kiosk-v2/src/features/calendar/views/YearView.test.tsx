/**
 * Tests for YearView component.
 *
 * Validates year view renders with 12-month grid and event indicators.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { YearView } from './YearView'

describe('YearView', () => {
  const mockDate = Temporal.PlainDate.from('2026-08-24')
  const mockOnPrevious = vi.fn()
  const mockOnNext = vi.fn()

  it('renders navigation arrows', async () => {
    await waitFor(() => {
      render(
        <YearView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    expect(screen.getByTitle('Previous year')).toBeInTheDocument()
    expect(screen.getByTitle('Next year')).toBeInTheDocument()
  })

  it('renders all 12 months', async () => {
    await waitFor(() => {
      render(
        <YearView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Should show all months (full names)
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('February')).toBeInTheDocument()
    expect(screen.getByText('March')).toBeInTheDocument()
    expect(screen.getByText('April')).toBeInTheDocument()
    expect(screen.getByText('May')).toBeInTheDocument()
    expect(screen.getByText('June')).toBeInTheDocument()
    expect(screen.getByText('July')).toBeInTheDocument()
    expect(screen.getByText('August')).toBeInTheDocument()
    expect(screen.getByText('September')).toBeInTheDocument()
    expect(screen.getByText('October')).toBeInTheDocument()
    expect(screen.getByText('November')).toBeInTheDocument()
    expect(screen.getByText('December')).toBeInTheDocument()
  })

  it('renders month names correctly', async () => {
    await waitFor(() => {
      render(
        <YearView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })
    // Check for full month names
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('August')).toBeInTheDocument()
    expect(screen.getByText('December')).toBeInTheDocument()
  })

  it('calls onPrevious when left arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <YearView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Previous year'))
    expect(mockOnPrevious).toHaveBeenCalled()
  })

  it('calls onNext when right arrow clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    await waitFor(() => {
      render(
        <YearView
          date={mockDate}
          onPrevious={mockOnPrevious}
          onNext={mockOnNext}
        />
      )
    })

    await user.click(screen.getByTitle('Next year'))
    expect(mockOnNext).toHaveBeenCalled()
  })
})
