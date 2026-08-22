/**
 * Chores API mutation functions.
 *
 * All CRUD operations for master chores, instances, categories, and tags.
 * Uses direct fetch() against the dashy-api endpoints — same pattern as
 * useCalendarData.
 */

import { ENDPOINTS } from '@/shared/api/endpoints'
import type {
  ChoresData,
  MasterChore,
  ChoreInstance,
  ChoreCategory,
  ChoreTag,
  InstanceStatus,
} from '@/types/chores'

const BASE = ENDPOINTS.chores.url

/**
 * Fetch all chores data (categories, tags, masters, instances).
 *
 * @returns Complete chores data payload.
 */
export async function fetchChores(): Promise<ChoresData> {
  const response = await fetch(BASE)
  if (!response.ok) {
    throw new Error(`Chores API error: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Create a new master chore template.
 *
 * @param data - Master chore fields.
 * @returns The created master chore.
 */
export async function createMasterChore(
  data: Record<string, unknown>,
): Promise<MasterChore> {
  const response = await fetch(`${BASE}/masters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to create master chore: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Update an existing master chore template.
 *
 * @param choreId - The master chore ID to update.
 * @param data - Updated master chore fields.
 * @returns The updated master chore.
 */
export async function updateMasterChore(
  choreId: string,
  data: Record<string, unknown>,
): Promise<MasterChore> {
  const response = await fetch(`${BASE}/masters/${choreId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to update master chore: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Delete a master chore template (soft delete).
 *
 * @param choreId - The master chore ID to delete.
 */
export async function deleteMasterChore(choreId: string): Promise<void> {
  const response = await fetch(`${BASE}/masters/${choreId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete master chore: ${response.statusText}`)
  }
}

/**
 * Claim an open-pool chore instance for a member.
 *
 * @param instanceId - The instance to claim.
 * @param memberId - The member claiming it.
 * @returns The updated instance.
 */
export async function claimInstance(
  instanceId: string,
  memberId: string,
): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${instanceId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to claim instance: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Assign a chore instance to a member.
 *
 * @param instanceId - The instance to assign.
 * @param assigneeId - The member being assigned.
 * @param assignerId - The parent making the assignment.
 * @returns The updated instance.
 */
export async function assignInstance(
  instanceId: string,
  assigneeId: string,
  assignerId: string,
): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${instanceId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignee_id: assigneeId, assigner_id: assignerId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to assign instance: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Update the status of a chore instance.
 *
 * @param instanceId - The instance to update.
 * @param status - The new status.
 * @param actorId - The member performing the action.
 * @returns The updated instance.
 */
export async function updateInstanceStatus(
  instanceId: string,
  status: InstanceStatus,
  actorId: string,
): Promise<ChoreInstance> {
  const response = await fetch(`${BASE}/instances/${instanceId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, actor_id: actorId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update instance status: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Create a new chore category.
 *
 * @param name - Category display name.
 * @returns The created category.
 */
export async function createCategory(name: string): Promise<ChoreCategory> {
  const response = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Create a new chore tag.
 *
 * @param name - Tag display name.
 * @returns The created tag.
 */
export async function createTag(name: string): Promise<ChoreTag> {
  const response = await fetch(`${BASE}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create tag: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Approve a pending master chore.
 *
 * @param choreId - The master chore to approve.
 * @param approverId - The parent approving it.
 * @returns The approved master chore.
 */
export async function approveMasterChore(
  choreId: string,
  approverId: string,
): Promise<MasterChore> {
  const response = await fetch(`${BASE}/masters/${choreId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approver_id: approverId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to approve master chore: ${response.statusText}`)
  }
  return response.json()
}
