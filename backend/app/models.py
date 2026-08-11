from typing import Literal

from pydantic import BaseModel


class FamilyMember(BaseModel):
    name: str
    key: str
    calendar_id: str
    color: str
    initial: str


class Attendee(BaseModel):
    """Represents an event attendee with RSVP status."""

    member_key: str | None = None  # null for external guests not in family config
    email: str
    display_name: str
    status: Literal["accepted", "declined", "tentative", "needsAction"]
    color: str  # member color or default grey for external guests


class CalendarEvent(BaseModel):
    id: str
    title: str
    start: str  # ISO format
    end: str  # ISO format
    all_day: bool = False
    members: list[str] = []  # list of member keys (backward compatible)
    description: str | None = None
    location: str | None = None
    organizer: str | None = None  # member key of the event organizer
    attendees: list[Attendee] = []
    recurring_event_id: str | None = None
    is_recurring_instance: bool = False
    recurrence_rule: str | None = None  # e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO"


class WeekCalendar(BaseModel):
    week_start: str  # ISO date (Monday)
    week_end: str  # ISO date (Sunday)
    events: list[CalendarEvent]


# All 15 distinct OpenWeatherMap weather.main values — 1:1 mapping, no grouping.
WeatherCondition = Literal[
    "clear",
    "clouds",
    "rain",
    "drizzle",
    "thunderstorm",
    "snow",
    "mist",
    "smoke",
    "haze",
    "dust",
    "fog",
    "sand",
    "ash",
    "squall",
    "tornado",
]


class WeatherCurrent(BaseModel):
    temperature: float
    feels_like: float
    condition: WeatherCondition
    icon: str
    is_night: bool = False
    humidity: int
    wind_speed: float
    wind_gust: float | None = None
    wind_deg: int | None = None
    pressure: float | None = None  # API returns float (e.g., 1010.87)
    dew_point: float | None = None
    uvi: float | None = None
    sunrise: str | None = None  # ISO time
    sunset: str | None = None  # ISO time


class HourlyForecast(BaseModel):
    """Hourly weather data for rich day breakdown."""

    time: str  # ISO datetime
    temperature: float
    feels_like: float
    condition: WeatherCondition
    icon: str
    humidity: int
    wind_speed: float
    pop: float  # probability of precipitation (0-1)
    pressure: float | None = None  # API returns float
    dew_point: float | None = None
    uvi: float | None = None


class DailyForecast(BaseModel):
    """Daily weather forecast. Rich fields for days 1-7, basic for days 8-16."""

    date: str
    high: float
    low: float
    condition: WeatherCondition
    icon: str

    # Rich fields (days 1-7 from One Call API)
    feels_like_day: float | None = None
    feels_like_night: float | None = None
    temp_morn: float | None = None
    temp_day: float | None = None
    temp_eve: float | None = None
    temp_night: float | None = None
    humidity: int | None = None
    pressure: float | None = None  # API returns float
    dew_point: float | None = None
    wind_speed: float | None = None
    wind_gust: float | None = None
    wind_deg: int | None = None
    uvi: float | None = None
    pop: float | None = None  # probability of precipitation (0-1)
    rain: float | None = None  # mm
    snow: float | None = None  # mm
    clouds: int | None = None  # percentage
    sunrise: str | None = None  # ISO time
    sunset: str | None = None  # ISO time
    moonrise: str | None = None  # ISO time
    moonset: str | None = None  # ISO time
    moon_phase: float | None = None  # 0-1
    summary: str | None = None

    # Hourly breakdown (days 1-7 only)
    hourly: list[HourlyForecast] = []


class WeatherResponse(BaseModel):
    current: WeatherCurrent
    forecast: list[DailyForecast]
