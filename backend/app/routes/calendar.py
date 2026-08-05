from fastapi import APIRouter

from app.models import WeekCalendar
from app.services.calendar_service import get_calendar_events

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("", response_model=WeekCalendar)
def get_week_calendar():
    """
    Get the current week's calendar events.

    Fetches from Google Calendar API. Falls back to mock data
    when service account credentials are not configured.
    """
    return get_calendar_events()
