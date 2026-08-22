/**
 * Chores board view — metrics row + member columns + open pool.
 *
 * Displays a kanban-style board with:
 * - Top row: 5 metric cards (Pending, In Progress, Completed, Overdue, This Week)
 * - Bottom row: Open Pool column + one column per family member
 *
 * Each column shows chore instances with status-colored left borders.
 */

import { Plus } from 'lucide-react'
import { ContentCard } from '@/shared/components/ContentCard'
import { ChoreCard } from '../components/ChoreCard'
import { useChoresData } from '../hooks/useChoresData'
import { isOpenPoolInstance, getMemberInstances } from '@/shared/utils/chores'
import type { ChoreInstance, MasterChore, FamilyMember } from '@/types'
import { memberBgClasses, getMemberInitial, type MemberColorKey } from '@/shared/utils/memberColors'

/** Props for the ChoresBoard component. */
export interface ChoresBoardProps {
  /** Family members for column headers. */
  members: FamilyMember[]
  /** Callback when a chore card is clicked. */
  onChoreClick?: (instance: ChoreInstance) => void
  /** Callback when the add button is clicked in a column. */
  onAddChore?: (memberId?: string) => void
}

/**
 * Chores board with metrics and member columns.
 *
 * @param props - Component props.
 * @returns The chores board UI.
 */
export function ChoresBoard({ members, onChoreClick, onAddChore }: ChoresBoardProps) {
  const { data, isLoading, error } = useChoresData()

  if (isLoading) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading chores...</p>
        </div>
      </ContentCard>
    )
  }

  if (error) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-danger">Error loading chores: {error}</p>
        </div>
      </ContentCard>
    )
  }

  if (!data) {
    return null
  }

  const { categories, master_chores, instances } = data

  // Calculate metrics
  const pendingCount = instances.filter(
    (i) => i.status === 'open' || i.status === 'claimed' || i.status === 'assigned',
  ).length
  const inProgressCount = instances.filter((i) => i.status === 'in_progress').length
  const completedCount = instances.filter((i) => i.status === 'completed').length
  const overdueCount = instances.filter((i) => i.status === 'overdue').length
  const totalCount = instances.length

  // Get open pool instances (unclaimed and unassigned)
  const openPoolInstances = instances.filter(isOpenPoolInstance)

  // Helper to get master chore for an instance
  const getMasterChore = (instance: ChoreInstance): MasterChore | undefined =>
    master_chores.find((mc) => mc.id === instance.master_chore_id)

  return (
    <ContentCard>
      <div className="flex h-full flex-col">
        {/* Metrics row */}
        <div className="grid grid-cols-5 gap-4 border-b border-border px-4 py-3">
          <MetricCard label="Pending" value={pendingCount} color="bg-chores-pending" />
          <MetricCard label="In Progress" value={inProgressCount} color="bg-chores-in-progress" />
          <MetricCard label="Completed" value={completedCount} color="bg-chores-completed" />
          <MetricCard label="Overdue" value={overdueCount} color="bg-chores-overdue" />
          <MetricCard label="This Week" value={totalCount} suffix="chores" />
        </div>

        {/* Columns row */}
        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Open Pool column */}
          <Column
            title="Open Pool"
            subtitle1={{ label: 'Unclaimed', value: openPoolInstances.length }}
            subtitle2={{ label: 'Overdue', value: openPoolInstances.filter((i) => i.status === 'overdue').length, color: 'text-chores-overdue' }}
            onAdd={() => onAddChore?.()}
          >
            {openPoolInstances.map((instance) => {
              const master = getMasterChore(instance)
              if (!master) return null
              return (
                <ChoreCard
                  key={instance.id}
                  instance={instance}
                  masterChore={master}
                  categories={categories}
                  onClick={() => onChoreClick?.(instance)}
                />
              )
            })}
          </Column>

          {/* Member columns */}
          {members.map((member) => {
            const memberInstances = getMemberInstances(instances, member.key)
            const assignedCount = memberInstances.length
            const completedByMember = memberInstances.filter((i) => i.status === 'completed').length
            const pendingByMember = memberInstances.filter(
              (i) => i.status !== 'completed' && i.status !== 'overdue',
            ).length

            return (
              <Column
                key={member.key}
                title={member.name}
                memberColor={member.key as MemberColorKey}
                subtitle1={{ label: 'Assigned', value: assignedCount }}
                subtitle2={{ label: 'Completed', value: completedByMember, color: 'text-chores-completed' }}
                subtitle3={{ label: 'Pending', value: pendingByMember, color: 'text-chores-pending' }}
                onAdd={() => onAddChore?.(member.key)}
              >
                {memberInstances.map((instance) => {
                  const master = getMasterChore(instance)
                  if (!master) return null
                  return (
                    <ChoreCard
                      key={instance.id}
                      instance={instance}
                      masterChore={master}
                      categories={categories}
                      onClick={() => onChoreClick?.(instance)}
                    />
                  )
                })}
              </Column>
            )
          })}
        </div>
      </div>
    </ContentCard>
  )
}

/** Metric card for the top row. */
interface MetricCardProps {
  label: string
  value: number
  color?: string
  suffix?: string
}

function MetricCard({ label, value, color, suffix }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border-light bg-bg-hover/50 p-3">
      <div className="mb-1 text-xs text-text-muted">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {color && <div className={`h-2.5 w-2.5 rounded-full ${color}`} />}
        {suffix && <span className="text-xs text-text-muted">{suffix}</span>}
      </div>
    </div>
  )
}

/** Column component for member or open pool. */
interface ColumnProps {
  title: string
  memberColor?: MemberColorKey
  subtitle1: { label: string; value: number; color?: string }
  subtitle2: { label: string; value: number; color?: string }
  subtitle3?: { label: string; value: number; color?: string }
  onAdd?: () => void
  children: React.ReactNode
}

function Column({ title, memberColor, subtitle1, subtitle2, subtitle3, onAdd, children }: ColumnProps) {
  return (
    <div className="flex w-64 flex-col overflow-hidden rounded-lg border border-border-light bg-bg-hover/50">
      {/* Column header */}
      <div className="border-b border-border-light bg-bg-hover px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <div className="flex items-center gap-2">
            {memberColor && (
              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${memberBgClasses[memberColor]} text-xs font-bold text-white`}>
                {getMemberInitial(memberColor)}
              </div>
            )}
            <button
              onClick={onAdd}
              className="rounded-md p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary"
              title="Add chore"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-[10px] text-text-muted">{subtitle1.label}</div>
            <div className={`text-lg font-bold ${subtitle1.color ?? 'text-text-primary'}`}>
              {subtitle1.value}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted">{subtitle2.label}</div>
            <div className={`text-lg font-bold ${subtitle2.color ?? 'text-text-primary'}`}>
              {subtitle2.value}
            </div>
          </div>
          {subtitle3 && (
            <div>
              <div className="text-[10px] text-text-muted">{subtitle3.label}</div>
              <div className={`text-lg font-bold ${subtitle3.color ?? 'text-text-primary'}`}>
                {subtitle3.value}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chore cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">{children}</div>
    </div>
  )
}
