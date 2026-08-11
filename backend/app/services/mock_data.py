from datetime import datetime, timedelta

from app.models import (
    Attendee,
    CalendarEvent,
    DailyForecast,
    FamilyMember,
    HourlyForecast,
    WeatherCurrent,
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


def get_mock_weather(units: str = "imperial") -> WeatherResponse:
    """Generate mock weather data with rich details for days 1-7 and basic for days 8-16."""
    # Start from yesterday to handle timezone edge cases (backend UTC vs frontend local time)
    today = datetime.now().date() - timedelta(days=1)

    def fahrenheit_to_celsius(fahrenheit: float) -> float:
        """Convert Fahrenheit to Celsius."""
        return (fahrenheit - 32) * 5 / 9

    def convert_mock_temp(value: float | None, units: str) -> float | None:
        """Convert mock temperature (stored as Fahrenheit) to requested units."""
        if value is None:
            return None
        if units == "metric":
            return fahrenheit_to_celsius(value)
        return value  # imperial, return as-is

    # Current conditions (mock values in Fahrenheit, convert if needed)
    current = WeatherCurrent(
        temperature=convert_mock_temp(78, units),
        feels_like=convert_mock_temp(80, units),
        condition="sunny",
        icon="01d",
        humidity=55,
        wind_speed=8.5,
        wind_gust=12.0,
        wind_deg=225,
        pressure=1015,
        dew_point=convert_mock_temp(62.0, units),
        uvi=6.5,
        sunrise="06:12",
        sunset="19:48",
    )

    # Rich forecast data for days 1-7
    rich_days = [
        {
            "condition": "sunny",
            "icon": "01d",
            "high": 81,
            "low": 69,
            "temp_morn": 65,
            "temp_day": 78,
            "temp_eve": 74,
            "temp_night": 68,
            "feels_like_day": 83,
            "feels_like_night": 66,
            "humidity": 55,
            "pressure": 1015,
            "dew_point": 62.0,
            "wind_speed": 8.5,
            "wind_gust": 12.0,
            "wind_deg": 225,
            "uvi": 6.5,
            "pop": 0.05,
            "rain": 0.0,
            "snow": 0.0,
            "clouds": 10,
            "sunrise": "06:12",
            "sunset": "19:48",
            "moonrise": "20:15",
            "moonset": "07:30",
            "moon_phase": 0.75,
            "summary": "Clear skies throughout the day",
        },
        {
            "condition": "partly-cloudy",
            "icon": "02d",
            "high": 78,
            "low": 66,
            "temp_morn": 63,
            "temp_day": 75,
            "temp_eve": 72,
            "temp_night": 65,
            "feels_like_day": 77,
            "feels_like_night": 63,
            "humidity": 60,
            "pressure": 1013,
            "dew_point": 63.0,
            "wind_speed": 10.2,
            "wind_gust": 15.0,
            "wind_deg": 240,
            "uvi": 5.0,
            "pop": 0.15,
            "rain": 0.0,
            "snow": 0.0,
            "clouds": 40,
            "sunrise": "06:13",
            "sunset": "19:47",
            "moonrise": "20:45",
            "moonset": "08:35",
            "moon_phase": 0.8,
            "summary": "Partly cloudy with mild temperatures",
        },
        {
            "condition": "cloudy",
            "icon": "03d",
            "high": 75,
            "low": 63,
            "temp_morn": 61,
            "temp_day": 72,
            "temp_eve": 69,
            "temp_night": 62,
            "feels_like_day": 73,
            "feels_like_night": 60,
            "humidity": 65,
            "pressure": 1010,
            "dew_point": 64.0,
            "wind_speed": 12.0,
            "wind_gust": 18.0,
            "wind_deg": 250,
            "uvi": 3.5,
            "pop": 0.30,
            "rain": 0.5,
            "snow": 0.0,
            "clouds": 70,
            "sunrise": "06:14",
            "sunset": "19:46",
            "moonrise": "21:20",
            "moonset": "09:40",
            "moon_phase": 0.85,
            "summary": "Overcast with a chance of light rain",
        },
        {
            "condition": "rainy",
            "icon": "10d",
            "high": 68,
            "low": 58,
            "temp_morn": 56,
            "temp_day": 65,
            "temp_eve": 62,
            "temp_night": 57,
            "feels_like_day": 65,
            "feels_like_night": 55,
            "humidity": 78,
            "pressure": 1008,
            "dew_point": 61.0,
            "wind_speed": 12.0,
            "wind_gust": 20.0,
            "wind_deg": 45,
            "uvi": 2.0,
            "pop": 0.80,
            "rain": 5.0,
            "snow": 0.0,
            "clouds": 90,
            "sunrise": "06:15",
            "sunset": "19:45",
            "moonrise": "22:00",
            "moonset": "10:45",
            "moon_phase": 0.9,
            "summary": "Rain likely throughout the day",
        },
        {
            "condition": "rainy",
            "icon": "10d",
            "high": 65,
            "low": 55,
            "temp_morn": 53,
            "temp_day": 62,
            "temp_eve": 59,
            "temp_night": 54,
            "feels_like_day": 61,
            "feels_like_night": 52,
            "humidity": 82,
            "pressure": 1006,
            "dew_point": 60.0,
            "wind_speed": 14.5,
            "wind_gust": 22.0,
            "wind_deg": 50,
            "uvi": 1.5,
            "pop": 0.85,
            "rain": 8.0,
            "snow": 0.0,
            "clouds": 95,
            "sunrise": "06:16",
            "sunset": "19:44",
            "moonrise": "22:45",
            "moonset": "11:50",
            "moon_phase": 0.95,
            "summary": "Heavy rain expected",
        },
        {
            "condition": "partly-cloudy",
            "icon": "02d",
            "high": 72,
            "low": 60,
            "temp_morn": 58,
            "temp_day": 70,
            "temp_eve": 67,
            "temp_night": 59,
            "feels_like_day": 70,
            "feels_like_night": 57,
            "humidity": 62,
            "pressure": 1012,
            "dew_point": 59.0,
            "wind_speed": 9.0,
            "wind_gust": 14.0,
            "wind_deg": 270,
            "uvi": 4.5,
            "pop": 0.20,
            "rain": 0.2,
            "snow": 0.0,
            "clouds": 45,
            "sunrise": "06:17",
            "sunset": "19:43",
            "moonrise": "23:35",
            "moonset": "12:55",
            "moon_phase": 0.0,
            "summary": "Clearing skies after morning showers",
        },
        {
            "condition": "sunny",
            "icon": "01d",
            "high": 79,
            "low": 67,
            "temp_morn": 64,
            "temp_day": 76,
            "temp_eve": 73,
            "temp_night": 66,
            "feels_like_day": 79,
            "feels_like_night": 64,
            "humidity": 52,
            "pressure": 1018,
            "dew_point": 60.0,
            "wind_speed": 7.0,
            "wind_gust": 10.0,
            "wind_deg": 315,
            "uvi": 7.0,
            "pop": 0.05,
            "rain": 0.0,
            "snow": 0.0,
            "clouds": 15,
            "sunrise": "06:18",
            "sunset": "19:42",
            "moonrise": None,
            "moonset": "14:00",
            "moon_phase": 0.1,
            "summary": "Beautiful sunny day",
        },
    ]

    # Generate hourly data for each rich day
    def generate_hourly(day_offset: int, day_data: dict) -> list[HourlyForecast]:
        """Generate 6 hourly readings (every 3 hours from 6am to 9pm)."""
        hourly = []
        base_temp = day_data["temp_morn"]
        peak_temp = day_data["temp_day"]
        evening_temp = day_data["temp_eve"]

        temps = [
            base_temp,
            base_temp + (peak_temp - base_temp) * 0.3,
            base_temp + (peak_temp - base_temp) * 0.7,
            peak_temp,
            peak_temp - (peak_temp - evening_temp) * 0.4,
            evening_temp - 3,
        ]
        times = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]

        for i, (time_str, temp) in enumerate(zip(times, temps, strict=True)):
            hour_date = today + timedelta(days=day_offset)
            hourly.append(
                HourlyForecast(
                    time=f"{hour_date.isoformat()}T{time_str}:00",
                    temperature=round(convert_mock_temp(temp, units), 1),
                    feels_like=round(convert_mock_temp(temp - 2, units), 1),
                    condition=day_data["condition"],
                    icon=day_data["icon"],
                    humidity=day_data["humidity"] + (i * 2),
                    wind_speed=day_data["wind_speed"] + (i * 0.5),
                    pop=day_data["pop"],
                    pressure=day_data["pressure"],
                    dew_point=convert_mock_temp(day_data["dew_point"], units),
                    uvi=max(0, day_data["uvi"] - (i * 0.8)),
                )
            )
        return hourly

    forecast = []

    # Days 1-7: Rich data with hourly breakdown
    for i, day_data in enumerate(rich_days):
        day_date = today + timedelta(days=i)
        forecast.append(
            DailyForecast(
                date=day_date.isoformat(),
                high=convert_mock_temp(day_data["high"], units),
                low=convert_mock_temp(day_data["low"], units),
                condition=day_data["condition"],
                icon=day_data["icon"],
                feels_like_day=convert_mock_temp(day_data["feels_like_day"], units),
                feels_like_night=convert_mock_temp(day_data["feels_like_night"], units),
                temp_morn=convert_mock_temp(day_data["temp_morn"], units),
                temp_day=convert_mock_temp(day_data["temp_day"], units),
                temp_eve=convert_mock_temp(day_data["temp_eve"], units),
                temp_night=convert_mock_temp(day_data["temp_night"], units),
                humidity=day_data["humidity"],
                pressure=day_data["pressure"],
                dew_point=convert_mock_temp(day_data["dew_point"], units),
                wind_speed=day_data["wind_speed"],
                wind_gust=day_data["wind_gust"],
                wind_deg=day_data["wind_deg"],
                uvi=day_data["uvi"],
                pop=day_data["pop"],
                rain=day_data["rain"],
                snow=day_data["snow"],
                clouds=day_data["clouds"],
                sunrise=day_data["sunrise"],
                sunset=day_data["sunset"],
                moonrise=day_data["moonrise"],
                moonset=day_data["moonset"],
                moon_phase=day_data["moon_phase"],
                summary=day_data["summary"],
                hourly=generate_hourly(i, day_data),
            )
        )

    # Days 8-16: Basic data only
    basic_days = [
        {"condition": "sunny", "icon": "01d", "high": 82, "low": 70},
        {"condition": "partly-cloudy", "icon": "02d", "high": 77, "low": 65},
        {"condition": "cloudy", "icon": "03d", "high": 73, "low": 61},
        {"condition": "sunny", "icon": "01d", "high": 79, "low": 67},
        {"condition": "partly-cloudy", "icon": "02d", "high": 76, "low": 64},
        {"condition": "sunny", "icon": "01d", "high": 80, "low": 68},
        {"condition": "cloudy", "icon": "03d", "high": 74, "low": 62},
        {"condition": "partly-cloudy", "icon": "02d", "high": 78, "low": 66},
        {"condition": "sunny", "icon": "01d", "high": 81, "low": 69},
    ]

    for i, day_data in enumerate(basic_days):
        day_date = today + timedelta(days=7 + i)
        forecast.append(
            DailyForecast(
                date=day_date.isoformat(),
                high=convert_mock_temp(day_data["high"], units),
                low=convert_mock_temp(day_data["low"], units),
                condition=day_data["condition"],
                icon=day_data["icon"],
            )
        )

    return WeatherResponse(current=current, forecast=forecast)
