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
    tables exist in the test database with the current schema.
    Drops and recreates tables to ensure schema consistency.
    Seeds the database with test family members for calendar tests.
    """
    from app.core.database import sync_engine, get_async_session_factory
    from sqlmodel import SQLModel
    from app.infrastructure.persistence.models import FamilyMemberDB
    
    # Drop all tables and recreate to ensure schema matches current models
    SQLModel.metadata.drop_all(sync_engine)
    SQLModel.metadata.create_all(sync_engine)
    
    # Seed test family members for calendar tests
    from app.domain.family.models import FamilyMember
    from app.infrastructure.persistence.family_repository import FamilyRepositoryImpl
    import asyncio
    
    async def seed_test_data():
        session_factory = get_async_session_factory()
        async with session_factory() as session:
            repo = FamilyRepositoryImpl(session)
            test_members = [
                FamilyMember(id="faiyaz", name="Faiyaz", email="faiyaz@test.com", color="#4A90E2", initial="F"),
                FamilyMember(id="trisha", name="Trisha", email="trisha@test.com", color="#E24A8D", initial="T"),
            ]
            for member in test_members:
                await repo.save(member)
    
    asyncio.run(seed_test_data())
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
