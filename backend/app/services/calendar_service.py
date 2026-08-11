"""
Google Calendar service.

Fetches events from each family member's personal Google Calendar.
Color-codes events by which member's calendar they came from.
Deduplicates events that appear on multiple calendars (shared events).
Extracts attendee information with RSVP status.
Handles recurring events properly.
Falls back to mock data when credentials are not available.
"""

import os
from collections import defaultdict
from datetime import datetime, timedelta

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings
from app.models import Attendee, CalendarEvent, WeekCalendar
from app.services.mock_data import get_mock_week_calendar

# Scopes for read-only access to Google Calendar
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

# Default color for external guests not in family config
DEFAULT_GUEST_COLOR = "#9ca3af"


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


def _get_member_color(member_key: str, family_members: dict) -> str:
    """Get the color for a family member, or default grey for external guests."""
    if member_key and member_key in family_members:
        return family_members[member_key].color
    return DEFAULT_GUEST_COLOR


def _parse_attendees(gcal_event: dict, family_members: dict) -> tuple[list[Attendee], str | None]:
    """
    Extract attendee information from Google Calendar event.

    Returns:
        Tuple of (attendees list, organizer member key or None)
    """
    attendees = []
    organizer_email = gcal_event.get("organizer", {}).get("email", "")
    organizer_member_key = None

    # Build email-to-member-key mapping
    email_to_member = {
        m.calendar_id: m.key for m in family_members.values() if hasattr(m, "calendar_id")
    }

    for attendee_data in gcal_event.get("attendees", []):
        email = attendee_data.get("email", "")
        display_name = attendee_data.get("displayName", email.split("@")[0])
        status = attendee_data.get("responseStatus", "needsAction")

        # Check if this attendee is a family member
        member_key = email_to_member.get(email)

        if member_key:
            color = family_members[member_key].color
            if email == organizer_email:
                organizer_member_key = member_key
        else:
            color = DEFAULT_GUEST_COLOR

        attendees.append(
            Attendee(
                member_key=member_key,
                email=email,
                display_name=display_name,
                status=status,
                color=color,
            )
        )

    return attendees, organizer_member_key


def _fetch_recurring_rules(
    service, calendar_id: str, time_min: datetime, time_max: datetime
) -> dict[str, str]:
    """
    Fetch master recurring events to extract RRULE definitions.

    Google Calendar API only includes the `recurrence` field (RRULE) on master
    recurring events, not on expanded instances. This function fetches events
    with singleEvents=False to get the master events and build a mapping of
    recurring_event_id -> RRULE string.

    Args:
        service: Google Calendar API service instance
        calendar_id: The calendar ID to fetch from
        time_min: Start of the date range
        time_max: End of the date range

    Returns:
        Dict mapping recurring_event_id to RRULE string
    """
    recurring_rules: dict[str, str] = {}

    try:
        # Fetch with singleEvents=False to get master recurring events
        events_result = (
            service.events()
            .list(
                calendarId=calendar_id,
                timeMin=time_min.isoformat() + "Z",
                timeMax=time_max.isoformat() + "Z",
                singleEvents=False,
                orderBy="startTime",
            )
            .execute()
        )

        for event in events_result.get("items", []):
            # Master recurring events have "recurrence" field
            recurrence_rules = event.get("recurrence", [])
            if recurrence_rules:
                event_id = event.get("id", "")
                recurring_rules[event_id] = recurrence_rules[0]

    except HttpError as e:
        print(f"Error fetching recurring rules for calendar {calendar_id}: {e}")

    return recurring_rules


def _fetch_cancelled_instances(
    service, calendar_id: str, time_min: datetime, time_max: datetime
) -> set[str]:
    """
    Fetch cancelled instances (exceptions) of recurring events.

    When a recurring event has an exception (e.g., "Every Monday except this week"),
    Google Calendar represents the cancelled instance as a separate event with
    status="cancelled". We need to track these to exclude them from results.

    Args:
        service: Google Calendar API service instance
        calendar_id: The calendar ID to fetch from
        time_min: Start of the date range
        time_max: End of the date range

    Returns:
        Set of event IDs that are cancelled instances
    """
    cancelled_ids: set[str] = set()

    try:
        # Fetch with singleEvents=False to see cancelled exceptions
        events_result = (
            service.events()
            .list(
                calendarId=calendar_id,
                timeMin=time_min.isoformat() + "Z",
                timeMax=time_max.isoformat() + "Z",
                singleEvents=False,
                orderBy="startTime",
                showDeleted=True,  # Include cancelled events
            )
            .execute()
        )

        for event in events_result.get("items", []):
            # Cancelled instances have status="cancelled" and recurringEventId
            if event.get("status") == "cancelled" and event.get("recurringEventId"):
                cancelled_ids.add(event.get("id", ""))

    except HttpError as e:
        print(f"Error fetching cancelled instances for calendar {calendar_id}: {e}")

    return cancelled_ids


def _parse_recurring_info(
    gcal_event: dict, recurring_rules: dict[str, str]
) -> tuple[str | None, bool, str | None]:
    """
    Extract recurring event metadata.

    Uses the recurring_rules map (from master events) to get the RRULE
    for instances that don't have it directly.

    Args:
        gcal_event: Raw Google Calendar event dict
        recurring_rules: Map of recurring_event_id -> RRULE string

    Returns:
        Tuple of (recurring_event_id, is_recurring_instance, recurrence_rule)
    """
    recurring_event_id = gcal_event.get("recurringEventId")
    recurrence_rules = gcal_event.get("recurrence", [])

    # Get RRULE from event itself (master) or from lookup map (instance)
    if recurrence_rules:
        recurrence_rule = recurrence_rules[0]
    elif recurring_event_id and recurring_event_id in recurring_rules:
        recurrence_rule = recurring_rules[recurring_event_id]
    else:
        recurrence_rule = None

    # If recurringEventId exists, this is an instance of a recurring event
    is_instance = recurring_event_id is not None

    return recurring_event_id, is_instance, recurrence_rule


def _parse_event(
    gcal_event: dict,
    member_key: str,
    family_members: dict,
    recurring_rules: dict[str, str],
) -> CalendarEvent:
    """
    Convert Google Calendar event to our CalendarEvent model.

    Extracts full event details including attendees, description, location,
    and recurring event metadata.

    Args:
        gcal_event: Raw Google Calendar event dict
        member_key: Family member key whose calendar this came from
        family_members: Dict of family member configs
        recurring_rules: Map of recurring_event_id -> RRULE string

    Returns:
        CalendarEvent with full details
    """
    # Skip cancelled events (exceptions to recurring events)
    if gcal_event.get("status") == "cancelled":
        return None

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

    # Parse attendees and organizer
    attendees, organizer_key = _parse_attendees(gcal_event, family_members)

    # Parse recurring event info (with RRULE lookup)
    recurring_event_id, is_instance, recurrence_rule = _parse_recurring_info(
        gcal_event, recurring_rules
    )

    return CalendarEvent(
        id=gcal_event.get("id", ""),
        title=gcal_event.get("summary", "Untitled"),
        start=start_iso,
        end=end_iso,
        all_day=all_day,
        members=[member_key],  # Tag with the member whose calendar this came from
        description=gcal_event.get("description"),
        location=gcal_event.get("location"),
        organizer=organizer_key,
        attendees=attendees,
        recurring_event_id=recurring_event_id,
        is_recurring_instance=is_instance,
        recurrence_rule=recurrence_rule,
    )


def _deduplicate_events(events: list[CalendarEvent]) -> list[CalendarEvent]:
    """
    Merge duplicate events from multiple family member calendars.

    When the same event appears on multiple calendars (shared events),
    this function merges them into a single event with combined attendees.

    Args:
        events: List of CalendarEvent objects (may contain duplicates)

    Returns:
        Deduplicated list of events with merged attendees
    """
    # Group events by Google Calendar event ID
    events_by_id: dict[str, list[CalendarEvent]] = defaultdict(list)

    for event in events:
        events_by_id[event.id].append(event)

    deduplicated = []

    for event_group in events_by_id.values():
        if len(event_group) == 1:
            # No duplicates, use as-is
            deduplicated.append(event_group[0])
        else:
            # Merge duplicates
            base_event = event_group[0]

            # Collect all unique member keys
            all_members = set()
            for event in event_group:
                all_members.update(event.members)

            # Collect all unique attendees (by email)
            all_attendees_dict: dict[str, Attendee] = {}
            for event in event_group:
                for attendee in event.attendees:
                    all_attendees_dict[attendee.email] = attendee

            # Find the best description/location (prefer non-null)
            description = next((e.description for e in event_group if e.description), None)
            location = next((e.location for e in event_group if e.location), None)

            # Find organizer (prefer non-null)
            organizer = next((e.organizer for e in event_group if e.organizer), None)

            # Create merged event
            merged_event = CalendarEvent(
                id=base_event.id,
                title=base_event.title,
                start=base_event.start,
                end=base_event.end,
                all_day=base_event.all_day,
                members=sorted(all_members),
                description=description,
                location=location,
                organizer=organizer,
                attendees=list(all_attendees_dict.values()),
                recurring_event_id=base_event.recurring_event_id,
                is_recurring_instance=base_event.is_recurring_instance,
                recurrence_rule=base_event.recurrence_rule,
            )

            deduplicated.append(merged_event)

    # Sort by start time
    deduplicated.sort(key=lambda e: e.start)

    return deduplicated


def get_calendar_events(start_date: str | None = None, end_date: str | None = None) -> WeekCalendar:
    """
    Fetch events from ALL family members' calendars for a given date range.

    Each family member has their own Google Calendar (configured in FAMILY_MEMBERS env var).
    Events are deduplicated (shared events appear once with all attendees).
    Full event details are extracted including description, location, attendees with RSVP status,
    and recurring event metadata.

    Args:
        start_date: ISO format start date (e.g. "2026-08-08" or "2026-08-08T00:00:00").
            Defaults to current week Monday.
        end_date: ISO format end date (e.g. "2026-08-08" or "2026-08-08T23:59:00").
            Defaults to current week Sunday.

    Returns:
        WeekCalendar with deduplicated events and full details.

    Falls back to mock data if:
    - Service account JSON file doesn't exist
    - API request fails
    """
    credentials = _get_credentials()
    if not credentials:
        return get_mock_week_calendar(start_date, end_date)

    family_members_list = settings.get_family_members()
    if not family_members_list:
        return get_mock_week_calendar(start_date, end_date)

    # Build family members dict for quick lookup
    family_members = {m.key: m for m in family_members_list}

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

        for member in family_members_list:
            try:
                # Pass 1: Fetch master recurring events to get RRULE definitions
                recurring_rules = _fetch_recurring_rules(
                    service, member.calendar_id, time_min, time_max
                )

                # Pass 2: Fetch expanded instances with singleEvents=True
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
                    parsed_event = _parse_event(event, member.key, family_members, recurring_rules)
                    if parsed_event:  # Skip cancelled events
                        all_events.append(parsed_event)

            except HttpError as e:
                print(f"Error fetching {member.name}'s calendar: {e}")
                continue

        # Deduplicate events (merge shared events from multiple calendars)
        deduplicated_events = _deduplicate_events(all_events)

        return WeekCalendar(
            week_start=time_min.strftime("%Y-%m-%d"),
            week_end=time_max.strftime("%Y-%m-%d"),
            events=deduplicated_events,
        )

    except Exception as e:
        print(f"Unexpected error fetching calendars: {e}")
        return get_mock_week_calendar(start_date, end_date)
