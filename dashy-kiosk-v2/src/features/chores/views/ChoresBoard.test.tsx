/**
 * Tests for ChoresBoard component.
 *
 * Validates chores board renders metrics and member columns correctly.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoresBoard } from './ChoresBoard'
import type { FamilyMember } from '@/types/family'
import type { ChoresData } from '@/types/chores'

describe('ChoresBoard', () => {
  const mockMembers: FamilyMember[] = [
    { key: 'faiyaz', name: 'Faiyaz', color: 'blue', initial: 'F', calendar_id: 'cal1', color_key: 'blue', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
    { key: 'trisha', name: 'Trisha', color: 'pink', initial: 'T', calendar_id: 'cal2', color_key: 'pink', email: 'trisha@test.com', date_of_birth: '1992-01-01', relation: 'mother' },
  ]

  const mockData: ChoresData = {
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
  }

  it('renders loading state', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={null}
        isLoading={true}
        isRefreshing={false}
        error={null}
      />
    )
    expect(screen.getByText('Loading chores...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={null}
        isLoading={false}
        isRefreshing={false}
        error="Failed to load"
      />
    )
    expect(screen.getByText('Error loading chores: Failed to load')).toBeInTheDocument()
  })

  it('renders metrics row', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={mockData}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0)
  })

  it('renders member columns', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={mockData}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    expect(screen.getByText('Faiyaz')).toBeInTheDocument()
    expect(screen.getByText('Trisha')).toBeInTheDocument()
  })

  it('renders open pool column', () => {
    render(
      <ChoresBoard
        members={mockMembers}
        data={mockData}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    expect(screen.getByText('Open Pool')).toBeInTheDocument()
  })

  it('renders null when no data and not loading', () => {
    const { container } = render(
      <ChoresBoard
        members={mockMembers}
        data={null}
        isLoading={false}
        isRefreshing={false}
        error={null}
      />
    )
    expect(container.firstChild).toBeNull()
  })
})
