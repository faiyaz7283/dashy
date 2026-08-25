/**
 * Chore edit modal with tabbed "This Instance" / "Template" UX.
 *
 * Tab 1 (This Instance): Status dropdown, assignment segmented control,
 * completed by, signed off by, period (read-only), timestamps.
 *
 * Tab 2 (Template): All master chore fields (name, category, tags, difficulty,
 * frequency, due time, est. minutes, expiration behavior).
 *
 * Both tabs: Delete + Cancel/Save footer.
 */

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { SegmentedControl } from '@/shared/components/SegmentedControl'
import { Combobox } from '@/shared/components/Combobox'
import { TagInput } from '@/shared/components/TagInput'
import { DifficultySlider } from '@/shared/components/DifficultySlider'
import { useChoreActions } from '../hooks/useChoreActions'
import { getStatusLabel } from '@/shared/utils/chores'
import { paletteBgClasses, type PaletteKey } from '@/shared/utils/memberColors'
import { isAdult } from '@/shared/utils/family'
import type {
  ChoreInstance,
  MasterChore,
  ChoreCategory,
  ChoreTag,
  InstanceStatus,
  ChoreFrequency,
  ExpirationBehavior,
  UpdateMasterChoreRequest,
} from '@/types/chores'
import type { FamilyMember } from '@/types'

/** Props for the ChoreEditModal component. */
export interface ChoreEditModalProps {
  /** The chore instance being edited. */
  instance: ChoreInstance
  /** The parent master chore template. */
  masterChore: MasterChore
  /** Available categories. */
  categories: ChoreCategory[]
  /** Available tags. */
  tags: ChoreTag[]
  /** Family members. */
  members: FamilyMember[]
  /** Callback to close the modal. */
  onClose: () => void
  /** Refetch trigger. */
  refetch: () => void
}

/**
 * Chore edit modal with tabbed interface.
 *
 * @param props - Component props.
 * @returns The edit modal UI.
 */
export function ChoreEditModal({
  instance,
  masterChore,
  categories,
  tags,
  members,
  onClose,
  refetch,
}: ChoreEditModalProps) {
  const actions = useChoreActions(refetch)
  const [activeTab, setActiveTab] = useState<'instance' | 'template'>('instance')

  // Instance tab state
  const [status, setStatus] = useState<InstanceStatus>(instance.status)
  const [assignmentType, setAssignmentType] = useState<string>(
    instance.claimed_by ? 'claimed' : instance.assigned_to ? 'assigned' : 'open',
  )
  const [completedBy, setCompletedBy] = useState<string>(instance.completed_by ?? '')
  const [signoffBy, setSignoffBy] = useState<string>(instance.signoff_by ?? '')

  // Template tab state
  const [name, setName] = useState(masterChore.name)
  const [categoryId, setCategoryId] = useState(masterChore.category.id)
  const [tagIds, setTagIds] = useState<string[]>(masterChore.tags.map((t) => t.id))
  const [difficulty, setDifficulty] = useState(masterChore.difficulty)
  const [frequency, setFrequency] = useState<ChoreFrequency>(masterChore.frequency)
  const [dueTime, setDueTime] = useState(masterChore.due_time ?? '')
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(masterChore.estimated_minutes)
  const [expirationBehavior, setExpirationBehavior] = useState<ExpirationBehavior>(
    masterChore.expiration_behavior,
  )

  // Handle instance save
  const handleInstanceSave = async () => {
    // Determine what changed and call appropriate action(s)
    const statusChanged = status !== instance.status
    const assignmentChanged = assignmentType !== (instance.claimed_by ? 'claimed' : instance.assigned_to ? 'assigned' : 'open')
    const signoffChanged = signoffBy !== (instance.signoff_by ?? '')

    // Handle status change
    if (statusChanged) {
      // Find the actor (who is making this change)
      const actor = members[0] // Default to first member as actor
      if (!actor) return

      const actorIsAdult = isAdult(actor)
      await actions.updateInstanceStatus(instance.id, status, actor.key, actorIsAdult)
    }

    // Handle assignment change
    if (assignmentChanged) {
      if (assignmentType === 'claimed') {
        // Claim the instance
        const memberKey = instance.claimed_by
        if (memberKey) {
          await actions.claimInstance(instance.id, memberKey)
        }
      } else if (assignmentType === 'assigned') {
        // Assign the instance
        const assigneeKey = instance.assigned_to
        const assignerKey = members[0]?.key // First member as assigner
        if (assigneeKey && assignerKey) {
          await actions.assignInstance(instance.id, assigneeKey, assignerKey)
        }
      }
      // If 'open', no action needed (backend handles clearing via claim/assign)
    }

    // Handle signoff
    if (signoffChanged && signoffBy) {
      await actions.signoffInstance(instance.id, signoffBy)
    }

    onClose()
  }

  // Handle template save
  const handleTemplateSave = async () => {
    const data: UpdateMasterChoreRequest = {
      name: name.trim(),
      category_id: categoryId,
      tag_ids: tagIds,
      difficulty,
      frequency,
      due_time: dueTime || null,
      estimated_minutes: estimatedMinutes,
      expiration_behavior: expirationBehavior,
    }

    await actions.updateMaster(masterChore.id, data)
    onClose()
  }

  // Handle delete
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this chore?')) {
      await actions.deleteMaster(masterChore.id)
      onClose()
    }
  }

  // Handle category create
  const handleCreateCategory = async (categoryName: string) => {
    const newCategory = await actions.createCategory(categoryName)
    setCategoryId(newCategory.id)
  }

  // Handle tag create
  const handleCreateTag = async (tagName: string) => {
    const newTag = await actions.createTag(tagName)
    setTagIds((prev) => [...prev, newTag.id])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[28rem] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-border dark:bg-bg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
          <h2 className="text-base font-semibold text-text-primary">Edit Chore</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex items-center border-b border-border px-5">
          <button
            onClick={() => setActiveTab('instance')}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold ${
              activeTab === 'instance'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            This Instance
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium ${
              activeTab === 'template'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Template
          </button>
        </div>

        {/* Form body */}
        <div className="space-y-4 px-5 py-4">
          {activeTab === 'instance' ? (
            <>
              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InstanceStatus)}
                  className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                >
                  {(['open', 'claimed', 'assigned', 'in_progress', 'completed_pending_signoff', 'completed', 'overdue'] as InstanceStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {getStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Assignment</label>
                <div className="space-y-2">
                  <SegmentedControl
                    label=""
                    options={[
                      { value: 'open', label: 'Open' },
                      { value: 'claimed', label: 'Claimed' },
                      { value: 'assigned', label: 'Assigned' },
                    ]}
                    value={assignmentType}
                    onChange={setAssignmentType}
                  />
                  {(assignmentType === 'claimed' || assignmentType === 'assigned') && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2">
                      {(() => {
                        const memberKey = instance.claimed_by ?? instance.assigned_to
                        const member = members.find((m) => m.key === memberKey)
                        const colorKey = member?.color_key && member.color_key in paletteBgClasses
                          ? member.color_key as PaletteKey
                          : 'blue'
                        return (
                          <>
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full ${paletteBgClasses[colorKey]} text-[9px] font-bold leading-none text-white`}>
                              {member?.initial ?? '?'}
                            </div>
                            <span className="text-sm text-text-primary">
                              {member?.name ?? 'Unknown'}
                            </span>
                            <span className="ml-auto text-[10px] text-text-faint">{assignmentType}</span>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Completed by */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Completed by</label>
                <select
                  value={completedBy}
                  onChange={(e) => setCompletedBy(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                >
                  <option value="">— Not completed —</option>
                  {members.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Signed off by */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Signed off by</label>
                <select
                  value={signoffBy}
                  onChange={(e) => setSignoffBy(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                >
                  <option value="">— Not signed off —</option>
                  {members.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period (read-only) */}
              {instance.period_start && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">Period</label>
                  <div className="rounded-lg border border-border bg-bg-hover px-3 py-2 text-sm text-text-muted">
                    {instance.period_start}
                    {instance.period_end && ` → ${instance.period_end}`}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                />
              </div>

              {/* Category */}
              <Combobox
                label="Category"
                options={categories.map((c) => ({ id: c.id, label: c.name }))}
                value={categoryId}
                onChange={setCategoryId}
                onCreate={handleCreateCategory}
              />

              {/* Tags */}
              <TagInput
                label="Tags"
                availableTags={tags.map((t) => ({ id: t.id, label: t.name }))}
                value={tagIds}
                onChange={setTagIds}
                onCreate={handleCreateTag}
              />

              {/* Difficulty + Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <DifficultySlider label="Difficulty" value={difficulty} onChange={setDifficulty} />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as ChoreFrequency)}
                    className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="once">Once</option>
                  </select>
                </div>
              </div>

              {/* Due time */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">Due time</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                />
              </div>

              {/* Est. minutes + Expiration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">Est. minutes</label>
                  <input
                    type="number"
                    value={estimatedMinutes ?? ''}
                    onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">When overdue</label>
                  <select
                    value={expirationBehavior}
                    onChange={(e) => setExpirationBehavior(e.target.value as ExpirationBehavior)}
                    className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
                  >
                    <option value="carry_over">Carry over</option>
                    <option value="stay_visible">Stay visible</option>
                    <option value="convert_to_open">Convert to open</option>
                    <option value="disappear">Disappear</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-bg/50 px-5 py-3">
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
            title="Delete chore"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-hover hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={activeTab === 'instance' ? handleInstanceSave : handleTemplateSave}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
