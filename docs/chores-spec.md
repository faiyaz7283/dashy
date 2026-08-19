# Chores Module Specification v1

> **Status:** Locked — ready for architectural design
> **Last updated:** 2026-08-18

---

## 1. Core Model

### Master Chore (template)

Defines the chore template. One master can produce many instances over time.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | e.g. "Wipe Kitchen Counter" |
| `category_id` | FK → Category | Single-select from preset + user-created categories |
| `tags` | M2M → Tag | Multi-select, freeform, auto-created on entry |
| `difficulty` | integer | 1–5 scale |
| `frequency` | enum | `once`, `daily`, `weekly`, `monthly` |
| `estimated_minutes` | integer \| null | Optional time estimate |
| `due_time` | time \| null | Optional time-of-day deadline |
| `due_date` | date \| null | For one-off chores |
| `expiration_behavior` | enum | `disappear`, `carry_over`, `stay_visible`, `convert_to_open` |
| `created_by` | FK → Member | Who created this master chore |
| `approved_by` | FK → Member \| null | Who approved it (null = auto-approved) |
| `status` | enum | `pending_approval`, `active`, `archived` |
| `created_at` | datetime | |
| `updated_at` | datetime | |
| `deleted_at` | datetime \| null | Soft-delete timestamp (null = not deleted) |

### Chore Instance (per-period occurrence)

Generated from a master chore for a specific period.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `master_chore_id` | FK → MasterChore | Parent template |
| `period_start` | date | When this instance's period begins |
| `period_end` | date | When this instance's period ends |
| `status` | enum | See §2 Status Keywords |
| `claimed_by` | FK → Member \| null | Voluntary claim (mutually exclusive with `assigned_to`) |
| `assigned_to` | FK → Member \| null | Parent assignment (mutually exclusive with `claimed_by`) |
| `assigned_by` | FK → Member \| null | Parent who made the assignment |
| `completed_by` | FK → Member \| null | Who marked it done |
| `signoff_by` | FK → Member \| null | Parent who signed off (required for kid completions) |
| `started_at` | datetime \| null | When work began |
| `completed_at` | datetime \| null | When marked complete |
| `signed_off_at` | datetime \| null | When parent signed off |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### Category

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | Unique, case-normalized |
| `created_at` | datetime | |

**Presets (seeded):** Kitchen, Bathroom, Outdoor, Laundry, General.
Users can create new categories inline in the chore form (dropdown/combobox with "Create" action).

### Tag

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | Unique, case-normalized |
| `created_at` | datetime | |

**Behavior:** Freeform multi-select. New tags auto-create when typed in the form (type + Enter). Autocomplete suggests existing tags as the library grows.

### Join Table: chore_tags

| Field | Type | Notes |
|---|---|---|
| `master_chore_id` | FK → MasterChore | |
| `tag_id` | FK → Tag | |

---

## 2. Status Keywords

### Master Chore Status

| Status | Meaning |
|---|---|
| `pending_approval` | Created by a kid, awaiting adult approval |
| `active` | Approved and generating instances |
| `archived` | Soft-deleted, no longer generating instances |

### Chore Instance Status

| Status | Meaning |
|---|---|
| `active` | Available to claim/be assigned |
| `in_progress` | Work has started (`started_at` set) |
| `completed_pending_signoff` | Kid marked complete, awaiting parent signoff |
| `completed` | Fully done (signed off by parent, or adult self-completed) |
| `overdue` | Past due and not completed |
| `missed` | Period ended without completion |
| `archived` | Soft-deleted |

---

## 3. Creation & Approval Flow

### Who can create

Anyone — adults and kids alike.

### Approval rules

| Creator | Approver selected at creation? | Result |
|---|---|---|
| Adult | N/A | Auto-published (`status = active`) |
| Kid | Yes (selected an adult as approver) | Auto-published (`status = active`) |
| Kid | No | `status = pending_approval` — any adult can approve |

### Approval action

- Pending chores are visible to all adults.
- Any adult can approve by setting `approved_by` to themselves → status becomes `active`.
- Trust-based: fields are editable after creation (no permission gates).

---

## 4. Open Pool & Claim/Assign Model

### Open Pool

- A **shared section** (not a dedicated column) displaying unassigned, unclaimed chore instances.
- Chores flow into a member's column only when claimed or assigned.

### Claim vs Assign (mutually exclusive)

Each instance has two fields — only one can be set at a time:

| Field | Set by | Meaning |
|---|---|---|
| `claimed_by` | The member themselves (or anyone on their behalf) | Voluntary claim from the open pool |
| `assigned_to` + `assigned_by` | A parent | Parent-directed assignment |

Both fields are **editable** after initial set — a claimed chore can be reassigned by a parent, an assigned chore can be un-assigned and re-claimed.

### claimable_by

Open pool chores can optionally have a `claimable_by` field restricting who can claim them (e.g., only specific members). If null, anyone can claim.

---

## 5. Completion & Signoff Flow

### Who can change status

**Anyone** can change a chore instance's status (including kids). The system records *who* did it via the appropriate field.

### Kid completion flow

1. Kid sets `completed_by` to themselves → status becomes `completed_pending_signoff`.
2. A parent later sets `signoff_by` to themselves → status becomes `completed`.

### Adult completion flow

1. Adult sets `completed_by` to themselves → status becomes `completed` immediately (no signoff needed).

### Timestamps

- `started_at` — set when status changes to `in_progress`.
- `completed_at` — set when `completed_by` is recorded.
- `signed_off_at` — set when `signoff_by` is recorded.

---

## 6. Visual Layout

### Two-row structure (fits viewport, scales like calendar)

**Top row: Metrics summary**
- Compact metrics bar showing key stats (completion rate, overdue count, unclaimed count, etc.)
- Collapsible via a sidebar-style handle — click to expand for full metrics view (future enhancement)
- Keeps metrics visible without requiring a separate screen

**Bottom row: Chore board**

| Open Pool | Faiyaz | Mahbub | Tahmid | Saad |
|---|---|---|---|---|
| Unclaimed/unassigned chores only | Their claimed/assigned chores | Their claimed/assigned chores | Their claimed/assigned chores | Their claimed/assigned chores |

### Open Pool column

- Shows **only unclaimed and unassigned** chore instances
- When a chore is claimed or assigned, it **disappears from Open Pool** and appears in the member's column
- Open Pool is a **state**, not a chore type — any chore without a `claimed_by` or `assigned_to` lives here
- **Conditionally rendered** — column only appears when there are unclaimed/unassigned chores. If all chores are claimed or assigned, the Open Pool column disappears and member columns expand to fill the space
- Status badges: `open`, `overdue`, `expiring_soon`

### Member columns

- One column per family member
- Shows chores that member has claimed or been assigned
- Status badges: `claimed`, `assigned`, `in_progress`, `completed_pending_signoff`, `completed`, `overdue`, `expiring_soon`

### Chore card contents

Each card displays:

- Chore name
- Category badge (color-coded)
- Tags (small chips)
- Difficulty (1–5 indicator)
- Time info (estimated minutes, due time/date if applicable)
- Status badge (see tables above)
- Attribution: who claimed/assigned/completed/signed off (shown as small name badges)

### Interaction

- Click a card to open detail/edit modal.
- Claim/assign actions available directly on the card (dropdown to select member).
- Status changes via dropdown or action buttons on the card/modal.

### Scaling

- Must always fit the visible window, scaled properly based on resolution/screen size (same approach as calendar feature).
- No page-level scroll; the board adapts to viewport.

---

## 7. Recurring Chore Instance Model

### Frequency

One of: `once`, `daily`, `weekly`, `monthly`.

**No multi-count per period.** "Brush teeth 2x/day" becomes two separate master chores: "Morning Brush Teeth" and "Night Brush Teeth."

### Instance generation

- System generates one `ChoreInstance` per period from the `MasterChore`.
- Generation logic runs on a schedule (e.g., nightly cron or on-demand).
- Each instance inherits name, category, tags, difficulty, estimated_minutes from the master.
- Instance gets its own `period_start`, `period_end`, and independent status/attribution fields.

### Period boundaries

| Frequency | Period |
|---|---|
| `daily` | Single calendar day |
| `weekly` | Configurable start day (default: Monday) |
| `monthly` | Calendar month (1st → last day) |
| `once` | Single instance, no recurring period |

---

## 8. Expiration & Rollover

When a period ends without completion, the creator's chosen `expiration_behavior` determines what happens to the instance:

| Behavior | Result |
|---|---|
| `disappear` | Instance is removed (no trace) |
| `carry_over` | A new instance is generated for the next period, carrying the same status |
| `stay_visible` | Instance remains in place, marked as `missed` |
| `convert_to_open` | Instance is moved to the Open Pool for anyone to claim |

---

## 9. Delete vs Archive

| Action | Effect | Use case |
|---|---|---|
| **Delete** | Permanent removal, no history preserved | Mistakes during creation |
| **Archive** | Soft-delete via `deleted_at` timestamp, preserved in metrics and history | Completed/cleared chores that should no longer be active |

Archived master chores stop generating instances. Archived instances remain queryable for historical metrics.

---

## 10. What's NOT in v1

These are explicitly deferred to future versions:

- **Partial completion** — no percentage or sub-task tracking
- **Gamification** — no badges, leaderboards, streaks, or reward rings
- **Advanced analytics** — no charts, trends, or historical dashboards beyond basic completion counts
- **Calendar integration** — chores are independent of the calendar feature
- **Notifications** — data model supports it but no push/alert system in v1
- **Drag-and-drop reassignment** — UI interaction deferred
- **Multi-count frequency** — each chore is once per period; duplicates for multiple counts
