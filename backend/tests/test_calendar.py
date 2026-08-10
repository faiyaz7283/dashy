"""Tests for calendar service date range functionality."""

from datetime import datetime
from unittest.mock import patch

from app.models import Attendee, CalendarEvent
from app.services.calendar_service import (
    _deduplicate_events,
    _parse_iso_date,
    _parse_recurring_info,
    get_calendar_events,
)
from app.services.mock_data import get_mock_week_calendar


class TestParseIsoDate:
    """Tests for ISO date parsing utility."""

    def test_parse_date_only(self):
        """Test parsing date-only format (YYYY-MM-DD)."""
        result = _parse_iso_date("2026-08-15")
        assert result == datetime(2026, 8, 15, 0, 0, 0)

    def test_parse_datetime_format(self):
        """Test parsing datetime format (YYYY-MM-DDTHH:MM:SS)."""
        result = _parse_iso_date("2026-08-15T14:30:00")
        assert result == datetime(2026, 8, 15, 14, 30, 0)

    def test_parse_datetime_with_z_suffix(self):
        """Test parsing datetime with Z suffix."""
        result = _parse_iso_date("2026-08-15T14:30:00Z")
        assert result == datetime(2026, 8, 15, 14, 30, 0)


class TestMockWeekCalendar:
    """Tests for mock calendar generation with date ranges."""

    def test_default_range(self):
        """Test mock calendar with no dates defaults to current week."""
        result = get_mock_week_calendar()
        assert result.week_start is not None
        assert result.week_end is not None
        assert len(result.events) > 0

    def test_custom_date_range(self):
        """Test mock calendar with custom date range."""
        result = get_mock_week_calendar("2026-09-01", "2026-09-07")
        assert result.week_start == "2026-09-01"
        assert result.week_end == "2026-09-07"
        assert len(result.events) > 0

    def test_events_within_range(self):
        """Test that all generated events fall within the requested range."""
        start = "2026-10-05"
        end = "2026-10-11"
        result = get_mock_week_calendar(start, end)

        range_start = datetime.strptime(start, "%Y-%m-%d")
        range_end = datetime.strptime(end, "%Y-%m-%d").replace(hour=23, minute=59, second=59)

        for event in result.events:
            event_start = datetime.fromisoformat(event.start)
            event_end = datetime.fromisoformat(event.end)
            assert event_start >= range_start
            assert event_end <= range_end

    def test_single_day_range(self):
        """Test mock calendar with single day range."""
        result = get_mock_week_calendar("2026-08-15", "2026-08-15")
        assert result.week_start == "2026-08-15"
        assert result.week_end == "2026-08-15"
        assert len(result.events) > 0

    def test_month_range(self):
        """Test mock calendar with month range."""
        result = get_mock_week_calendar("2026-08-01", "2026-08-31")
        assert result.week_start == "2026-08-01"
        assert result.week_end == "2026-08-31"
        assert len(result.events) > 0

    def test_year_range(self):
        """Test mock calendar with year range."""
        result = get_mock_week_calendar("2026-01-01", "2026-12-31")
        assert result.week_start == "2026-01-01"
        assert result.week_end == "2026-12-31"
        assert len(result.events) > 0

    def test_datetime_format_range(self):
        """Test mock calendar with datetime format dates."""
        result = get_mock_week_calendar("2026-08-15T00:00:00", "2026-08-15T23:59:59")
        assert result.week_start == "2026-08-15"
        assert len(result.events) > 0


class TestGetCalendarEvents:
    """Tests for calendar service with date range params."""

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_no_params_returns_current_week(self, mock_creds):
        """Test that no params returns current week events."""
        result = get_calendar_events()
        assert result.week_start is not None
        assert result.week_end is not None
        assert len(result.events) > 0

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_with_date_range(self, mock_creds):
        """Test fetching events for a specific date range."""
        result = get_calendar_events("2026-09-01", "2026-09-07")
        assert result.week_start == "2026-09-01"
        assert result.week_end == "2026-09-07"
        assert len(result.events) > 0

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_single_day_range(self, mock_creds):
        """Test fetching events for a single day."""
        result = get_calendar_events("2026-08-15", "2026-08-15")
        assert result.week_start == "2026-08-15"
        assert result.week_end == "2026-08-15"

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_month_range(self, mock_creds):
        """Test fetching events for a full month."""
        result = get_calendar_events("2026-08-01", "2026-08-31")
        assert result.week_start == "2026-08-01"
        assert result.week_end == "2026-08-31"

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_year_range(self, mock_creds):
        """Test fetching events for a full year."""
        result = get_calendar_events("2026-01-01", "2026-12-31")
        assert result.week_start == "2026-01-01"
        assert result.week_end == "2026-12-31"

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_events_sorted_by_start_time(self, mock_creds):
        """Test that events are sorted by start time."""
        result = get_calendar_events("2026-08-01", "2026-08-31")
        start_times = [e.start for e in result.events]
        assert start_times == sorted(start_times)

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_events_have_member_tags(self, mock_creds):
        """Test that all events have member tags."""
        result = get_calendar_events("2026-08-01", "2026-08-07")
        for event in result.events:
            assert len(event.members) > 0
            assert isinstance(event.members, list)

    @patch("app.services.calendar_service._get_credentials", return_value=None)
    def test_all_day_events_flagged(self, mock_creds):
        """Test that all-day events are properly flagged."""
        result = get_calendar_events("2026-08-01", "2026-08-31")
        all_day_events = [e for e in result.events if e.all_day]
        timed_events = [e for e in result.events if not e.all_day]

        # Should have both types
        assert len(all_day_events) > 0 or len(timed_events) > 0

        # All-day events should span full day
        for event in all_day_events:
            start = datetime.fromisoformat(event.start)
            end = datetime.fromisoformat(event.end)
            assert start.hour == 0
            assert end.hour == 23


class TestDeduplication:
    """Tests for event deduplication logic."""

    def test_deduplication_merges_same_event(self):
        """Test that duplicate events with same ID are merged."""
        # Create two events with same ID (simulating shared event on multiple calendars)
        event1 = CalendarEvent(
            id="event_123",
            title="Family Dinner",
            start="2026-08-10T18:00:00",
            end="2026-08-10T20:00:00",
            members=["faiyaz"],
            attendees=[
                Attendee(
                    member_key="faiyaz",
                    email="faiyaz@gmail.com",
                    display_name="Faiyaz",
                    status="accepted",
                    color="#4A90E2",
                )
            ],
            description="Bring dessert!",
            location="Home",
            organizer="faiyaz",
        )

        event2 = CalendarEvent(
            id="event_123",  # Same ID
            title="Family Dinner",
            start="2026-08-10T18:00:00",
            end="2026-08-10T20:00:00",
            members=["trisha"],
            attendees=[
                Attendee(
                    member_key="trisha",
                    email="trisha@gmail.com",
                    display_name="Trisha",
                    status="accepted",
                    color="#E24A8D",
                )
            ],
            description=None,  # Missing description
            location=None,  # Missing location
            organizer=None,
        )

        result = _deduplicate_events([event1, event2])

        # Should be merged into one event
        assert len(result) == 1
        merged = result[0]

        # Members should be combined
        assert set(merged.members) == {"faiyaz", "trisha"}

        # Attendees should be combined
        assert len(merged.attendees) == 2

        # Description/location should come from the event that has them
        assert merged.description == "Bring dessert!"
        assert merged.location == "Home"
        assert merged.organizer == "faiyaz"

    def test_deduplication_preserves_unique_events(self):
        """Test that unique events are not affected."""
        event1 = CalendarEvent(
            id="event_1",
            title="Event 1",
            start="2026-08-10T09:00:00",
            end="2026-08-10T10:00:00",
            members=["faiyaz"],
        )

        event2 = CalendarEvent(
            id="event_2",
            title="Event 2",
            start="2026-08-10T11:00:00",
            end="2026-08-10T12:00:00",
            members=["trisha"],
        )

        result = _deduplicate_events([event1, event2])

        # Both events should be preserved
        assert len(result) == 2
        assert result[0].id == "event_1"
        assert result[1].id == "event_2"

    def test_deduplication_sorts_by_start_time(self):
        """Test that deduplicated events are sorted by start time."""
        event1 = CalendarEvent(
            id="event_1",
            title="Later Event",
            start="2026-08-10T15:00:00",
            end="2026-08-10T16:00:00",
            members=["faiyaz"],
        )

        event2 = CalendarEvent(
            id="event_2",
            title="Earlier Event",
            start="2026-08-10T09:00:00",
            end="2026-08-10T10:00:00",
            members=["trisha"],
        )

        result = _deduplicate_events([event1, event2])

        # Should be sorted by start time
        assert result[0].id == "event_2"
        assert result[1].id == "event_1"


class TestEventDetails:
    """Tests for enhanced event details in mock data."""

    def test_events_have_description(self):
        """Test that mock events include descriptions."""
        result = get_mock_week_calendar("2026-08-10", "2026-08-16")

        # At least some events should have descriptions
        events_with_desc = [e for e in result.events if e.description]
        assert len(events_with_desc) > 0

    def test_events_have_location(self):
        """Test that mock events include locations."""
        result = get_mock_week_calendar("2026-08-10", "2026-08-16")

        # At least some events should have locations
        events_with_location = [e for e in result.events if e.location]
        assert len(events_with_location) > 0

    def test_events_have_attendees(self):
        """Test that mock events include attendees with RSVP status."""
        result = get_mock_week_calendar("2026-08-10", "2026-08-16")

        # All events should have attendees
        for event in result.events:
            assert len(event.attendees) > 0

            # Each attendee should have required fields
            for attendee in event.attendees:
                assert attendee.email
                assert attendee.display_name
                assert attendee.status in ["accepted", "declined", "tentative", "needsAction"]
                assert attendee.color

    def test_events_have_organizer(self):
        """Test that mock events identify the organizer."""
        result = get_mock_week_calendar("2026-08-10", "2026-08-16")

        # All events should have an organizer
        for event in result.events:
            assert event.organizer is not None
            assert event.organizer in ["faiyaz", "trisha", "arya", "raya"]

    def test_recurring_events_have_rule(self):
        """Test that recurring events have recurrence rules."""
        result = get_mock_week_calendar("2026-08-10", "2026-08-16")

        # Some events should be recurring
        recurring_events = [e for e in result.events if e.recurrence_rule]
        assert len(recurring_events) > 0

        # Recurrence rule should follow RRULE format
        for event in recurring_events:
            assert event.recurrence_rule.startswith("RRULE:")


class TestRecurringEventHandling:
    """Tests for recurring event RRULE fetching and parsing."""

    def test_parse_recurring_info_with_direct_rule(self):
        """Test parsing recurring info when RRULE is in the event itself."""
        gcal_event = {
            "id": "master_event_123",
            "recurrence": ["RRULE:FREQ=WEEKLY;BYDAY=MO"],
        }
        recurring_rules = {}

        recurring_id, is_instance, rule = _parse_recurring_info(
            gcal_event, recurring_rules
        )

        assert recurring_id is None
        assert is_instance is False
        assert rule == "RRULE:FREQ=WEEKLY;BYDAY=MO"

    def test_parse_recurring_info_with_lookup(self):
        """Test parsing recurring info when RRULE comes from lookup map."""
        gcal_event = {
            "id": "instance_456",
            "recurringEventId": "master_event_123",
        }
        recurring_rules = {
            "master_event_123": "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
        }

        recurring_id, is_instance, rule = _parse_recurring_info(
            gcal_event, recurring_rules
        )

        assert recurring_id == "master_event_123"
        assert is_instance is True
        assert rule == "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"

    def test_parse_recurring_info_non_recurring(self):
        """Test parsing non-recurring event."""
        gcal_event = {
            "id": "single_event_789",
        }
        recurring_rules = {}

        recurring_id, is_instance, rule = _parse_recurring_info(
            gcal_event, recurring_rules
        )

        assert recurring_id is None
        assert is_instance is False
        assert rule is None

    def test_parse_event_skips_cancelled(self):
        """Test that cancelled events are skipped."""
        from app.config import FamilyMemberConfig
        from app.services.calendar_service import _parse_event

        gcal_event = {
            "id": "cancelled_123",
            "status": "cancelled",
            "summary": "Cancelled Event",
        }
        family_members = {
            "faiyaz": FamilyMemberConfig(
                name="Faiyaz",
                key="faiyaz",
                calendar_id="faiyaz@gmail.com",
                color="#4A90E2",
            )
        }

        result = _parse_event(gcal_event, "faiyaz", family_members, {})
        assert result is None
