"""Database configuration and session management."""

import os

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session, SQLModel, create_engine

# Database URL - use environment variable or default
# For async SQLite, use sqlite+aiosqlite://
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./dashy.db")

# Convert async URL to sync URL for migrations
SYNC_DATABASE_URL = DATABASE_URL.replace("+aiosqlite", "")

# Synchronous engine for migrations
sync_engine = create_engine(SYNC_DATABASE_URL, echo=False)

# Async engine for application (lazily initialized)
_async_engine = None


def get_async_engine():
    """Get or create the async engine."""
    global _async_engine
    if _async_engine is None:
        _async_engine = create_async_engine(DATABASE_URL, echo=False)
    return _async_engine


# Async session factory (lazily initialized)
_async_session_local = None


def get_async_session_factory():
    """Get or create the async session factory."""
    global _async_session_local
    if _async_session_local is None:
        async_engine = get_async_engine()
        _async_session_local = sessionmaker(
            async_engine, class_=AsyncSession, expire_on_commit=False
        )
    return _async_session_local


def create_db_and_tables():
    """Create all database tables."""
    SQLModel.metadata.create_all(sync_engine)


def get_session():
    """Get synchronous database session."""
    with Session(sync_engine) as session:
        yield session


async def get_async_session():
    """Get asynchronous database session."""
    async_session_local = get_async_session_factory()
    async with async_session_local() as session:
        yield session
