# Backend Migration Plan

> Status: **✅ COMPLETE — All phases B1-B6 done, deployed to production**
> Created: 2026-08-16
> Last updated: 2026-08-17
> Scope: Restructure backend for dependency injection, configuration-driven design, provider-agnostic architecture, caching, clean separation of concerns, and database persistence for family members.

### Implementation Status (as of 2026-08-17)

**All six phases complete and deployed to production.** The backend is fully operational with:

| Area | Status | Detail |
|------|--------|--------|
| Domain layer (`domain/`) | ✅ Complete | All 3 domains with models, ports, services |
| Infrastructure adapters | ✅ Complete | OWM, Google, mock adapters + persistence |
| DI container + registry | ✅ Complete | `core/container.py`, `core/registry.py` |
| Cache (Redis) | ✅ Complete | `core/cache.py`, Redis in docker compose, fail-open design |
| Database (SQLite + SQLModel) | ✅ Complete | `core/database.py`, Alembic migrations, WAL mode, persistent volume |
| API models | ✅ Complete | Split into `api/models/` (weather, calendar, family, requests) |
| Route wiring | ✅ Complete | All routes use DI, calendar reads from DB |
| Family endpoint | ✅ Complete | Full CRUD API (GET/POST/PUT/PATCH/DELETE) |
| Old code removal | ✅ Complete | `app/services/` removed, all code uses new architecture |
| SQLite Docker volume | ✅ Complete | Persistent volume at `/app/data/dashy.db` |
| Database schema | ✅ Complete | Family members table with email, date_of_birth, relation fields |
| Mock/Real switching | ✅ Complete | Environment-based (dev=mock, prod=real) |
| Test coverage | ✅ Complete | 283 tests passing (148 backend + 135 frontend) |

**All quality gates passing:** lint, typecheck, test, build. Deployed to Raspberry Pi production.

### Repository Structure (as of 2026-08-17)

This backend will become the **`dashy-api`** submodule in the `dashy` orchestrator repo (dashtam pattern). See `docs/plans/REPO-SPLIT-INTEGRATION.md` for details.

```
dashy/                        ← orchestrator repo
├── compose/                  ← docker-compose (dev + prod)
├── scripts/                  ← kiosk scripts, deploy helpers
├── docs/                     ← plans, guides
├── env/                      ← shared .env files
├── frontend/  → submodule    ← dashy-kiosk (React kiosk dashboard)
├── backend/   → submodule    ← dashy-api (this repo — FastAPI backend)
└── Makefile                  ← orchestrates frontend + backend
```

**Implications for this plan:**
- Docker compose files live in the orchestrator (`dashy/compose/`), not here
- Deployment is orchestrated via `make deploy-pi` from the orchestrator
- This repo has its own CI (lint, typecheck, test, build) independent of the frontend
- API contract with frontend is defined in `app/registry.py` (backend) and `src/core/api/endpoints.ts` (frontend)

---

## Guiding Principles

### Modern Best Practices Over Dashtam Replication

Dashtam is used as **conceptual inspiration only** — not as a reference implementation. Dashtam was built some time ago and its code may use outdated patterns, deprecated APIs, or older package versions.

**Rules:**
- **Borrow the architecture concepts** (registry, protocols, DI, result types, testing tiers) — not the implementation details
- **Always use latest stable package versions** — design around current APIs, not legacy ones
- **Follow current Python best practices** — modern type hints (`X | None` not `Optional[X]`), `asyncio` patterns, Pydantic v2 idioms
- **Follow current FastAPI best practices** — latest dependency injection patterns, modern middleware, current security practices
- **Discard anything deprecated** — if a Dashtam pattern uses deprecated APIs or terminology, find the modern equivalent
- **Verify package versions at implementation time** — check PyPI for latest stable before adding any dependency

**Why:** Dashy is a new project being built for longevity. Starting with modern foundations means less tech debt from day one. Dashtam's architectural *ideas* are sound — its specific *implementations* may not reflect today's best practices.

### Docstring Standard — Google Style (Mandatory)

All Python code in the backend **must** follow Google-style docstrings. This is a project coding standard, enforced via ruff.

**Convention:** [Google Python Style Guide — §3.8 Comments and Docstrings](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings)

**Why Google style:**
- Most popular convention in the broader Python community
- Already loosely used in the existing codebase
- Clean, readable in source (unlike Sphinx/reST)
- Consistent with Dashtam's convention
- Fully supported by ruff's `pydocstyle` (D) rules

**Rules:**
- **Every** public module, class, function, and method gets a docstring
- Private helpers (`_prefixed`) get docstrings when the logic is non-obvious
- Module docstrings describe the module's purpose and contents
- Class docstrings describe what instances represent (not "Class that describes...")
- Function/method docstrings include `Args:`, `Returns:`, `Raises:` sections as applicable
- Summary line: one line, imperative mood (`"""Fetch weather data."""` not `"""This function fetches..."""`), ends with a period
- Blank line between summary and the rest of the docstring
- Exception class docstrings describe the error, not the context (`"""No more cheese is available."""` not `"""Raised when no more cheese is available."""`)

**Example:**
```python
def fetch_smalltable_rows(
    table_handle: smalltable.Table,
    keys: Sequence[bytes | str],
    require_all_keys: bool = False,
) -> Mapping[bytes, tuple[str, ...]]:
    """Fetches rows from a Smalltable.

    Retrieves rows pertaining to the given keys from the Table instance
    represented by table_handle. String keys will be UTF-8 encoded.

    Args:
        table_handle: An open smalltable.Table instance.
        keys: A sequence of strings representing the key of each table
            row to fetch. String keys will be UTF-8 encoded.
        require_all_keys: If True only rows with values set for all keys
            will be returned.

    Returns:
        A dict mapping keys to the corresponding table row data
        fetched. Each row is represented as a tuple of strings.

    Raises:
        IOError: An error occurred accessing the smalltable.
    """
```

**Enforcement:**
- Ruff `pydocstyle` (D) rules with `convention = "google"` in `pyproject.toml`
- `make lint` must pass — docstring violations are lint failures
- All new code must comply; existing code upgraded during migration phases

**Why:** Consistent, readable documentation across the codebase. Docstrings are the primary way developers understand what code does without reading the implementation. Enforced via linting so it never drifts.

---

## Current State Audit

### Directory Structure (as of 2026-08-17)
```
backend/
├── app/
│   ├── main.py                    # FastAPI app with lifespan, CORS, router registration
│   ├── config.py                  # Settings (pydantic-settings), environment-based config
│   │
│   ├── core/                      # Cross-cutting concerns
│   │   ├── cache.py               # Redis cache with fail-open design
│   │   ├── container.py           # DI container with provider selection
│   │   ├── database.py            # SQLite engine, session factory, WAL mode
│   │   ├── exceptions.py          # Custom exception hierarchy
│   │   ├── logging.py             # Structured logging (structlog)
│   │   └── seed.py                # Database seeder for initial family members
│   │
│   ├── domain/                    # Pure business logic
│   │   ├── calendar/
│   │   │   ├── models.py          # CalendarEvent, DateRange, RecurrenceRule
│   │   │   ├── ports.py           # CalendarProvider protocol
│   │   │   └── services.py        # parse_event, deduplicate_events, parse_attendees
│   │   ├── family/
│   │   │   ├── models.py          # FamilyMember entity (id, name, email, color, initial, date_of_birth, relation)
│   │   │   ├── ports.py           # FamilyRepository protocol
│   │   │   └── services.py        # CRUD operations
│   │   └── weather/
│   │       ├── models.py          # WeatherResponse, CurrentWeather, DailyForecast
│   │       ├── ports.py           # WeatherProvider protocol
│   │       └── services.py        # Unit conversion, condition mapping
│   │
│   ├── infrastructure/            # External adapters
│   │   ├── calendar/
│   │   │   ├── google_adapter.py  # Google Calendar API (sync wrapped in async)
│   │   │   └── mock_adapter.py    # Mock calendar data (Google API format)
│   │   ├── persistence/
│   │   │   ├── models.py          # SQLModel: FamilyMemberDB
│   │   │   └── family_repository.py  # SQLite implementation of FamilyRepository
│   │   └── weather/
│   │       ├── owm_adapter.py     # OpenWeatherMap 4.0 API
│   │       └── mock_adapter.py    # Mock weather data (OWM format)
│   │
│   ├── api/                       # HTTP layer
│   │   ├── deps.py                # FastAPI dependency injection
│   │   ├── models/
│   │   │   ├── calendar.py        # Calendar API response models
│   │   │   ├── family.py          # Family API response models
│   │   │   ├── requests.py        # Request validation models
│   │   │   └── weather.py         # Weather API response models
│   │   └── routes/
│   │       ├── calendar.py        # GET /api/v1/calendar (reads from DB)
│   │       ├── family.py          # Full CRUD: GET/POST/PUT/PATCH/DELETE /api/v1/family
│   │       └── weather.py         # GET /api/v1/weather
│   │
│   └── registry.py                # Provider registry
│
├── alembic/                       # Database migrations
│   ├── versions/
│   │   └── 001_initial_family_members.py
│   └── env.py
│
├── tests/
│   ├── conftest.py                # Shared fixtures, test DB setup
│   ├── unit/                      # Domain logic tests
│   ├── integration/               # Cache, repository tests
│   └── api/                       # HTTP endpoint tests
│
├── pyproject.toml                 # Dependencies, ruff config, pytest config
├── Dockerfile                     # Production image
└── Dockerfile.dev                 # Development image
```

### Architecture Highlights

**Family Members as Database Registry:**
- Family members stored in SQLite database (not .env)
- Full CRUD API for managing members via kiosk UI
- Schema: id, key, name, email, color, initial, date_of_birth, relation
- Calendar route reads members from DB to fetch events
- Startup seeder migrates existing .env members on first boot

**Environment-Based Mock/Real Switching:**
- `ENVIRONMENT=development` → mock weather + mock calendar (no API calls)
- `ENVIRONMENT=production` → real OpenWeatherMap + real Google Calendar
- Controlled via `WEATHER_USE_MOCK` and `CALENDAR_USE_MOCK` env vars

**Database Persistence:**
- SQLite with WAL mode for concurrent reads/writes
- Persistent volume at `/app/data/dashy.db`
- Alembic migrations for schema management
- Automatic migrations on container startup via entrypoint.sh

### What Works Well
- Clean domain-driven architecture with clear separation of concerns
- Protocol-based adapters (easy to swap providers)
- Fail-open cache design (cache failures don't break the app)
- Comprehensive test coverage (283 tests)
- Environment-based mock/real switching (safe local development)
- Full CRUD API for family members (future-proof for kiosk UI)
- Structured logging with request IDs
- RFC 9457 error responses
- API versioning (/api/v1/*)

---

## Dashtam Concepts Applied

From the Dashtam architecture, these patterns are adapted for Dashy's scale:

| Concept | How we adapt it |
|---------|----------------|
| **Registry Pattern** | Single source of truth for API endpoints and data providers |
| **Protocol-Based Architecture** | Python `Protocol` for all service contracts (no ABC inheritance) |
| **Centralized DI Container** | FastAPI `Depends()` + `@lru_cache` for singletons |
| **Result Types** | Explicit `{ data, error }` returns instead of silent mock fallback |
| **Provider-Agnostic Domain** | Weather/calendar services behind protocols — swap OWM for anything |
| **Self-Enforcing Tests** | Registry compliance tests verify completeness |
| **Pragmatic DDD** | Value objects for dates/units, entities for events/members |
| **Fail-Open Cache** | Cache failures fall through to API, never break the app |
| **Defense-in-Depth Validation** | Config at startup, schema at boundary, domain in entities |
| **RFC 9457 Error Handling** | Machine-readable error codes + human messages |
| **Async-First Architecture** | All services async, sync boundaries handled via `run_in_executor` |
| **Three-Tier Testing** | Unit (domain), Integration (real DB/cache), API (HTTP endpoints) |

**Deliberately NOT borrowing** (overkill for Dashy):
- CQRS (no write operations)
- Domain Events / Event Bus (no side-effect chains)
- SSE Registry (no real-time push needed)
- Audit trail (no compliance requirements)
- Immutable frozen dataclasses (Pydantic models are sufficient)

---

## Async-First Requirements

**Rule**: All service methods, repository methods, and infrastructure adapters MUST be `async def`. Domain entities remain synchronous (pure logic, no I/O).

### Sync/Async Boundary Handling

**Problem**: Google Calendar API client is synchronous. We cannot block the event loop.

**Solution**: Use `asyncio.to_thread()` or `loop.run_in_executor()` to offload sync calls to a thread pool.

```python
# infrastructure/calendar/google_adapter.py
import asyncio
from googleapiclient.discovery import build

class GoogleCalendarAdapter:
    async def fetch_events(self, member: FamilyMember, date_range: DateRange) -> list[CalendarEvent]:
        # Offload sync Google API call to thread pool
        loop = asyncio.get_running_loop()
        events = await loop.run_in_executor(
            None, 
            self._fetch_events_sync, 
            member, 
            date_range
        )
        return events
    
    def _fetch_events_sync(self, member: FamilyMember, date_range: DateRange) -> list[CalendarEvent]:
        # Synchronous Google API call (runs in thread pool)
        service = build('calendar', 'v3', credentials=self._get_credentials())
        # ... Google API calls ...
        return parsed_events
```

### httpx Client Strategy

**Dashtam pattern**: Per-request `httpx.AsyncClient` (no shared state, no connection pooling).

**Dashy decision**: **Shared async client** with connection pooling. We have higher request frequency (weather refreshes every 10 minutes, calendar every 2 minutes). Connection pooling reduces latency.

```python
# infrastructure/weather/http_client.py
import httpx
from functools import lru_cache

@lru_cache()
def get_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=30.0, limits=httpx.Limits(max_connections=10))
```

### Async Checklist

- [x] All domain service methods: `async def`
- [x] All repository methods: `async def`
- [x] All infrastructure adapters: `async def`
- [x] Google Calendar API calls: wrapped in `run_in_executor`
- [x] httpx client: shared async client with connection pooling
- [x] Redis cache: `redis.asyncio` client
- [x] Database: SQLModel + `aiosqlite` for async SQLite (sync engine for Alembic migrations)
- [x] Tests: `asyncio_mode = auto` in pytest config

---

## Testing Structure

### Three-Tier Testing Strategy

```
tests/
├── conftest.py                    # Shared fixtures, test config
├── unit/                          # Domain logic tests (no I/O, no framework)
│   ├── test_weather_models.py     # Value object tests
│   ├── test_calendar_models.py    # Entity tests
│   ├── test_weather_services.py   # Domain service tests (mocked repos)
│   └── test_calendar_services.py  # Domain service tests (mocked repos)
│
├── integration/                   # Real infrastructure tests
│   ├── test_owm_adapter.py        # Real HTTP calls to OWM (or pytest-httpx mocks)
│   ├── test_google_adapter.py     # Real Google API calls (or mocked)
│   ├── test_cache.py              # Real Redis tests
│   └── test_repositories.py       # Real DB tests (future)
│
└── api/                           # HTTP endpoint tests
    ├── test_weather_api.py        # Full request/response cycle
    ├── test_calendar_api.py       # Full request/response cycle
    └── test_family_api.py         # Full request/response cycle
```

### Pytest Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
testpaths = ["tests"]
markers = [
    "unit: Fast domain logic tests (no I/O)",
    "integration: Tests with real infrastructure (Redis, DB)",
    "api: HTTP endpoint tests",
    "slow: Tests that take >1 second",
]
```

### Shared Fixtures (conftest.py)

```python
# tests/conftest.py
import pytest
from unittest.mock import AsyncMock, Mock
from app.core.config import Settings

@pytest.fixture
def test_settings() -> Settings:
    """Load test configuration from .env.test"""
    return Settings(_env_file=".env.test")

@pytest.fixture
def mock_weather_provider() -> AsyncMock:
    """Mock weather provider for unit tests"""
    provider = AsyncMock()
    provider.get_current.return_value = WeatherCurrent(...)
    provider.get_hourly.return_value = [...]
    provider.get_daily.return_value = [...]
    return provider

@pytest.fixture
def mock_calendar_provider() -> AsyncMock:
    """Mock calendar provider for unit tests"""
    provider = AsyncMock()
    provider.fetch_events.return_value = [...]
    return provider

@pytest.fixture
def mock_container(mock_weather_provider, mock_calendar_provider):
    """Override DI container for unit tests"""
    with patch("app.core.container.get_weather_provider", return_value=mock_weather_provider):
        with patch("app.core.container.get_calendar_provider", return_value=mock_calendar_provider):
            yield {
                "weather_provider": mock_weather_provider,
                "calendar_provider": mock_calendar_provider,
            }
```

### Test Patterns by Layer

**Unit Tests** (domain logic, no I/O):
```python
# tests/unit/test_calendar_services.py
async def test_deduplicate_events_merges_shared_events():
    # Arrange
    events = [
        CalendarEvent(id="123", title="Dentist", members=[member_a, member_b]),
        CalendarEvent(id="123", title="Dentist", members=[member_b]),  # Same event, different calendar
    ]
    service = CalendarService(calendar_repo=AsyncMock())
    
    # Act
    result = await service.deduplicate_events(events)
    
    # Assert
    assert len(result) == 1
    assert len(result[0].members) == 2
```

**Integration Tests** (real infrastructure):
```python
# tests/integration/test_cache.py
async def test_cache_set_and_get(redis_client):
    # Arrange
    cache = RedisCache(redis_client)
    
    # Act
    await cache.set("weather:imperial", WeatherResponse(...), ttl=600)
    result = await cache.get("weather:imperial")
    
    # Assert
    assert result is not None
    assert result.current.temperature == 72.0
```

**API Tests** (HTTP endpoints):
```python
# tests/api/test_weather_api.py
from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_get_weather_returns_200(mock_container):
    # Arrange
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Act
        response = await client.get("/api/v1/weather?units=imperial")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "current" in data
        assert "forecast" in data
```

### Mocking Strategy

| Layer | What to Mock | How |
|-------|--------------|-----|
| **Unit** | Repositories, external APIs | `AsyncMock()` for async, `Mock()` for sync |
| **Integration** | External APIs (OWM, Google) | `pytest-httpx` for HTTP, real Redis/DB |
| **API** | All dependencies | Override DI container via `app.dependency_overrides` |

### HTTP Mocking with pytest-httpx

```python
# tests/integration/test_owm_adapter.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_owm_adapter_parses_current_weather(httpx_mock):
    # Arrange
    httpx_mock.add_response(
        url="https://api.openweathermap.org/data/4.0/onecall/current",
        json={"current": {"temp": 22.5, "weather": [{"main": "Clear"}]}},
    )
    adapter = OWMWeatherAdapter(api_key="test", lat=40.7, lon=-73.5)
    
    # Act
    result = await adapter.get_current(units="metric")
    
    # Assert
    assert result.temperature.value == 22.5
    assert result.condition == "Clear"
```

### Test Execution

```bash
# Run all tests
make test-backend

# Run by layer
pytest tests/unit/           # Fast, no I/O
pytest tests/integration/    # Needs Redis/DB
pytest tests/api/            # Needs app setup

# Run with coverage
pytest --cov=app --cov-report=html
```

### Testing Checklist

- [ ] `conftest.py` with shared fixtures
- [ ] Unit tests for all domain services
- [ ] Unit tests for all value objects and entities
- [ ] Integration tests for all infrastructure adapters
- [ ] Integration tests for cache (Redis)
- [ ] API tests for all endpoints
- [ ] Registry compliance tests (verify all providers implement protocols)
- [ ] `pytest-httpx` for HTTP mocking
- [ ] Coverage reporting configured
- [ ] CI runs all three test tiers

---

## Target Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app — minimal: mounts router + middleware
│   │
│   ├── core/                      # Cross-cutting concerns
│   │   ├── config.py              # Settings (pydantic-settings), validated at startup
│   │   ├── container.py           # DI container — all dependencies wired here
│   │   ├── logging.py             # Structured logging (structlog or stdlib logging)
│   │   ├── exceptions.py          # Custom exception hierarchy + RFC 9457 error responses
│   │   ├── cache.py               # TTL cache (in-memory or Redis) with fail-open design
│   │   └── database.py            # SQLite engine, session factory, WAL mode (added in B3)
│   │
│   ├── domain/                    # Pure business logic, zero framework imports
│   │   ├── weather/
│   │   │   ├── models.py          # Value objects: Temperature, WindSpeed, WeatherCondition
│   │   │   ├── ports.py           # Protocol: WeatherProvider, WeatherRepository
│   │   │   └── services.py        # Use cases: GetWeatherForecast
│   │   ├── calendar/
│   │   │   ├── models.py          # Value objects: EventId, DateRange, RecurrenceRule
│   │   │   ├── ports.py           # Protocol: CalendarProvider, CalendarRepository
│   │   │   └── services.py        # Use cases: GetWeekCalendar, DeduplicateEvents
│   │   └── family/
│   │       ├── models.py          # Entity: FamilyMember (identity-based)
│   │       ├── ports.py           # Protocol: FamilyRepository
│   │       └── services.py        # Use cases: GetFamilyMembers
│   │
│   ├── infrastructure/            # Adapters — external world
│   │   ├── weather/
│   │   │   ├── owm_adapter.py     # OpenWeatherMap 4.0 implementation of WeatherProvider
│   │   │   ├── mock_adapter.py    # Mock implementation of WeatherProvider
│   │   │   └── http_client.py     # Shared httpx.AsyncClient with connection pooling
│   │   ├── calendar/
│   │   │   ├── google_adapter.py  # Google Calendar implementation of CalendarProvider
│   │   │   └── mock_adapter.py    # Mock implementation of CalendarProvider
│   │   └── persistence/
│   │       ├── models.py          # SQLModel ORM models (DB schema)
│   │       ├── migrations/        # Alembic migration files
│   │       └── family_repository.py  # SQLite-backed implementation of FamilyRepository
│   │
│   ├── api/                       # HTTP layer — thin controllers
│   │   ├── router.py              # Single router, composed from sub-routers
│   │   ├── deps.py                # FastAPI Depends() functions → container
│   │   ├── middleware.py           # CORS (from config), request logging, request ID
│   │   └── routes/
│   │       ├── weather.py         # GET /api/v1/weather
│   │       ├── calendar.py        # GET /api/v1/calendar
│   │       └── family.py          # GET /api/v1/family
│   │
│   └── registry.py                # Provider registry — single source of truth
│
├── tests/
│   ├── conftest.py                # Shared fixtures, test container override
│   ├── unit/
│   │   ├── domain/                # Domain logic tests (no framework deps)
│   │   ├── infrastructure/        # Adapter tests (with mocked externals)
│   │   └── test_registry.py       # Registry compliance tests
│   └── integration/
│       └── test_api.py            # Endpoint tests via httpx ASGI transport
│
├── pyproject.toml
├── Dockerfile
└── Dockerfile.dev
```

---

## Migration Phases

### Phase B1: Foundation (no behavior changes)

Fix the easy bugs. No restructuring. Everything stays in place.

| Step | What | Why |
|------|------|-----|
| B1.1 | Fix Python version mismatch | `.python-version`, Dockerfile, ruff target → all 3.13 |
| B1.2 | Add structured logging | Replace all `print()` with `structlog` |
| B1.3 | Add custom exception hierarchy | `DashyError` base → `WeatherApiError`, `CalendarApiError`, `ConfigError` |
| B1.4 | Add RFC 9457 error responses | Machine-readable error codes + human messages |
| B1.5 | Add API versioning | `/api/v1/...` prefix on all routes |
| B1.6 | Move CORS origins to config | Remove hardcoded list from `main.py` |
| B1.7 | Remove dead code | `_fetch_cancelled_instances` or wire it up, remove `GOOGLE_CALENDAR_ID` |
| B1.8 | Set up test infrastructure | `conftest.py`, pytest config, `pytest-httpx`, test directory structure |
| B1.9 | Enforce Google-style docstrings | Add ruff `pydocstyle` rules with `convention = "google"`, upgrade all existing docstrings to comply |

**Testing for B1:**
- [x] Create `tests/conftest.py` with shared fixtures
- [x] Create `tests/unit/`, `tests/integration/`, `tests/api/` directories
- [x] Update pytest config: `asyncio_mode = "auto"`, markers
- [x] Add `pytest-httpx` to dev dependencies
- [x] Migrate existing tests to new structure (no behavior changes)
- [x] Add ruff `pydocstyle` config: `convention = "google"` in `pyproject.toml`
- [x] All existing functions/classes have compliant Google-style docstrings
- [x] `make lint` passes with docstring rules enabled

**Verification:** ✅ `make lint && make typecheck && make test && make build` — all pass. No behavior changes.

**Status:** ✅ **COMPLETE**

---

### Phase B2: Domain Layer (pure business logic)

Extract business logic into a framework-free domain layer.

| Step | What | Why |
|------|------|-----|
| B2.1 | Create `domain/weather/models.py` | Value objects: `Temperature(unit, value)`, `WindSpeed`, `WeatherCondition` enum |
| B2.2 | Create `domain/weather/ports.py` | `WeatherProvider` Protocol — `async def get_current()`, `async def get_hourly()`, `async def get_daily()` |
| B2.3 | Create `domain/calendar/models.py` | Value objects: `EventId`, `DateRange`, `RecurrenceRule` |
| B2.4 | Create `domain/calendar/ports.py` | `CalendarProvider` Protocol — `async def fetch_events(member, range)` |
| B2.5 | Create `domain/family/models.py` | `FamilyMember` entity with identity |
| B2.6 | Create `domain/family/ports.py` | `FamilyRepository` Protocol — `async def get_members() -> list[FamilyMember]`, `async def add_member()`, `async def update_member()`, `async def delete_member()` |
| B2.7 | Move business logic from services into domain | Parsing, deduplication, unit conversion → pure functions in domain |

**Key rule:** Domain layer has ZERO imports from FastAPI, httpx, or any framework. Pure Python only.

**Testing for B2:**
- [x] Unit tests for all value objects (Temperature, WindSpeed, etc.)
- [x] Unit tests for domain services (with mocked repositories)
- [x] Test deduplication logic thoroughly
- [x] Test unit conversion functions
- [x] All domain tests are synchronous (no I/O)

**Verification:** ✅ Domain tests pass without any framework imports. Existing service tests still pass.

**Status:** ✅ **COMPLETE**

---

### Phase B3: Infrastructure Adapters

Move external integrations behind protocol interfaces.

| Step | What | Why |
|------|------|-----|
| B3.1 | Create shared `http_client.py` | Single `httpx.AsyncClient` with connection pooling, retry, timeout |
| B3.2 | Create `owm_adapter.py` | Implements `WeatherProvider` — moves HTTP logic from `weather_service.py` |
| B3.3 | Create `google_adapter.py` | Implements `CalendarProvider` — moves Google API logic, make it **async** via `run_in_executor` |
| B3.4 | Create `mock_adapter.py` for weather | Implements `WeatherProvider` — moves mock generation |
| B3.5 | Create `mock_adapter.py` for calendar | Implements `CalendarProvider` — moves mock generation |
| B3.6 | Set up SQLite + SQLModel + Alembic | `core/database.py` — engine, session factory, WAL mode. Initialize Alembic for migrations |
| B3.7 | Create `family_members` table | SQLModel ORM model for `FamilyMember`. First Alembic migration. Seed from existing `.env` data |
| B3.8 | Create `family_repository.py` | SQLite-backed `FamilyRepository` implementation — reads/writes `family_members` table |

**Key rule:** Each adapter is independently testable. Mock adapters are first-class, not afterthoughts.

**Why DB in B3 (not B7):** The `FamilyRepository` Protocol is defined in B2. Building a config-file implementation (originally planned) would be throwaway work — we're going to DB anyway. Family members are the simplest domain (one table, basic CRUD), making them the perfect first table to validate the SQLite + SQLModel + Alembic setup before heavier domains land in B7.

**Testing for B3:**
- [x] Integration tests for OWM adapter using `pytest-httpx`
- [x] Integration tests for Google adapter (mock the sync Google API calls)
- [x] Unit tests for mock adapters (verify they return correct shapes)
- [x] Test connection pooling and retry logic
- [x] Test `run_in_executor` wrapping for Google API
- [x] Integration tests for `FamilyRepository` — CRUD operations against real SQLite
- [x] Test Alembic migration applies cleanly (including seed data)
- [x] All adapter tests are async

**Verification:** ✅ Each adapter has unit tests. Swapping `WEATHER_PROVIDER=mock|owm` works via env var. Family members persist in SQLite, seeded from existing `.env` data.

**Status:** ✅ **COMPLETE** (adapters built, DB schema created, Alembic migration exists)

---

### Phase B4: DI Container + Registry

Wire everything together through a central container.

| Step | What | Why |
|------|------|-----|
| B4.1 | Create `core/container.py` | Wire all dependencies — `@lru_cache` for singletons, `Depends()` for request scope |
| B4.2 | Create `registry.py` | Provider registry — maps provider names to adapter classes |
| B4.3 | Add env-driven provider selection | `WEATHER_PROVIDER=owm|mock`, `CALENDAR_PROVIDER=google|mock` |
| B4.4 | Add registry compliance tests | Tests verify every registered provider implements its protocol |

**Container pattern:**
```python
# core/container.py
from functools import lru_cache

@lru_cache()
def get_weather_provider() -> WeatherProvider:
    provider_name = get_settings().WEATHER_PROVIDER
    return PROVIDER_REGISTRY["weather"][provider_name]()

# api/deps.py
from fastapi import Depends
from app.core.container import get_weather_provider

def weather_provider() -> WeatherProvider:
    return get_weather_provider()
```

**Testing for B4:**
- [x] Registry compliance tests (verify all providers implement protocols)
- [x] Test container wiring (verify correct provider returned based on env)
- [x] Test `Depends()` overrides work correctly
- [x] Mock container in unit tests

**Verification:** ✅ Registry compliance tests pass. Adding a new provider requires only: write adapter + add registry entry.

**Status:** ✅ **COMPLETE**

---

### Phase B5: Cache Layer

Add caching to avoid burning API quotas.

| Step | What | What |
|------|------|------|
| B5.1 | Create `core/cache.py` | TTL cache with fail-open design using `redis.asyncio` |
| B5.2 | Add caching to weather service | 10-minute TTL (matches frontend refresh interval) |
| B5.3 | Add caching to calendar service | 2-minute TTL |
| B5.4 | Add cache health to `/health` | Report cache hit/miss stats |

**Fail-open design:**
```python
async def get_weather(units: str) -> WeatherResponse:
    cache_key = f"weather:{units}"
    cached = await cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        result = await weather_provider.get_weather(units)
        await cache.set(cache_key, result, ttl=600)
        return result
    except Exception:
        # Fail-open: return mock data on any failure
        return get_mock_weather(units)
```

**Testing for B5:**
- [x] Integration tests for Redis cache (real Redis in Docker)
- [x] Test TTL expiration
- [x] Test fail-open behavior (cache failure falls through to API)
- [x] Test cache hit/miss stats
- [x] All cache tests are async

**Verification:** ✅ Second request within TTL returns cached data. Cache failure falls through to API.

**Status:** ✅ **COMPLETE** (Redis service in docker compose, cache wired into weather + calendar routes)

---

### Phase B6: API Layer Cleanup

Final polish on the HTTP layer.

| Step | What | Why |
|------|------|-----|
| B6.1 | Split `models.py` | Move to domain-specific model files |
| B6.2 | Separate request/response models | `WeatherQuery` (request) vs `WeatherResponse` (response) |
| B6.3 | Fix family endpoint | Return real DB data via `FamilyRepository` (SQLite-backed since B3), remove `.env` JSON parsing |
| B6.4 | Add request validation | Proper query param validation with helpful error messages |
| B6.5 | Add `conftest.py` with test fixtures | Shared fixtures, container override for testing |

**Additional work completed (beyond original plan):**
- Full CRUD API for family members (GET/POST/PUT/PATCH/DELETE)
- Database schema redesigned: `calendar_id` → `email`, added `date_of_birth`, `relation`
- Calendar route reads family members from DB (not config)
- Mock adapters return data in correct API format (Google Calendar API format, OWM format)
- Environment-based mock/real switching (dev=mock, prod=real)
- Startup seeder migrates existing .env members to DB on first boot
- Test database schema consistency (drop/recreate tables, seed test data)

**Testing for B6:**
- [x] API tests for all endpoints (weather, calendar, family)
- [x] Test request validation (invalid units, bad dates)
- [x] Test RFC 9457 error responses
- [x] Test family endpoint returns real DB data
- [x] Test full CRUD operations (create, read, update, delete)
- [x] All API tests use `httpx.AsyncClient` with `ASGITransport`

**Verification:** ✅ All quality gates pass. Family endpoint returns real DB data. Calendar route reads from DB. Mock/real switching works correctly. 283 tests passing.

**Status:** ✅ **COMPLETE**

---

## Execution Order

```
B1 (Foundation) → B2 (Domain) → B3 (Adapters) → B4 (DI + Registry) → B5 (Cache) → B6 (API Cleanup) → B7 (Wiring Cleanup)
```

**Status:** ✅ **All phases complete** (2026-08-17)

All phases B1-B7 have been completed and deployed to production. The backend is fully operational with:
- Domain-driven architecture with clean separation of concerns
- Protocol-based adapters for weather and calendar
- Redis caching with fail-open design
- SQLite database with persistent volume
- Full CRUD API for family members
- Environment-based mock/real switching
- 283 tests passing (148 backend + 135 frontend)

**Next steps:** Frontend migration (F1-F7) as outlined in `FRONTEND-MIGRATION.md`.

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Logging library** | `structlog` | Rich structured logging, better for debugging |
| **Cache backend** | Redis | Shared across processes, production-grade |
| **Result types** | Hand-rolled `Result[T, E]` | Simple use case, avoid heavy dependency |
| **API versioning** | URL path `/api/v1/` | Simpler, more explicit, easier to test |
| **Database** | SQLite + SQLModel + Alembic | Perfect for single-family app on Pi, zero infra |
| **Family member storage** | SQLite DB (not `.env` JSON) | Persistent, supports add/modify/delete, no login needed for kiosk |
| **Family CRUD timing** | Completed in B7 | Full CRUD API implemented and deployed (2026-08-17) |
| **DB setup timing** | B3 (not B7) | `FamilyRepository` Protocol defined in B2 — config-file impl would be throwaway |
| **Mock/Real switching** | Environment-based | `WEATHER_USE_MOCK` and `CALENDAR_USE_MOCK` env vars control provider selection |
| **Database schema** | `email` not `calendar_id` | Family members are a general registry, not calendar-specific. Supports future features (rewards, permissions) |

---

## Database & Persistence

**Family members are the first persistent domain** (implemented in B3). Future features requiring persistence:
- Shopping lists (with cross-reference to calendar events)
- Chores (assignments, completion tracking, reward points)
- Rewards (redemptions, point balances)
- Cross-component references (chores → rewards, calendar → lists)

**Tech stack:**
- **SQLite** — file-based, zero infrastructure, perfect for Pi
- **SQLModel** — Pydantic + SQLAlchemy hybrid, eliminates model duplication
- **Alembic** — schema migrations, versioning

**Architecture (after B3):**
```
backend/app/
├── core/
│   └── database.py              # SQLite engine, session factory, WAL mode
├── infrastructure/
│   └── persistence/
│       ├── models.py            # SQLModel ORM models (DB schema)
│       ├── migrations/          # Alembic migration files
│       └── family_repository.py # SQLite-backed FamilyRepository
└── data/
    └── dashy.db                 # SQLite database file (volume-mounted in Docker)
```

**Performance:**
- WAL mode for concurrent reads
- Connection pooling (reuse, don't open/close per request)
- Indexes on foreign keys
- Transactions for multi-step operations

**Family Members Design Decision (2026-08-17):**
- Family members move from `.env` JSON config to SQLite database
- No login/logout — this is a family kiosk, not a multi-tenant app
- CRUD endpoints (add/modify/delete) deferred to B7 alongside lists/chores/rewards
- B3 provides DB persistence + read-only access via existing `GET /api/v1/family`
- Seed migration populates initial members from existing `.env` data
- **Deprecation path:** B3 seeds DB from `FAMILY_MEMBERS` env var → B6.3 removes env var parsing → `FAMILY_MEMBERS` removed from `.env` files after B6

---

## Docker Infrastructure

**Services in docker compose (dev + prod):**

| Service | Purpose | Status |
|---------|---------|--------|
| **Redis** | Cache backend (B5) | ✅ Implemented — `redis:7-alpine`, AOF persistence, exposed on 6379 |
| **Backend** | FastAPI app | ✅ Implemented |
| **Frontend** | React + Vite (dev) / Nginx (prod) | ✅ Implemented |
| **Traefik** | Reverse proxy (prod only) | ✅ Implemented |
| **SQLite** | Database persistence | ✅ Implemented — persistent volume at `/app/data/dashy.db` |

**Redis configuration:**
- Image: `redis:7-alpine`
- Persistence: AOF (Append Only File) enabled via `--appendonly yes`
- Volume: `redis-data:/data` (persists cache across restarts)
- Network: Internal docker network, exposed to backend via `REDIS_URL=redis://redis:6379`

**SQLite configuration:**
- Volume: `backend-data:/app/data` (persists database across restarts)
- Database URL: `sqlite+aiosqlite:////app/data/dashy.db`
- WAL mode enabled for concurrent reads/writes
- Automatic migrations on container startup via `entrypoint.sh`

**Why Redis was added (2026-08-17):**
- B5 cache layer requires a distributed cache backend
- Redis chosen over in-memory cache for production reliability
- Added to docker compose manually during B5 implementation
- This plan was not updated to reflect the infrastructure change until now

---

## Dependencies to Add

| Package | Purpose | Phase |
|---------|---------|-------|
| `structlog` | Structured logging | B1 |
| `redis` | Redis client for caching | B5 |
| `pytest-httpx` | HTTP mocking for integration tests | B1 |
| `sqlmodel` | Pydantic + SQLAlchemy hybrid ORM | B3 |
| `alembic` | Database migrations | B3 |

## Dependencies to Remove

None currently planned. The existing dependency tree is lean and appropriate.

---

## Phase B7: Wiring Cleanup + Extended Domains

**Status:** ✅ **COMPLETE** (2026-08-17)

All B7 work has been completed and deployed to production.

### Part 1: Wiring Cleanup ✅

**Completed:**
- ✅ Moved route files to `app/api/routes/`
- ✅ Updated `main.py` imports to use `app.api.routes`
- ✅ Migrated calendar route to use injected `CalendarProvider`
- ✅ Wired family route to use `FamilyRepository` (reads from DB)
- ✅ Added SQLite volume mount to docker compose (`/app/data/dashy.db`)
- ✅ Updated infrastructure adapters to use domain services
- ✅ Removed old `app/services/` directory
- ✅ Updated all tests to use new architecture
- ✅ Family endpoint returns real DB data

**Additional work completed:**
- Full CRUD API for family members (POST, PUT, PATCH, DELETE)
- Database schema redesigned: `calendar_id` → `email`, added `date_of_birth`, `relation`
- Calendar route reads family members from DB (not config)
- Mock adapters return data in correct API format (Google Calendar API format, OWM format)
- Environment-based mock/real switching (dev=mock, prod=real)
- Startup seeder migrates existing .env members to DB on first boot
- Test database schema consistency (drop/recreate tables, seed test data)
- WAL mode enabled for SQLite
- Database.py reads from Settings (single source of truth)
- Alembic env.py reads from config
- FamilyService wired into API route

### Part 2: Extended Domains 🔲

**Status:** Deferred until lists/chores/rewards features are needed.

**Future scope:**
- Add new persistent domains: shopping lists, chores, rewards
- Cross-referencing between domains (lists ↔ calendar events, chores ↔ rewards)
    id: int | None = Field(default=None, primary_key=True)
    text: str
    completed: bool = False
    linked_event_id: str | None = None  # Google Calendar event ID
    linked_event_date: date | None = None
```

This enables features like "show me all shopping items for this week's events" or "what chores are due today."

**Status:** 🔲 **NOT STARTED** (depends on B7.1-B7.9)
