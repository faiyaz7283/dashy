/**
 * Tests for ChoresView component.
 *
 * Validates chores view renders board correctly with modal state passed as props.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoresView } from './ChoresView'
import type { FamilyMember } from '@/types/family'
import type { CreateEntryPoint } from '../components/ChoreCreateModal'

// Mock useChoresData to return loaded data instead of hitting the real API
vi.mock('../hooks/useChoresData', () => ({
  useChoresData: () => ({
    data: {
      categories: [{ id: 'cat-1', name: 'Kitchen' }],
      tags: [{ id: 'tag-1', name: 'Quick' }],
      master_chores: [
        {
          id: 'master-1',
          name: 'Wipe Counter',
          category: { id: 'cat-1', name: 'Kitchen' },
          tags: [],
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
        },
      ],
      instances: [
        {
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
        },
      ],
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
    lastRefresh: null,
  }),
}))

describe('ChoresView', () => {
  const mockMembers: FamilyMember[] = [
    { key: 'faiyaz', name: 'Faiyaz', color: 'blue', initial: 'F', calendar_id: 'cal1', color_key: 'blue', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
    { key: 'trisha', name: 'Trisha', color: 'pink', initial: 'T', calendar_id: 'cal2', color_key: 'pink', email: 'trisha@test.com', date_of_birth: '1992-01-01', relation: 'mother' },
  ]

  const defaultProps = {
    members: mockMembers,
    showCreateModal: false,
    createEntryPoint: { type: 'sidebar' } as CreateEntryPoint,
    editingInstance: null,
    onCloseCreateModal: vi.fn(),
    onCloseEditModal: vi.fn(),
    onAddChore: vi.fn(),
    onChoreClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chores board', () => {
    render(<ChoresView {...defaultProps} />)
    expect(screen.getByText('Faiyaz')).toBeInTheDocument()
    expect(screen.getByText('Trisha')).toBeInTheDocument()
  })

  it('renders open pool column', () => {
    render(<ChoresView {...defaultProps} />)
    expect(screen.getByText('Open Pool')).toBeInTheDocument()
  })

  it('renders metrics row', () => {
    render(<ChoresView {...defaultProps} />)
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0)
  })

  it('does not show create modal when showCreateModal is false', () => {
    render(<ChoresView {...defaultProps} />)
    expect(screen.queryByText('New Chore')).not.toBeInTheDocument()
  })

  it('does not show edit modal when editingInstance is null', () => {
    render(<ChoresView {...defaultProps} />)
    expect(screen.queryByText('Edit Chore')).not.toBeInTheDocument()
  })

  it('calls onAddChore when add button clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    const onAddChore = vi.fn()

    render(<ChoresView {...defaultProps} onAddChore={onAddChore} />)

    const addButtons = screen.getAllByRole('button', { name: /add chore/i })
    if (addButtons.length > 0 && addButtons[0]) {
      await user.click(addButtons[0])
      expect(onAddChore).toHaveBeenCalled()
    }
  })
})
