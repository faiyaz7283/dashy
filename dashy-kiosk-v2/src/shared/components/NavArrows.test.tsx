/**
 * Tests for NavArrows component.
 *
 * Validates navigation arrows render and trigger callbacks.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavArrows } from './NavArrows'

describe('NavArrows', () => {
  it('renders both arrows', () => {
    render(
      <NavArrows
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        previousTitle="Previous day"
        nextTitle="Next day"
      />
    )
    expect(screen.getByTitle('Previous day')).toBeInTheDocument()
    expect(screen.getByTitle('Next day')).toBeInTheDocument()
  })

  it('calls onPrevious when left arrow clicked', async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()
    render(
      <NavArrows
        onPrevious={onPrevious}
        onNext={vi.fn()}
        previousTitle="Previous"
        nextTitle="Next"
      />
    )

    await user.click(screen.getByTitle('Previous'))
    expect(onPrevious).toHaveBeenCalledOnce()
  })

  it('calls onNext when right arrow clicked', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(
      <NavArrows
        onPrevious={vi.fn()}
        onNext={onNext}
        previousTitle="Previous"
        nextTitle="Next"
      />
    )

    await user.click(screen.getByTitle('Next'))
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('applies custom titles', () => {
    render(
      <NavArrows
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        previousTitle="Previous week"
        nextTitle="Next week"
      />
    )
    expect(screen.getByTitle('Previous week')).toBeInTheDocument()
    expect(screen.getByTitle('Next week')).toBeInTheDocument()
  })
})
