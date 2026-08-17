# Backend Migration Plan

> Status: **COMPLETED**
> Created: 2026-08-16
> Completed: 2026-08-17
> Scope: Restructure backend for dependency injection, configuration-driven design, provider-agnostic architecture, caching, clean separation of concerns, and database persistence for family members.

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

### Directory Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration, health/root endpoints
│   ├── config.py             # Settings (pydantic-settings), FamilyMemberConfig class
│   ├── models.py             # All Pydantic models in one file (~120 lines)
│   ├── routes/
│   │   ├── weather.py        # GET /api/weather
│   │   ├── calendar.py       # GET /api/calendar
│   │   └── family.py         # GET /api/family (always returns mock data)
│   └── services/
│       ├── weather_service.py  # ~330 lines, module-level functions, no classes
│       ├── calendar_service.py # ~340 lines, SYNCHRONOUS in async framework
│       └── mock_data.py        # ~300 lines, mock generators
└── tests/
    ├── test_api.py
    ├── test_weather_service.py
    ├── test_weather_units.py
    └── test_calendar.py
```

### Critical Issues Found

| # | Issue | Impact |
|---|-------|--------|
| 1 | No dependency injection | Global `settings` singleton imported directly everywhere |
| 2 | No caching | Every request = 3-5 OWM calls + N Google API calls |
| 3 | Sync calendar service in async framework | Blocks the event loop |
| 4 | `config.py` mixes config + business logic | `get_family_members()` parses JSON inside Settings class |
| 5 | `print()` for error logging | No structured logging, no log levels, no aggregation |
| 6 | No custom exceptions | Broad `except Exception` catches everything silently |
| 7 | `models.py` is a dumping ground | All domains in one file |
| 8 | `DailyForecast` has ~25 optional fields | God-model, unclear which fields are populated when |
| 9 | Family endpoint always returns mock | Ignores config entirely |
| 10 | `GOOGLE_CALENDAR_ID` declared but unused | Dead config, required in env but never referenced |
| 11 | `httpx.AsyncClient` created per request | No connection pooling |
| 12 | Python version mismatch | `.python-version`=3.14, Dockerfile=3.13, ruff=py313 |
| 13 | No API versioning | Breaking changes require coordination |
| 14 | CORS origins hardcoded in `main.py` | Not configurable |
| 15 | Dead code | `_fetch_cancelled_instances` defined but never called |
| 16 | Mock data has hardcoded timezone | Breaks outside Eastern Time (EDT `-14400`) |
| 17 | No request validation | Invalid `units` silently coerced, dates accept garbage |
| 18 | No rate limiting | Any client can burn through OWM/Google API quotas |
| 19 | Mock data imports from weather_service | Circular dependency risk |
| 20 | Calendar service knows about `FamilyMemberConfig` | Tight coupling to config internals |
| 21 | Family members stored in `.env` JSON | No add/modify/delete capability, not persistent across deployments, no validation |

### What Works Well (preserve these)
- Clean route/service separation (routes are thin)
- Good test coverage with meaningful assertions
- Mock data flows through same parser as real data (code parity)
- Proper Pydantic response validation
- Docker-first development setup

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

- [ ] All domain service methods: `async def`
- [ ] All repository methods: `async def`
- [ ] All infrastructure adapters: `async def`
- [ ] Google Calendar API calls: wrapped in `run_in_executor`
- [ ] httpx client: shared async client with connection pooling
- [ ] Redis cache: `redis.asyncio` client
- [ ] Database (future): `asyncpg` via SQLAlchemy async
- [ ] Tests: `asyncio_mode = auto` in pytest config

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
- [ ] Create `tests/conftest.py` with shared fixtures
- [ ] Create `tests/unit/`, `tests/integration/`, `tests/api/` directories
- [ ] Update pytest config: `asyncio_mode = "auto"`, markers
- [ ] Add `pytest-httpx` to dev dependencies
- [ ] Migrate existing tests to new structure (no behavior changes)
- [ ] Add ruff `pydocstyle` config: `convention = "google"` in `pyproject.toml`
- [ ] All existing functions/classes have compliant Google-style docstrings
- [ ] `make lint` passes with docstring rules enabled

**Verification:** `make lint && make typecheck && make test && make build` — all pass. No behavior changes.

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
- [ ] Unit tests for all value objects (Temperature, WindSpeed, etc.)
- [ ] Unit tests for domain services (with mocked repositories)
- [ ] Test deduplication logic thoroughly
- [ ] Test unit conversion functions
- [ ] All domain tests are synchronous (no I/O)

**Verification:** Domain tests pass without any framework imports. Existing service tests still pass.

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
- [ ] Integration tests for OWM adapter using `pytest-httpx`
- [ ] Integration tests for Google adapter (mock the sync Google API calls)
- [ ] Unit tests for mock adapters (verify they return correct shapes)
- [ ] Test connection pooling and retry logic
- [ ] Test `run_in_executor` wrapping for Google API
- [ ] Integration tests for `FamilyRepository` — CRUD operations against real SQLite
- [ ] Test Alembic migration applies cleanly (including seed data)
- [ ] All adapter tests are async

**Verification:** Each adapter has unit tests. Swapping `WEATHER_PROVIDER=mock|owm` works via env var. Family members persist in SQLite, seeded from existing `.env` data.

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
- [ ] Registry compliance tests (verify all providers implement protocols)
- [ ] Test container wiring (verify correct provider returned based on env)
- [ ] Test `Depends()` overrides work correctly
- [ ] Mock container in unit tests

**Verification:** Registry compliance tests pass. Adding a new provider requires only: write adapter + add registry entry.

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
- [ ] Integration tests for Redis cache (real Redis in Docker)
- [ ] Test TTL expiration
- [ ] Test fail-open behavior (cache failure falls through to API)
- [ ] Test cache hit/miss stats
- [ ] All cache tests are async

**Verification:** Second request within TTL returns cached data. Cache failure falls through to API.

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

**Testing for B6:**
- [ ] API tests for all endpoints (weather, calendar, family)
- [ ] Test request validation (invalid units, bad dates)
- [ ] Test RFC 9457 error responses
- [ ] Test family endpoint returns real config data
- [ ] All API tests use `httpx.AsyncClient` with `ASGITransport`

**Verification:** Full quality gate passes. API docs at `/docs` are accurate.

---

## Execution Order

```
B1 (Foundation) → B2 (Domain) → B3 (Adapters) → B4 (DI + Registry) → B5 (Cache) → B6 (API Cleanup)
```

Each phase is independently deployable. No phase requires a later phase to be complete.

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
| **Family CRUD timing** | Deferred to B7 | Persistence in B3, management endpoints alongside lists/chores/rewards |
| **DB setup timing** | B3 (not B7) | `FamilyRepository` Protocol defined in B2 — config-file impl would be throwaway |

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

## Future Phase: Extended Domains + Family CRUD (B7)

**When to implement:** After B1-B6 are complete, when you're ready to add lists, chores, or rewards features.

**Scope:**
- Add family member CRUD endpoints (`POST`, `PUT`, `DELETE /api/v1/family`)
- Add new persistent domains: shopping lists, chores, rewards
- Cross-referencing between domains (lists ↔ calendar events, chores ↔ rewards)

**New domains to add:**
```
backend/app/
├── domain/
│   └── lists/                   # First new persistent domain
│       ├── models.py
│       ├── ports.py
│       └── services.py
├── infrastructure/
│   └── persistence/
│       ├── list_repository.py   # Implements ListRepository Protocol
│       ├── chore_repository.py  # Implements ChoreRepository Protocol
│       └── reward_repository.py # Implements RewardRepository Protocol
```

**Migration strategy for new tables:**
1. Add SQLModel ORM models to `persistence/models.py`
2. Generate migration: `alembic revision --autogenerate -m "add lists"`
3. Apply: `alembic upgrade head`

**Cross-referencing example:**
```python
# Shopping list item linked to calendar event
class ListItem(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str
    completed: bool = False
    linked_event_id: str | None = None  # Google Calendar event ID
    linked_event_date: date | None = None
```

This enables features like "show me all shopping items for this week's events" or "what chores are due today."
