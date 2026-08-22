/**
 * Chore create modal with 3 entry-point variations.
 *
 * Entry points:
 * 1. From member column (+ clicked on member) — assigned_to locked to that member
 * 2. From open pool (+ clicked on open pool) — no assigned_to, shows "Open Pool" info
 * 3. From sidebar (+ clicked in sidebar) — assigned_to editable dropdown
 *
 * Fields: Name, Category (combobox), Tags, Difficulty (slider), Frequency,
 * Due date & time, Est. minutes, When overdue, Assigned to (varies by entry).
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import { Combobox } from '@/shared/components/Combobox'
import { TagInput } from '@/shared/components/TagInput'
import { DifficultySlider } from '@/shared/components/DifficultySlider'
import { useChoreActions } from '../hooks/useChoreActions'
import type { ChoreCategory, ChoreTag, ChoreFrequency, ExpirationBehavior } from '@/types/chores'
import type { FamilyMember } from '@/types'

/** Entry point for the create modal. */
export type CreateEntryPoint =
  | { type: 'member'; memberId: string }
  | { type: 'open-pool' }
  | { type: 'sidebar' }

/** Props for the ChoreCreateModal component. */
export interface ChoreCreateModalProps {
  /** How the modal was opened. */
  entryPoint: CreateEntryPoint
  /** Available categories. */
  categories: ChoreCategory[]
  /** Available tags. */
  tags: ChoreTag[]
  /** Family members for assignment dropdown. */
  members: FamilyMember[]
  /** Callback to close the modal. */
  onClose: () => void
  /** Refetch trigger from useChoresData. */
  refetch: () => void
}

/**
 * Chore create modal with adaptive assigned-to behavior.
 *
 * @param props - Component props.
 * @returns The create modal UI.
 */
export function ChoreCreateModal({
  entryPoint,
  categories,
  tags,
  members,
  onClose,
  refetch,
}: ChoreCreateModalProps) {
  const actions = useChoreActions(refetch)

  // Form state
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState(2)
  const [frequency, setFrequency] = useState<ChoreFrequency>('daily')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [expirationBehavior, setExpirationBehavior] = useState<ExpirationBehavior>('carry_over')
  const [assignedTo, setAssignedTo] = useState<string | null>(
    entryPoint.type === 'member' ? entryPoint.memberId : null,
  )

  // Handle category create
  const handleCreateCategory = async (categoryName: string) => {
    await actions.createCategory(categoryName)
  }

  // Handle tag create
  const handleCreateTag = async (tagName: string) => {
    await actions.createTag(tagName)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!name.trim() || !categoryId) return

    const data: Record<string, unknown> = {
      name: name.trim(),
      category_id: categoryId,
      tag_ids: tagIds,
      difficulty,
      frequency,
      estimated_minutes: estimatedMinutes,
      due_time: dueTime || null,
      due_date: dueDate || null,
      expiration_behavior: expirationBehavior,
    }

    // Only include assigned_to for member and sidebar entry points
    if (entryPoint.type !== 'open-pool' && assignedTo) {
      data.assigned_to = assignedTo
    }

    await actions.createMaster(data)
    onClose()
  }

  // Get assigned member name for display
  const getAssignedMemberName = () => {
    if (!assignedTo) return null
    return members.find((m) => m.key === assignedTo)?.name ?? null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[28rem] overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-border dark:bg-bg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-4">
          <h2 className="text-base font-semibold text-text-primary">New Chore</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form body */}
        <div className="space-y-4 px-5 pb-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder-text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              placeholder="Chore name..."
            />
          </div>

          {/* Category */}
          <Combobox
            label="Category"
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            value={categoryId}
            onChange={setCategoryId}
            onCreate={handleCreateCategory}
            placeholder="Search or create category..."
          />

          {/* Tags */}
          <TagInput
            label="Tags"
            availableTags={tags.map((t) => ({ id: t.id, label: t.name }))}
            value={tagIds}
            onChange={setTagIds}
            onCreate={handleCreateTag}
            placeholder="Type and press Enter to add..."
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

          {/* Due date & time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Due date & time</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
            </div>
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
                placeholder="Optional"
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

          {/* Assigned to (varies by entry point) */}
          {entryPoint.type === 'member' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Assigned to</label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-hover px-3 py-2 opacity-75">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-faiyaz text-[9px] font-bold leading-none text-white">
                  {getAssignedMemberName()?.[0] ?? '?'}
                </div>
                <span className="text-sm text-text-muted">{getAssignedMemberName() ?? 'Unknown'}</span>
                <span className="ml-auto text-[10px] text-text-faint">locked</span>
              </div>
            </div>
          )}

          {entryPoint.type === 'sidebar' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">Assigned to</label>
              <select
                value={assignedTo ?? ''}
                onChange={(e) => setAssignedTo(e.target.value || null)}
                className="w-full appearance-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-ring"
              >
                <option value="">Unassigned (Open Pool)</option>
                {members.map((member) => (
                  <option key={member.key} value={member.key}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {entryPoint.type === 'open-pool' && (
            <div className="rounded-lg border border-chores-open/20 bg-chores-open/10 px-3 py-2">
              <p className="text-xs font-medium text-chores-open">
                Open Pool — chore will be available for anyone to claim
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border bg-bg/50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-bg-hover hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !categoryId}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Create Chore
          </button>
        </div>
      </div>
    </div>
  )
}
