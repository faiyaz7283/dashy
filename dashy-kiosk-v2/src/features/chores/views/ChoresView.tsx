/**
 * ChoresView — top-level view for the chores feature.
 *
 * Composes the ChoresBoard, ChoreCreateModal, and ChoreEditModal.
 * Manages modal state and passes data/callbacks to children.
 */

import { useState } from 'react'
import { ChoresBoard } from './ChoresBoard'
import { ChoreCreateModal, type CreateEntryPoint } from '../components/ChoreCreateModal'
import { ChoreEditModal } from '../components/ChoreEditModal'
import { useChoresData } from '../hooks/useChoresData'
import type { ChoreInstance, FamilyMember } from '@/types'

/** Props for the ChoresView component. */
export interface ChoresViewProps {
  /** Family members for board columns. */
  members: FamilyMember[]
}

/**
 * Chores view with board and modals.
 *
 * @param props - Component props.
 * @returns The chores view UI.
 */
export function ChoresView({ members }: ChoresViewProps) {
  const { data, refetch } = useChoresData()

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createEntryPoint, setCreateEntryPoint] = useState<CreateEntryPoint>({ type: 'sidebar' })
  const [editingInstance, setEditingInstance] = useState<ChoreInstance | null>(null)

  // Handle add chore from board
  const handleAddChore = (memberId?: string) => {
    if (memberId) {
      setCreateEntryPoint({ type: 'member', memberId })
    } else {
      setCreateEntryPoint({ type: 'open-pool' })
    }
    setShowCreateModal(true)
  }

  // Handle chore card click
  const handleChoreClick = (instance: ChoreInstance) => {
    setEditingInstance(instance)
  }

  // Close modals
  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  const handleCloseEditModal = () => {
    setEditingInstance(null)
  }

  if (!data) {
    return <ChoresBoard members={members} onAddChore={handleAddChore} />
  }

  const { master_chores } = data

  // Find master chore for editing instance
  const editingMasterChore = editingInstance
    ? master_chores.find((mc) => mc.id === editingInstance.master_chore_id)
    : null

  return (
    <>
      <ChoresBoard
        members={members}
        onChoreClick={handleChoreClick}
        onAddChore={handleAddChore}
      />

      {showCreateModal && (
        <ChoreCreateModal
          entryPoint={createEntryPoint}
          categories={data.categories}
          tags={data.tags}
          members={members}
          onClose={handleCloseCreateModal}
          refetch={refetch}
        />
      )}

      {editingInstance && editingMasterChore && (
        <ChoreEditModal
          instance={editingInstance}
          masterChore={editingMasterChore}
          categories={data.categories}
          tags={data.tags}
          members={members}
          onClose={handleCloseEditModal}
          refetch={refetch}
        />
      )}
    </>
  )
}
