/**
 * Hook for chore mutation actions.
 *
 * Provides typed wrappers around all chores API mutation functions.
 * Each action triggers a refetch after completion to keep data in sync.
 */

import { useCallback } from 'react'
import {
  createMasterChore,
  updateMasterChore,
  deleteMasterChore,
  claimInstance,
  assignInstance,
  updateInstanceStatus,
  createCategory,
  createTag,
  approveMasterChore,
} from '../api/choresApi'
import type {
  MasterChore,
  ChoreInstance,
  InstanceStatus,
} from '@/types/chores'

/** Return type of useChoreActions. */
export interface UseChoreActionsReturn {
  /** Create a new master chore template. */
  createMaster: (data: Record<string, unknown>) => Promise<MasterChore>
  /** Update an existing master chore template. */
  updateMaster: (
    choreId: string,
    data: Record<string, unknown>,
  ) => Promise<MasterChore>
  /** Soft-delete a master chore template. */
  deleteMaster: (choreId: string) => Promise<void>
  /** Claim an open-pool instance for a member. */
  claimInstance: (instanceId: string, memberId: string) => Promise<ChoreInstance>
  /** Assign an instance to a member. */
  assignInstance: (
    instanceId: string,
    assigneeId: string,
    assignerId: string,
  ) => Promise<ChoreInstance>
  /** Update an instance's status. */
  updateInstanceStatus: (
    instanceId: string,
    status: InstanceStatus,
    actorId: string,
  ) => Promise<ChoreInstance>
  /** Create a new chore category. */
  createCategory: (name: string) => Promise<void>
  /** Create a new chore tag. */
  createTag: (name: string) => Promise<void>
  /** Approve a pending master chore. */
  approveMaster: (choreId: string, approverId: string) => Promise<MasterChore>
}

/**
 * Provides chore mutation actions with automatic refetch.
 *
 * @param refetch - Function to trigger a data refetch after mutations.
 * @returns All chore mutation actions.
 */
export function useChoreActions(
  refetch: () => void,
): UseChoreActionsReturn {
  const createMaster = useCallback(
    async (data: Record<string, unknown>) => {
      const result = await createMasterChore(data)
      refetch()
      return result
    },
    [refetch],
  )

  const updateMaster = useCallback(
    async (choreId: string, data: Record<string, unknown>) => {
      const result = await updateMasterChore(choreId, data)
      refetch()
      return result
    },
    [refetch],
  )

  const deleteMaster = useCallback(
    async (choreId: string) => {
      await deleteMasterChore(choreId)
      refetch()
    },
    [refetch],
  )

  const claimInstanceAction = useCallback(
    async (instanceId: string, memberId: string) => {
      const result = await claimInstance(instanceId, memberId)
      refetch()
      return result
    },
    [refetch],
  )

  const assignInstanceAction = useCallback(
    async (instanceId: string, assigneeId: string, assignerId: string) => {
      const result = await assignInstance(instanceId, assigneeId, assignerId)
      refetch()
      return result
    },
    [refetch],
  )

  const updateInstanceStatusAction = useCallback(
    async (instanceId: string, status: InstanceStatus, actorId: string) => {
      const result = await updateInstanceStatus(instanceId, status, actorId)
      refetch()
      return result
    },
    [refetch],
  )

  const createCategoryAction = useCallback(
    async (name: string) => {
      await createCategory(name)
      refetch()
    },
    [refetch],
  )

  const createTagAction = useCallback(
    async (name: string) => {
      await createTag(name)
      refetch()
    },
    [refetch],
  )

  const approveMaster = useCallback(
    async (choreId: string, approverId: string) => {
      const result = await approveMasterChore(choreId, approverId)
      refetch()
      return result
    },
    [refetch],
  )

  return {
    createMaster,
    updateMaster,
    deleteMaster,
    claimInstance: claimInstanceAction,
    assignInstance: assignInstanceAction,
    updateInstanceStatus: updateInstanceStatusAction,
    createCategory: createCategoryAction,
    createTag: createTagAction,
    approveMaster,
  }
}
