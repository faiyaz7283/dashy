# Chores Bug Report — Manual Testing Findings

**Date:** 2026-08-28
**Reporter:** User (manual testing after Chores Frontend Rewire Phases 1-7)
**Status:** Open — awaiting full inspection before fixes

---

## Bug 1: Board Not Updating After Actions (Live Refresh)

**Severity:** High
**Category:** UX / Data Sync

**Description:**
After performing any action (assign, claim, add to open pool, start, complete), the success toast notification appears but the board does not update visually. A manual page refresh is required to see the changes.

**Expected:** Board should reflect changes immediately after action.
**Actual:** Board remains stale until page refresh.

**Likely Cause:** `refetch()` in `useChoreActions` may not be triggering a re-render, or the query cache is not being invalidated properly.

---

## Bug 2: No Way to Remove/Delete an Instance

**Severity:** Medium
**Category:** Missing Feature

**Description:**
Once an instance is created (via association), there is no UI to remove or delete it. If an instance was created by accident, the user has no way to undo it.

**Expected:** Ability to delete/remove an instance from the board.
**Actual:** No delete option exists on instance cards.

**Note:** Backend has `DELETE /instances/{id}` endpoint? Need to verify. If not, backend work needed first.

---

## Bug 3: No Way to Undo Start/Complete Actions

**Severity:** Medium
**Category:** Missing Feature

**Description:**
If a user accidentally clicks "Start" or "Complete" on an instance, there is no way to reverse the action. No "Undo" or status revert option exists.

**Expected:** Ability to revert instance status (e.g., completed → in_progress → active).
**Actual:** Status transitions are one-way with no undo.

**Design Decision Needed:** Should we allow status reversal? Or add an "Undo" toast action (5-second window)?

---

## Bug 4: Collaborative Chore Double-Assignment Not Prevented

**Severity:** High
**Category:** Logic / Enforcement

**Description:**
A collaborative chore can be assigned to the same member twice:
1. Via member column `+` → Claim/Assign
2. Via open pool `+` → Add to open pool → then Claim/Assign from open pool instance

Both succeed, creating two separate associations for the same member on the same master chore. No enforcement or warning.

**Expected:** System should detect and prevent duplicate member assignments for the same master chore.
**Actual:** Two associations created silently.

**Root Cause:** Each association has a different ID, so the backend's duplicate check (by member_id) may not catch cross-association duplicates. Frontend also doesn't check.

---

## Bug 5: Non-Collaborative Chore Allows Multiple Associations

**Severity:** Critical
**Category:** Backend Logic / Data Model

**Description:**
Steps to reproduce:
1. Create non-collaborative master chore
2. Add to open pool via open pool `+`
3. Click member column `+` → Claim the same chore → Success
4. Refresh → Open pool still shows, member column also shows
5. "Manage Current" → chore shows 2 associations

A non-collaborative chore should only allow ONE member association. The open pool association + member association violates this rule.

**Expected:** Non-collaborative master should reject second association (whether member or open pool).
**Actual:** Both associations created. Backend `_validate_association()` only checks non-open-pool associations against each other, not open-pool vs member.

**Root Cause:** Backend validation logic in `_validate_association()` — open pool associations are not counted when checking non-collaborative constraints.

---

## Bug 6: Open Pool Instance Shows Start Button (Non-Functional)

**Severity:** Medium
**Category:** UI / UX

**Description:**
Open pool instances display a "Start" button on the instance card. Clicking it does nothing (no actor assigned). The button should not be visible for unclaimed open pool instances.

**Expected:** Open pool instances show Claim/Assign actions, not Start/Complete.
**Actual:** Start button visible but non-functional.

---

## Bug 7: Archive Allows Active/In-Progress Instances

**Severity:** Medium
**Category:** Logic / Data Integrity

**Description:**
A collaborative chore can be archived even when it has:
- Member instance in `in_progress` status
- Member instance in `completed` status
- Open pool instance (active)

The archive succeeds without warning or automatic instance archival.

**Expected:** Either (a) prevent archiving with active instances, or (b) automatically archive all associated instances.
**Actual:** Master chore archived, instances remain in their current status (orphaned).

**Root Cause:** `bulk_update_master_status` only updates the master's status field. It does not touch associations or instances.

---

## Bug 8: No Permanent Delete Endpoint

**Severity:** Medium
**Category:** Backend Missing Feature

**Description:**
Frontend shows "Permanently delete chore?" confirmation dialog, but `DELETE /masters/{id}` is a soft-delete (sets `deleted_at`). There is no hard/permanent delete endpoint.

After archiving a chore, calling delete again just re-archives it (no-op). The chore disappears from the board because the frontend filters out archived masters, but the data remains in the database.

**Expected:** True permanent delete that removes master + associations + instances.
**Actual:** Only soft-delete exists. "Permanent delete" in UI is misleading.

**Root Cause:** Backend only implements soft-delete. No cascade delete for related records.

---

## Bug 9: Local Time Conversion Not Happening (UTC vs Local Timezone)

**Severity:** High
**Category:** Frontend / Backend — Timezone

**Description:**
A chore was created with `due_time` set to 3:57 AM. The instance card displays 11:57 PM — an 8-hour offset, indicating the backend is storing UTC but the frontend is not converting to local time (or vice versa).

**Expected:** Instance card shows 3:57 AM (local time).
**Actual:** Instance card shows 11:57 PM (raw UTC or wrong conversion).

**Likely Cause:** Backend stores `due_time` as a string (e.g., `"03:57"`) without timezone context. When combined with the instance's `period_start` date, the frontend may be treating it as UTC and converting to local, or the backend is converting to UTC before storing. Need to trace the full `due_time` flow: create → store → fetch → display.

**Impact:** Blocks testing of Bug 10 and Bug 11 (expiration behavior tests depend on correct time display).

---

## Bug 10: expiration_behavior "disappear" Not Working

**Severity:** High
**Category:** Backend Logic / Frontend UI

**Description:**
Two issues:
1. Created a chore with `expiration_behavior: "disappear"`, completed an instance, and the instance **remains** on the board instead of disappearing.
2. The edit modal has **no option to select "disappear"** as the expiration behavior. The UI only shows toggles for "Keep overdue instance visible" and "Keep missed instance visible". "Disappear" should be the default when neither toggle is active, but there's no way to explicitly set it.

**Expected:**
- After completing an instance with `disappear` behavior, the instance should be removed/hidden from the board.
- UI should either show "disappear" as a selectable option, or clearly indicate it's the default when both toggles are off.

**Actual:**
- Completed instance remains visible.
- No "disappear" option in the edit modal.

**Likely Cause:** Backend may not be enforcing `disappear` behavior on instance completion. Frontend may not be mapping the toggle state correctly to the `expiration_behavior` enum values (`disappear`, `stay_visible`, `convert_to_open`).

---

## Bug 11: expiration_behavior "stay_visible" — Cannot Test (Blocked by Bug 9)

**Severity:** Medium (blocked)
**Category:** Backend Logic

**Description:**
Intended test: Create chore with `expiration_behavior: "stay_visible"`, let the period pass, verify instance is marked as missed. Cannot test because Bug 9 (timezone conversion) means the displayed time is wrong, so we cannot reliably determine when a period has "passed."

**Expected:** Instance marked as missed after period expires.
**Actual:** Cannot verify — timezone bug blocks this test.

**Dependency:** Blocked by Bug 9 fix.

---

## Bug 12: max_occurrences Not Enforced on Association

**Severity:** High
**Category:** Backend Logic / Frontend UI

**Description:**
Created a chore with `max_occurrences: 3`. Verified that only 3 instances were generated (correct). However:
1. When claiming a 4th instance, the **success toast still appeared** — no error or warning that the max was reached.
2. After all 3 instances are claimed, the chore **still appears in the `+` icon dropdown** for new associations. It should be hidden/removed once max occurrences are exhausted.

**Expected:**
- Claiming beyond `max_occurrences` should fail with a clear error.
- Chores at max capacity should not appear in the association dropdown.

**Actual:**
- 4th claim shows success toast (no enforcement).
- Chore remains selectable in `+` dropdown after all slots filled.

**Likely Cause:** Backend validates instance generation count but does not validate association/claim count against `max_occurrences`. Frontend dropdown does not filter out chores that have reached their max.

---

## Bug 13: expiration_behavior "convert_to_open" Missing from Edit Modal

**Severity:** Medium
**Category:** Frontend UI

**Description:**
The edit modal has no option to set `expiration_behavior` to `"convert_to_open"`. The UI only exposes toggles that map to `disappear` and `stay_visible`. The `convert_to_open` behavior (move instance to open pool when period expires) is not accessible from the UI.

**Expected:** All three `expiration_behavior` values should be selectable: `disappear`, `stay_visible`, `convert_to_open`.
**Actual:** Only `disappear` (default) and `stay_visible` are accessible. `convert_to_open` is missing.

**Likely Cause:** Frontend edit modal only maps two toggle states to two enum values. The third value (`convert_to_open`) was never added to the UI.

---

## Question 1: Should Instances Be Editable?

**Category:** Design Decision

Currently only master chores are editable. Instances are created from master templates and associations. Should users be able to edit instance-level fields (e.g., change due_time for a specific occurrence, reassign without creating new association)?

**Options:**
- A) Instances are immutable — only master chore edits propagate
- B) Instances are editable for certain fields (reassign, due_time override)
- C) Instances can be deleted and recreated

---

## Question 2: Master Chore Edit Modal — Missing Fields

**Category:** Phase 4 Scope Clarification

The Phase 4 success criteria stated "All mutable fields are editable." The edit modal currently shows the same fields as create. However, the user expected to see instance-level fields (assigned_to, claimed_by, assigned_by) in the edit modal.

**Clarification:** Those are instance-level fields, not master chore fields. The master chore edit modal correctly shows all `UpdateMasterChoreRequest` fields:
- name, category_id, tag_ids, difficulty
- recurrence_rule, estimated_minutes
- due_time, due_date (once only)
- expiration_behavior, end_date, max_occurrences
- is_collaborative, status

Instance-level fields (claimed_by, assigned_to, assigned_by) are managed through instance actions (claim, assign), not the master edit modal.

**Action Needed:** Confirm this is the intended design, or add instance editing capability.

---

## Summary

| # | Bug | Severity | Scope |
|---|-----|----------|-------|
| 1 | Board not updating after actions | High | Frontend |
| 2 | No way to delete instance | Medium | Frontend + possibly Backend |
| 3 | No way to undo start/complete | Medium | Frontend + Backend |
| 4 | Collaborative double-assignment | High | Frontend + Backend |
| 5 | Non-collaborative allows 2 associations | Critical | Backend |
| 6 | Open pool shows non-functional Start button | Medium | Frontend |
| 7 | Archive allows active/in-progress instances | Medium | Backend |
| 8 | No permanent delete endpoint | Medium | Backend |
| 9 | Local time conversion not happening (UTC vs local) | High | Frontend + Backend |
| 10 | expiration_behavior "disappear" not working | High | Frontend + Backend |
| 11 | expiration_behavior "stay_visible" — blocked by Bug 9 | Medium (blocked) | Backend |
| 12 | max_occurrences not enforced on association | High | Frontend + Backend |
| 13 | expiration_behavior "convert_to_open" missing from UI | Medium | Frontend |

---

## Recommended Fix Order

1. **Bug 5** (Critical) — Backend validation fix for non-collaborative constraint
2. **Bug 9** (High) — Fix timezone conversion (blocks Bug 10, 11 testing)
3. **Bug 1** (High) — Fix live board refresh
4. **Bug 4** (High) — Prevent duplicate member assignments
5. **Bug 10** (High) — Fix "disappear" behavior + UI mapping
6. **Bug 12** (High) — Enforce max_occurrences on association + filter dropdown
7. **Bug 6** (Medium) — Hide Start button on open pool instances
8. **Bug 7** (Medium) — Archive should cascade to instances OR block with active instances
9. **Bug 8** (Medium) — Add permanent delete endpoint with cascade
10. **Bug 13** (Medium) — Add "convert_to_open" option to edit modal
11. **Bug 2** (Medium) — Add instance delete capability
12. **Bug 3** (Medium) — Add undo/revert for status transitions
13. **Bug 11** (Medium, blocked) — Test "stay_visible" after Bug 9 fix
