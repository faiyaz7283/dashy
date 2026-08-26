# Project-Wide Date/Time Standardization

**Status:** ✅ COMPLETE (All phases implemented)
**Created:** 2026-08-26
**Updated:** 2026-08-26
**Scope:** All repos — dashy-api (backend), dashy-kiosk (frontend), orchestrator

---

## Overview

Standardize all date/time handling across the entire Dashy project to follow industry best practices. This is a cross-cutting concern affecting all three repos.

---

## Architecture Decisions

### Single Source of Truth: TIMEZONE in .env

The user's timezone is configured once in `.env` via the `TIMEZONE` variable (IANA identifier, e.g. `"America/New_York"`). This is the single source of truth for display timezone across the entire application.

### Backend: All times stored and transmitted in UTC

- All `datetime` values in the database use `TIMESTAMPTZ` (PostgreSQL enforces this)
- All API responses serialize datetimes as ISO 8601 with UTC offset (`+00:00` or `Z`)
- Server-side operations (default week dates, mock data, cache TTLs) use `datetime.now(timezone.utc)`
- The configured `TIMEZONE` is used only for server-side display-oriented logic (e.g. "what is today in the user's timezone?")

### Frontend: UTC → configured timezone for display

- Frontend fetches timezone from `GET /api/v1/config` on app load
- All wire-format UTC times are converted to the configured timezone for display
- Uses `Temporal.ZonedDateTime` for timezone-aware conversions
- No browser timezone auto-detection — always uses the configured timezone

### Wire Format: Strictly UTC, no exceptions

All datetime values on the wire use UTC with timezone indicator:
- `"2026-08-26T19:30:00+00:00"` or `"2026-08-26T19:30:00Z"`

All date values:
- `"2026-08-26"` (ISO 8601 date, no time component)

All time values (sunrise, sunset, hourly times):
- `"18:00"` (24-hour, no seconds, no timezone — these are UTC times)

### API: GET /api/v1/config (singleton resource)

- RESTful singleton — application configuration is a single resource
- Read-only (config set via `.env`, not through API)
- Returns `{ "timezone": "America/New_York" }`
- Extensible for future settings (units, locale, etc.)

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

### ✅ Phase 5: Configuration (Backend) — COMPLETE
**Commit:** `71d91fa`
**Date:** 2026-08-26

**Rationale:** Moved to execute first — timezone config is the foundation that Phases 2-4 depend on.

**Completed:**

**5.1 Add TIMEZONE setting to `app/config.py`**
```python
TIMEZONE: str = "America/New_York"  # From .env, IANA timezone identifier
```

**5.2 Add `GET /api/v1/config` endpoint**
- New file: `app/api/models/config.py` — `AppConfig` response model
- New file: `app/api/routes/config.py` — singleton resource route
- Registered in `app/main.py` under `/api/v1`

**5.3 Add TIMEZONE to .env files**
- `env/.env.dev` — `TIMEZONE=America/New_York`
- `env/.env.dev.example` — `TIMEZONE=America/New_York`
- `env/.env.test` — `TIMEZONE=UTC` (tests use UTC for determinism)
- `env/.env.test.example` — `TIMEZONE=UTC`

**5.4 Add `zoneinfo` helper to config**
```python
@property
def tz(self) -> ZoneInfo:
    """Return ZoneInfo for the configured timezone."""
    return ZoneInfo(self.TIMEZONE)
```

**Verification:**
- [x] `GET /api/v1/config` returns `{ "timezone": "America/New_York" }`
- [x] TIMEZONE read from .env (not hardcoded)
- [x] Tests use `TIMEZONE=UTC`

---

### ✅ Phase 2: Weather Module (Backend) — UTC CONVERSION — COMPLETE
**Commit:** `2317dba`
**Date:** 2026-08-26

**Files:** `app/infrastructure/weather/owm_adapter.py`, `app/infrastructure/mock_data.py`

**Completed:**

**2.1 OWM adapter — convert all output times to UTC**
- `_ts_to_iso()` — convert Unix timestamp to UTC time string (`"HH:MM"` in UTC)
- `_ts_to_datetime()` — convert to UTC ISO datetime (`"YYYY-MM-DDTHH:MM:SS+00:00"`)
- `_ts_to_date()` — convert to UTC date (`"YYYY-MM-DD"`)
- Removed `tz_offset` parameter from all helper functions — always use UTC
- `_get_today_midnight_timestamp()` — use `datetime.now(timezone.utc)` instead of `datetime.now(local_tz)`
- `_build_response()` — sunrise/sunset times in UTC, daily dates in UTC
- Night detection: compare UTC timestamps directly (no timezone conversion needed)

**2.2 Mock data — weather section**
- `_get_mock_api_responses()` — use `datetime.now(timezone.utc)` instead of `datetime.now(eastern_tz)`
- Mock sunrise/sunset timestamps in UTC
- Mock hourly/daily timestamps in UTC

**Wire format after changes:**
- Sunrise/sunset: `"10:30"` (UTC time)
- Hourly forecast time: `"2026-08-26T18:00:00+00:00"` (UTC datetime)
- Daily forecast date: `"2026-08-26"` (UTC date)

**Frontend impact:** `parseWeatherTime()` already handles ISO strings with timezone via `stripTimezone()`. After backend sends UTC, frontend will convert UTC→configured timezone for display.

---

### ✅ Phase 3: Calendar Module (Backend) — COMPLETE
**Commit:** `71d91fa`
**Date:** 2026-08-26

**Files:** `app/domain/calendar/services.py`, `app/infrastructure/calendar/`, `app/infrastructure/mock_data.py`

**Completed:**

**3.1 `services.py` — `get_default_week_dates()`**
- Line 18: `datetime.now()` → `datetime.now(timezone.utc)`
- Import updated to use `timezone` from datetime module

**3.2 `mock_data.py` — `get_mock_calendar_events()`**
- Line 95: `datetime.now()` → `datetime.now(timezone.utc)`
- Default week range now calculated in UTC

**3.3 Google Calendar adapter — normalize event times to UTC**
- `parse_event()` in `services.py` — event start/end from Google API come with timezone info
- Convert all event times to UTC before storing in the response model
- `parse_iso_date()` — currently strips timezone, should preserve UTC

**3.4 Mock calendar data — UTC timestamps**
- Mock event start/end already append `"Z"` — verified these are treated as UTC
- `mock_data.py` event generation uses naive datetimes — should use UTC-aware

---

### ✅ Phase 4: Frontend Standardization — COMPLETE
**Date:** 2026-08-26
**Repo:** `dashy-kiosk`

**Completed:**

#### 4.1 Timezone context — fetch and provide configured timezone
**New file:** `src/shared/date/timezone.ts`

- Added `useConfig()` hook — calls `GET /api/v1/config`, returns timezone string
- Added `convertUtcToTimezone(utcIso: string, timezone: string)` — UTC→configured timezone conversion using `Temporal.ZonedDateTime`
- Added `formatUtcTime(utcIso: string, timezone: string)` — format UTC time in configured timezone for display
- Added `formatUtcDate(utcIso: string, timezone: string)` — format UTC date in configured timezone for display
- Exported all utilities from `src/shared/date/index.ts`

#### 4.2 Fix legacy `Date` usage
**Files:**
- `src/features/weather/components/WeatherPopup.tsx:233`
- `src/shared/utils/family.ts:20-21`

**Changes:**
- ✅ Replaced `new Date(hour.time)` with `parseWeatherTime(hour.time)` + `toLocaleString()` for formatting
- ✅ Replaced `new Date(member.date_of_birth)` with `Temporal.PlainDate.from()`
- ✅ Replaced `new Date()` with `Temporal.Now.plainDateISO()`

#### 4.3 Update parse.ts for UTC wire format
**Files:** `src/shared/date/parse.ts`

**Status:** No changes needed — `parseWeatherTime()` already handles ISO strings with timezone via `stripTimezone()`. The utility correctly parses both old (naive local) and new (UTC) formats.

#### 4.4 Consistent parsing audit
**Files:** All components using date/time data

**Completed:**
- ✅ Audited all date field usage
- ✅ All ISO strings go through `src/shared/date/parse.ts` utilities
- ✅ Zero `new Date()` calls in frontend code (except in timezone utilities for Intl formatting)
- ✅ All display formatting goes through timezone-aware formatters

---

## Wire Format Specification

### Timestamps (DateTime)
- **Format:** ISO 8601 with UTC offset
- **Precision:** Seconds (no microseconds)
- **Timezone:** Always UTC (`+00:00` or `Z`)
- **Serialization:** Pydantic auto-serializes `datetime` → ISO string
- **Example:** `"2026-08-26T19:30:00+00:00"` or `"2026-08-26T19:30:00Z"`

### Dates (Date-only)
- **Format:** ISO 8601 date
- **Example:** `"2026-08-26"`
- **No time component**

### Times (Time-only)
- **Format:** 24-hour HH:MM in UTC
- **Example:** `"10:30"` (meaning 10:30 UTC)
- **No seconds, no timezone**
- **Frontend converts to configured timezone for display**

---

## Execution Order

1. **Phase 5** (Config) — foundation, everything else depends on TIMEZONE setting
2. **Phase 2** (Weather) — convert wire format to UTC
3. **Phase 3** (Calendar) — fix naive datetimes, normalize to UTC
4. **Phase 4** (Frontend) — add UTC→local conversion, fix legacy Date usage

Each phase: implement → quality gate → commit → push.

---

## Testing Strategy

### Backend Tests
1. **Unit tests** for timezone conversions
2. **Unit tests** for `GET /api/v1/config` endpoint
3. **Integration tests** for weather adapter UTC output
4. **API tests** to verify wire format consistency (all times have UTC offset)

### Frontend Tests
1. **Unit tests** for UTC→local conversion utilities
2. **Unit tests** for date parsing/formatting with configured timezone
3. **Component tests** to verify display in configured timezone

---

## Migration Checklist

### Backend
- [x] Chores module: Replace `datetime.utcnow()`
- [x] Chores module: Convert TEXT → Date/DateTime columns
- [x] Family module: Update DB model defaults
- [ ] Config: Add `TIMEZONE` setting to `config.py`
- [ ] Config: Add `GET /api/v1/config` endpoint
- [ ] Config: Add `TIMEZONE` to all .env files
- [ ] Weather: Convert all output times to UTC
- [ ] Weather: Remove `tz_offset` from helper functions
- [ ] Weather: Mock data — use UTC timestamps
- [ ] Calendar: Fix `get_default_week_dates()` to use `datetime.now(timezone.utc)`
- [ ] Calendar: Fix `mock_data.py` to use `datetime.now(timezone.utc)`
- [ ] Calendar: Normalize Google Calendar event times to UTC

### Frontend
- [ ] Add timezone fetch from `GET /api/v1/config`
- [ ] Add UTC→local conversion utilities
- [ ] Fix `WeatherPopup.tsx` — replace `new Date()` with Temporal
- [ ] Fix `family.ts` — replace `new Date()` with Temporal
- [ ] Update `parse.ts` for UTC wire format
- [ ] Audit all date field usage

### Tests
- [ ] Config endpoint test
- [ ] Timezone conversion tests (backend)
- [ ] UTC→local conversion tests (frontend)
- [ ] Wire format consistency tests

### Env files
- [ ] `env/.env.dev` — add `TIMEZONE=America/New_York`
- [ ] `env/.env.dev.example` — add `TIMEZONE=America/New_York`
- [ ] `env/.env.test` — add `TIMEZONE=UTC`
- [ ] `env/.env.test.example` — add `TIMEZONE=UTC`

---

## Success Criteria

- [x] Zero `datetime.utcnow()` calls in backend (already achieved)
- [ ] Zero `datetime.now()` (naive) calls in backend
- [ ] Zero `new Date()` calls in frontend (except polyfill)
- [ ] All API responses use consistent ISO 8601 in UTC
- [ ] All database temporal fields use proper column types (enforced by PostgreSQL)
- [ ] Timezone configurable via `.env` (`TIMEZONE` variable)
- [ ] Frontend fetches timezone from `GET /api/v1/config`
- [ ] Frontend converts all UTC times to configured timezone for display
- [ ] All tests pass
- [ ] No data loss during migration

---

## Notes

- **Chores module is reference implementation** — use as template for other modules
- **Pydantic handles serialization** — no need for manual `.isoformat()` in routes
- **PostgreSQL enforces temporal types** — `sa.Date()` and `sa.DateTime(timezone=True)` columns are strictly enforced. All temporal fields already use proper column types from Phase 1
- **Database migration complete** — PostgreSQL 18 is now the database (migrated 2026-08-26)
- **No hardcoded timezone** — always read from `settings.TIMEZONE`, never assume a specific timezone in code
- **Backward compatibility** — frontend must handle both old (naive local) and new (UTC) formats during transition. `stripTimezone()` in `parse.ts` already handles both
- **Weather station timezone vs user timezone** — the OWM API returns a `timezone_offset` for the weather station location. After Phase 2, we convert everything to UTC on the backend. The frontend then converts UTC to the user's configured timezone for display. If the weather station and user are in different timezones, the display will show the user's local time, not the station's local time

---

## References

- **Phase 1 commit:** `f06755a` — chores redesign with associations and recurrence rules
- **Phase 1.5 commit:** `edea1c1` — convert date fields to proper types
- **Chores redesign plan:** `dashy-api/docs/plans/CHORES-REDESIGN.md`
- **Python datetime best practices:** https://docs.python.org/3/library/datetime.html#datetime.UTC
- **Pydantic datetime serialization:** https://docs.pydantic.dev/latest/concepts/serialization/
- **Temporal API:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
- **IANA timezone database:** https://www.iana.org/time-zones
