/**
 * Chores domain types.
 *
 * Defines the shape of chore categories, tags, master chore templates,
 * and per-period chore instances used across the chores feature.
 *
 * Must stay in sync with the backend Pydantic models in
 * `app/api/models/chores.py`.
 */

/** How often a master chore generates instances. */
export type ChoreFrequency = 'once' | 'daily' | 'weekly' | 'monthly'

/** What happens to an instance when its period expires. */
export type ExpirationBehavior = 'disappear' | 'carry_over' | 'stay_visible' | 'convert_to_open'

/** Lifecycle status of a master chore template. */
export type MasterChoreStatus = 'pending_approval' | 'active' | 'archived'

/**
 * Lifecycle status of a chore instance.
 *
 * - `open` — available to claim or be assigned
 * - `claimed` — voluntarily claimed by a member
 * - `assigned` — assigned by a parent
 * - `in_progress` — work has started
 * - `completed_pending_signoff` — kid completed, awaiting parent signoff
 * - `completed` — fully done (signed off or adult self-completed)
 * - `overdue` — past due and not completed
 * - `expiring_soon` — period ending soon
 */
export type InstanceStatus =
  | 'open'
  | 'claimed'
  | 'assigned'
  | 'in_progress'
  | 'completed_pending_signoff'
  | 'completed'
  | 'overdue'
  | 'expiring_soon'

/** A chore category (e.g. Kitchen, Bathroom, Outdoor). */
export interface ChoreCategory {
  /** Unique identifier. */
  id: string
  /** Display name. */
  name: string
}

/** A tag for labeling chores (e.g. "Quick", "Heavy"). */
export interface ChoreTag {
  /** Unique identifier. */
  id: string
  /** Display name. */
  name: string
}

/**
 * Master chore template.
 *
 * Defines the chore definition from which per-period instances are generated.
 * One master can produce many instances over time based on its frequency.
 */
export interface MasterChore {
  /** Unique identifier. */
  id: string
  /** Chore name (e.g. "Wipe Kitchen Counter"). */
  name: string
  /** Category this chore belongs to. */
  category: ChoreCategory
  /** Tags associated with this chore. */
  tags: ChoreTag[]
  /** Difficulty level (1–5). */
  difficulty: number
  /** How often instances are generated. */
  frequency: ChoreFrequency
  /** Estimated time in minutes, or null if not set. */
  estimated_minutes: number | null
  /** Optional due time-of-day (ISO time string), or null. */
  due_time: string | null
  /** Optional due date (ISO date string) for one-off chores, or null. */
  due_date: string | null
  /** What happens when the instance period expires. */
  expiration_behavior: ExpirationBehavior
  /** Member ID of the creator. */
  created_by: string
  /** Member ID of the approver, or null if auto-approved. */
  approved_by: string | null
  /** Current lifecycle status. */
  status: MasterChoreStatus
  /** ISO datetime when created. */
  created_at: string
  /** ISO datetime when last updated. */
  updated_at: string
}

/**
 * Chore instance — a per-period occurrence of a master chore.
 *
 * Tracks assignment, progress, and completion for a specific period.
 */
export interface ChoreInstance {
  /** Unique identifier. */
  id: string
  /** ID of the parent master chore template. */
  master_chore_id: string
  /** Period start date (ISO string), or null for one-off chores. */
  period_start: string | null
  /** Period end date (ISO string), or null for one-off chores. */
  period_end: string | null
  /** Current lifecycle status. */
  status: InstanceStatus
  /** Member ID who voluntarily claimed, or null. Mutually exclusive with assigned_to. */
  claimed_by: string | null
  /** Member ID who was assigned by a parent, or null. Mutually exclusive with claimed_by. */
  assigned_to: string | null
  /** Member ID of the parent who made the assignment, or null. */
  assigned_by: string | null
  /** Member ID who marked it complete, or null. */
  completed_by: string | null
  /** Member ID of the parent who signed off, or null. */
  signoff_by: string | null
  /** ISO datetime when work began, or null. */
  started_at: string | null
  /** ISO datetime when marked complete, or null. */
  completed_at: string | null
  /** ISO datetime when parent signed off, or null. */
  signed_off_at: string | null
}

/**
 * Complete chores data response from the API.
 *
 * Contains all reference data (categories, tags), master chore templates,
 * and active instances in a single payload.
 */
export interface ChoresData {
  /** Available chore categories. */
  categories: ChoreCategory[]
  /** Available tags. */
  tags: ChoreTag[]
  /** Master chore templates. */
  master_chores: MasterChore[]
  /** Active chore instances. */
  instances: ChoreInstance[]
}
