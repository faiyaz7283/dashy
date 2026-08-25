/**
 * Tests for ChoreCard component.
 *
 * Validates chore card renders instance details correctly.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChoreCard } from './ChoreCard'
import type { ChoreInstance, MasterChore, ChoreCategory } from '@/types/chores'
import type { PaletteKey } from '@/shared/utils/memberColors'

describe('ChoreCard', () => {
  const mockCategories: ChoreCategory[] = [
    { id: 'cat-1', name: 'Kitchen' },
    { id: 'cat-2', name: 'Bathroom' },
  ]

  const mockMasterChore: MasterChore = {
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

  const mockColorMap = new Map<string, PaletteKey>([
    ['faiyaz', 'blue'],
    ['trisha', 'pink'],
  ])

  it('renders chore name', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Wipe Counter')).toBeInTheDocument()
  })

  it('renders category name', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
  })

  it('renders frequency', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('daily')).toBeInTheDocument()
  })

  it('renders difficulty dots', () => {
    const { container } = render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    // Should have 5 difficulty dots
    const dots = container.querySelectorAll('.h-1\\.5')
    expect(dots.length).toBe(5)
  })

  it('renders estimated time', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('10m')).toBeInTheDocument()
  })

  it('renders due time', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Due: 18:00')).toBeInTheDocument()
  })

  it('renders assignment status for open chore', () => {
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Unclaimed')).toBeInTheDocument()
  })

  it('renders assignment status for claimed chore', () => {
    const claimedInstance = { ...mockInstance, claimed_by: 'faiyaz', status: 'claimed' as const }
    render(
      <ChoreCard
        instance={claimedInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Claimed by faiyaz')).toBeInTheDocument()
  })

  it('renders assignment status for assigned chore', () => {
    const assignedInstance = {
      ...mockInstance,
      assigned_to: 'trisha',
      assigned_by: 'faiyaz',
      status: 'assigned' as const,
    }
    render(
      <ChoreCard
        instance={assignedInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Assigned by faiyaz to trisha')).toBeInTheDocument()
  })

  it('renders completion status', () => {
    const completedInstance = {
      ...mockInstance,
      completed_by: 'trisha',
      status: 'completed' as const,
    }
    render(
      <ChoreCard
        instance={completedInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Completed by trisha')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={mockMasterChore}
        categories={mockCategories}
        colorMap={mockColorMap}
        onClick={onClick}
      />
    )
    await user.click(screen.getByText('Wipe Counter'))
    expect(onClick).toHaveBeenCalled()
  })

  it('shows "Uncategorized" when category not found', () => {
    const masterWithUnknownCategory = {
      ...mockMasterChore,
      category: { id: 'unknown', name: 'Unknown' },
    }
    render(
      <ChoreCard
        instance={mockInstance}
        masterChore={masterWithUnknownCategory}
        categories={mockCategories}
        colorMap={mockColorMap}
      />
    )
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
  })
})
