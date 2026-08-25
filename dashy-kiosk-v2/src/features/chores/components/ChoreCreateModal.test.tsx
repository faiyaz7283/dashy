/**
 * Tests for ChoreCreateModal component.
 *
 * Validates chore create modal renders form fields and handles submission.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoreCreateModal } from './ChoreCreateModal'
import type { ChoreCategory, ChoreTag } from '@/types/chores'
import type { FamilyMember } from '@/types/family'

describe('ChoreCreateModal', () => {
  const mockCategories: ChoreCategory[] = [
    { id: 'cat-1', name: 'Kitchen' },
    { id: 'cat-2', name: 'Bathroom' },
  ]

  const mockTags: ChoreTag[] = [
    { id: 'tag-1', name: 'Quick' },
    { id: 'tag-2', name: 'Heavy' },
  ]

  const mockMembers: FamilyMember[] = [
    { key: 'faiyaz', name: 'Faiyaz', color: 'blue', initial: 'F', calendar_id: 'cal1', color_key: 'blue', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
    { key: 'trisha', name: 'Trisha', color: 'pink', initial: 'T', calendar_id: 'cal2', color_key: 'pink', email: 'trisha@test.com', date_of_birth: '1992-01-01', relation: 'mother' },
  ]

  const mockOnClose = vi.fn()
  const mockRefetch = vi.fn()

  it('renders modal title', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('New Chore')).toBeInTheDocument()
  })

  it('renders name input', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByPlaceholderText('Chore name...')).toBeInTheDocument()
  })

  it('renders category combobox', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('renders tags input', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('Tags')).toBeInTheDocument()
  })

  it('renders difficulty slider', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('Difficulty')).toBeInTheDocument()
  })

  it('renders frequency dropdown', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('Frequency')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    // Close button is the X icon in the header
    const modal = screen.getByText('New Chore').closest('div')
    const closeButton = modal?.querySelector('button')
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    // Click the first button (close button in header)
    const modal = screen.getByText('New Chore').closest('div')
    const closeButton = modal?.querySelector('button')
    if (closeButton) {
      await user.click(closeButton)
    }
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows assigned member for member entry point', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'member', memberId: 'faiyaz' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    // Should show assigned member info
    expect(screen.getByText(/assigned to/i)).toBeInTheDocument()
  })

  it('shows open pool info for open-pool entry point', () => {
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'open-pool' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    // Should show open pool info
    expect(screen.getByText(/open pool/i)).toBeInTheDocument()
  })

  it('allows typing in name field', async () => {
    const user = userEvent.setup()
    render(
      <ChoreCreateModal
        entryPoint={{ type: 'sidebar' }}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    const nameInput = screen.getByPlaceholderText('Chore name...')
    await user.type(nameInput, 'Test Chore')
    expect(nameInput).toHaveValue('Test Chore')
  })
})
