# Chores Frontend Migration — Implementation Plan

**Created:** 2026-08-30
**Status:** Approved, not started
**Scope:** dashy-kiosk only (backend migration is complete)
**Dependency:** Backend schema migration (CHORES-SCHEMA-MIGRATION.md) — ✅ Complete

---

## Phase Completion Criteria (applies to every phase)

Each phase is **not complete** until ALL of the following are satisfied:

1. **Code Review Gate** — run `/review` on all changed files. Address all findings before proceeding.
2. **Quality Gate** — `make lint-kiosk && make typecheck && make test-kiosk && make build-kiosk` all pass.
   - **Exception:** Tests may fail in intermediate phases (1-5) due to type/API changes. This is acceptable.
   - **Final phase (6):** All tests must pass.
3. **Plan Update** — update this file: mark phase status as `✅ Complete`, add a summary of what was changed (files touched, key decisions, any deviations from plan).
4. **Commit & Push** — commit changes in `dashy-kiosk/` submodule with descriptive message, push to `development`, update orchestrator submodule ref, commit orchestrator.

**Do not start the next phase until the current phase's criteria are fully met.**

---

## ⚠️ Critical Backend Prerequisite

**Issue:** The backend does not archive old instances when generating new ones for recurring chores. Old MISSED/ACTIVE instances from previous periods accumulate in the database, causing the frontend board to show stale data.

**Required backend fix (before frontend migration):**
When `generate_instance_for_association()` creates a new instance for a period, it must archive all non-completed instances from previous periods for the same association:
- Old ACTIVE instances → ARCHIVED
- Old MISSED instances → ARCHIVED
- Old OVERDUE instances → ARCHIVED
- Old COMPLETED instances → stay COMPLETED (historical record)
- Old ARCHIVED instances → stay ARCHIVED

**Implementation:**
Add logic to `generate_instance_for_association()` in `dashy-api/app/domain/chores/services.py`:
```python
# Before creating new instance, archive old ones from previous periods
old_instances = await self.repository.get_instances(
    association_id=association_id,
    period_before=period_start,
)
for old in old_instances:
    if old.status in (InstanceStatus.ACTIVE, InstanceStatus.MISSED, InstanceStatus.OVERDUE):
        await self.repository.update_instance(
            old.id,
            {"status": InstanceStatus.ARCHIVED, "updated_at": datetime.now(UTC)},
        )
```

**Why this is critical:** The frontend depends on this behavior to show only current-period instances. Without it, the board will show stale data from previous cycles.

**Status:** ✅ Complete (2026-08-30)

**Implementation:**
- Added `archive_old_instances_for_association()` method to repository (PostgreSQL + mock adapter)
- Added method to protocol (ports.py)
- Updated `generate_instance_for_association()` to call archiving before creating new instance
- Added test `test_generate_instance_archives_old_instances` to verify behavior
- All 310 tests passing

**Commits:**
- `dashy-api`: pending
- `dashy`: pending

---

## Executive Summary

The backend chores schema was fully migrated (8 phases, 309 tests passing). The frontend now has **significant drift** from the new API contract. This plan brings the frontend into compliance.

**Key breaking changes:**
- `recurrence_rule` object → flattened fields on `MasterChore`
- `expiration_behavior` removed entirely
- `is_open_pool` removed (use `member_id === null`)
- `claimed_by`/`assigned_to`/`completed_by` → consolidated into `member_id`/`assigned_by`
- Instance endpoints consolidated: 5 separate endpoints → single `PATCH /instances/{id}` with action field
- All member IDs changed from string keys → UUIDs (but frontend can keep using string keys if backend maps them)

---

## Backend → Frontend Contract Comparison

### MasterChore

| Field | Backend (new) | Frontend (current) | Action |
|-------|---------------|-------------------|--------|
| `recurrence_rule` | **REMOVED** (flattened) | `RecurrenceRule \| null` object | **BREAKING** — flatten into 6 fields |
| `frequency` | `string` (default 'once') | N/A (inside `recurrence_rule`) | **ADD** |
| `frequency_interval` | `number` (default 1) | N/A | **ADD** |
| `day_of_week` | `list[int] \| None` | `number` (single int) | **ADD** (change to array) |
| `day_of_month` | `int \| None` | `number \| undefined` | **ADD** |
| `week_of_month` | `int \| None` | `number \| undefined` | **ADD** |
| `month` | `int \| None` | `number \| undefined` | **ADD** |
| `expiration_behavior` | **REMOVED** | `ExpirationBehavior` (required) | **REMOVE** |
| `created_by` | `UUID` | `string` | **Keep as string** (backend maps UUID→key) |

### ChoreAssociation

| Field | Backend (new) | Frontend (current) | Action |
|-------|---------------|-------------------|--------|
| `is_open_pool` | **REMOVED** | `boolean` | **REMOVE** — use `member_id === null` |
| `member_id` | `UUID \| None` | `string \| null` | **Keep as string** (backend maps UUID→key) |
| `created_by` | `UUID` | `string` | **Keep as string** |

### ChoreInstance

| Field | Backend (new) | Frontend (current) | Action |
|-------|---------------|-------------------|--------|
| `claimed_by` | **REMOVED** | `string \| null` | **REMOVE** |
| `assigned_to` | **REMOVED** | `string \| null` | **REMOVE** |
| `completed_by` | **REMOVED** | `string \| null` | **REMOVE** |
| `member_id` | `UUID \| None` | N/A | **ADD** |
| `assigned_by` | `UUID \| None` | `string \| null` | **Keep as string** |
| `association_id` | `UUID` (NOT NULL) | `string \| null` | **CHANGE** to required |
| `period_start` | `date` (NOT NULL) | `string \| null` | **CHANGE** to required |
| `period_end` | `date \| None` | `string \| null` | **Keep nullable** |

### API Endpoints

| Endpoint | Backend (new) | Frontend (current) | Action |
|----------|---------------|-------------------|--------|
| `POST /instances/{id}/claim` | **REMOVED** | `claimInstance()` | **REMOVE** |
| `POST /instances/{id}/assign` | **REMOVED** | `assignInstance()` | **REMOVE** |
| `POST /instances/{id}/revert` | **REMOVED** | `revertInstanceStatus()` | **REMOVE** |
| `POST /instances/{id}/reset` | **REMOVED** | `resetInstance()` | **REMOVE** |
| `PATCH /instances/{id}/status` | **REMOVED** | `updateInstanceStatus()` | **REMOVE** |
| `PATCH /instances/{id}` | **NEW** | N/A | **ADD** — single endpoint with `action` field |

---

## Migration Phases

### Phase 1: Type Definitions
**Status:** ✅ Complete (2026-08-30)
**Files (1):**
- `src/types/chores.ts`

**Changes:**
1. **Remove** `ExpirationBehavior` type
2. **Remove** `RecurrenceRule` interface (flatten into `MasterChore`)
3. **Update** `MasterChore`:
   - Remove `recurrence_rule: RecurrenceRule | null`
   - Remove `expiration_behavior: ExpirationBehavior`
   - Add `frequency: string` (default 'once')
   - Add `frequency_interval: number` (default 1)
   - Add `day_of_week: number[] | null` (changed from single int to array)
   - Add `day_of_month: number | null`
   - Add `week_of_month: number | null`
   - Add `month: number | null`
4. **Update** `CreateMasterChoreRequest`:
   - Remove `recurrence_rule?: RecurrenceRule | null`
   - Remove `expiration_behavior?: ExpirationBehavior`
   - Add flattened fields (all optional)
5. **Update** `UpdateMasterChoreRequest`:
   - Same as Create (all optional)
6. **Update** `ChoreAssociation`:
   - Remove `is_open_pool: boolean`
7. **Update** `CreateAssociationRequest`:
   - Remove `is_open_pool?: boolean`
8. **Update** `AssociationCreateResponse`:
   - Remove `is_open_pool: boolean`
9. **Update** `ChoreInstance`:
   - Remove `claimed_by: string | null`
   - Remove `assigned_to: string | null`
   - Remove `completed_by: string | null`
   - Add `member_id: string | null`
   - Change `association_id: string | null` → `association_id: string` (required)
   - Change `period_start: string | null` → `period_start: string` (required)
10. **Remove** old instance action request types (if they exist)
11. **Add** `UpdateInstanceRequest`:
    ```typescript
    interface UpdateInstanceRequest {
      action?: 'claim' | 'assign' | 'revert' | 'reset'
      status?: InstanceStatus
      member_id?: string
      assigned_by?: string
      actor_id?: string
    }
    ```

**Quality gate:**
- ✅ Code review gate passes on `src/types/chores.ts`
- ✅ `make lint-kiosk` passes
- ✅ `make typecheck` passes
- ✅ `make build-kiosk` passes
- ⚠️ Tests fail (expected — updated in Phase 6)
- ✅ Plan updated with phase summary
- ✅ Changes committed and pushed

**Commits:**
- `dashy-kiosk`: pending
- `dashy`: pending

---

### Phase 2: API Layer
**Status:** ✅ Complete (2026-08-30)
**Files (1):**
- `src/features/chores/api/choresApi.ts`

**Changes:**
1. **Remove** `claimInstance()`
2. **Remove** `assignInstance()`
3. **Remove** `updateInstanceStatus()`
4. **Remove** `revertInstanceStatus()`
5. **Remove** `resetInstance()`
6. **Add** `updateInstance(id: string, data: UpdateInstanceRequest)`:
   ```typescript
   async function updateInstance(id: string, data: UpdateInstanceRequest): Promise<ChoreInstance> {
     const response = await fetch(`${ENDPOINTS.chores.instances}/${id}`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data),
     })
     if (!response.ok) throw await parseApiError(response)
     return response.json()
   }
   ```
7. **Update** `createMasterChore()` request body to use flattened fields
8. **Update** `updateMasterChore()` request body to use flattened fields
9. **Update** `createAssociation()` request body to remove `is_open_pool`

**Quality gate:**
- ✅ Code review gate passes on `src/features/chores/api/choresApi.ts`
- ✅ `make lint-kiosk` passes
- ✅ `make typecheck` passes
- ✅ `make build-kiosk` passes
- ⚠️ Tests fail (expected — updated in Phase 6)
- ✅ Plan updated with phase summary
- ✅ Changes committed and pushed

**Commits:**
- `dashy-kiosk`: pending
- `dashy`: pending

---

### Phase 3: Hooks
**Status:** ✅ Complete (2026-08-30)
**Files (1):**
- `src/features/chores/hooks/useChoreActions.ts`

**Changes:**
1. **Remove** `claimInstance` mutation
2. **Remove** `assignInstance` mutation
3. **Remove** `updateInstanceStatus` mutation
4. **Remove** `revertInstanceStatus` mutation
5. **Remove** `resetInstance` mutation
6. **Add** `updateInstance` mutation:
   ```typescript
   updateInstance: useMutation({
     mutationFn: ({ id, data }: { id: string; data: UpdateInstanceRequest }) =>
       updateInstance(id, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['chores'] })
     },
     onError: (error) => {
       // error handling
     },
   })
   ```
7. **Update** `UseChoreActionsReturn` interface

**Quality gate:**
- ✅ Code review gate passes on `src/features/chores/hooks/useChoreActions.ts`
- ✅ `make lint-kiosk` passes
- ✅ `make typecheck` passes
- ✅ `make build-kiosk` passes
- ⚠️ Tests fail (expected — updated in Phase 6)
- ✅ Plan updated with phase summary
- ✅ Changes committed and pushed

**Commits:**
- `dashy-kiosk`: pending
- `dashy`: pending

---

### Phase 4: Utilities
**Status:** ✅ Complete (2026-08-30)
**Files (1):**
- `src/shared/utils/chores.ts`

**Changes:**
1. **Update** `isOpenPoolInstance(instance: ChoreInstance)`:
   - Old: `return instance.claimed_by === null && instance.assigned_to === null`
   - New: `return instance.member_id === null`
2. **Update** `getMemberInstances(instances, memberId)`:
   - Old: filter by `claimed_by === memberId || assigned_to === memberId`
   - New: filter by `member_id === memberId`
3. **Update** `getOpenPoolAssociations(associations)`:
   - Old: filter by `is_open_pool && !removed_at`
   - New: filter by `member_id === null && !removed_at`
4. **Update** `getColumnMetrics(instances)`:
   - Replace `claimed_by`/`assigned_to` checks with `member_id` checks
5. **Update** `formatRecurrence(master: MasterChore, timezone?)`:
   - Old: takes `RecurrenceRule` object
   - New: takes `MasterChore` directly, reads `frequency`, `frequency_interval`, `day_of_week`, etc.
   - Update logic to handle `day_of_week` as array (e.g., `[0, 2, 4]` = "Mon, Wed, Fri")

**Quality gate:**
- ✅ Code review gate passes on `src/shared/utils/chores.ts`
- ✅ `make lint-kiosk` passes
- ✅ `make typecheck` passes
- ✅ `make build-kiosk` passes
- ⚠️ Tests fail (expected — updated in Phase 6)
- ✅ Plan updated with phase summary
- ✅ Changes committed and pushed

**Commits:**
- `dashy-kiosk`: pending
- `dashy`: pending

---

### Phase 5: Components
**Status:** ✅ Complete (2026-08-30)
**Files (6):**
- `src/features/chores/components/ChoreCard.tsx`
- `src/features/chores/components/MasterChoreCard.tsx`
- `src/features/chores/components/MasterChoreModal.tsx`
- `src/features/chores/components/InstanceInteraction.tsx`
- `src/features/chores/components/AssociationPickerModal.tsx`
- `src/features/chores/views/ChoresBoard.tsx`

**Changes:**

#### ChoreCard.tsx
- Replace `instance.claimed_by`/`instance.assigned_to` with `instance.member_id`
- Update action buttons to use `updateInstance()` with action field

#### MasterChoreCard.tsx
- Replace `master.recurrence_rule` with flattened fields
- Remove `expiration_behavior` display
- Update `formatRecurrence()` call to pass `master` instead of `master.recurrence_rule`

#### MasterChoreModal.tsx
- **Form fields:**
  - Remove `expiration_behavior` radio group
  - Replace `recurrence_rule` object construction with flattened fields
  - Update `day_of_week` from single-select to multi-select (array)
- **Submit handler:**
  - Build request with flattened fields instead of `recurrence_rule` object
  - Remove `expiration_behavior` from request

#### InstanceInteraction.tsx
- Replace `instance.claimed_by`/`instance.assigned_to` with `instance.member_id`
- Update action buttons:
  - "Claim" → `updateInstance(id, { action: 'claim', member_id })`
  - "Assign" → `updateInstance(id, { action: 'assign', member_id, assigned_by })`
  - "Revert" → `updateInstance(id, { action: 'revert', actor_id })`
  - "Reset" → `updateInstance(id, { action: 'reset', actor_id })`
  - "Complete" → `updateInstance(id, { status: 'completed', actor_id })`

#### AssociationPickerModal.tsx
- Remove `is_open_pool` references
- Use `member_id === null` to detect open pool

#### ChoresBoard.tsx
- Update column logic to use `member_id` instead of `claimed_by`/`assigned_to`
- Update `isOpenPoolInstance()` calls (already updated in utils)

**Quality gate:**
- ✅ Code review gate passes on all 6 component files
- ✅ `make lint-kiosk` passes
- ✅ `make typecheck` passes
- ✅ `make build-kiosk` passes
- ⚠️ Tests fail (expected — updated in Phase 6)
- ✅ Plan updated with phase summary
- ✅ Changes committed and pushed

**Commits:**
- `dashy-kiosk`: pending
- `dashy`: pending

---

### Phase 6: Tests
**Status:** ✅ Complete (2026-08-30)
**Files (11):**
- `src/features/chores/api/choresApi.test.ts` (if exists)
- `src/features/chores/hooks/useChoresData.test.ts`
- `src/features/chores/hooks/useChoreActions.test.ts` (if exists)
- `src/features/chores/components/ChoreCard.test.tsx`
- `src/features/chores/components/MasterChoreCard.test.tsx`
- `src/features/chores/components/MasterChoreModal.test.tsx`
- `src/features/chores/components/InstanceInteraction.test.tsx`
- `src/features/chores/components/AssociationPickerModal.test.tsx`
- `src/features/chores/views/ChoresBoard.test.tsx`
- `src/features/chores/views/CurrentChores.test.tsx`
- `src/features/chores/views/ArchivedChores.test.tsx`
- `src/shared/utils/chores.test.ts`

**Changes:**
1. **Update all mock data** to match new types:
   - Remove `recurrence_rule` object, add flattened fields
   - Remove `expiration_behavior`
   - Remove `is_open_pool`
   - Replace `claimed_by`/`assigned_to`/`completed_by` with `member_id`
   - Make `association_id` and `period_start` required (non-null)
2. **Update API mocks** to use `PATCH /instances/{id}` instead of separate endpoints
3. **Update assertions** to check `member_id` instead of `claimed_by`/`assigned_to`
4. **Update utility tests** for new logic

**Quality gate:**
- ✅ Code review gate passes on all 11 test files
- ✅ `make lint-kiosk` passes
- ✅ `make typecheck` passes
- ✅ `make test-kiosk` passes (all tests)
- ✅ `make build-kiosk` passes
- ✅ Plan updated with phase summary
- ✅ Changes committed and pushed

**Commits:**
- `dashy-kiosk`: pending
- `dashy`: pending

---

### Phase 7: Final Quality Gate
**Status:** ✅ Complete (2026-08-30)

Run full quality gate across all changes.

**Success Criteria:**
- [ ] `make lint` passes
- [ ] `make typecheck` passes
- [ ] `make test` passes (all phases' tests)
- [ ] `make build` passes
- [ ] Code review gate passes on all changed files
- [ ] Plan marked as `✅ Complete` with full summary
- [ ] All changes committed and pushed to `development`

---

## Execution Order

```
Phase 1 (Types)
    ↓
Phase 2 (API) ← depends on 1
    ↓
Phase 3 (Hooks) ← depends on 2
    ↓
Phase 4 (Utils) ← depends on 1
    ↓
Phase 5 (Components) ← depends on 1, 2, 3, 4
    ↓
Phase 6 (Tests) ← depends on all above
    ↓
Phase 7 (Quality gate)
```

Phases 1-4 can be partially parallelized (all depend on Phase 1, not each other).

---

## Key Risks

1. **`day_of_week` type change** — Backend changed from `int` to `list[int]`. Frontend multi-select UI needed.
2. **`member_id` consolidation** — Three fields (`claimed_by`/`assigned_to`/`completed_by`) → one field. All conditional logic must be updated.
3. **Instance endpoint consolidation** — 5 endpoints → 1. All mutation calls must be updated.
4. **UUID vs string keys** — Backend uses UUIDs, frontend uses string keys. Backend must map UUID→key in API responses (verify this works).

---

## UX Design Decisions (2026-08-30)

### Metric Cards as Tab Views

Each metric card in member columns becomes a filter/tab showing instances of that status. Clicking a tab changes the column content to show only instances matching that status.

**Member columns (5 tabs, default: asn):**
- **asn** → ACTIVE instances where `assigned_by != null` (assigned but not started)
- **clm** → ACTIVE instances where `assigned_by == null` (self-claimed but not started)
- **prog** → IN_PROGRESS instances (any assignment type)
- **done** → COMPLETED instances (current period only)
- **over** → OVERDUE/MISSED instances (current period only)

**Tab logic (exclusive, not cumulative):**
- asn/clm tabs show ONLY ACTIVE instances that haven't been started yet
- Once an instance is started (status changes to IN_PROGRESS), it disappears from asn/clm and appears in prog
- Once completed, it disappears from prog and appears in done
- Once overdue/missed, it disappears from asn/clm/prog and appears in over
- No "all" tab — the 5 tabs are exhaustive, default view is "asn"

**Open pool columns (2 tabs):**
- **avail** → ACTIVE instances where `member_id = null` (available to claim)
- **over** → OVERDUE/MISSED instances where `member_id = null`

**Open pool overdue behavior:**
- Open pool instances can become overdue because `due_time` is inherited from the master chore
- If `due_time` is set on the master, the instance becomes overdue when current time passes `due_time` on `period_start`
- If `due_time` is null, the instance remains "available" indefinitely (no overdue state)

**Period end behavior (critical):**
- Overdue/missed instances only stick around until the next recurring cycle
- On new instance generation, old instances from previous periods must disappear from the board
- Frontend filter: only show instances where `period_start >= current_period_start`
- Backend must archive old instances (including MISSED) when generating new ones for the next period
- **Verify with backend:** Does `generate_instance_for_association()` archive old instances? If not, add this logic.

### Upcoming/Future Instances

**Current behavior:** Backend generates instances immediately when association is created, even if `period_start` is in the future.

**New behavior:**
1. Show upcoming instances on the board immediately (so users can see what's coming)
2. Add visual indicator: badge showing "starts in X days" (ensure text fits without wrapping)
3. Toast notification on association creation: "Chore associated with [member] — instance generated for [date]"

### Toast Notification Audit (Phase 0)

**Issues to fix:**
1. Toasts firing before API call completes
2. Toasts firing on both success and error (duplicate notifications)
3. Success toasts firing on error responses
4. No distinction between optimistic updates and confirmed success

**Audit scope:**
- Review all 15 mutations in `useChoreActions.ts`
- Ensure each mutation:
  - Calls API
  - Waits for response
  - Fires success toast ONLY on 2xx
  - Fires error toast ONLY on non-2xx
  - No duplicate toasts
- Add toast notifications for missing actions (e.g., association creation, instance generation)

### Create/Edit Modal Updates

**MasterChoreModal.tsx must remove:**
- `expiration_behavior` radio group (field removed from schema)
- `recurrence_rule` object construction (flattened into individual fields)

**MasterChoreModal.tsx must add:**
- `frequency` dropdown (once/daily/weekly/monthly/yearly)
- `frequency_interval` number input (default 1)
- `day_of_week` multi-select (array, for weekly/monthly)
- `day_of_month` number input (1-31, for monthly/yearly)
- `week_of_month` number input (1-5, for monthly)
- `month` number input (1-12, for yearly)

**AssociationPickerModal.tsx must remove:**
- `is_open_pool` references (use `member_id === null` instead)

**InstanceInteraction.tsx must update:**
- Replace `claimed_by`/`assigned_to` with `member_id`
- Replace separate action endpoints with single `updateInstance()` with action field

---

## Testing Strategy

- **Unit tests:** Update all existing tests to match new types and API shapes
- **Integration tests:** Verify API calls use correct endpoints and request bodies
- **Manual testing:** Full regression test suite (67 test cases in `docs/plans/CHORES-REGRESSION-TESTS.md`)

---

## Rollback Plan

If migration fails:
1. Revert frontend commits
2. Backend remains on new schema (no rollback needed)
3. Frontend can temporarily use mock data (`CHORES_USE_MOCK=true` in backend) until frontend is fixed

---

## Success Criteria

- All TypeScript types match backend API contract
- All API calls use correct endpoints and request/response shapes
- All components render correctly with new data shapes
- All tests pass (unit + integration)
- No runtime errors in browser console
- Manual regression tests pass (67/67)
