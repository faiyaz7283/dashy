import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Clock } from './Clock'

describe('Clock', () => {
  it('renders without crashing', () => {
    render(<Clock />)
    // Clock should render a time string (format varies by timezone)
    const timeElement = screen.getByText(/.+/)
    expect(timeElement).toBeInTheDocument()
  })

  it('displays time in correct format', () => {
    render(<Clock />)
    // Should match pattern like "2:30 PM" or "10:30 AM"
    const timeElement = screen.getByText(/\d+:\d+\s*(AM|PM)/)
    expect(timeElement).toBeInTheDocument()
  })
})
