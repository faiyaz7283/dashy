/**
 * Tests for chores utility functions.
 *
 * Validates chore instance filtering, classification, and formatting.
 */

import { describe, it, expect } from 'vitest'
import {
  isOpenPoolInstance,
  getMemberInstances,
  getStatusColor,
  formatDifficulty,
  getStatusLabel,
} from './chores'
import type { ChoreInstance, InstanceStatus } from '@/types/chores'

describe('chores utilities', () => {
  // Test instances
  const openPoolInstance: ChoreInstance = {
    id: '1',
    master_chore_id: 'mc1',
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'open',
    claimed_by: null,
    assigned_to: null,
    assigned_by: null,
    completed_by: null,
    signoff_by: null,
    started_at: null,
    completed_at: null,
    signed_off_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const claimedInstance: ChoreInstance = {
    id: '2',
    master_chore_id: 'mc2',
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'claimed',
    claimed_by: 'alice',
    assigned_to: null,
    assigned_by: null,
    completed_by: null,
    signoff_by: null,
    started_at: null,
    completed_at: null,
    signed_off_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const assignedInstance: ChoreInstance = {
    id: '3',
    master_chore_id: 'mc3',
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'assigned',
    claimed_by: null,
    assigned_to: 'bob',
    assigned_by: 'parent',
    completed_by: null,
    signoff_by: null,
    started_at: null,
    completed_at: null,
    signed_off_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const completedInstance: ChoreInstance = {
    id: '4',
    master_chore_id: 'mc4',
    period_start: '2026-01-15',
    period_end: '2026-01-15',
    status: 'completed',
    claimed_by: 'alice',
    assigned_to: null,
    assigned_by: null,
    completed_by: 'alice',
    signoff_by: 'parent',
    started_at: '2026-01-15T10:00:00',
    completed_at: '2026-01-15T11:00:00',
    signed_off_at: '2026-01-15T12:00:00',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  const instances: ChoreInstance[] = [
    openPoolInstance,
    claimedInstance,
    assignedInstance,
    completedInstance,
  ]

  describe('isOpenPoolInstance', () => {
    it('returns true for unclaimed and unassigned instance', () => {
      expect(isOpenPoolInstance(openPoolInstance)).toBe(true)
    })

    it('returns false for claimed instance', () => {
      expect(isOpenPoolInstance(claimedInstance)).toBe(false)
    })

    it('returns false for assigned instance', () => {
      expect(isOpenPoolInstance(assignedInstance)).toBe(false)
    })

    it('returns false for completed instance', () => {
      expect(isOpenPoolInstance(completedInstance)).toBe(false)
    })
  })

  describe('getMemberInstances', () => {
    it('returns instances claimed by member', () => {
      const result = getMemberInstances(instances, 'alice')
      expect(result).toHaveLength(2)
      expect(result).toContainEqual(claimedInstance)
      expect(result).toContainEqual(completedInstance)
    })

    it('returns instances assigned to member', () => {
      const result = getMemberInstances(instances, 'bob')
      expect(result).toHaveLength(1)
      expect(result).toContainEqual(assignedInstance)
    })

    it('returns empty array for member with no instances', () => {
      const result = getMemberInstances(instances, 'charlie')
      expect(result).toHaveLength(0)
    })

    it('handles empty instances array', () => {
      const result = getMemberInstances([], 'alice')
      expect(result).toHaveLength(0)
    })
  })

  describe('getStatusColor', () => {
    it('returns color for open status', () => {
      const color = getStatusColor('open')
      expect(color).toBeDefined()
      expect(typeof color).toBe('string')
    })

    it('returns color for completed status', () => {
      const color = getStatusColor('completed')
      expect(color).toBeDefined()
      expect(typeof color).toBe('string')
    })

    it('returns color for overdue status', () => {
      const color = getStatusColor('overdue')
      expect(color).toBeDefined()
      expect(typeof color).toBe('string')
    })

    it('returns different colors for different statuses', () => {
      const openColor = getStatusColor('open')
      const completedColor = getStatusColor('completed')
      const overdueColor = getStatusColor('overdue')

      expect(openColor).not.toBe(completedColor)
      expect(openColor).not.toBe(overdueColor)
      expect(completedColor).not.toBe(overdueColor)
    })
  })

  describe('formatDifficulty', () => {
    it('returns "Easy" for level 1', () => {
      expect(formatDifficulty(1)).toBe('Easy')
    })

    it('returns "Easy-Medium" for level 2', () => {
      expect(formatDifficulty(2)).toBe('Easy-Medium')
    })

    it('returns "Medium" for level 3', () => {
      expect(formatDifficulty(3)).toBe('Medium')
    })

    it('returns "Hard" for level 4', () => {
      expect(formatDifficulty(4)).toBe('Hard')
    })

    it('returns "Very Hard" for level 5', () => {
      expect(formatDifficulty(5)).toBe('Very Hard')
    })

    it('handles level below 1', () => {
      expect(formatDifficulty(0)).toBe('Easy')
    })

    it('handles level above 5', () => {
      expect(formatDifficulty(6)).toBe('Very Hard')
    })
  })

  describe('getStatusLabel', () => {
    const allStatuses: InstanceStatus[] = [
      'open',
      'claimed',
      'assigned',
      'in_progress',
      'completed_pending_signoff',
      'completed',
      'overdue',
      'expiring_soon',
    ]

    it('returns label for all statuses', () => {
      allStatuses.forEach((status) => {
        const label = getStatusLabel(status)
        expect(label).toBeDefined()
        expect(typeof label).toBe('string')
        expect(label.length).toBeGreaterThan(0)
      })
    })

    it('returns "Open" for open status', () => {
      expect(getStatusLabel('open')).toBe('Open')
    })

    it('returns "Claimed" for claimed status', () => {
      expect(getStatusLabel('claimed')).toBe('Claimed')
    })

    it('returns "Assigned" for assigned status', () => {
      expect(getStatusLabel('assigned')).toBe('Assigned')
    })

    it('returns "In Progress" for in_progress status', () => {
      expect(getStatusLabel('in_progress')).toBe('In Progress')
    })

    it('returns "Pending Signoff" for completed_pending_signoff status', () => {
      expect(getStatusLabel('completed_pending_signoff')).toBe('Pending Signoff')
    })

    it('returns "Completed" for completed status', () => {
      expect(getStatusLabel('completed')).toBe('Completed')
    })

    it('returns "Overdue" for overdue status', () => {
      expect(getStatusLabel('overdue')).toBe('Overdue')
    })

    it('returns "Expiring Soon" for expiring_soon status', () => {
      expect(getStatusLabel('expiring_soon')).toBe('Expiring Soon')
    })
  })
})
