"""Calendar API routes.

Provides endpoints for fetching calendar events.
"""

from fastapi import APIRouter, Depends

from app.api.deps import CacheDep, CalendarProviderDep
from app.api.models.calendar import WeekCalendar
from app.api.models.requests import CalendarQuery
from app.config import settings
from app.services.calendar_service import get_calendar_events
from app.services.mock_data import get_mock_week_calendar

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("", response_model=WeekCalendar)
async def get_calendar(
    calendar_provider: CalendarProviderDep,
    cache: CacheDep,
    query: CalendarQuery = Depends(),
) -> WeekCalendar:
    """Get calendar events for a date range.

    Fetches from Google Calendar API. Falls back to mock data
    when service account credentials are not configured.
    Results are cached for 2 minutes.

    If start_date and end_date are not provided, defaults to the current week.

    Args:
        calendar_provider: Injected calendar provider instance.
        cache: Injected cache instance.
        query: Validated query parameters.

    Returns:
        WeekCalendar with events for the specified date range.
    """
    # Build cache key from date range
    cache_key = f"calendar:{query.start_date or 'default'}:{query.end_date or 'default'}"

    # Try cache first
    cached = await cache.get(cache_key)
    if cached is not None:
        return WeekCalendar(**cached)

    # Fetch from service
    try:
        result = await get_calendar_events(query.start_date, query.end_date)
        # Cache the result
        await cache.set(cache_key, result.model_dump(), settings.CALENDAR_CACHE_TTL)
        return result
    except Exception:
        # Fail-open: return mock data on any failure
        return get_mock_week_calendar(query.start_date, query.end_date)
