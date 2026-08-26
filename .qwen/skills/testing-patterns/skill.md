---
name: testing-patterns
description: Testing patterns for Dashy — test isolation, mock vs real repositories, environment setup, when to use integration vs unit tests.
---

# Testing Patterns

Dashy uses a three-tier testing strategy with strict isolation between environments. This skill covers the patterns and conventions that apply across all tests.

## When to Use

- Writing new tests (unit, integration, API)
- Debugging test failures
- Setting up test fixtures or mocks
- Understanding when to use mock vs real repositories
- Troubleshooting test database issues

## Test Isolation

### Database isolation

**Critical rule:** Tests never use the development database.

- **Dev database:** PostgreSQL `dashy` database on `postgres-data` Docker volume (persists across restarts)
- **Test database:** PostgreSQL `dashy_test` database (isolated, cleaned between tests via savepoint rollback)

The test database is configured via `POSTGRES_*` env vars in `.env.test`:

```python
# conftest.py sets up test database connection
# POSTGRES_DB=dashy_test in .env.test ensures tests use isolated database
# Savepoint-based rollback cleans data between tests without dropping tables
```

**Why isolation matters:** Tests connect to a separate `dashy_test` database so they never modify development data. Savepoint rollback ensures each test starts with a clean state.

### Environment isolation

Tests run with `ENVIRONMENT=testing`, which:
- Loads `.env.test` instead of `.env.dev`
- Uses test-specific configuration (separate database, mock flags)
- Prevents accidental writes to dev database

### Running tests

```bash
# From orchestrator root
make test-api          # Run API tests only
make test-kiosk        # Run kiosk tests only
make test              # Run both

# Never run tests directly on host
# ❌ pytest tests/
# ✅ docker compose -f compose/docker-compose.dev.yml exec -T api uv run pytest tests/ -v
```

## Mock vs Real Repositories

Dashy uses the repository pattern with Protocol-based interfaces. Tests can use either mock or real implementations.

### When to use mock repositories

- **Unit tests** — test business logic in isolation
- **Fast feedback** — no database setup/teardown
- **Deterministic** — mock returns predictable data
- **Edge cases** — easily simulate errors, empty data, timeouts

Example:

```python
@pytest.fixture
def mock_chore_repository() -> AsyncMock:
    """Mock chore repository for unit tests."""
    repo = AsyncMock(spec=ChoreRepository)
    repo.get_all.return_value = [
        ChoreMaster(id="1", name="Dishes", ...),
        ChoreMaster(id="2", name="Laundry", ...),
    ]
    return repo

async def test_get_overdue_chores(mock_chore_repository: AsyncMock):
    """Test overdue chore detection logic."""
    service = ChoreService(mock_chore_repository)
    overdue = await service.get_overdue_chores()
    assert len(overdue) == 1
    mock_chore_repository.get_all.assert_called_once()
```

### When to use real repositories

- **Integration tests** — test database queries, migrations, constraints
- **API tests** — test full request/response cycle
- **Complex queries** — test joins, aggregations, transactions
- **Migration validation** — ensure schema changes work correctly

Example:

```python
async def test_create_chore_instance(test_db_session):
    """Test creating a chore instance in the database."""
    repo = ChoreRepositoryImpl(test_db_session)
    
    master = ChoreMaster(name="Dishes", frequency_days=1)
    await repo.save_master(master)
    
    instance = ChoreInstance(
        master_id=master.id,
        assigned_to="faiyaz",
        due_date=date.today(),
    )
    await repo.save_instance(instance)
    
    retrieved = await repo.get_instance(instance.id)
    assert retrieved is not None
    assert retrieved.assigned_to == "faiyaz"
```

### Mock flags in configuration

Some features use environment flags to toggle between mock and real implementations:

```python
# app/config.py
CHORES_USE_MOCK: bool = True  # Dev/test
WEATHER_USE_MOCK: bool = True  # Dev
CALENDAR_USE_MOCK: bool = True  # Dev
```

In production, these are set to `false` in `.env.prod`.

## Three-Tier Testing Strategy

### Tier 1: Unit tests

**Purpose:** Test individual functions/classes in isolation.

**Characteristics:**
- Fast (< 10ms per test)
- No database, no network, no file I/O
- Use mocks for all dependencies
- Test business logic, validation, transformations

**Location:** `tests/unit/`

**Example:**

```python
def test_calculate_overdue_status():
    """Test overdue calculation logic."""
    due_date = date(2026, 8, 15)
    today = date(2026, 8, 18)
    assert is_overdue(due_date, today) is True
```

### Tier 2: Integration tests

**Purpose:** Test database interactions, repository implementations, migrations.

**Characteristics:**
- Moderate speed (10-100ms per test)
- Use real database (test.db)
- Test queries, constraints, transactions
- Verify migrations work correctly

**Location:** `tests/integration/`

**Example:**

```python
async def test_chore_repository_save_and_retrieve(test_db_session):
    """Test repository save and retrieve operations."""
    repo = ChoreRepositoryImpl(test_db_session)
    
    master = ChoreMaster(name="Dishes", frequency_days=1)
    saved = await repo.save_master(master)
    
    retrieved = await repo.get_master(saved.id)
    assert retrieved is not None
    assert retrieved.name == "Dishes"
```

### Tier 3: API tests

**Purpose:** Test full HTTP request/response cycle.

**Characteristics:**
- Slower (100-500ms per test)
- Use TestClient with real database
- Test authentication, validation, error handling
- Verify API contracts

**Location:** `tests/api/`

**Example:**

```python
async def test_create_chore_master(client: AsyncClient):
    """Test POST /api/v1/chores/masters endpoint."""
    response = await client.post(
        "/api/v1/chores/masters",
        json={
            "name": "Dishes",
            "description": "Wash all dishes",
            "frequency_days": 1,
            "estimated_minutes": 15,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Dishes"
    assert "id" in data
```

## Test Fixtures

### Database fixtures

The `setup_test_database` fixture in `conftest.py` runs once per session:

```python
@pytest.fixture(autouse=True, scope="session")
def setup_test_database():
    """Create database tables before any tests run."""
    from sqlmodel import SQLModel
    from app.core.database import sync_engine
    
    # Drop all tables and recreate to ensure schema matches current models
    SQLModel.metadata.drop_all(sync_engine)
    SQLModel.metadata.create_all(sync_engine)
    
    # Seed test data if needed
    yield
```

**Why drop and recreate?** Ensures tests always run against the current schema, even if migrations are out of sync. This is safe because tests use an isolated `test.db`.

### Session fixtures

For tests that need a database session:

```python
@pytest.fixture
async def test_db_session():
    """Provide a database session for integration tests."""
    from app.core.database import get_async_session_factory
    
    session_factory = get_async_session_factory()
    async with session_factory() as session:
        yield session
        await session.rollback()  # Rollback after each test
```

### Mock fixtures

For unit tests:

```python
@pytest.fixture
def mock_weather_provider() -> AsyncMock:
    """Mock weather provider for unit tests."""
    provider = AsyncMock()
    provider.get_current.return_value = None
    provider.get_hourly.return_value = []
    provider.get_daily.return_value = []
    return provider
```

## Common Patterns

### Testing async code

Use `pytest.mark.asyncio` with `asyncio_mode = "auto"`:

```python
@pytest.mark.asyncio
async def test_async_function():
    """Test async function."""
    result = await async_function()
    assert result == expected
```

### Testing exceptions

```python
import pytest

async def test_repository_raises_on_not_found():
    """Test repository raises error when entity not found."""
    repo = ChoreRepositoryImpl(session)
    with pytest.raises(ChoreNotFoundError):
        await repo.get_master("nonexistent-id")
```

### Testing with different environments

```python
def test_config_loads_correct_env():
    """Test configuration loads correct environment."""
    settings = Settings(_env_file=".env.test")
    assert settings.ENVIRONMENT == "testing"
    assert settings.POSTGRES_DB == "dashy_test"
```

## Troubleshooting

### Tests are using dev database

**Symptom:** Tests modify dev database instead of test database

**Cause:** `.env.test` not loaded or `POSTGRES_DB` not set to `dashy_test`

**Fix:** Ensure `.env.test` is loaded by conftest.py and contains `POSTGRES_DB=dashy_test`. The test database is configured via environment variables, not hardcoded URLs.

### Tests are slow

**Symptom:** Tests take > 1 second each

**Causes:**
- Using real database when mock would suffice
- Not using fixtures efficiently
- Network calls in tests

**Fix:** Use mocks for unit tests, real database only for integration/API tests.

### Test data persists between runs

**Symptom:** Test data appears in dev environment

**Cause:** Tests using dev database instead of test database

**Fix:** Check `conftest.py` environment setup order (see above).

### Migration tests fail

**Symptom:** Integration tests fail with "table already exists" or "no such table"

**Cause:** Test database schema out of sync with models

**Fix:** The `setup_test_database` fixture drops and recreates tables automatically. If this fails, check that all models are imported in `conftest.py`.

## Checklist for New Tests

- [ ] Test uses correct tier (unit/integration/API)
- [ ] Test uses mocks for unit tests, real database for integration/API
- [ ] Test does not modify dev database
- [ ] Test fixtures are properly scoped (session vs function)
- [ ] Async tests use `@pytest.mark.asyncio`
- [ ] Test names describe what is being tested
- [ ] Test data is realistic but minimal
- [ ] Test passes in isolation and as part of full suite

## Related Skills

- **dashy-api:** `add-backend-test` — step-by-step guide for adding tests
- **dashy-kiosk:** `add-frontend-test` — frontend testing patterns
- **quality-gate** — running the full test suite
- **dev-env** — development environment setup
