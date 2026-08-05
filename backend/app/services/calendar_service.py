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
        return service_account.Credentials.from_service_account_file(
            json_path, scopes=SCOPES
        )
    except Exception:
        return None


def _get_week_dates() -> tuple[datetime, datetime]:
    """Get Monday 00:00 and Sunday 23:59 of the current week."""
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59)
    return monday, sunday


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


def get_calendar_events() -> WeekCalendar:
    """
    Fetch current week's events from ALL family members' calendars.

    Each family member has their own Google Calendar (configured in FAMILY_MEMBERS env var).
    Events are tagged with the member key so the frontend can color-code them.

    Falls back to mock data if:
    - Service account JSON file doesn't exist
    - API request fails
    """
    credentials = _get_credentials()
    if not credentials:
        return get_mock_week_calendar()

    family_members = settings.get_family_members()
    if not family_members:
        return get_mock_week_calendar()

    monday, sunday = _get_week_dates()
    all_events: list[CalendarEvent] = []

    try:
        service = build("calendar", "v3", credentials=credentials)

        for member in family_members:
            try:
                events_result = (
                    service.events()
                    .list(
                        calendarId=member.calendar_id,
                        timeMin=monday.isoformat() + "Z",
                        timeMax=sunday.isoformat() + "Z",
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
            week_start=monday.strftime("%Y-%m-%d"),
            week_end=sunday.strftime("%Y-%m-%d"),
            events=all_events,
        )

    except Exception as e:
        print(f"Unexpected error fetching calendars: {e}")
        return get_mock_week_calendar()
