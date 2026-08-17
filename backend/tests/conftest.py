"""Shared pytest fixtures for Dashy tests.

Provides test configuration, mock providers, and container overrides
for unit, integration, and API tests.
"""

from unittest.mock import AsyncMock

import pytest

from app.config import Settings
from app.core.database import create_db_and_tables


@pytest.fixture(autouse=True, scope="session")
def setup_test_database():
    """Create database tables before any tests run.

    This fixture runs once per test session and ensures all SQLModel
    tables exist in the test database.
    """
    create_db_and_tables()
    yield


@pytest.fixture
def test_settings() -> Settings:
    """Load test configuration from .env.test.

    Returns:
        Settings instance configured for testing.
    """
    return Settings(_env_file=".env.test")


@pytest.fixture
def mock_weather_provider() -> AsyncMock:
    """Mock weather provider for unit tests.

    Returns:
        AsyncMock configured with weather provider methods.
    """
    provider = AsyncMock()
    provider.get_current.return_value = None
    provider.get_hourly.return_value = []
    provider.get_daily.return_value = []
    return provider


@pytest.fixture
def mock_calendar_provider() -> AsyncMock:
    """Mock calendar provider for unit tests.

    Returns:
        AsyncMock configured with calendar provider methods.
    """
    provider = AsyncMock()
    provider.fetch_events.return_value = []
    return provider
