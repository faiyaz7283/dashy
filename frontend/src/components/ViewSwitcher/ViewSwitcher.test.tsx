import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ViewSwitcher } from './ViewSwitcher'

describe('ViewSwitcher', () => {
  it('renders all four view options', () => {
    render(<ViewSwitcher activeView="week" onViewChange={vi.fn()} />)
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Year')).toBeInTheDocument()
  })

  it('highlights the active view', () => {
    render(<ViewSwitcher activeView="month" onViewChange={vi.fn()} />)
    const monthButton = screen.getByText('Month')
    expect(monthButton).toBeInTheDocument()
  })

  it('calls onViewChange when a view is clicked', () => {
    const onViewChange = vi.fn()
    render(<ViewSwitcher activeView="week" onViewChange={onViewChange} />)

    fireEvent.click(screen.getByText('Day'))
    expect(onViewChange).toHaveBeenCalledWith('day')

    fireEvent.click(screen.getByText('Year'))
    expect(onViewChange).toHaveBeenCalledWith('year')
  })

  it('renders all views in correct order', () => {
    const { container } = render(<ViewSwitcher activeView="week" onViewChange={vi.fn()} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons).toHaveLength(4)
    expect(buttons[0]).toHaveTextContent('Day')
    expect(buttons[1]).toHaveTextContent('Week')
    expect(buttons[2]).toHaveTextContent('Month')
    expect(buttons[3]).toHaveTextContent('Year')
  })
})
