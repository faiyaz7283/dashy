# Chores Frontend Rewire — Implementation Plan

**Status:** In Progress
**Created:** 2026-08-28
**Last Updated:** 2026-08-28

---

## Overview

The Chores API backend is fully compliant with the behavioral contract (82 Postman tests passing). The frontend API layer has been rewired to match (PATCH methods, sync on load, RFC 9457 error handling). However, multiple critical UX/logic bugs remain in the frontend chore feature.

This plan covers all remaining work to make the Chores feature production-ready.

---

## Phase 0: Backend Extension — Association Auto-Claim/Assign

**Repo:** `dashy-api/`
**Goal:** Extend `POST /api/v1/chores/associations` to support optional auto-claim or auto-assign on creation, eliminating the need for 3 chained frontend calls.

### Changes

#### 1. New Request Model (`app/api/models/chores.py`)
```python
class CreateAssociationRequest(BaseModel):
    master_chore_id: UUID
    member_id: str | None = None
    is_open_pool: bool = False
    created_by: str
    # New optional fields
    auto_claim: bool = False
    auto_assign: dict | None = None  # {"assigner_id": "trisha"}
```

#### 2. Service Method (`app/domain/chores/services.py`)
- After creating association, run `sync()` to generate instance
- If `auto_claim=True`: call `claim_instance()` on the generated instance
- If `auto_assign` provided: call `assign_instance()` on the generated instance
- Return association with generated instance data

#### 3. Route Update (`app/api/routes/chores.py`)
- Accept new optional fields
- Return enriched response with instance info

#### 4. Tests
- Test auto_claim creates association + claims instance
- Test auto_assign creates association + assigns instance
- Test open pool + auto_claim works
- Test validation: auto_claim requires member_id
- Test validation: auto_assign requires member_id

### Success Criteria
- [ ] `POST /associations` with `auto_claim: true` returns association + claimed instance
- [ ] `POST /associations` with `auto_assign: {assigner_id: "trisha"}` returns association + assigned instance
- [ ] Existing association creation (without auto flags) still works
- [ ] All 301+ backend tests pass
- [ ] Lint + typecheck pass

---

## Phase 1: Frontend Notification System

**Repo:** `dashy-kiosk/`
**Goal:** Create a shared notification/toast system for user feedback on all actions.

### Components

#### 1. `useNotifications` Hook (`src/shared/hooks/useNotifications.ts`)
```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'danger'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  autoDismiss?: boolean
  duration?: number  // ms, default 5000
}

// API:
const { notifications, addNotification, removeNotification, clearAll } = useNotifications()
```

#### 2. `NotificationToast` Component (`src/shared/components/NotificationToast.tsx`)
- Based on Tailwind UI `overlays/notifications/01-simple.jsx`
- Uses `@headlessui/react` Transition for animations
- Auto-dismiss with progress bar
- Manual close button
- Portal to `document.body`
- Stacks multiple notifications

#### 3. `NotificationProvider` (`src/shared/context/NotificationContext.tsx`)
- Wraps app, provides notification context
- Renders toast container

### Design
- **Success:** Green, CheckCircle icon, auto-dismiss 5s
- **Error:** Red, XCircle icon, auto-dismiss 8s
- **Warning:** Yellow, ExclamationTriangle icon, auto-dismiss 6s
- **Danger:** Red, ExclamationTriangle icon, no auto-dismiss (requires action)

### Success Criteria
- [ ] Hook provides add/remove/clear API
- [ ] Toast renders with correct colors per type
- [ ] Auto-dismiss works with configurable duration
- [ ] Manual close works
- [ ] Multiple toasts stack correctly
- [ ] Portal to document.body (not nested in component tree)
- [ ] All tests pass

---

## Phase 2: Association Picker Redesign

**Repo:** `dashy-kiosk/`
**Goal:** Redesigned association picker with smart filtering and correct action buttons.

### Member Column Flow (`+` clicked on Arya's column)

**Modal title:** "Assign Chores to Arya"

Each available chore shows **two buttons**:
| Button | Action | Backend Call |
|--------|--------|--------------|
| **Claim** | Arya claims it herself | `POST /associations` with `auto_claim: true` |
| **Assign by ▾** | Dropdown of other members (not Arya) | `POST /associations` with `auto_assign: {assigner_id: selected}` |

### Open Pool Column Flow (`+` clicked)

**Modal title:** "Add to Open Pool"

Each available chore shows **one button**:
| Button | Action | Backend Call |
|--------|--------|--------------|
| **Add** | Creates open pool association | `POST /associations` with `is_open_pool: true` |

After adding, instance appears in Open Pool column. User clicks instance card → InstanceInteraction popup → there they see Claim by ▾ / Assign ▾ options (Phase 3).

### Smart Filtering

Hide chores from the list when:
1. Already associated to that member (or open pool)
2. Non-collaborative master already has an active member association (can't add another member)
3. Master is inactive or archived

### Visual Distinction
- One-off chores: "One-time" badge
- Recurring chores: Show frequency summary

### Success Criteria
- [ ] Member column shows Claim + Assign by ▾ buttons
- [ ] Open pool column shows only Add button
- [ ] Smart filtering hides invalid options
- [ ] One-off vs recurring clearly distinguished
- [ ] Success notification on action
- [ ] Error notification on failure (with RFC 9457 detail)

---

## Phase 3a: InstanceInteraction — Open Pool Actions

**Repo:** `dashy-kiosk/`
**Goal:** Add Claim by  and Assign ▾ dropdowns for open pool instances in the interaction popup.

## Phase 3b: InstanceInteraction — Member Attribution Display

**Repo:** `dashy-kiosk/`
**Goal:** Fix attribution text to correctly show "Claimed by X" vs "Assigned by Y to Z" based on instance fields.

### Current State
- Active instance → Start button
- In Progress → Complete button
- Overdue → Complete Now button
- Missed → Disabled button
- Open Pool → Claim button (no member selection)

### New State

#### Open Pool Instance Popup
Add two action sections:

**Claim by **
- Dropdown of all members
- Clicking a member claims the instance for them
- `POST /instances/{id}/claim` with `member_id: selected`

**Assign ▾**
- Two grouped dropdowns:
  - "Assign to" — any member
  - "Assign by" — any member except "Assign to"
- Both mandatory
- `POST /instances/{id}/assign` with `assignee_id` + `assigner_id`

#### Member-Assigned Instance Popup
- Start/Complete buttons remain (performed by the assigned member)
- No other member can start/complete someone else's chore
- Show clear attribution: "Assigned by Trisha to Arya" or "Claimed by Arya"

### Success Criteria
- [ ] Open pool popup shows Claim by  and Assign ▾
- [ ] Assign requires both "Assign to" and "Assign by"
- [ ] "Assign by" excludes "Assign to" member
- [ ] Member-assigned popup shows correct attribution text
- [ ] Start/Complete only available to the assigned member
- [ ] Success/error notifications on all actions

---

## Phase 4: Edit Modal Fixes

**Repo:** `dashy-kiosk/`
**Goal:** Fix `due_time` availability and ensure all mutable fields are editable.

### Changes

#### `due_time` — Available for ALL frequencies
Currently restricted to `frequency === 'once'`. Should be available for daily/weekly/monthly/yearly as a time-of-day deadline within each period.

#### `due_date` — Keep restricted to `once` only
Absolute date only makes sense for one-off chores. Recurring chores determine dates via recurrence pattern.

#### All mutable fields from `UpdateMasterChoreRequest`
Verify all fields are editable:
- name, category_id, tag_ids, difficulty
- recurrence_rule (frequency + conditional fields)
- estimated_minutes, due_time, due_date (once only)
- expiration_behavior, end_date, max_occurrences
- conditions, is_collaborative, status

### Success Criteria
- [ ] `due_time` field shows for all frequencies
- [ ] `due_date` field only shows for `once`
- [ ] All mutable fields are editable
- [ ] Edit saves correctly via PATCH
- [ ] Success notification on save

---

## Phase 5: Confirmation Dialogs

**Repo:** `dashy-kiosk/`
**Goal:** Add confirmation dialogs for destructive actions.

### Based on Tailwind UI `overlays/modal-dialogs/03-simple-alert.jsx`

#### Archive Chore
- "Archive this chore? Active instances will be archived."
- Confirm / Cancel buttons

#### Delete Association
- "Remove this assignment? The instance will be archived."
- Confirm / Cancel buttons

#### Restore Chore
- "Restore this chore? New instances will be generated for the current period."
- Confirm / Cancel buttons

#### Delete Master Chore (permanent)
- Danger variant (red)
- "Permanently delete this chore? This cannot be undone."
- Confirm / Cancel buttons

### Success Criteria
- [ ] All destructive actions require confirmation
- [ ] Dialog uses HeadlessUI Dialog component
- [ ] Clear messaging about consequences
- [ ] Cancel closes without action
- [ ] Confirm executes action + shows notification

---

## Phase 6: Error Handling Integration

**Repo:** `dashy-kiosk/`
**Goal:** Use RFC 9457 error fields for user-friendly error messages.

### Error Type Mapping

| Error Type | User Message |
|------------|--------------|
| `not-found` (404) | "This chore no longer exists" |
| `conflict` (409) | "Already assigned to another member" / "Already claimed" |
| `validation-error` (422) | Show field-specific errors from `errors` array |
| `bad-request` (400) | "Invalid request. Please try again." |
| `internal-error` (500) | "Something went wrong. Please try again." |

### Implementation
- Update `parseApiError` to extract `type`, `title`, `detail`, `errors`
- Create error message mapping utility
- Show appropriate notification based on error type
- For 422 validation errors, show field-specific messages

### Success Criteria
- [ ] 409 conflict shows specific message ("Already claimed")
- [ ] 422 validation shows field-specific errors
- [ ] 404 shows "no longer exists" message
- [ ] 500 shows generic error message
- [ ] All error notifications use the toast system

---

## Phase 7: Hardcoded Value Removal

**Repo:** `dashy-kiosk/`
**Goal:** Remove all hardcoded member IDs and actor references.

### Current Issues
- "Completed by faiyaz" — actor_id is hardcoded
- `findFirstAdult(members)` used as fallback for `created_by`

### Fix
- Use member column context for actor determination
- Start/Complete actions use the member the instance belongs to (`claimed_by` or `assigned_to`)
- Claim actions use the member whose column the action originated from
- Assign actions use the selected member from dropdown

### Success Criteria
- [ ] No hardcoded member IDs in chore actions
- [ ] Actor determined from UI context
- [ ] All actions use correct member

---

## Execution Order

```
Phase 0 (Backend) → Phase 1 (Notifications) → Phase 2 (Association Picker)
    → Phase 3a (Open Pool Actions) → Phase 3b (Attribution Display)
    → Phase 4 (Edit Modal) → Phase 5 (Confirmations)
    → Phase 6 (Error Handling) → Phase 7 (Hardcoded Values)
```

**Rationale:** Backend extension first (Phase 0) enables cleaner frontend flows. Notification system (Phase 1) is needed by all subsequent phases. Then tackle the core UX flows (Phases 2-4), followed by polish (Phases 5-7).

## Workflow

- One phase at a time
- Each phase: implement → quality gate → code review → commit/push → "Ready for next phase?"
- User decides: continue, take a break, or wrap up for later
- Plan file tracks progress across sessions

---

## Quality Gate Per Phase

Each phase must pass before moving to the next:

1. `make lint` — 0 errors
2. `make typecheck` — passes
3. `make test` — all tests pass
4. `make build` — production build succeeds
5. Code review via `/review` skill
6. User approval

---

## Git Workflow

- Work on `development` branch
- Commit each phase separately with descriptive messages
- Include `Co-Authored-By: Qwen <noreply@qwen.ai>`
- Update submodule refs after each phase
- Final deployment after all phases complete

---

## References

- **API Contract:** `docs/chores-api-behavioral-contract.md`
- **Postman Collection:** `docs/chores-api-postman-collection.json`
- **Instance Interaction Mockup:** `dashy-kiosk/mockups/instance-interaction.html`
- **Tailwind UI Components:** `/Users/admin/Downloads/application-ui-v4/react/`
- **Existing Architecture:** `docs/plans/CHORES-ARCHITECTURE.md`
