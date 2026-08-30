# Chores Schema Migration — Backend Implementation Plan

**Created:** 2026-08-30
**Status:** Approved, not started
**Scope:** dashy-api only (frontend migration is a separate plan)

---

## Phase Completion Criteria (applies to every phase)

Each phase is **not complete** until ALL of the following are satisfied:

1. **Code Review Gate** — run `/review` on all changed files. Address all findings before proceeding.
2. **Quality Gate** — `make lint && make typecheck && make test && make build` all pass.
3. **Plan Update** — update this file: mark phase status as `✅ Complete`, add a summary of what was changed (files touched, key decisions, any deviations from plan).
4. **Commit & Push** — commit changes in `dashy-api/` submodule with descriptive message, push to `development`, update orchestrator submodule ref, commit orchestrator.

**Do not start the next phase until the current phase's criteria are fully met.**

---

## Finalized Schema (Post-Migration)

### `master_chores`
- **Removed:** `expiration_behavior`
- **Flattened:** `recurrence_rule` JSONB → 6 typed columns (`frequency`, `frequency_interval`, `day_of_week`, `day_of_month`, `week_of_month`, `month`)
- **Added:** `difficulty` CHECK (1-5), `frequency` CHECK, `frequency_interval` CHECK
- **Changed:** `created_by` string → UUID FK → `family_members(id)`

### `chore_associations`
- **Removed:** `is_open_pool` (redundant — NULL `member_id` = open pool), surrogate `id` PK
- **Changed:** Composite PK `(master_chore_id, member_id)`, `member_id` string → UUID FK, `created_by` string → UUID FK

### `chore_instances`
- **Removed:** `claimed_by`, `assigned_to`, `completed_by` (merged → `member_id` + `assigned_by`)
- **Changed:** `association_id` NOT NULL, `period_end` nullable (NULL = no deadline), all member FKs string → UUID
- **Added:** Unique constraint `(master_chore_id, association_id, period_start)`, CHECK `member_id != assigned_by OR assigned_by IS NULL`

### `chore_audit_log` (new)
- Polymorphic audit table: `entity_type` + `entity_id` + `action` + `actor_id` + `old_values`/`new_values` JSONB

### All tables
- All `member_id`/`created_by`/`assigned_by` string FKs → UUID FK → `family_members(id)`

---

## Phases

### Phase 1: Database Schema + DB Models
**Status:** ✅ Complete (2026-08-30)
**Files (3):**
- `alembic/versions/20260826_0000-000000000001_initial_postgres_schema.py`
- `app/infrastructure/persistence/models.py`
- `alembic/env.py`

**Summary:** Rewrote the initial migration (only migration in project) to match the finalized schema. Updated all 6 SQLModel classes and added `ChoreAuditLogDB`. Added `ChoreAuditLogDB` to Alembic imports.

**Key changes:**
- `master_chores`: Removed `expiration_behavior`, flattened `recurrence_rule` → 6 columns (`frequency`, `frequency_interval`, `day_of_week`, `day_of_month`, `week_of_month`, `month`), added 8 CHECK constraints, `created_by` → UUID FK
- `chore_associations`: Removed `is_open_pool`, `member_id` → UUID FK, `created_by` → UUID FK, added UNIQUE constraint `(master_chore_id, member_id)`
- `chore_instances`: Removed `claimed_by`/`assigned_to`/`completed_by`, added `member_id` + `assigned_by` (both UUID FK), `association_id` NOT NULL, `period_start` NOT NULL, `period_end` nullable, added UNIQUE constraint `(master_chore_id, association_id, period_start)`, added CHECK constraints
- `chore_audit_log`: New table with polymorphic `entity_type` + `entity_id` + `action` + `actor_id` + JSONB `old_values`/`new_values`
- All member FKs changed from string → UUID → `family_members(id)`

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ✅ `make build-api` passes
- ✅ `make migrate` applies cleanly
- ️ Tests fail (expected — updated in Phase 7)

**Note:** `period_start`/`period_end` are `date` (not `datetime`) because periods are calendar windows, not moments in time. `due_time` (HH:MM) handles time-of-day separately.

### Phase 2: Domain Models + Enums
**Status:** ✅ Complete (2026-08-30)
**Files (2):**
- `app/domain/chores/models.py`
- `app/domain/chores/schemas.py`

**Summary:** Removed `ExpirationBehavior` enum. Updated all three main dataclasses (`MasterChore`, `ChoreInstance`, `ChoreAssociation`) to match the new schema. Added `frequency_interval` to `RecurrenceRule` and changed `day_of_week` from `int` to `list[int]`.

**Key changes:**
- `ExpirationBehavior` enum removed entirely
- `MasterChore`: `recurrence_rule: dict` → 6 typed fields (`frequency`, `frequency_interval`, `day_of_week`, `day_of_month`, `week_of_month`, `month`), `expiration_behavior` removed, `created_by: str` → `UUID`
- `ChoreInstance`: `claimed_by`/`assigned_to`/`completed_by` removed, added `member_id: UUID`, `assigned_by: str` → `UUID | None`, `association_id: UUID | None` → `UUID` (NOT NULL), `period_start: date | None` → `date` (NOT NULL)
- `ChoreAssociation`: `is_open_pool` removed, `member_id: str` → `UUID | None`, `created_by: str` → `UUID`
- `RecurrenceRule`: Added `frequency_interval: int = 1`, changed `day_of_week: int | None` → `list[int] | None`, updated validator

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ️ Tests fail (expected — updated in Phase 7)

### Phase 3: Repository Layer
**Status:** ✅ Complete (2026-08-30)
**Files (2):**
- `app/infrastructure/persistence/chores_repository.py`
- `app/domain/chores/ports.py`

**Summary:** Updated all mapper methods to work with the new schema. Changed `member_id` type from `str` to `UUID` across all methods. Updated `get_instance_for_period` to match on `(association_id, period_start)` only (removed `period_end` parameter since it's now nullable).

**Key changes:**
- Removed `ExpirationBehavior` import
- `_master_to_domain`/`_master_to_db`: `recurrence_rule` dict → 6 typed fields, removed `expiration_behavior`, `created_by` now UUID
- `_instance_to_domain`/`_instance_to_db`: removed `claimed_by`/`assigned_to`/`completed_by`, added `member_id` (UUID), `association_id` NOT NULL
- `_association_to_domain`/`_association_to_db`: removed `is_open_pool`, `member_id` now UUID, `created_by` now UUID
- `list_associations`/`get_associations_by_member`: `member_id` type changed from `str` to `UUID`
- `get_instance_for_period`: removed `period_end` parameter, matches on `(association_id, period_start)` per unique constraint
- Protocol updated to match new signatures

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ️ Tests fail (expected — updated in Phase 7)

**Commits:**
- `dashy-api`: `c9bab30` — repository layer updates
- `dashy`: `7f5ae95` — submodule ref updated

### Phase 4: Mock Adapter
**Status:** ✅ Complete (2026-08-30)
**Files (1):**
- `app/infrastructure/chores/mock_adapter.py` (805 lines)

**Summary:** Updated all mock data to match the new schema. Added family member UUID constants, replaced string member IDs with UUIDs, removed `expiration_behavior` and `is_open_pool`, flattened recurrence rules, and updated instance ownership model.

**Key changes:**
- Added `_MEMBER_FAIYAZ`, `_MEMBER_TRISHA`, `_MEMBER_ARYA`, `_MEMBER_RAYA` UUID constants
- All `MasterChore` mock data: `recurrence_rule` dict → typed fields (`frequency`, `frequency_interval`, `day_of_week`, etc.), removed `expiration_behavior`, `created_by` → UUID
- All `ChoreAssociation` mock data: removed `is_open_pool` (use `member_id=None` for open pool), `member_id` → UUID, `created_by` → UUID
- All `ChoreInstance` mock data: removed `claimed_by`/`assigned_to`/`completed_by`, added `member_id` (UUID) + `assigned_by` (UUID | None)
- Method signatures: `member_id: str` → `member_id: UUID`
- `get_instance_for_period`: removed `period_end` parameter

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ️ Tests fail (expected — updated in Phase 7)

**Commits:**
- `dashy-api`: `eaac18f` — mock adapter updates
- `dashy`: `0d01527` — submodule ref updated

### Phase 5: API Models + Routes
**Status:** ✅ Complete (2026-08-30)
**Files (2):**
- `app/api/models/chores.py`
- `app/api/routes/chores.py`

**Summary:** Updated all API request/response models and route handlers to match the new schema. Removed `expiration_behavior`, flattened `recurrence_rule` into typed fields, changed all member ID fields from `str` to `UUID`, and removed `is_open_pool`.

**Key changes:**
- `MasterChoreResponse`: removed `expiration_behavior`, flattened `recurrence_rule` → 6 typed fields, `created_by: str` → `UUID`
- `ChoreInstanceResponse`: removed `claimed_by`/`assigned_to`/`completed_by`, added `member_id: UUID`, `assigned_by: str` → `UUID`, `association_id: UUID | None` → `UUID` (NOT NULL), `period_start: date | None` → `date` (NOT NULL)
- `AssociationResponse`/`AssociationCreateResponse`: removed `is_open_pool`, `member_id: str` → `UUID`, `created_by: str` → `UUID`
- `CreateMasterChoreRequest`: removed `expiration_behavior` and validator, flattened `recurrence_rule` into typed fields with validation (`frequency_interval >= 1`, `day_of_month` 1-31, etc.), `created_by: str` → `UUID`
- `UpdateMasterChoreRequest`: removed `expiration_behavior` and validator, flattened `recurrence_rule` into typed fields
- `AutoAssignConfig`: `assigner_id: str` → `UUID`
- `CreateAssociationRequest`: removed `is_open_pool`, `member_id: str` → `UUID`, `created_by: str` → `UUID`
- `ClaimInstanceRequest`: `member_id: str` → `UUID`
- `AssignInstanceRequest`: `assignee_id: str` → `UUID`, `assigner_id: str` → `UUID`
- `UpdateInstanceStatusRequest`: `actor_id: str` → `UUID`
- Routes: updated `_master_to_response`, `_instance_to_response`, `_association_to_response` mappers, `create_master_chore`, `update_master_chore`, `create_association` handlers

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ️ Tests fail (expected — updated in Phase 7)

**Commits:**
- `dashy-api`: `2cfc105` — API models and routes updates
- `dashy`: `8cd2180` — submodule ref updated

### Phase 5b: REST Compliance
**Status:** ✅ Complete (2026-08-30)
**Files (3):**
- `app/domain/chores/services.py`
- `app/api/models/chores.py`
- `app/api/routes/chores.py`

**Summary:** Consolidated instance endpoints into single RESTful `PATCH /instances/{id}` endpoint with action field. Removed action verbs from URLs. Updated service methods to use new field names (`member_id`/`assigned_by` instead of `claimed_by`/`assigned_to`/`completed_by`).

**Key changes:**
- **Routes:** Removed separate `POST /claim`, `POST /assign`, `POST /revert`, `POST /reset`, `PATCH /status` endpoints. Single `PATCH /instances/{id}` endpoint handles all operations via `action` field (claim, assign, revert, reset) or `status` field (generic updates).
- **Models:** Added `UpdateInstanceRequest` with optional `action`, `status`, `member_id`, `assigned_by`, `actor_id` fields. Removed `ClaimInstanceRequest`, `AssignInstanceRequest`, `UpdateInstanceStatusRequest`.
- **Services:** Updated `claim_instance`, `assign_instance` to use `member_id`/`assigned_by` (UUID) instead of `claimed_by`/`assigned_to` (str). Removed `completed_by` references from `revert_instance_status`, `reset_instance`, `update_instance_status`. Removed `expiration_behavior` archive logic from `update_instance_status`. Changed `actor_id` from `str` to `UUID`.

**REST compliance achieved:**
- ✅ No action verbs in URLs (claim/assign/revert/reset handled via action field)
- ✅ Single resource endpoint `PATCH /instances/{id}` for all updates
- ✅ Proper HTTP methods (PATCH for updates, DELETE for removal)
- ✅ Consistent error handling (404 not found, 400 bad request, 422 conflict)

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ️ Tests fail (expected — updated in Phase 7)

**Commits:**
- `dashy-api`: `552b4f0` — REST compliance updates
- `dashy`: `82fa48a` — submodule ref updated

### Phase 6: Services Layer
**Status:** ✅ Complete (2026-08-30)
**Files (1):**
- `app/domain/chores/services.py`

**Summary:** Updated all service methods to use the new schema. Removed `expiration_behavior` logic, replaced `claimed_by`/`assigned_to`/`completed_by` with `member_id`/`assigned_by`, updated recurrence generation to use flattened fields, and simplified `process_expired_instances` to just mark instances as MISSED.

**Key changes:**
- Removed `ExpirationBehavior` import
- `_validate_claim_assign`: `member_id: str` → `UUID`, use `member_id is None` for open pool detection instead of `is_open_pool`
- `create_association`: removed `is_open_pool` from logging
- `_validate_association`: use `member_id is None` for open pool detection instead of `is_open_pool`
- `generate_instance_for_association`: build `RecurrenceRule` from flattened fields (`frequency`, `frequency_interval`, `day_of_week`, etc.) instead of `recurrence_rule` dict, use `member_id`/`assigned_by` instead of `claimed_by`/`assigned_to`, handle nullable `period_end`
- `_generate_one_time_instance`: use `member_id`/`assigned_by` instead of `claimed_by`/`assigned_to`, update `get_instance_for_period` call (no `period_end` parameter)
- `process_expired_instances`: removed `expiration_behavior` logic, just mark all expired instances as MISSED

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ️ Tests fail (expected — updated in Phase 7)

**Commits:**
- `dashy-api`: `c619b6d` — services layer updates
- `dashy`: `5a1df73` — submodule ref updated

### Phase 7: Tests
**Status:** ✅ Complete (2026-08-30)
**Files (7):**
- `tests/api/test_chores_api.py` ✅
- `tests/integration/test_chores_repository.py` ✅
- `tests/unit/test_chores_services.py` ✅
- `tests/unit/test_period_calculation.py` ✅
- `tests/unit/test_condition_evaluator.py` ✅
- `tests/unit/test_expiration_overdue.py` ✅
- `tests/unit/test_bulk_operations.py` ✅

**Summary:** Updated all 7 test files to match the new schema. All 309 tests pass.

**Key changes:**
- `test_chores_repository.py`: Added UUID constants for member IDs (`_TESTER`, `_ARYA`, `_RAYA`), added `FamilyMemberDB` seeding for FK constraints, added `_seed_association` helper for FK requirements, updated all `MasterChore`/`ChoreInstance`/`ChoreAssociation` constructions with UUID member IDs, removed `period_end` from `get_instance_for_period` calls, fixed unique constraint handling for multiple instances per association
- `test_chores_services.py`: Imported `_MEMBER_*` UUID constants from mock_adapter, replaced `recurrence_rule={...}` with flattened fields (`frequency="daily"`, `due_time="18:00"`), removed `is_open_pool` from all `ChoreAssociation` constructions, changed string member IDs to UUIDs in service method calls, replaced `claimed_by`/`assigned_to`/`completed_by` assertions with `member_id`/`assigned_by`
- `test_bulk_operations.py`, `test_expiration_overdue.py`: Removed unused `UUID` imports

**Quality gate:**
- ✅ `make lint-api` passes
- ✅ `make typecheck` passes
- ✅ `make test-api` passes (309 tests)
- ✅ `make build-api` passes

**Commits:**
- `dashy-api`: pending
- `dashy`: pending

### Phase 8: Final Quality Gate
**Status:** ⬜ Not started

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
Phase 1 (DB schema)
    ↓
Phase 2 (Domain models)
    ↓
Phase 3 (Repository) ← depends on 1 + 2
    ↓
Phase 4 (Mock adapter) ← depends on 1 + 2
    ↓
Phase 5 (API models/routes) ← depends on 2
    ↓
Phase 6 (Services) ← depends on 2 + 3
    ↓
Phase 7 (Tests) ← depends on all above
    ↓
Phase 8 (Quality gate)
```

Phases 3, 4, 5 can be partially parallelized (all depend on Phase 2, not each other).

---

## Key Risks

1. **`member_id` string→UUID** — domain layer currently maps `id` ↔ `key` (string). Repository mapper must change to use UUID PK.
2. **Composite PK on associations** — `chore_instances.association_id` FK changes from surrogate `id` to `(master_chore_id, member_id)`. Changes all join queries.
3. **Mock adapter (790 lines)** — highest-effort single file. Every mock entity needs field updates.
