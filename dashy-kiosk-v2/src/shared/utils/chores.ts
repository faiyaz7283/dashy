/**
 * Chores domain utilities.
 *
 * Pure functions for filtering, classifying, and formatting chore data.
 * Used across the chores feature components and hooks.
 */

import type { ChoreInstance, InstanceStatus } from '@/types/chores'
import { colors } from '@/theme/tokens'

/**
 * Checks whether a chore instance is in the open pool (unclaimed and unassigned).
 *
 * An instance is in the open pool when both `claimed_by` and `assigned_to`
 * are null — nobody has taken ownership yet.
 *
 * @param instance - The chore instance to check.
 * @returns True if the instance is unclaimed and unassigned.
 */
export function isOpenPoolInstance(instance: ChoreInstance): boolean {
  return instance.claimed_by === null && instance.assigned_to === null
}

/**
 * Returns instances belonging to a specific member.
 *
 * A member "owns" an instance if they claimed it or were assigned to it.
 *
 * @param instances - All chore instances.
 * @param memberId - The member's key/ID.
 * @returns Instances where claimed_by or assigned_to matches the member.
 */
export function getMemberInstances(instances: ChoreInstance[], memberId: string): ChoreInstance[] {
  return instances.filter((inst) => inst.claimed_by === memberId || inst.assigned_to === memberId)
}

/**
 * Returns the CSS color token for a given instance status.
 *
 * @param status - The chore instance status.
 * @returns A CSS color string from the design tokens.
 */
export function getStatusColor(status: InstanceStatus): string {
  const colorMap: Record<InstanceStatus, string> = {
    open: colors.choresOpen,
    claimed: colors.choresClaimed,
    assigned: colors.choresAssigned,
    in_progress: colors.choresInProgress,
    completed_pending_signoff: colors.choresPendingSignoff,
    completed: colors.choresCompleted,
    overdue: colors.choresOverdue,
    expiring_soon: colors.choresExpiringSoon,
  }
  return colorMap[status]
}

/**
 * Returns a human-readable difficulty label for a numeric level.
 *
 * @param level - Difficulty level (1–5).
 * @returns Display string (e.g. "Easy", "Medium", "Hard").
 */
export function formatDifficulty(level: number): string {
  if (level <= 1) return 'Easy'
  if (level <= 2) return 'Easy-Medium'
  if (level <= 3) return 'Medium'
  if (level <= 4) return 'Hard'
  return 'Very Hard'
}

/**
 * Returns a human-readable label for an instance status.
 *
 * @param status - The chore instance status.
 * @returns Display string for the status.
 */
export function getStatusLabel(status: InstanceStatus): string {
  const labelMap: Record<InstanceStatus, string> = {
    open: 'Open',
    claimed: 'Claimed',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed_pending_signoff: 'Pending Signoff',
    completed: 'Completed',
    overdue: 'Overdue',
    expiring_soon: 'Expiring Soon',
  }
  return labelMap[status]
}
