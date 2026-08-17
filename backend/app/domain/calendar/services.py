"""Calendar domain services.

Pure business logic for calendar data processing.
"""

from datetime import datetime

from app.domain.calendar.models import DateRange, RecurrenceRule


def parse_date_range(start_str: str, end_str: str) -> DateRange:
    """Parse date strings into DateRange.

    Args:
        start_str: Start date string (ISO format).
        end_str: End date string (ISO format).

    Returns:
        DateRange instance.
    """
    start = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
    end = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
    return DateRange(start=start, end=end)


def parse_recurrence_rule(rrule: str) -> RecurrenceRule:
    """Parse RRULE string into RecurrenceRule.

    Args:
        rrule: RRULE string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO,WE").

    Returns:
        RecurrenceRule instance.
    """
    return RecurrenceRule.from_rrule_string(rrule)


def deduplicate_events(events: list[dict]) -> list[dict]:
    """Deduplicate calendar events by ID.

    When the same event appears on multiple calendars, merge them into
    a single event with combined attendees.

    Args:
        events: List of event dictionaries.

    Returns:
        Deduplicated list of events.
    """
    events_by_id: dict[str, dict] = {}

    for event in events:
        event_id = event.get("id")
        if not event_id:
            continue

        if event_id not in events_by_id:
            events_by_id[event_id] = event.copy()
        else:
            # Merge attendees
            existing = events_by_id[event_id]
            existing_attendees = existing.get("attendees", [])
            new_attendees = event.get("attendees", [])

            # Combine attendees by email
            attendee_map = {a["email"]: a for a in existing_attendees}
            for attendee in new_attendees:
                if attendee["email"] not in attendee_map:
                    attendee_map[attendee["email"]] = attendee

            existing["attendees"] = list(attendee_map.values())

            # Merge member keys
            existing_members = set(existing.get("members", []))
            new_members = set(event.get("members", []))
            existing["members"] = sorted(existing_members | new_members)

            # Prefer non-null values
            if not existing.get("description") and event.get("description"):
                existing["description"] = event["description"]
            if not existing.get("location") and event.get("location"):
                existing["location"] = event["location"]
            if not existing.get("organizer") and event.get("organizer"):
                existing["organizer"] = event["organizer"]

    # Sort by start time
    return sorted(events_by_id.values(), key=lambda e: e.get("start", ""))
