# Chores Feature — Regression Test Suite

**Date:** 2026-08-28
**Scope:** Chores module (Phases 1-7 complete)
**Status:** Draft — ready for automation
**Linked:** [Bug Report](CHORES-BUG-REPORT.md)

---

## 1. Overview

This document defines the complete regression test suite for the Chores feature. It covers:
- All 13 bugs found during manual testing (Phases 1-7)
- Additional edge cases and scenarios identified during inspection
- End-to-end user flows across the full chore lifecycle

### 1.1 Recommended Tooling: Playwright

**Why Playwright over Selenium:**
- Native TypeScript support (matches our stack)
- Auto-waiting for elements (no flaky `sleep()` calls)
- Built-in test runner, assertions, and HTML reporter
- Faster execution (parallel test support)
- Better React async rendering handling
- Cross-browser (Chromium, Firefox, WebKit) from one test file
- Network interception for API mocking
- Visual regression testing built-in

**Alternative considered:** Cypress — more opinionated, single-browser focus, less flexible for our Docker-based dev environment.

### 1.2 Test Environment

| Component | Setup |
|-----------|-------|
| Frontend | `make dev-up` → `http://api.dashy.local` (Traefik) |
| Backend | Docker container, PostgreSQL via `postgres-data` volume |
| Test DB | Separate `dashy_test` database (configured via `.env.test`) |
| Cleanup | `make db-clean-chores` before each test run (or per-suite setup) |

### 1.3 Test Structure

```
dashy-kiosk/
├── e2e/                          # NEW — Playwright tests
│   ├── fixtures/                 # Test data factories
│   │   ├── chores.fixture.ts
│   │   └── members.fixture.ts
│   ├── pages/                    # Page Object Models
│   │   ├── ChoresBoard.page.ts
│   │   ├── MasterChoreModal.page.ts
│   │   └── InstanceCard.page.ts
│   ├── specs/                    # Test specs
│   │   ├── master-chore-crud.spec.ts
│   │   ├── associations.spec.ts
│   │   ├── instances.spec.ts
│   │   ├── recurrence.spec.ts
│   │   ├── expiration.spec.ts
│   │   ├── archive-delete.spec.ts
│   │   └── ui-display.spec.ts
│   └── playwright.config.ts
└── playwright.config.ts          # Root config
```

---

## 2. Test Cases

### Legend

| Field | Values |
|-------|--------|
| **Priority** | P0 (Critical), P1 (High), P2 (Medium), P3 (Low) |
| **Type** | Functional, UI, Integration, Edge Case |
| **Bug** | Links to bug report ID (if applicable) |

---

### 2.1 Master Chore CRUD

#### TC-001: Create Master Chore — All Fields

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Dev environment running (`make dev-up`)
- At least one category exists
- At least one tag exists

**Steps:**
1. Navigate to Chores board
2. Click `+` to open Create Master Chore modal
3. Fill all fields: name, category, tags, difficulty, recurrence, estimated minutes, due time, due date, expiration behavior, end date, max occurrences, collaborative toggle
4. Click Save

**Expected:**
- Modal closes
- Success toast appears
- New chore appears on board with correct data
- Board updates without manual refresh

**Linked Bug:** #1 (board refresh)

---

#### TC-002: Create Master Chore — Minimal Fields

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- At least one category exists

**Steps:**
1. Open Create modal
2. Fill only required fields: name, category
3. Click Save

**Expected:**
- Chore created with defaults (difficulty=1, non-collaborative, disappear behavior)
- Appears on board

---

#### TC-003: Create Master Chore — Validation Errors

**Priority:** P1 | **Type:** Functional

**Steps:**
1. Open Create modal
2. Leave name empty → click Save
3. Fill name, leave category empty → click Save
4. Enter invalid difficulty (e.g., 0 or 11) → click Save

**Expected:**
- Inline validation errors appear
- Save button disabled or shows error on click
- No toast, no chore created

---

#### TC-004: Edit Master Chore — All Mutable Fields

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- At least one master chore exists

**Steps:**
1. Click "Manage Current" on a chore
2. Click Edit
3. Modify all editable fields
4. Click Save

**Expected:**
- Changes saved
- Board reflects updated data
- No manual refresh needed

**Linked Bug:** #1 (board refresh)

---

#### TC-005: Edit Master Chore — Name Uniqueness

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- Chore "Brush Teeth" exists

**Steps:**
1. Create new chore with name "Brush Teeth"
2. Click Save

**Expected:**
- Either: (a) Duplicate name rejected with error, OR (b) Duplicate allowed (design decision)
- Document current behavior

**Note:** Design question — are chore names unique? See Bug Report Question 1.

---

#### TC-006: Edit Master Chore — Change Frequency

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Daily recurring master chore exists with at least one generated instance

**Steps:**
1. Open "Manage Current" → Edit
2. Change recurrence from daily to weekly
3. Save
4. Trigger sync (refresh page)
5. Check generated instances

**Expected:**
- New instances follow weekly pattern (not daily)
- Existing instances from previous daily pattern remain unchanged
- `period_start`/`period_end` reflect weekly span

---

#### TC-007: Edit Master Chore — Toggle Collaborative (false → true)

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Non-collaborative master chore with one member association

**Steps:**
1. Open "Manage Current" → Edit
2. Toggle `is_collaborative` to true
3. Save
4. Try adding a second member association

**Expected:**
- Second member can now be added (collaborative allows multiple)

---

#### TC-008: Edit Master Chore — Toggle Collaborative (true → false)

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Collaborative master chore with multiple member associations

**Steps:**
1. Open "Manage Current" → Edit
2. Toggle `is_collaborative` to false
3. Save
4. Observe behavior

**Expected:**
- Either: (a) Toggle rejected with warning about existing multiple associations, OR (b) Toggle succeeds but existing associations preserved (document behavior)

---

### 2.2 Associations & Open Pool

#### TC-010: Associate Chore to Member via Member Column

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore exists
- Member column visible

**Steps:**
1. Click `+` in member column
2. Select a chore from dropdown
3. Confirm association

**Expected:**
- Instance appears in member's column
- Board updates immediately

**Linked Bug:** #1 (board refresh)

---

#### TC-011: Associate Chore to Open Pool

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore exists
- Open pool section visible

**Steps:**
1. Click `+` in open pool section
2. Select a chore from dropdown
3. Confirm association

**Expected:**
- Instance appears in open pool
- Board updates immediately

---

#### TC-012: Non-Collaborative — Single Association Limit

**Priority:** P0 | **Type:** Functional | **Bug:** #5

**Preconditions:**
- Non-collaborative master chore exists

**Steps:**
1. Add chore to open pool via open pool `+`
2. Click member column `+` → Claim same chore
3. Refresh page
4. Open "Manage Current" → check association count

**Expected:**
- Second association rejected with error
- Only one association exists (either open pool OR member, not both)

**Actual (Bug #5):** Both associations created silently.

---

#### TC-013: Collaborative — Prevent Duplicate Member Assignment

**Priority:** P1 | **Type:** Functional | **Bug:** #4

**Preconditions:**
- Collaborative master chore exists
- Member "Faiyaz" not yet assigned

**Steps:**
1. Assign chore to Faiyaz via member column `+`
2. Add chore to open pool via open pool `+`
3. From open pool instance, click Claim → assign to Faiyaz again
4. Check "Manage Current" → association count

**Expected:**
- Second assignment to same member rejected
- Only one association per member per master chore

**Actual (Bug #4):** Two associations created silently.

---

#### TC-014: Open Pool — Claim Instance

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Open pool instance exists (unclaimed)

**Steps:**
1. Click on open pool instance card
2. Click "Claim" button
3. Select member from dropdown

**Expected:**
- Instance moves from open pool to member's column
- Board updates immediately

**Linked Bug:** #1 (board refresh)

---

#### TC-015: Open Pool — Assign Instance to Member

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Open pool instance exists

**Steps:**
1. Click on open pool instance card
2. Click "Assign" button
3. Select member from dropdown

**Expected:**
- Instance moves to member's column
- `assigned_by` field set to current user

---

#### TC-016: max_occurrences — Dropdown Filtering

**Priority:** P1 | **Type:** Functional | **Bug:** #12

**Preconditions:**
- Master chore with `max_occurrences: 3`
- 3 instances already claimed/associated

**Steps:**
1. Click `+` in member column or open pool
2. Check dropdown list

**Expected:**
- Chore NOT visible in dropdown (max reached)

**Actual (Bug #12):** Chore still appears in dropdown.

---

### 2.3 Instance Lifecycle

#### TC-020: Start Instance

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Active instance assigned to member

**Steps:**
1. Click instance card
2. Click "Start" button

**Expected:**
- Instance status changes to `in_progress`
- `started_at` timestamp set
- Board updates immediately

**Linked Bug:** #1 (board refresh)

---

#### TC-021: Complete Instance

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Instance in `active` or `in_progress` status

**Steps:**
1. Click instance card
2. Click "Complete" button

**Expected:**
- Instance status changes to `completed`
- `completed_at` timestamp set
- `completed_by` set to member key
- Board updates immediately

---

#### TC-022: Undo Start/Complete (If Implemented)

**Priority:** P2 | **Type:** Functional | **Bug:** #3

**Preconditions:**
- Instance in `completed` status

**Steps:**
1. Click instance card
2. Look for "Undo" or status revert option

**Expected:**
- Option to revert: completed → in_progress → active
- OR: 5-second undo toast after action

**Actual (Bug #3):** No undo option exists. Status transitions are one-way.

---

#### TC-023: Delete Instance

**Priority:** P2 | **Type:** Functional | **Bug:** #2

**Preconditions:**
- Instance exists

**Steps:**
1. Click instance card
2. Look for "Delete" or "Remove" option

**Expected:**
- Instance removed from board
- Association removed (or instance count decremented)

**Actual (Bug #2):** No delete option exists.

---

#### TC-024: Open Pool Instance — No Start Button

**Priority:** P2 | **Type:** UI | **Bug:** #6

**Preconditions:**
- Unclaimed open pool instance exists

**Steps:**
1. View open pool instance card
2. Check available action buttons

**Expected:**
- Only "Claim" and "Assign" buttons visible
- No "Start" or "Complete" buttons

**Actual (Bug #6):** Start button visible but non-functional.

---

### 2.4 Recurrence & Instance Generation

#### TC-030: Daily Recurrence — Instance Generation

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore with daily recurrence rule
- No existing instances

**Steps:**
1. Create daily recurring chore
2. Check board for generated instances

**Expected:**
- One instance generated for current period (today)
- Instance appears in open pool or assigned column

---

#### TC-031: Weekly Recurrence — Instance Generation

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore with weekly recurrence rule

**Steps:**
1. Create weekly recurring chore
2. Check board for generated instances

**Expected:**
- One instance generated for current week

---

#### TC-032: Monthly Recurrence — Instance Generation

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore with monthly recurrence rule

**Steps:**
1. Create monthly recurring chore
2. Check board for generated instances

**Expected:**
- One instance generated for current month

---

#### TC-033: max_occurrences — Instance Generation Limit

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore with `max_occurrences: 3` and daily recurrence

**Steps:**
1. Create chore
2. Wait/simulate 4 days passing
3. Check instance count

**Expected:**
- Only 3 instances generated (not 4)
- `occurrence_count` on master = 3

**Note:** Instance generation is period-based, not time-based. To test, verify today's instance exists and sync doesn't create duplicates.

---

#### TC-034: max_occurrences — Association Enforcement

**Priority:** P1 | **Type:** Functional | **Bug:** #12

**Preconditions:**
- Master chore with `max_occurrences: 3`
- 3 instances generated and claimed

**Steps:**
1. Attempt to claim a 4th instance (if visible)
2. Check toast/notification

**Expected:**
- Claim rejected with error: "Maximum occurrences reached"
- No success toast

**Actual (Bug #12):** Success toast appears, no enforcement.

---

#### TC-035: end_date — Stop Generation After Date

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore with `end_date` set to yesterday

**Steps:**
1. Create chore with past `end_date`
2. Trigger sync
3. Check instance count

**Expected:**
- No new instances generated after end date

---

#### TC-036: Sync Duplicate Check — No Duplicate Instances

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Daily recurring master chore with one instance for today

**Steps:**
1. Call `POST /chores/sync` (via API or page refresh)
2. Call `POST /chores/sync` again
3. Check instance count for today

**Expected:**
- Still only one instance for today
- `occurrence_count` on master not incremented twice
- No duplicate instances created

**Key Insight:** Instance generation is period-based, not time-based. A daily chore generates one instance per calendar day. Sync is idempotent for the current period.

---

#### TC-037: occurrence_count Incremented Correctly

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Daily recurring master chore, `occurrence_count` = 0

**Steps:**
1. Create chore → verify `occurrence_count` = 1 (today's instance)
2. Simulate next day (or verify via API)
3. Trigger sync
4. Check `occurrence_count`

**Expected:**
- `occurrence_count` increments by 1 per new period
- Matches actual instance count in database

---

#### TC-038: Weekly Recurrence — period_start/period_end Span Correct Week

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- Weekly recurring master chore

**Steps:**
1. Create weekly chore
2. Check generated instance's `period_start` and `period_end`
3. Verify they span the correct calendar week (Monday–Sunday or configured week start)

**Expected:**
- `period_start` = Monday of current week
- `period_end` = Sunday of current week
- Instance visible for the entire week period

---

#### TC-039: Monthly Recurrence — period_start/period_end Span Correct Month

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- Monthly recurring master chore

**Steps:**
1. Create monthly chore
2. Check generated instance's `period_start` and `period_end`

**Expected:**
- `period_start` = 1st of current month
- `period_end` = last day of current month

---

### 2.5 Expiration Behavior

> **Testing Approach for Expiration:** Set `due_time` to 1 minute in the past, wait 2 minutes, then refresh the page. This triggers the expiration logic without waiting for a real period to pass. **Note:** Bug #9 (timezone conversion) must be fixed first for reliable time-based testing.

#### TC-040: expiration_behavior "disappear" — Instance Removed After Complete

**Priority:** P1 | **Type:** Functional | **Bug:** #10

**Preconditions:**
- Master chore with `expiration_behavior: "disappear"`
- Instance in `completed` status

**Steps:**
1. Complete an instance
2. Refresh board
3. Check if instance is visible

**Expected:**
- Completed instance removed/hidden from board

**Actual (Bug #10):** Instance remains visible.

---

#### TC-041: expiration_behavior "disappear" — UI Option

**Priority:** P2 | **Type:** UI | **Bug:** #10

**Preconditions:**
- Edit modal open

**Steps:**
1. Open edit modal for a chore
2. Check expiration behavior options

**Expected:**
- "Disappear" option visible and selectable
- OR: Clear indication that "disappear" is default when both toggles are off

**Actual (Bug #10):** No "disappear" option in UI.

---

#### TC-042: expiration_behavior "stay_visible" — Instance Marked Missed

**Priority:** P2 | **Type:** Functional | **Bug:** #11 (blocked)

**Preconditions:**
- Master chore with `expiration_behavior: "stay_visible"`
- Instance with `due_time` in the past

**Steps:**
1. Create chore with `due_time` set to 1 minute ago
2. Wait 2 minutes
3. Refresh board
4. Check instance status

**Expected:**
- Instance marked as `missed`
- Instance still visible on board

**Dependency:** Blocked by Bug #9 (timezone conversion).

---

#### TC-043: expiration_behavior "convert_to_open" — Instance Moves to Open Pool

**Priority:** P2 | **Type:** Functional | **Bug:** #13

**Preconditions:**
- Master chore with `expiration_behavior: "convert_to_open"`
- Instance with `due_time` in the past

**Steps:**
1. Create chore with `due_time` set to 1 minute ago
2. Wait 2 minutes
3. Refresh board
4. Check instance location

**Expected:**
- Instance moved from member column to open pool
- Instance status updated

**Linked Bug:** #13 (UI option missing)

---

#### TC-044: expiration_behavior "convert_to_open" — UI Option

**Priority:** P2 | **Type:** UI | **Bug:** #13

**Preconditions:**
- Edit modal open

**Steps:**
1. Open edit modal
2. Check expiration behavior options

**Expected:**
- "Convert to Open Pool" option visible and selectable

**Actual (Bug #13):** Only "disappear" and "stay_visible" accessible.

---

### 2.6 Archive & Delete

#### TC-050: Archive Chore — No Active Instances

**Priority:** P1 | **Type:** Functional

**Preconditions:**
- Master chore with no active/in-progress instances

**Steps:**
1. Click "Manage Current"
2. Click "Archive"
3. Confirm archive

**Expected:**
- Chore moves to "Archived" view
- Board updates immediately

---

#### TC-051: Archive Chore — With Active Instances

**Priority:** P1 | **Type:** Functional | **Bug:** #7

**Preconditions:**
- Collaborative master chore with:
  - One instance `in_progress`
  - One instance `completed`
  - One open pool instance (active)

**Steps:**
1. Click "Manage Current"
2. Click "Archive"
3. Observe behavior

**Expected:**
- Either: (a) Archive blocked with warning, OR (b) All instances auto-archived

**Actual (Bug #7):** Archive succeeds, instances orphaned (remain in current status).

---

#### TC-052: Restore Archived Chore

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- Archived chore exists (with recurrence rule)

**Steps:**
1. Navigate to "Archived" view
2. Click on archived chore
3. Click "Restore" or "Unarchive"
4. Confirm restore dialog
5. Return to "Current" view
6. Check board for regenerated instances

**Expected:**
- Chore returns to "Current" view
- Instances regenerate for current period (if recurring)
- Board updates immediately

---

#### TC-053: Bulk Pause — Multiple Chores

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- 3+ active chores on board

**Steps:**
1. Select 3 chores (via bulk select or "Manage Current" multi-select)
2. Click "Pause" or bulk status change to "inactive"
3. Confirm dialog

**Expected:**
- All selected chores change to inactive/paused status
- Board updates — paused chores no longer generate instances
- Board reflects changes immediately

---

#### TC-054: Bulk Archive — Multiple Chores with Confirmation

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- 3+ active chores on board

**Steps:**
1. Select 3 chores
2. Click "Archive"
3. Verify confirmation dialog appears
4. Click "Cancel" → verify no change
5. Select same 3 chores again
6. Click "Archive" → confirm

**Expected:**
- Cancel: dialog closes, no changes
- Confirm: all 3 chores move to "Archived" view
- Board updates immediately

---

#### TC-055: Bulk Delete — Multiple Chores with Confirmation

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- 3+ archived chores

**Steps:**
1. Navigate to "Archived" view
2. Select 3 chores
3. Click "Delete"
4. Verify danger confirmation dialog appears
5. Click "Cancel" → verify no change
6. Select same 3 chores again
7. Click "Delete" → confirm

**Expected:**
- Cancel: dialog closes, no changes
- Confirm: all 3 chores permanently deleted (or soft-deleted — document behavior)
- Archived view updates

---

#### TC-056: Permanent Delete — Soft Delete Only

**Priority:** P2 | **Type:** Functional | **Bug:** #8

**Preconditions:**
- Archived chore exists

**Steps:**
1. Navigate to "Archived" view
2. Click on archived chore
3. Click "Delete"
4. Confirm "Permanently delete chore?"
5. Check database (via `make dev-shell` → query)

**Expected:**
- Master + associations + instances removed from database

**Actual (Bug #8):** Only soft-delete (`deleted_at` set). Data remains in DB.

---

### 2.7 UI/UX & Display

#### TC-060: Board Refresh After Actions

**Priority:** P1 | **Type:** UI | **Bug:** #1

**Preconditions:**
- Board visible with at least one chore

**Steps:**
1. Perform any action: assign, claim, start, complete, add to open pool
2. Observe board

**Expected:**
- Board updates immediately after action
- No manual refresh needed

**Actual (Bug #1):** Board stale until manual refresh.

---

#### TC-061: Timezone Conversion — due_time Display

**Priority:** P1 | **Type:** UI | **Bug:** #9

**Preconditions:**
- Master chore with `due_time: "03:57"` (3:57 AM)

**Steps:**
1. Create chore with `due_time` 3:57 AM
2. View instance card on board
3. Check displayed time

**Expected:**
- Instance card shows 3:57 AM (local time)

**Actual (Bug #9):** Shows 11:57 PM (8-hour offset, UTC vs local mismatch).

---

#### TC-062: Tooltip — No Clipping in Modal

**Priority:** P2 | **Type:** UI

**Preconditions:**
- Create/Edit Master Chore modal open

**Steps:**
1. Hover over tooltip icons (Category, Tags, etc.)
2. Check tooltip visibility

**Expected:**
- Tooltip fully visible, not clipped by modal `overflow-hidden`
- Tooltip stays within viewport bounds

**Note:** Fixed in Tooltip.tsx rewrite (portal to document.body).

---

#### TC-063: Difficulty Dots — Visual Representation

**Priority:** P3 | **Type:** UI

**Preconditions:**
- Chore with difficulty 1-10

**Steps:**
1. View chore card
2. Check difficulty dots

**Expected:**
- Correct number of dots filled (1-10 scale)
- Color matches difficulty level

---

#### TC-064: Category & Tag Display

**Priority:** P3 | **Type:** UI

**Preconditions:**
- Chore with category and tags

**Steps:**
1. View chore card
2. Check category label
3. Check tag badges

**Expected:**
- Category name visible
- Tag badges visible with correct names

---

#### TC-065: Instance Interaction Popup — Active Instance

**Priority:** P1 | **Type:** UI

**Preconditions:**
- Instance in `active` status assigned to member

**Steps:**
1. Click instance card to open interaction popup
2. Check available action buttons

**Expected:**
- "Start" button visible and enabled
- "Complete" button visible (optional — may skip start)

---

#### TC-066: Instance Interaction Popup — In-Progress Instance

**Priority:** P1 | **Type:** UI

**Preconditions:**
- Instance in `in_progress` status

**Steps:**
1. Click instance card to open interaction popup
2. Check available action buttons

**Expected:**
- "Complete" button visible and enabled
- "Start" button hidden or disabled (already started)

---

#### TC-067: Instance Interaction Popup — Overdue Instance

**Priority:** P1 | **Type:** UI

**Preconditions:**
- Instance past its `due_time`/`period_end`, status still `active`

**Steps:**
1. Click instance card to open interaction popup
2. Check available action buttons and visual indicators

**Expected:**
- "Complete Now" button visible (prominent/urgent styling)
- Visual indicator showing overdue state (red/orange highlight)

---

#### TC-068: Instance Interaction Popup — Missed Instance

**Priority:** P2 | **Type:** UI

**Preconditions:**
- Instance in `missed` status (period expired, `stay_visible` behavior)

**Steps:**
1. Click instance card to open interaction popup
2. Check available action buttons

**Expected:**
- Action buttons disabled or hidden
- Visual indicator showing missed state (greyed out)

---

#### TC-069: Timezone — TIMEZONE Env Var Change

**Priority:** P2 | **Type:** Integration

**Preconditions:**
- Dev environment running with `TIMEZONE` set in `.env.dev`
- Chore with `due_time: "23:00"` exists

**Steps:**
1. Note current displayed time on instance card
2. Change `TIMEZONE` in `.env.dev` to a different timezone (e.g., `America/New_York` → `Asia/Tokyo`)
3. Restart dev environment (`make dev-restart`)
4. Check displayed time on instance card

**Expected:**
- Time updates to reflect new timezone
- `23:00` UTC displays correctly in new timezone

**Linked Bug:** #9 (timezone conversion)

---

### 2.8 Edge Cases & Error Handling

#### TC-070: Create Chore — Network Error

**Priority:** P2 | **Type:** Edge Case

**Preconditions:**
- Dev environment running

**Steps:**
1. Open Create modal
2. Fill required fields
3. Disable network (DevTools → Offline)
4. Click Save

**Expected:**
- Error toast: "Network error. Please try again."
- Modal stays open, data preserved

---

#### TC-071: Create Chore — Duplicate Name (If Enforced)

**Priority:** P2 | **Type:** Edge Case

**Preconditions:**
- Chore "Brush Teeth" exists

**Steps:**
1. Create new chore with name "Brush Teeth"
2. Click Save

**Expected:**
- Error: "Chore name already exists"
- OR: Duplicate allowed (document behavior)

---

#### TC-072: Association — Member Already Assigned (Collaborative)

**Priority:** P1 | **Type:** Edge Case | **Bug:** #4

**Preconditions:**
- Collaborative chore
- Member "Faiyaz" already assigned

**Steps:**
1. Click member column `+`
2. Try to assign same chore to Faiyaz again

**Expected:**
- Assignment rejected or warning shown

**Actual (Bug #4):** Duplicate assignment succeeds.

---

#### TC-073: Association — Non-Collaborative Already Assigned

**Priority:** P0 | **Type:** Edge Case | **Bug:** #5

**Preconditions:**
- Non-collaborative chore
- One association exists (member or open pool)

**Steps:**
1. Try to add second association (member or open pool)

**Expected:**
- Second association rejected

**Actual (Bug #5):** Both associations created.

---

#### TC-074: Instance — Start Without Assignment

**Priority:** P2 | **Type:** Edge Case

**Preconditions:**
- Open pool instance (unclaimed)

**Steps:**
1. Click instance card
2. Check available actions

**Expected:**
- No "Start" button (instance not assigned to anyone)

**Linked Bug:** #6 (Start button visible but non-functional)

---

#### TC-075: Bulk Operations — Archive Multiple Chores

**Priority:** P2 | **Type:** Functional

**Preconditions:**
- Multiple active chores

**Steps:**
1. Select multiple chores (if bulk select exists)
2. Click "Archive"

**Expected:**
- All selected chores archived
- Board updates

---

#### TC-076: Confirmation Dialog — Cancel Action

**Priority:** P2 | **Type:** UI

**Preconditions:**
- About to perform destructive action (archive, delete)

**Steps:**
1. Click action button
2. Confirmation dialog appears
3. Click "Cancel"

**Expected:**
- Dialog closes
- No action performed
- Board unchanged

---

#### TC-077: Delete Non-Existent Chore — 404 Error

**Priority:** P2 | **Type:** Edge Case

**Preconditions:**
- Dev environment running

**Steps:**
1. Via API: `DELETE /api/v1/chores/masters/{non-existent-uuid}`
2. Or: Navigate to archived view, delete a chore, then try to delete it again

**Expected:**
- 404 error toast: "Chore not found"
- No crash, no silent failure

---

#### TC-078: Confirmation Dialog — Archive Confirm

**Priority:** P2 | **Type:** UI

**Preconditions:**
- Active chore on board

**Steps:**
1. Click "Manage Current" → "Archive"
2. Confirmation dialog appears
3. Click "Confirm"

**Expected:**
- Chore moves to "Archived" view
- Board updates immediately
- Success toast appears

---

#### TC-079: Confirmation Dialog — Delete Confirm (Danger)

**Priority:** P2 | **Type:** UI

**Preconditions:**
- Archived chore exists

**Steps:**
1. Navigate to "Archived" view
2. Click "Delete" on a chore
3. Danger confirmation dialog appears (red styling)
4. Click "Confirm"

**Expected:**
- Chore removed from archived view
- Danger dialog has distinct visual styling (red/warning)
- Success/error toast appears

---

#### TC-080: Confirmation Dialog — Restore Confirm

**Priority:** P2 | **Type:** UI

**Preconditions:**
- Archived chore exists

**Steps:**
1. Navigate to "Archived" view
2. Click "Restore" on a chore
3. Confirmation dialog appears
4. Click "Confirm"

**Expected:**
- Chore returns to "Current" view
- Instances regenerate for current period
- Board updates immediately

---

### 2.9 Full Flow Tests (End-to-End)

> These tests verify complete user workflows spanning multiple features. They should be run as integration tests after all individual component tests pass.

#### TC-090: Open Pool Full Flow

**Priority:** P1 | **Type:** Integration

**Preconditions:**
- Dev environment running
- At least one member exists
- At least one category exists

**Steps:**
1. Create a new master chore (any recurrence)
2. Click open pool `+` → add chore to open pool
3. Verify instance appears in open pool column
4. Click instance card → click "Claim" → select member
5. Verify instance moves from open pool to member's column
6. Click instance card → click "Start"
7. Verify status changes to `in_progress`
8. Click instance card → click "Complete"
9. Verify status changes to `completed`
10. Refresh page → verify all changes persisted

**Expected:**
- Each step updates the board immediately (Bug #1)
- Instance flows: open pool → member column → started → completed
- All state persisted after refresh

**Linked Bugs:** #1 (board refresh), #6 (open pool Start button)

---

#### TC-091: Member Column Full Flow

**Priority:** P1 | **Type:** Integration

**Preconditions:**
- Dev environment running
- At least one member exists

**Steps:**
1. Click member column `+` → Claim → select a chore
2. Verify instance appears in member's column
3. Click member column `+` → Assign by [other member] → select a different chore
4. Verify assignment created with `assigned_by` set
5. Click first instance → Start → verify `in_progress`
6. Click first instance → Complete → verify `completed`
7. Refresh page → verify all changes persisted

**Expected:**
- Claim creates instance in member column
- Assign creates instance with `assigned_by` field
- Start/Complete transitions work correctly
- All state persisted after refresh

**Linked Bug:** #1 (board refresh)

---

#### TC-092: Collaborative Chore — Multi-Member Flow

**Priority:** P1 | **Type:** Integration

**Preconditions:**
- Collaborative master chore exists
- 2+ members available

**Steps:**
1. Assign chore to Member A via member column `+`
2. Assign chore to Member B via member column `+`
3. Verify both members have their own instance
4. Member A: Start → Complete their instance
5. Member B: Start → Complete their instance
6. Verify both instances show `completed`
7. Refresh → verify persisted

**Expected:**
- Each member has independent instance
- Status transitions are per-instance, not per-chore
- All state persisted

---

#### TC-093: Recurring Chore — Full Lifecycle

**Priority:** P1 | **Type:** Integration

**Preconditions:**
- Dev environment running

**Steps:**
1. Create daily recurring chore with `max_occurrences: 3`
2. Verify today's instance generated
3. Assign to member → Start → Complete
4. Trigger sync → verify no duplicate for today
5. Verify `occurrence_count` = 1
6. Edit chore → change to weekly recurrence
7. Trigger sync → verify new instance follows weekly pattern
8. Archive chore → verify moves to archived
9. Restore chore → verify returns to current with regenerated instance

**Expected:**
- Instance generation respects max_occurrences
- Sync is idempotent
- Frequency change propagates to new instances
- Archive/restore cycle works correctly

---

## 3. Test Execution Plan

### 3.1 Manual Regression (Immediate)

Run these tests manually after each bug fix to verify no regressions:

| Priority | Test IDs | Estimated Time |
|----------|----------|----------------|
| P0 (Critical) | TC-012, TC-073 | 5 min |
| P1 (High) | TC-001, TC-004, TC-010, TC-011, TC-014, TC-020, TC-021, TC-030, TC-033, TC-034, TC-040, TC-050, TC-051, TC-060, TC-061 | 20 min |
| P2 (Medium) | TC-002, TC-003, TC-016, TC-022, TC-023, TC-024, TC-041, TC-042, TC-043, TC-044, TC-052, TC-053, TC-062, TC-070, TC-071, TC-072, TC-074, TC-076 | 15 min |
| P3 (Low) | TC-005, TC-031, TC-032, TC-035, TC-063, TC-064, TC-075 | 10 min |

**Total manual regression time:** ~50 minutes

### 3.2 Automated Regression (Playwright)

Once Playwright is set up:

```bash
# Run all chores regression tests
make test-e2e-chores

# Run specific category
make test-e2e-chores-crud
make test-e2e-chores-associations
make test-e2e-chores-instances
make test-e2e-chores-recurrence
make test-e2e-chores-expiration
make test-e2e-chores-archive
make test-e2e-chores-ui

# Run with UI (headed mode)
make test-e2e-chores-headed

# Generate HTML report
make test-e2e-report
```

### 3.3 CI Integration

Add to GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  run: make test-e2e-chores
  env:
    BASE_URL: http://api.dashy.local
```

---

## 4. Setup Instructions (Playwright)

### 4.1 Install Playwright

```bash
cd dashy-kiosk
make add-kiosk-dev PACKAGE=@playwright/test
make add-kiosk-dev PACKAGE=@playwright/experimental-ct-react  # Optional: component testing
npx playwright install chromium
```

### 4.2 Configure Playwright

Create `dashy-kiosk/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e/specs',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://api.dashy.local',
    headless: true,
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  reporter: [['html', { open: 'never' }]],
})
```

### 4.3 Add Makefile Targets

```makefile
.PHONY: test-e2e-chores test-e2e-chores-headed test-e2e-report

test-e2e-chores: ## Run chores E2E tests (headless)
	docker compose -f compose/docker-compose.dev.yml exec kiosk \
		npx playwright test e2e/specs/ --project=chromium

test-e2e-chores-headed: ## Run chores E2E tests (headed/UI mode)
	docker compose -f compose/docker-compose.dev.yml exec kiosk \
		npx playwright test e2e/specs/ --project=chromium --headed

test-e2e-report: ## Open Playwright HTML report
	docker compose -f compose/docker-compose.dev.yml exec kiosk \
		npx playwright show-report
```

---

## 5. Test Data Management

### 5.1 Fixtures

Create reusable test data factories:

```typescript
// e2e/fixtures/chores.fixture.ts
export async function createTestChore(page: Page, options: Partial<ChoreData> = {}) {
  const chore = {
    name: `Test Chore ${Date.now()}`,
    category_id: 'default-category-id',
    difficulty: 1,
    is_collaborative: false,
    expiration_behavior: 'disappear',
    ...options,
  }
  
  // API call or UI flow to create chore
  await page.request.post('/api/v1/chores/masters', { data: chore })
  return chore
}
```

### 5.2 Cleanup

Before each test suite:

```bash
make db-clean-chores  # Truncate chores tables
```

Or via API:

```typescript
await page.request.post('/api/v1/chores/debug/reset')  # If endpoint exists
```

---

## 6. Bug Fix Verification

After fixing each bug, run the corresponding test:

| Bug | Test IDs to Verify |
|-----|-------------------|
| #1 (Board refresh) | TC-001, TC-004, TC-010, TC-011, TC-014, TC-020, TC-021, TC-060 |
| #2 (Delete instance) | TC-023 |
| #3 (Undo start/complete) | TC-022 |
| #4 (Collaborative double-assign) | TC-013, TC-072 |
| #5 (Non-collaborative limit) | TC-012, TC-073 |
| #6 (Open pool Start button) | TC-024, TC-074 |
| #7 (Archive with active instances) | TC-051 |
| #8 (Permanent delete) | TC-053 |
| #9 (Timezone conversion) | TC-061 |
| #10 (Disappear behavior) | TC-040, TC-041 |
| #11 (Stay visible) | TC-042 |
| #12 (max_occurrences) | TC-016, TC-034 |
| #13 (Convert to open) | TC-043, TC-044 |

---

## 7. Future Enhancements

### 7.1 Visual Regression Testing

Add screenshot comparisons for:
- Chore card layout (different difficulty levels)
- Modal states (create, edit, manage)
- Board states (empty, full, archived)

```typescript
await expect(page.locator('.chore-card')).toHaveScreenshot('chore-card-default.png')
```

### 7.2 Performance Testing

Measure:
- Board load time with 50+ chores
- Modal open/close latency
- Action response time (claim, start, complete)

### 7.3 Accessibility Testing

Add axe-core integration:

```typescript
import { AxeBuilder } from '@axe-core/playwright'

const results = await new AxeBuilder({ page }).analyze()
expect(results.violations).toEqual([])
```

---

## 8. Maintenance

- **Update frequency:** After each major feature or bug fix
- **Owner:** Chores feature team
- **Review cadence:** Monthly (or after every 5+ bug fixes)
- **Deprecation:** Remove tests for deprecated features, add tests for new features

---

## Summary

| Category | Test Count | P0 | P1 | P2 | P3 |
|----------|-----------|----|----|----|----|
| Master Chore CRUD | 8 | 0 | 6 | 2 | 0 |
| Associations & Open Pool | 7 | 1 | 4 | 1 | 1 |
| Instance Lifecycle | 5 | 0 | 2 | 2 | 1 |
| Recurrence & Generation | 10 | 0 | 6 | 4 | 0 |
| Expiration Behavior | 5 | 0 | 1 | 4 | 0 |
| Archive & Delete | 7 | 0 | 2 | 5 | 0 |
| UI/UX & Display | 10 | 0 | 5 | 4 | 1 |
| Edge Cases & Errors | 11 | 1 | 2 | 8 | 0 |
| Full Flow (E2E) | 4 | 0 | 4 | 0 | 0 |
| **Total** | **67** | **2** | **32** | **30** | **3** |

**Estimated automation effort:** 3-4 days (setup + 67 tests)
**Estimated manual regression time:** ~75 minutes per full run

### 3.4 Bug Fix Verification Matrix

After fixing each bug, run the corresponding tests:

| Bug | Test IDs to Verify |
|-----|-------------------|
| #1 (Board refresh) | TC-001, TC-004, TC-010, TC-011, TC-014, TC-020, TC-021, TC-050, TC-052, TC-053, TC-054, TC-060, TC-078, TC-080, TC-090, TC-091 |
| #2 (Delete instance) | TC-023 |
| #3 (Undo start/complete) | TC-022 |
| #4 (Collaborative double-assign) | TC-013, TC-072, TC-092 |
| #5 (Non-collaborative limit) | TC-012, TC-073 |
| #6 (Open pool Start button) | TC-024, TC-074, TC-090 |
| #7 (Archive with active instances) | TC-051 |
| #8 (Permanent delete) | TC-056 |
| #9 (Timezone conversion) | TC-061, TC-069 |
| #10 (Disappear behavior) | TC-040, TC-041 |
| #11 (Stay visible) | TC-042 |
| #12 (max_occurrences) | TC-016, TC-034, TC-093 |
| #13 (Convert to open) | TC-043, TC-044 |
