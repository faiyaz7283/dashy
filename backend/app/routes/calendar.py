from fastapi import APIRouter, Query

from app.models import WeekCalendar
from app.services.calendar_service import get_calendar_events

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("", response_model=WeekCalendar)
def get_calendar(
    start_date: str | None = Query(None, description="Start date in ISO format (e.g. 2026-08-08)"),
    end_date: str | None = Query(None, description="End date in ISO format (e.g. 2026-08-08)"),
):
    """
    Get calendar events for a date range.

    Fetches from Google Calendar API. Falls back to mock data
    when service account credentials are not configured.

    If start_date and end_date are not provided, defaults to the current week.
    """
    return get_calendar_events(start_date, end_date)
