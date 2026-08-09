from datetime import datetime, timedelta

from app.models import (
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


def get_mock_week_calendar(
    start_date: str | None = None, end_date: str | None = None
) -> WeekCalendar:
    """
    Generate mock calendar events relative to the requested date range.

    If no dates provided, defaults to current week.
    Events are generated with realistic patterns shifted to the target range.
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

    # Event templates: (day_offset, start_h, start_m, end_h, end_m, title, members, all_day)
    event_templates = [
        (0, 9, 0, 9, 30, "Team Standup", ["faiyaz"], False),
        (0, 10, 0, 11, 0, "Morning Yoga", ["trisha"], False),
        (0, 16, 0, 17, 30, "Soccer Practice", ["arya"], False),
        (1, 8, 0, 9, 0, "Dentist Appt", ["faiyaz", "arya"], False),
        (1, 9, 0, 12, 0, "Preschool", ["raya"], False),
        (1, 11, 0, 12, 0, "Grocery Shopping", ["trisha"], False),
        (1, 18, 0, 19, 0, "Gym", ["faiyaz"], False),
        (2, 15, 0, 16, 0, "Reading Club", ["arya"], False),
        (2, 16, 0, 17, 0, "Piano Lesson", ["trisha", "arya"], False),
        (2, 19, 0, 22, 0, "Date Night", ["faiyaz", "trisha"], False),
        (3, 10, 0, 12, 0, "Playdate w/ Lily", ["raya"], False),
        (3, 17, 0, 18, 30, "Cook Dinner", ["trisha"], False),
        (4, 0, 0, 23, 59, "Science Fair Project", ["arya", "faiyaz"], True),
        (4, 13, 0, 17, 0, "Team Offsite", ["faiyaz"], False),
        (4, 19, 0, 21, 0, "Family Movie Night", ["faiyaz", "trisha", "arya", "raya"], False),
        (5, 10, 0, 12, 0, "Park Visit", ["raya", "arya"], False),
        (5, 11, 0, 13, 0, "Brunch w/ Friends", ["trisha", "faiyaz"], False),
        (6, 11, 0, 13, 0, "Meal Prep", ["faiyaz", "trisha"], False),
        (6, 15, 0, 17, 0, "Homework Catch-up", ["arya"], False),
    ]

    events = []
    for idx, (day_offset, sh, sm, eh, em, title, members, all_day) in enumerate(event_templates, 1):
        # Wrap day_offset to fit within the range
        actual_day = day_offset % total_days
        event_start = range_start + timedelta(days=actual_day)
        event_start = event_start.replace(hour=sh, minute=sm)
        event_end = range_start + timedelta(days=actual_day)
        event_end = event_end.replace(hour=eh, minute=em)

        if all_day:
            event_start = event_start.replace(hour=0, minute=0)
            event_end = event_end.replace(hour=23, minute=59)

        events.append(
            CalendarEvent(
                id=str(idx),
                title=title,
                start=event_start.strftime("%Y-%m-%dT%H:%M:%S"),
                end=event_end.strftime("%Y-%m-%dT%H:%M:%S"),
                all_day=all_day,
                members=members,
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
