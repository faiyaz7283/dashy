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


class WeatherCurrent(BaseModel):
    temperature: float
    feels_like: float
    condition: Literal["sunny", "cloudy", "rainy", "partly-cloudy", "snowy"]
    icon: str
    humidity: int
    wind_speed: float


class WeatherForecast(BaseModel):
    date: str
    high: float
    low: float
    condition: Literal["sunny", "cloudy", "rainy", "partly-cloudy", "snowy"]
    icon: str


class WeatherResponse(BaseModel):
    current: WeatherCurrent
    forecast: list[WeatherForecast]
