/**
 * Chore card component for the board columns.
 *
 * Displays a single chore instance with status-colored left border,
 * title, category tag, frequency, difficulty dots, estimated time,
 * and assignment info.
 */

import { Clock, AlertTriangle, CheckCircle, Play, Pause } from 'lucide-react'
import type { ChoreInstance, MasterChore, ChoreCategory, InstanceStatus } from '@/types/chores'
import { paletteBorderClasses, getMemberPaletteKey, type PaletteKey } from '@/shared/utils/memberColors'

/** Props for the ChoreCard component. */
export interface ChoreCardProps {
  /** The chore instance to display. */
  instance: ChoreInstance
  /** The parent master chore template. */
  masterChore: MasterChore
  /** All available categories. */
  categories: ChoreCategory[]
  /** Member color map. */
  colorMap: Map<string, PaletteKey>
  /** Callback when the card is clicked. */
  onClick?: () => void
}

/** Static map for status icon colors. */
const statusIconClasses: Record<InstanceStatus, string> = {
  open: 'bg-chores-pending',
  claimed: 'bg-chores-claimed',
  assigned: 'bg-chores-assigned',
  in_progress: 'bg-chores-in-progress',
  completed_pending_signoff: 'bg-chores-pending',
  completed: 'bg-chores-completed',
  overdue: 'bg-chores-overdue',
  expiring_soon: 'bg-chores-pending',
}

/**
 * Get the status icon component.
 */
function getStatusIcon(status: InstanceStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-3 w-3" />
    case 'in_progress':
      return <Play className="h-3 w-3" />
    case 'overdue':
      return <AlertTriangle className="h-3 w-3" />
    case 'claimed':
    case 'assigned':
      return <Pause className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

/**
 * Chore card for board columns.
 *
 * @param props - Component props.
 * @returns The chore card UI.
 */
export function ChoreCard({ instance, masterChore, categories, colorMap, onClick }: ChoreCardProps) {
  // Get category name
  const category = categories.find((c) => c.id === masterChore.category.id)
  const categoryName = category?.name ?? 'Uncategorized'

  // Get member color for left border
  const memberKey = instance.claimed_by ?? instance.assigned_to
  const paletteKey = getMemberPaletteKey(memberKey, colorMap)

  // Difficulty dots (filled = active, empty = inactive)
  const difficultyDots = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={`h-1.5 w-1.5 rounded-full ${
        i < masterChore.difficulty ? 'bg-chores-in-progress' : 'bg-border'
      }`}
    />
  ))

  // Format assignment text
  const getAssignmentText = () => {
    if (instance.status === 'completed') {
      return `Completed by ${instance.completed_by ?? 'Unknown'}`
    }
    if (instance.claimed_by) {
      return `Claimed by ${instance.claimed_by}`
    }
    if (instance.assigned_to) {
      return `Assigned by ${instance.assigned_by ?? 'Unknown'} to ${instance.assigned_to}`
    }
    return 'Unclaimed'
  }

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border-l-4 ${paletteBorderClasses[paletteKey]} bg-white p-3 transition-colors hover:bg-bg-hover dark:bg-bg`}
    >
      {/* Title and status icon */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-text-primary">
          {masterChore.name}
        </span>
        <span
          className={`rounded-full p-1 text-white ${statusIconClasses[instance.status]}`}
          title={instance.status}
        >
          {getStatusIcon(instance.status)}
        </span>
      </div>

      {/* Category and frequency */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="rounded bg-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
          {categoryName}
        </span>
        <span className="rounded bg-border-light px-1 py-0.5 text-[9px] text-text-muted">
          {masterChore.frequency}
        </span>
      </div>

      {/* Difficulty dots and estimated time */}
      <div className="mb-2 flex items-center gap-2">
        <div className="flex gap-0.5">{difficultyDots}</div>
        {masterChore.estimated_minutes && (
          <span className="text-[10px] text-text-muted">
            {masterChore.estimated_minutes}m
          </span>
        )}
        {masterChore.due_time && (
          <span className="text-[10px] text-text-muted">
            Due: {masterChore.due_time}
          </span>
        )}
      </div>

      {/* Assignment info */}
      <div className="text-[10px] text-text-faint">{getAssignmentText()}</div>
    </div>
  )
}
