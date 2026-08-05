from datetime import datetime, timedelta
from app.models import FamilyMember, CalendarEvent, WeekCalendar, WeatherCurrent, WeatherForecast, WeatherResponse


def get_mock_family_members() -> list[FamilyMember]:
    return [
        FamilyMember(name="Faiyaz", key="faiyaz", calendar_id="faiyaz@gmail.com", color="#4A90E2", initial="F"),
        FamilyMember(name="Trisha", key="trisha", calendar_id="trisha@gmail.com", color="#E24A8D", initial="T"),
        FamilyMember(name="Arya", key="arya", calendar_id="arya@gmail.com", color="#4ADE80", initial="A"),
        FamilyMember(name="Raya", key="raya", calendar_id="raya@gmail.com", color="#FBBF24", initial="R"),
    ]


def get_mock_week_calendar() -> WeekCalendar:
    today = datetime.now()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    events = [
        CalendarEvent(id="1", title="Team Standup", start="2026-08-04T09:00:00", end="2026-08-04T09:30:00", members=["faiyaz"]),
        CalendarEvent(id="2", title="Morning Yoga", start="2026-08-04T10:00:00", end="2026-08-04T11:00:00", members=["trisha"]),
        CalendarEvent(id="3", title="Soccer Practice", start="2026-08-04T16:00:00", end="2026-08-04T17:30:00", members=["arya"]),
        CalendarEvent(id="4", title="Dentist Appt", start="2026-08-05T08:00:00", end="2026-08-05T09:00:00", members=["faiyaz", "arya"]),
        CalendarEvent(id="5", title="Grocery Shopping", start="2026-08-05T11:00:00", end="2026-08-05T12:00:00", members=["trisha"]),
        CalendarEvent(id="6", title="Preschool", start="2026-08-05T09:00:00", end="2026-08-05T12:00:00", members=["raya"]),
        CalendarEvent(id="7", title="Gym", start="2026-08-05T18:00:00", end="2026-08-05T19:00:00", members=["faiyaz"]),
        CalendarEvent(id="8", title="Reading Club", start="2026-08-06T15:00:00", end="2026-08-06T16:00:00", members=["arya"]),
        CalendarEvent(id="9", title="Piano Lesson", start="2026-08-06T16:00:00", end="2026-08-06T17:00:00", members=["trisha", "arya"]),
        CalendarEvent(id="10", title="Date Night", start="2026-08-06T19:00:00", end="2026-08-06T22:00:00", members=["faiyaz", "trisha"]),
        CalendarEvent(id="11", title="Playdate w/ Lily", start="2026-08-07T10:00:00", end="2026-08-07T12:00:00", members=["raya"]),
        CalendarEvent(id="12", title="Cook Dinner", start="2026-08-07T17:00:00", end="2026-08-07T18:30:00", members=["trisha"]),
        CalendarEvent(id="13", title="Science Fair Project", start="2026-08-08T00:00:00", end="2026-08-08T23:59:00", all_day=True, members=["arya", "faiyaz"]),
        CalendarEvent(id="14", title="Team Offsite", start="2026-08-08T13:00:00", end="2026-08-08T17:00:00", members=["faiyaz"]),
        CalendarEvent(id="15", title="Family Movie Night", start="2026-08-08T19:00:00", end="2026-08-08T21:00:00", members=["faiyaz", "trisha", "arya", "raya"]),
        CalendarEvent(id="16", title="Park Visit", start="2026-08-09T10:00:00", end="2026-08-09T12:00:00", members=["raya", "arya"]),
        CalendarEvent(id="17", title="Brunch w/ Friends", start="2026-08-09T11:00:00", end="2026-08-09T13:00:00", members=["trisha", "faiyaz"]),
        CalendarEvent(id="18", title="Meal Prep", start="2026-08-10T11:00:00", end="2026-08-10T13:00:00", members=["faiyaz", "trisha"]),
        CalendarEvent(id="19", title="Homework Catch-up", start="2026-08-10T15:00:00", end="2026-08-10T17:00:00", members=["arya"]),
    ]

    return WeekCalendar(
        week_start=monday.strftime("%Y-%m-%d"),
        week_end=sunday.strftime("%Y-%m-%d"),
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
            WeatherForecast(date="2026-08-06", high=82, low=70, condition="partly-cloudy", icon="02d"),
            WeatherForecast(date="2026-08-07", high=79, low=67, condition="cloudy", icon="03d"),
            WeatherForecast(date="2026-08-08", high=77, low=66, condition="rainy", icon="10d"),
            WeatherForecast(date="2026-08-09", high=75, low=65, condition="rainy", icon="10d"),
            WeatherForecast(date="2026-08-10", high=78, low=67, condition="partly-cloudy", icon="02d"),
            WeatherForecast(date="2026-08-11", high=81, low=69, condition="sunny", icon="01d"),
        ],
    )
