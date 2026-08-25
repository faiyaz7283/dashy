/**
 * ChoresView — top-level view for the chores feature.
 *
 * Composes the ChoresBoard and renders create/edit modals when triggered
 * by parent (AppShell). Modal state is managed by the parent so that
 * triggers from both the Sidebar and the Board columns work correctly.
 */

import { ChoresBoard } from './ChoresBoard'
import { ChoreCreateModal, type CreateEntryPoint } from '../components/ChoreCreateModal'
import { ChoreEditModal } from '../components/ChoreEditModal'
import { useChoresData } from '../hooks/useChoresData'
import type { ChoreInstance, FamilyMember } from '@/types'

/** Props for the ChoresView component. */
export interface ChoresViewProps {
  /** Family members for board columns. */
  members: FamilyMember[]
  /** Whether the create modal is open. */
  showCreateModal: boolean
  /** The entry point for the create modal. */
  createEntryPoint: CreateEntryPoint
  /** The instance being edited, or null. */
  editingInstance: ChoreInstance | null
  /** Callback to close the create modal. */
  onCloseCreateModal: () => void
  /** Callback to close the edit modal. */
  onCloseEditModal: () => void
  /** Callback when add chore is requested from a board column. */
  onAddChore: (memberId?: string) => void
  /** Callback when a chore card is clicked for editing. */
  onChoreClick: (instance: ChoreInstance) => void
}

/**
 * Chores view with board and modals.
 *
 * @param props - Component props.
 * @returns The chores view UI.
 */
export function ChoresView({
  members,
  showCreateModal,
  createEntryPoint,
  editingInstance,
  onCloseCreateModal,
  onCloseEditModal,
  onAddChore,
  onChoreClick,
}: ChoresViewProps) {
  const { data, isLoading, isRefreshing, error, refetch } = useChoresData()

  // Find master chore for editing instance
  const editingMasterChore = editingInstance && data
    ? data.master_chores.find((mc) => mc.id === editingInstance.master_chore_id)
    : null

  return (
    <>
      <ChoresBoard
        members={members}
        data={data}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        onChoreClick={onChoreClick}
        onAddChore={onAddChore}
      />

      {showCreateModal && data && (
        <ChoreCreateModal
          entryPoint={createEntryPoint}
          categories={data.categories}
          tags={data.tags}
          members={members}
          onClose={onCloseCreateModal}
          refetch={refetch}
        />
      )}

      {editingInstance && editingMasterChore && data && (
        <ChoreEditModal
          instance={editingInstance}
          masterChore={editingMasterChore}
          categories={data.categories}
          tags={data.tags}
          members={members}
          onClose={onCloseEditModal}
          refetch={refetch}
        />
      )}
    </>
  )
}
