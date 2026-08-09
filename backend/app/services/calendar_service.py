"""
Google Calendar service.

Fetches events from each family member's personal Google Calendar.
Color-codes events by which member's calendar they came from.
Falls back to mock data when credentials are not available.
"""

import os
from datetime import datetime, timedelta

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings
from app.models import CalendarEvent, WeekCalendar
from app.services.mock_data import get_mock_week_calendar

# Scopes for read-only access to Google Calendar
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]


def _get_credentials() -> service_account.Credentials | None:
    """Load service account credentials from JSON file."""
    json_path = settings.GOOGLE_SERVICE_ACCOUNT_JSON
    if not json_path or not os.path.exists(json_path):
        return None
    try:
        return service_account.Credentials.from_service_account_file(json_path, scopes=SCOPES)
    except Exception:
        return None


def _get_default_week_dates() -> tuple[datetime, datetime]:
    """Get Monday 00:00 and Sunday 23:59 of the current week."""
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59)
    return monday, sunday


def _parse_iso_date(date_str: str) -> datetime:
    """Parse an ISO format date string to datetime."""
    # Handle both "2026-08-08" and "2026-08-08T00:00:00"
    if "T" in date_str:
        return datetime.fromisoformat(date_str.replace("Z", ""))
    return datetime.strptime(date_str, "%Y-%m-%d").replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def _parse_event(gcal_event: dict, member_key: str) -> CalendarEvent:
    """Convert Google Calendar event to our CalendarEvent model."""
    start = gcal_event.get("start", {})
    end = gcal_event.get("end", {})

    # Handle all-day events (date field) vs timed events (dateTime field)
    if "dateTime" in start:
        start_iso = start["dateTime"]
        end_iso = end.get("dateTime", "")
        all_day = False
    else:
        start_iso = start.get("date", "") + "T00:00:00"
        end_iso = end.get("date", "") + "T23:59:00"
        all_day = True

    return CalendarEvent(
        id=gcal_event.get("id", ""),
        title=gcal_event.get("summary", "Untitled"),
        start=start_iso,
        end=end_iso,
        all_day=all_day,
        members=[member_key],  # Tag with the member whose calendar this came from
    )


def get_calendar_events(start_date: str | None = None, end_date: str | None = None) -> WeekCalendar:
    """
    Fetch events from ALL family members' calendars for a given date range.

    Each family member has their own Google Calendar (configured in FAMILY_MEMBERS env var).
    Events are tagged with the member key so the frontend can color-code them.

    Args:
        start_date: ISO format start date (e.g. "2026-08-08" or "2026-08-08T00:00:00").
            Defaults to current week Monday.
        end_date: ISO format end date (e.g. "2026-08-08" or "2026-08-08T23:59:00").
            Defaults to current week Sunday.

    Falls back to mock data if:
    - Service account JSON file doesn't exist
    - API request fails
    """
    credentials = _get_credentials()
    if not credentials:
        return get_mock_week_calendar(start_date, end_date)

    family_members = settings.get_family_members()
    if not family_members:
        return get_mock_week_calendar(start_date, end_date)

    if start_date and end_date:
        time_min = _parse_iso_date(start_date)
        time_max = _parse_iso_date(end_date)
        # Ensure end_date includes the full day
        if "T" not in end_date:
            time_max = time_max.replace(hour=23, minute=59, second=59)
    else:
        time_min, time_max = _get_default_week_dates()
    all_events: list[CalendarEvent] = []

    try:
        service = build("calendar", "v3", credentials=credentials)

        for member in family_members:
            try:
                events_result = (
                    service.events()
                    .list(
                        calendarId=member.calendar_id,
                        timeMin=time_min.isoformat() + "Z",
                        timeMax=time_max.isoformat() + "Z",
                        singleEvents=True,
                        orderBy="startTime",
                    )
                    .execute()
                )

                for event in events_result.get("items", []):
                    all_events.append(_parse_event(event, member.key))

            except HttpError as e:
                print(f"Error fetching {member.name}'s calendar: {e}")
                continue

        # Sort all events by start time
        all_events.sort(key=lambda e: e.start)

        return WeekCalendar(
            week_start=time_min.strftime("%Y-%m-%d"),
            week_end=time_max.strftime("%Y-%m-%d"),
            events=all_events,
        )

    except Exception as e:
        print(f"Unexpected error fetching calendars: {e}")
        return get_mock_week_calendar(start_date, end_date)
