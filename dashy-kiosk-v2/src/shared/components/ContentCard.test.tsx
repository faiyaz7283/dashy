/**
 * Tests for ContentCard component.
 *
 * Validates the standardized content card wrapper renders correctly.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentCard } from './ContentCard'

describe('ContentCard', () => {
  it('renders children', () => {
    render(
      <ContentCard>
        <div data-testid="child">Test content</div>
      </ContentCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    const { container } = render(
      <ContentCard>
        <span>Content</span>
      </ContentCard>
    )
    const outer = container.firstElementChild
    expect(outer).toHaveClass('flex', 'h-full', 'w-full', 'flex-col', 'p-2')
  })

  it('applies additional className', () => {
    const { container } = render(
      <ContentCard className="extra-class">
        <span>Content</span>
      </ContentCard>
    )
    const outer = container.firstElementChild
    expect(outer).toHaveClass('extra-class')
  })

  it('renders inner card with correct structure', () => {
    const { container } = render(
      <ContentCard>
        <span>Content</span>
      </ContentCard>
    )
    const inner = container.querySelector('.rounded-lg')
    expect(inner).toHaveClass('bg-white', 'shadow-xs', 'ring-1', 'ring-border')
  })
})
