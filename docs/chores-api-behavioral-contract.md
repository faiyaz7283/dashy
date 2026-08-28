# Chores API Behavioral Contract

**Version:** 1.0  
**Last Verified:** 2026-08-27  
**Status:** ✅ All behaviors verified via Postman collection (82 tests passing)

This document defines the verified behavior of the Dashy Chores API. All rules have been tested and confirmed working.

---

## 1. REST Compliance Rules

### HTTP Method Semantics

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| `GET` | Read resources | ✅ | ✅ |
| `POST` | Create resources |  | ❌ |
| `PATCH` | Partial updates | ❌ | ❌ |
| `DELETE` | Remove resources | ❌ | ❌ |

### Verified Rules

1. **GET endpoints are read-only** — no side effects, no data mutations
   - `GET /api/v1/chores` returns current state without triggering instance generation
   - Instance generation requires explicit `POST /api/v1/chores/sync`

2. **PATCH for partial updates** — only send fields that need updating
   - `PATCH /api/v1/chores/masters/{chore_id}` — update master chore fields
   - `PATCH /api/v1/chores/instances/{instance_id}/status` — update instance status
   - `PATCH /api/v1/chores/masters/bulk-status` — bulk status updates

3. **POST for creation** — creates new resources
   - `POST /api/v1/chores/categories` — create category
   - `POST /api/v1/chores/tags` — create tag
   - `POST /api/v1/chores/masters` — create master chore
   - `POST /api/v1/chores/associations` — create association
   - `POST /api/v1/chores/sync` — trigger instance generation (explicit safety net)

4. **Request bodies for mutations** — no mutation data in query parameters
   - All POST/PATCH requests send data in JSON body
   - Query parameters only for filtering (e.g., `?date=2026-08-27`)

---

## 2. Timezone Contract

### Core Principle

**UTC for storage and wire format, configured timezone for business logic.**

### Timestamp Rules

| Field | Format | Timezone | Example |
|-------|--------|----------|---------|
| `created_at` | ISO 8601 with offset | UTC | `2026-08-27T15:30:00+00:00` |
| `updated_at` | ISO 8601 with offset | UTC | `2026-08-27T15:30:00+00:00` |
| `completed_at` | ISO 8601 with offset | UTC | `2026-08-27T15:30:00+00:00` |
| `due_date` | Date string | N/A (date only) | `2026-08-27` |
| `due_time` | Time string | Local (configured tz) | `18:00` |

### Date Boundary Logic

All date comparisons use the **configured timezone** (from `TIMEZONE` env var, default `America/New_York`):

```python
# Backend uses configured timezone for "today"
today = datetime.now(settings.tz).date()
```

**Example:** If timezone is `America/New_York` and it's 11 PM UTC (7 PM ET):
- `datetime.now(UTC).date()` = 2026-08-28 ❌ (wrong)
- `datetime.now(settings.tz).date()` = 2026-08-27 ✅ (correct)

### due_time Handling

- Stored as plain string: `"HH:MM"` (e.g., `"18:00"`)
- Interpreted as **local time** in configured timezone
- Compared against current time in configured timezone for overdue detection

**Overdue logic:**
```python
# Instance is overdue if due_date < today OR (due_date == today AND due_time < now)
now_local = datetime.now(settings.tz)
if instance.due_date < now_local.date():
    status = "overdue"
elif instance.due_date == now_local.date() and instance.due_time < now_local.time():
    status = "overdue"
```

### Frontend Responsibilities

1. **Display timestamps** — convert UTC to user's local timezone for display
2. **Send due_time** — send as `"HH:MM"` string, backend interprets as local time
3. **Send due_date** — send as `"YYYY-MM-DD"` string, backend interprets in configured timezone

---

## 3. Error Format (RFC 9457)

All errors return **RFC 9457 Problem Details** format:

```json
{
  "type": "https://dashy.local/errors/{error-code}",
  "title": "{error-code}",
  "status": 422,
  "detail": "Human-readable description",
  "errors": [...]  // Only for validation errors
}
```

### Error Codes

| Status Code | Error Code | When |
|-------------|------------|------|
| 400 | `bad-request` | Malformed request |
| 404 | `not-found` | Resource doesn't exist |
| 409 | `conflict` | Business rule violation (e.g., already claimed) |
| 422 | `validation-error` | Invalid input data |
| 500 | `internal-error` | Server error |

### Validation Error Format (422)

```json
{
  "type": "https://dashy.local/errors/validation-error",
  "title": "validation-error",
  "status": 422,
  "detail": "Request validation failed",
  "errors": [
    {
      "loc": ["body", "field_name"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

### Example Errors

**Not Found (404):**
```json
{
  "type": "https://dashy.local/errors/not-found",
  "title": "not-found",
  "status": 404,
  "detail": "Master chore with id 'xyz' not found"
}
```

**Conflict (409):**
```json
{
  "type": "https://dashy.local/errors/conflict",
  "title": "conflict",
  "status": 409,
  "detail": "Instance is already claimed by another member"
}
```

**Validation (422):**
```json
{
  "type": "https://dashy.local/errors/validation-error",
  "title": "validation-error",
  "status": 422,
  "detail": "Request validation failed",
  "errors": [
    {
      "loc": ["body", "expiration_behavior"],
      "msg": "Input should be 'expire', 'rollover', or 'delete'",
      "type": "enum"
    }
  ]
}
```

---

## 4. Endpoint Behavior

### Categories

#### `POST /api/v1/chores/categories`
- **Creates** a new category
- **Required:** `name` (string, 1-50 chars)
- **Optional:** `color` (hex string, e.g., `"#FF5733"`)
- **Returns:** 201 with created category

#### `GET /api/v1/chores/categories`
- **Returns** all categories
- **No side effects**

### Tags

#### `POST /api/v1/chores/tags`
- **Creates** a new tag
- **Required:** `name` (string, 1-50 chars)
- **Returns:** 201 with created tag

#### `GET /api/v1/chores/tags`
- **Returns** all tags
- **No side effects**

### Master Chores

#### `POST /api/v1/chores/masters`
- **Creates** a new master chore
- **Required:** `name`, `recurrence`, `assigned_to`
- **Optional:** `category_id`, `tag_ids`, `due_time`, `expiration_behavior`, `difficulty`, `description`, `end_date`
- **Returns:** 201 with created master chore

#### `GET /api/v1/chores/masters`
- **Returns** all master chores
- **No side effects**

#### `PATCH /api/v1/chores/masters/{chore_id}`
- **Updates** master chore fields
- **Send only fields to update** (partial update)
- **Returns:** 200 with updated master chore

#### `PATCH /api/v1/chores/masters/bulk-status`
- **Updates** status of multiple master chores
- **Body:** `{"chore_ids": [...], "status": "active"}`
- **Returns:** 200 with updated count

### Associations

#### `POST /api/v1/chores/associations`
- **Creates** association between master chore and family member
- **Required:** `master_chore_id`, `member_id`
- **Returns:** 201 with created association

#### `GET /api/v1/chores/associations`
- **Returns** all associations
- **Optional filter:** `?member_id=xyz`

### Instances

#### `GET /api/v1/chores/instances`
- **Returns** all instances
- **Optional filters:** `?date=2026-08-27`, `?member_id=xyz`, `?status=pending`

#### `PATCH /api/v1/chores/instances/{instance_id}/status`
- **Updates** instance status
- **Required:** `status` (enum: `pending`, `claimed`, `completed`, `skipped`)
- **Optional:** `completed_at` (ISO 8601 timestamp)
- **Business rules:**
  - Cannot claim already claimed instance
  - Cannot complete already completed instance
- **Returns:** 200 with updated instance

### Sync

#### `POST /api/v1/chores/sync`
- **Triggers** instance generation for current period
- **Idempotent** — safe to call multiple times
- **Returns:** 200 with sync summary
- **Use when:** Frontend needs to ensure instances exist for current date range

---

## 5. Business Rules

### Instance Generation

1. **Explicit sync required** — instances are NOT generated on GET
2. **Sync is idempotent** — calling multiple times doesn't create duplicates
3. **Generates for current period** — based on recurrence pattern and date range

### Status Transitions

Valid transitions:
- `pending` → `claimed` → `completed`
- `pending` → `skipped`
- `claimed` → `completed`
- `claimed` → `pending` (unclaim)

Invalid transitions (return 409):
- `completed` → any other status
- `skipped` → any other status

### Claim/Assign Exclusivity

- One instance can only be claimed by one member at a time
- Attempting to claim already claimed instance returns 409

### Overdue Detection

- Instance is overdue if `due_date < today` OR (`due_date == today` AND `due_time < now`)
- All comparisons use configured timezone

### Expiration Behavior

When master chore has `end_date`:
- `expire` — instances after end_date are marked expired
- `rollover` — incomplete instances roll over to next period
- `delete` — instances after end_date are deleted

---

## 6. Frontend Validation Checklist

### Before Making Requests

- [ ] **GET requests** — no request body needed
- [ ] **POST requests** — send JSON body with required fields
- [ ] **PATCH requests** — send only fields to update
- [ ] **Timestamps** — send as ISO 8601 with timezone offset (or let backend set them)
- [ ] **Dates** — send as `"YYYY-MM-DD"` strings
- [ ] **Times** — send as `"HH:MM"` strings (backend interprets as local time)

### Error Handling

- [ ] **Check status code** — 2xx success, 4xx client error, 5xx server error
- [ ] **Parse RFC 9457 format** — extract `type`, `title`, `status`, `detail`
- [ ] **Validation errors** — check `errors` array for field-specific issues
- [ ] **Conflict errors (409)** — show user-friendly message (e.g., "Already claimed")
- [ ] **Not found errors (404)** — handle gracefully (e.g., redirect or show message)

### Timezone Handling

- [ ] **Display timestamps** — convert UTC to user's local timezone
- [ ] **Send due_time** — as `"HH:MM"` string (no timezone info needed)
- [ ] **Send due_date** — as `"YYYY-MM-DD"` string
- [ ] **Overdue indicators** — backend determines overdue status, frontend just displays it

### Instance Sync

- [ ] **Call sync on load** — `POST /api/v1/chores/sync` when chore view loads
- [ ] **Handle sync response** — check summary for generated instances
- [ ] **Don't rely on GET to generate** — GET is read-only

---

## 7. Testing

### Postman Collection

All behaviors verified via Postman collection:
- **Location:** `docs/chores-api-postman-collection.json`
- **Environment:** `docs/chores-test-env.json`
- **Tests:** 82 assertions across 12 endpoints
- **Status:** ✅ All passing (2026-08-27)

### Running Tests

**Via Postman GUI:**
1. Import collection and environment
2. Select environment "Dashy Test"
3. Click "Run collection"
4. Review results

**Via Newman (CLI):**
```bash
newman run docs/chores-api-postman-collection.json \
  -e docs/chores-test-env.json
```

---

## 8. Change Log

| Date | Change | Verified |
|------|--------|----------|
| 2026-08-27 | Initial contract — REST compliance, timezone, error format | ✅ 82 tests |

---

## 9. References

- **RFC 9457:** Problem Details for HTTP APIs — https://datatracker.ietf.org/doc/html/rfc9457
- **Postman Collection:** `docs/chores-api-postman-collection.json`
- **Test Environment:** `docs/chores-test-env.json`
- **API Routes:** `dashy-api/app/api/routes/chores.py`
- **Models:** `dashy-api/app/api/models/chores.py`
- **Services:** `dashy-api/app/domain/chores/services.py`
