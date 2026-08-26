# Project-Wide Date/Time Standardization

**Status:** In Progress (Phase 1 complete)  
**Created:** 2026-08-26  
**Updated:** 2026-08-26  
**Scope:** All repos — dashy-api (backend), dashy-kiosk (frontend), orchestrator

---

## Overview

Standardize all date/time handling across the entire Dashy project to follow industry best practices. This is a cross-cutting concern affecting all three repos.

---

## Progress

### ✅ Phase 1: Chores Module (Backend) — COMPLETE
**Commits:** `f06755a`, `edea1c1`  
**Date:** 2026-08-26

**Completed:**
- All `datetime.utcnow()` → `datetime.now(UTC)` (Python 3.11+ `UTC` alias)
- All `str` date/datetime fields → proper `date`/`datetime` types
- DB columns: `period_start`, `period_end`, `due_date`, `end_date` → `sa.Date()`
- DB columns: `started_at`, `completed_at` → `sa.DateTime()`
- Domain models updated with proper types
- API models use `date`/`datetime` (Pydantic handles JSON serialization)
- Routes simplified — no manual `.isoformat()` calls
- Mock adapter updated — removed `_iso()` and `_date_str()` helpers
- Migration `a3e5399aaca2` documents type changes

**Wire format:** Pydantic auto-serializes to ISO 8601. No breaking changes.

### ✅ Phase 1.5: Family Module (Backend) — COMPLETE
**Commit:** `f06755a` (included in Phase 1)  
**Date:** 2026-08-26

**Completed:**
- `FamilyMemberDB.created_at`/`updated_at` → `lambda: datetime.now(UTC)`
- `onupdate` handler → `lambda: datetime.now(UTC)`
- `date_of_birth` already `date` type (no change needed)

---

## Remaining Work

### ❌ Phase 2: Weather Module (Backend)
**Files:** `app/infrastructure/weather/owm_adapter.py`, `app/infrastructure/weather/mock_adapter.py`

**Issues:**
- Uses `datetime.utcnow()` in adapters
- OWM adapter uses local timezone from API (inconsistent)
- Timestamps not normalized to UTC

**Changes needed:**
- Replace `datetime.utcnow()` → `datetime.now(UTC)`
- Normalize all timestamps to UTC before serialization
- Ensure OWM adapter converts local timezone to UTC
- Update wire format to use consistent ISO 8601

**Migration:** None (no schema changes)

---

### ❌ Phase 3: Calendar Module (Backend)
**Files:** `app/domain/calendar/services.py`, `app/infrastructure/calendar/`

**Issues:**
- `get_default_week_dates()` uses `datetime.now()` (naive local time)
- Google Calendar adapter passes through timezone-aware strings without normalization
- Mixed timezone bases (UTC vs local)

**Changes needed:**
- Fix `get_default_week_dates()` to use `datetime.now(UTC)`
- Normalize Google Calendar event times to UTC
- Update serialization to use consistent ISO 8601

**Migration:** None

---

### ❌ Phase 4: Frontend Standardization
**Repo:** `dashy-kiosk`

#### 4.1 Fix Legacy `Date` Usage
**Files:**
- `src/features/weather/components/WeatherPopup.tsx:233`
- `src/shared/utils/family.ts:20-21`

**Changes:**
- Replace `new Date(hour.time)` with `parseWeatherTime(hour.time)` + `formatTime()`
- Replace `new Date(member.date_of_birth)` with `Temporal.PlainDate.from()`
- Replace `new Date()` with `Temporal.Now.plainDateISO()`

#### 4.2 Consistent Parsing
**Files:** All components using date/time data

**Changes:**
- Audit all date field usage
- Ensure all ISO strings go through `parse.ts` utilities
- Remove any direct `Date` constructor usage

---

### ❌ Phase 5: Configuration
**Repo:** `dashy-api`

#### 5.1 Add Timezone Config
**File:** `app/config.py`

**Changes:**
```python
class Settings(BaseSettings):
    # ... existing settings ...
    TIMEZONE: str = "UTC"  # Default to UTC, can override in .env
```

**Usage:**
- Use `zoneinfo.ZoneInfo(settings.TIMEZONE)` for local time conversions
- Display layer converts UTC to user's timezone
- All storage and computation in UTC

---

## Wire Format Specification

### Timestamps (DateTime)
- **Format:** ISO 8601
- **Precision:** Seconds (no microseconds)
- **Timezone:** Always UTC
- **Serialization:** Pydantic auto-serializes `datetime` → ISO string
- **Example:** `"2026-08-26T19:30:00+00:00"` (Pydantic default) or `"2026-08-26T19:30:00Z"` (if manually formatted)

### Dates (Date-only)
- **Format:** ISO 8601 date
- **Example:** `"2026-08-26"`
- **No time component**

### Times (Time-only)
- **Format:** 24-hour HH:MM
- **Example:** `"18:00"`
- **No seconds, no timezone**

---

## Testing Strategy

### Backend Tests
1. **Unit tests** for timezone conversions
2. **Integration tests** for database migrations (if any)
3. **API tests** to verify wire format consistency

### Frontend Tests
1. **Unit tests** for date parsing/formatting
2. **Component tests** to verify display in user's timezone

---

## Migration Checklist

### Backend
- [x] Chores module: Replace `datetime.utcnow()`
- [x] Chores module: Convert TEXT → Date/DateTime columns
- [x] Family module: Update DB model defaults
- [ ] Weather module: Replace `datetime.utcnow()`
- [ ] Weather module: Normalize to UTC
- [ ] Calendar module: Fix `get_default_week_dates()`
- [ ] Calendar module: Normalize Google Calendar times
- [ ] Config: Add `TIMEZONE` setting

### Frontend
- [ ] Fix `WeatherPopup.tsx`
- [ ] Fix `family.ts`
- [ ] Audit all date field usage
- [ ] Ensure consistent use of `parse.ts` utilities

### Tests
- [ ] Add timezone conversion tests (backend)
- [ ] Add date parsing tests (frontend)

### Docs
- [ ] Update API documentation with wire format spec

---

## Success Criteria

- [ ] Zero `datetime.utcnow()` calls in backend
- [ ] Zero `new Date()` calls in frontend (except polyfill)
- [ ] All API responses use consistent ISO 8601
- [ ] All database temporal fields use proper column types
- [ ] Timezone configurable via `.env`
- [ ] All tests pass
- [ ] No data loss during migration

---

## Notes

- **Chores module is reference implementation** — use as template for other modules
- **Pydantic handles serialization** — no need for manual `.isoformat()` in routes
- **SQLite dynamic typing** — column type changes are documentation-only (no actual schema migration needed for SQLite)
- **PostgreSQL migration** — when we migrate to PostgreSQL, proper column types will be enforced
- **Backward compatibility** — frontend must handle both old and new formats during transition
- **Monitoring** — log any parsing errors during transition period

---

## References

- **Phase 1 commit:** `f06755a` — chores redesign with associations and recurrence rules
- **Phase 1.5 commit:** `edea1c1` — convert date fields to proper types
- **Chores redesign plan:** `dashy-api/docs/plans/CHORES-REDESIGN.md`
- **Python datetime best practices:** https://docs.python.org/3/library/datetime.html#datetime.UTC
- **Pydantic datetime serialization:** https://docs.pydantic.dev/latest/concepts/serialization/
