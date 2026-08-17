import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingSkeleton } from './LoadingSkeleton'

describe('LoadingSkeleton', () => {
  it('renders the skeleton layout', () => {
    const { container } = render(<LoadingSkeleton />)

    // Check for the main grid container
    const grid = container.firstChild as HTMLElement
    expect(grid).toBeInTheDocument()
    expect(grid.style.display).toBe('grid')
    expect(grid.style.height).toBe('100vh')
  })

  it('renders placeholder blocks', () => {
    const { container } = render(<LoadingSkeleton />)

    // Check that multiple skeleton blocks are rendered
    const blocks = container.querySelectorAll('div[style*="animation"]')
    expect(blocks.length).toBeGreaterThan(0)
  })
})
