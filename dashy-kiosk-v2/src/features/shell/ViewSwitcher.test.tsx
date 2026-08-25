/**
 * Tests for ViewSwitcher component.
 *
 * Validates view switcher renders all views and handles selection.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewSwitcher } from './ViewSwitcher'

describe('ViewSwitcher', () => {
  it('renders all view options', () => {
    render(
      <ViewSwitcher currentView="month" onViewChange={vi.fn()} />
    )
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Year')).toBeInTheDocument()
  })

  it('highlights active view', () => {
    render(
      <ViewSwitcher currentView="week" onViewChange={vi.fn()} />
    )
    const weekButton = screen.getByText('Week')
    expect(weekButton).toHaveAttribute('aria-selected', 'true')
  })

  it('calls onViewChange when view clicked', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    render(
      <ViewSwitcher currentView="month" onViewChange={onViewChange} />
    )

    await user.click(screen.getByText('Day'))
    expect(onViewChange).toHaveBeenCalledWith('day')
  })

  it('has tablist role', () => {
    render(
      <ViewSwitcher currentView="month" onViewChange={vi.fn()} />
    )
    const tablists = screen.getAllByRole('tablist')
    expect(tablists.length).toBeGreaterThan(0)
  })
})
