from typing import Literal

from pydantic import BaseModel


class FamilyMember(BaseModel):
    name: str
    key: str
    calendar_id: str
    color: str
    initial: str


class CalendarEvent(BaseModel):
    id: str
    title: str
    start: str  # ISO format
    end: str  # ISO format
    all_day: bool = False
    members: list[str]  # list of member keys


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
