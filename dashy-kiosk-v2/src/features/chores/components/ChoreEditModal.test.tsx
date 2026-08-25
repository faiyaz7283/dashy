/**
 * Tests for ChoreEditModal component.
 *
 * Validates chore edit modal renders instance and template tabs correctly.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChoreEditModal } from './ChoreEditModal'
import type { ChoreInstance, MasterChore, ChoreCategory, ChoreTag } from '@/types/chores'
import type { FamilyMember } from '@/types/family'

describe('ChoreEditModal', () => {
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

  const mockMasterChore: MasterChore = {
    id: 'master-1',
    name: 'Wipe Counter',
    category: { id: 'cat-1', name: 'Kitchen' },
    tags: [{ id: 'tag-1', name: 'Quick' }],
    difficulty: 3,
    frequency: 'daily',
    estimated_minutes: 10,
    due_time: '18:00',
    due_date: null,
    expiration_behavior: 'carry_over',
    created_by: 'faiyaz',
    approved_by: 'faiyaz',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
  }

  const mockInstance: ChoreInstance = {
    id: 'instance-1',
    master_chore_id: 'master-1',
    status: 'open',
    period_start: '2026-01-15',
    period_end: '2026-01-16',
    assigned_to: null,
    assigned_by: null,
    claimed_by: null,
    completed_by: null,
    signoff_by: null,
    started_at: null,
    completed_at: null,
    signed_off_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const mockOnClose = vi.fn()
  const mockRefetch = vi.fn()

  it('renders modal title', () => {
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('Edit Chore')).toBeInTheDocument()
  })

  it('renders instance tab by default', () => {
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('This Instance')).toBeInTheDocument()
    expect(screen.getByText('Template')).toBeInTheDocument()
  })

  it('shows instance fields on instance tab', () => {
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Assignment')).toBeInTheDocument()
  })

  it('switches to template tab when clicked', async () => {
    const user = userEvent.setup()
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )

    await user.click(screen.getByText('Template'))
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    // Close button is the X icon in the header
    const modal = screen.getByText('Edit Chore').closest('div')
    const closeButton = modal?.querySelector('button')
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    // Click the first button (close button in header)
    const modal = screen.getByText('Edit Chore').closest('div')
    const closeButton = modal?.querySelector('button')
    if (closeButton) {
      await user.click(closeButton)
    }
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('renders delete button', () => {
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    expect(deleteButton).toBeInTheDocument()
  })

  it('renders save button', () => {
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeInTheDocument()
  })

  it('shows period information', () => {
    render(
      <ChoreEditModal
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        tags={mockTags}
        members={mockMembers}
        onClose={mockOnClose}
        refetch={mockRefetch}
      />
    )
    expect(screen.getByText('Period')).toBeInTheDocument()
  })
})
