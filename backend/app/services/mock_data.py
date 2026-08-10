from datetime import datetime, timedelta

from app.models import (
    Attendee,
    CalendarEvent,
    FamilyMember,
    WeatherCurrent,
    WeatherForecast,
    WeatherResponse,
    WeekCalendar,
)


def get_mock_family_members() -> list[FamilyMember]:
    return [
        FamilyMember(
            name="Faiyaz",
            key="faiyaz",
            calendar_id="faiyaz@gmail.com",
            color="#4A90E2",
            initial="F",
        ),
        FamilyMember(
            name="Trisha",
            key="trisha",
            calendar_id="trisha@gmail.com",
            color="#E24A8D",
            initial="T",
        ),
        FamilyMember(
            name="Arya", key="arya", calendar_id="arya@gmail.com", color="#4ADE80", initial="A"
        ),
        FamilyMember(
            name="Raya", key="raya", calendar_id="raya@gmail.com", color="#FBBF24", initial="R"
        ),
    ]


# Member color mapping for mock attendees
MEMBER_COLORS = {
    "faiyaz": "#4A90E2",
    "trisha": "#E24A8D",
    "arya": "#4ADE80",
    "raya": "#FBBF24",
}


def _create_mock_attendees(members: list[str], organizer_key: str) -> list[Attendee]:
    """Create mock attendees with RSVP status for testing."""
    attendees = []
    for member_key in members:
        status = "accepted" if member_key == organizer_key else "accepted"
        attendees.append(
            Attendee(
                member_key=member_key,
                email=f"{member_key}@gmail.com",
                display_name=member_key.capitalize(),
                status=status,
                color=MEMBER_COLORS.get(member_key, "#9ca3af"),
            )
        )
    return attendees


def get_mock_week_calendar(
    start_date: str | None = None, end_date: str | None = None
) -> WeekCalendar:
    """
    Generate mock calendar events relative to the requested date range.

    If no dates provided, defaults to current week.
    Events are generated with realistic patterns shifted to the target range;
    the one-week template pattern repeats across longer ranges (month/year).
    Includes full event details: description, location, attendees with RSVP status,
    and recurring event metadata.
    """
    if start_date and end_date:
        # Parse the requested range
        if "T" in start_date:
            range_start = datetime.fromisoformat(start_date.replace("Z", ""))
        else:
            range_start = datetime.strptime(start_date, "%Y-%m-%d").replace(
                hour=0, minute=0, second=0
            )
        if "T" in end_date:
            range_end = datetime.fromisoformat(end_date.replace("Z", ""))
        else:
            range_end = datetime.strptime(end_date, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59
            )
    else:
        # Default to current week
        today = datetime.now()
        range_start = today - timedelta(days=today.weekday())
        range_start = range_start.replace(hour=0, minute=0, second=0)
        range_end = range_start + timedelta(days=6, hours=23, minutes=59)

    total_days = (range_end - range_start).days + 1

    # Event templates: (day_offset, start_h, start_m, end_h, end_m, title,
    #                   members, all_day, organizer, description, location, recurrence)
    event_templates = [
        (
            0,
            9,
            0,
            9,
            30,
            "Team Standup",
            ["faiyaz"],
            False,
            "faiyaz",
            "Daily sync with the team",
            None,
            "RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
        ),
        (
            0,
            10,
            0,
            11,
            0,
            "Morning Yoga",
            ["trisha"],
            False,
            "trisha",
            "Vinyasa flow class",
            "Local Studio",
            None,
        ),
        (
            0,
            16,
            0,
            17,
            30,
            "Soccer Practice",
            ["arya"],
            False,
            "faiyaz",
            "Weekly soccer practice",
            "Community Field",
            "RRULE:FREQ=WEEKLY;BYDAY=MO",
        ),
        (
            1,
            8,
            0,
            9,
            0,
            "Dentist Appt",
            ["faiyaz", "arya"],
            False,
            "faiyaz",
            "Regular checkup for Arya",
            "Dr. Smith's Office",
            None,
        ),
        (
            1,
            9,
            0,
            12,
            0,
            "Preschool",
            ["raya"],
            False,
            "trisha",
            "Morning preschool session",
            "Little Learners Academy",
            "RRULE:FREQ=WEEKLY;BYDAY=TU,TH",
        ),
        (
            1,
            11,
            0,
            12,
            0,
            "Grocery Shopping",
            ["trisha"],
            False,
            "trisha",
            "Weekly grocery run",
            "Whole Foods",
            None,
        ),
        (
            1,
            18,
            0,
            19,
            0,
            "Gym",
            ["faiyaz"],
            False,
            "faiyaz",
            "Workout session",
            "LA Fitness",
            "RRULE:FREQ=WEEKLY;BYDAY=TU",
        ),
        (
            2,
            15,
            0,
            16,
            0,
            "Reading Club",
            ["arya"],
            False,
            "trisha",
            "Book discussion group",
            "Library",
            None,
        ),
        (
            2,
            16,
            0,
            17,
            0,
            "Piano Lesson",
            ["trisha", "arya"],
            False,
            "trisha",
            "Arya's piano lesson",
            "Music School",
            "RRULE:FREQ=WEEKLY;BYDAY=WE",
        ),
        (
            2,
            19,
            0,
            22,
            0,
            "Date Night",
            ["faiyaz", "trisha"],
            False,
            "faiyaz",
            "Weekly date night",
            "Italian Restaurant",
            None,
        ),
        (
            3,
            10,
            0,
            12,
            0,
            "Playdate w/ Lily",
            ["raya"],
            False,
            "trisha",
            "Playdate with Lily from preschool",
            "Lily's House",
            None,
        ),
        (
            3,
            17,
            0,
            18,
            30,
            "Cook Dinner",
            ["trisha"],
            False,
            "trisha",
            "Prepare meals for the week",
            "Home",
            None,
        ),
        (
            4,
            0,
            0,
            23,
            59,
            "Science Fair Project",
            ["arya", "faiyaz"],
            True,
            "faiyaz",
            "Work on Arya's science fair project",
            "Home",
            None,
        ),
        (
            4,
            13,
            0,
            17,
            0,
            "Team Offsite",
            ["faiyaz"],
            False,
            "faiyaz",
            "Quarterly team offsite meeting",
            "Conference Center",
            None,
        ),
        (
            4,
            19,
            0,
            21,
            0,
            "Family Movie Night",
            ["faiyaz", "trisha", "arya", "raya"],
            False,
            "faiyaz",
            "Watch a family movie together",
            "Home",
            "RRULE:FREQ=WEEKLY;BYDAY=FR",
        ),
        (
            5,
            10,
            0,
            12,
            0,
            "Park Visit",
            ["raya", "arya"],
            False,
            "trisha",
            "Visit the playground",
            "Central Park",
            None,
        ),
        (
            5,
            11,
            0,
            13,
            0,
            "Brunch w/ Friends",
            ["trisha", "faiyaz"],
            False,
            "trisha",
            "Brunch with Sarah and Mike",
            "Cafe Downtown",
            None,
        ),
        (
            6,
            11,
            0,
            13,
            0,
            "Meal Prep",
            ["faiyaz", "trisha"],
            False,
            "trisha",
            "Prepare meals for the upcoming week",
            "Home",
            "RRULE:FREQ=WEEKLY;BYDAY=SU",
        ),
        (
            6,
            15,
            0,
            17,
            0,
            "Homework Catch-up",
            ["arya"],
            False,
            "arya",
            "Finish homework assignments",
            "Home",
            None,
        ),
    ]

    events = []
    event_id = 0
    # Repeat the weekly template pattern across the requested range, so long
    # ranges (month/year views) are populated throughout, not just week one.
    for week in range((total_days + 6) // 7):
        for tpl in event_templates:
            (
                day_offset,
                sh,
                sm,
                eh,
                em,
                title,
                members,
                all_day,
                organizer,
                description,
                location,
                recurrence,
            ) = tpl
            actual_day = week * 7 + day_offset
            if actual_day >= total_days:
                continue
            event_id += 1

            event_start = range_start + timedelta(days=actual_day)
            event_start = event_start.replace(hour=sh, minute=sm)
            event_end = range_start + timedelta(days=actual_day)
            event_end = event_end.replace(hour=eh, minute=em)

            if all_day:
                event_start = event_start.replace(hour=0, minute=0)
                event_end = event_end.replace(hour=23, minute=59)

            # Create mock attendees
            attendees = _create_mock_attendees(members, organizer)

            events.append(
                CalendarEvent(
                    id=str(event_id),
                    title=title,
                    start=event_start.strftime("%Y-%m-%dT%H:%M:%S"),
                    end=event_end.strftime("%Y-%m-%dT%H:%M:%S"),
                    all_day=all_day,
                    members=members,
                    description=description,
                    location=location,
                    organizer=organizer,
                    attendees=attendees,
                    recurring_event_id=None,
                    is_recurring_instance=False,
                    recurrence_rule=recurrence,
                )
            )

    return WeekCalendar(
        week_start=range_start.strftime("%Y-%m-%d"),
        week_end=range_end.strftime("%Y-%m-%d"),
        events=events,
    )


def get_mock_weather() -> WeatherResponse:
    return WeatherResponse(
        current=WeatherCurrent(
            temperature=78,
            feels_like=80,
            condition="sunny",
            icon="01d",
            humidity=55,
            wind_speed=8.5,
        ),
        forecast=[
            WeatherForecast(date="2026-08-05", high=80, low=68, condition="sunny", icon="01d"),
            WeatherForecast(
                date="2026-08-06", high=82, low=70, condition="partly-cloudy", icon="02d"
            ),
            WeatherForecast(date="2026-08-07", high=79, low=67, condition="cloudy", icon="03d"),
            WeatherForecast(date="2026-08-08", high=77, low=66, condition="rainy", icon="10d"),
            WeatherForecast(date="2026-08-09", high=75, low=65, condition="rainy", icon="10d"),
            WeatherForecast(
                date="2026-08-10", high=78, low=67, condition="partly-cloudy", icon="02d"
            ),
            WeatherForecast(date="2026-08-11", high=81, low=69, condition="sunny", icon="01d"),
        ],
    )
