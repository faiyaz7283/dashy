"""
OpenWeatherMap service.

Fetches current weather and forecast from OpenWeatherMap API.
- One Call API 3.0: 7 days of rich data (hourly breakdown, sunrise/sunset, etc.)
- 16-day forecast API: days 8-16 with basic data (high/low, condition)
Falls back to mock data when API key is not available.
"""

from datetime import UTC, datetime

import httpx

from app.config import settings
from app.models import (
    DailyForecast,
    HourlyForecast,
    WeatherCurrent,
    WeatherResponse,
)
from app.services.mock_data import get_mock_weather


def _map_condition(weather_main: str) -> str:
    """Map OpenWeatherMap condition to our condition types."""
    condition_map = {
        "clear": "sunny",
        "clouds": "cloudy",
        "rain": "rainy",
        "drizzle": "rainy",
        "thunderstorm": "rainy",
        "snow": "snowy",
        "mist": "cloudy",
        "fog": "cloudy",
        "haze": "cloudy",
    }
    return condition_map.get(weather_main.lower(), "cloudy")


def celsius_to_fahrenheit(celsius: float) -> float:
    """Convert Celsius to Fahrenheit."""
    return (celsius * 9 / 5) + 32


def convert_temperature(value: float | None, units: str) -> float | None:
    """Convert temperature from Celsius to requested units."""
    if value is None:
        return None
    if units == "imperial":
        return celsius_to_fahrenheit(value)
    return value  # metric, return as-is


def _map_icon(icon_code: str) -> str:
    """Map OpenWeatherMap icon code to our icon identifiers."""
    icon_map = {
        "01": "sunny",
        "02": "partly-cloudy",
        "03": "cloudy",
        "04": "cloudy",
        "09": "rainy",
        "10": "rainy",
        "11": "rainy",
        "13": "snowy",
        "50": "cloudy",
    }
    prefix = icon_code[:2]
    return icon_map.get(prefix, "cloudy")


def _ts_to_iso(ts: int) -> str:
    """Convert Unix timestamp to ISO time string (HH:MM)."""
    return datetime.fromtimestamp(ts, tz=UTC).strftime("%H:%M")


def _ts_to_datetime(ts: int) -> str:
    """Convert Unix timestamp to ISO datetime string."""
    return datetime.fromtimestamp(ts, tz=UTC).strftime("%Y-%m-%dT%H:%M:%S")


def _ts_to_date(ts: int) -> str:
    """Convert Unix timestamp to ISO date string (YYYY-MM-DD)."""
    return datetime.fromtimestamp(ts, tz=UTC).strftime("%Y-%m-%d")


def _parse_hourly(hourly_data: list[dict], day_date: str) -> list[HourlyForecast]:
    """Parse hourly data for a specific day from One Call API response."""
    result = []
    for h in hourly_data:
        h_date = _ts_to_date(h["dt"])
        if h_date != day_date:
            continue
        result.append(
            HourlyForecast(
                time=_ts_to_datetime(h["dt"]),
                temperature=h["temp"],
                feels_like=h["feels_like"],
                condition=_map_condition(h["weather"][0]["main"]),
                icon=_map_icon(h["weather"][0]["icon"]),
                humidity=h.get("humidity", 0),
                wind_speed=h.get("wind_speed", 0),
                pop=h.get("pop", 0),
                pressure=h.get("pressure"),
                dew_point=h.get("dew_point"),
                uvi=h.get("uvi"),
            )
        )
    return result


async def _fetch_one_call(
    client: httpx.AsyncClient, api_key: str, lat: float, lon: float
) -> dict | None:
    """Fetch One Call API 3.0 data (current + 7 days daily + hourly)."""
    try:
        response = await client.get(
            "https://api.openweathermap.org/data/3.0/onecall",
            params={
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric",  # Fetch Celsius, convert later
                "exclude": "minutely,alerts",
            },
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        print(f"One Call API error: {e}")
        return None


async def _fetch_16day(
    client: httpx.AsyncClient, api_key: str, lat: float, lon: float
) -> dict | None:
    """Fetch 16-day forecast API data (basic daily data)."""
    try:
        response = await client.get(
            "https://api.openweathermap.org/data/2.5/forecast/daily",
            params={
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric",  # Fetch Celsius, convert later
                "cnt": 16,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        print(f"16-day API error: {e}")
        return None


async def get_weather(units: str = "imperial") -> WeatherResponse:
    """
    Fetch current weather and 16-day forecast from OpenWeatherMap.

    Uses One Call API 3.0 for days 1-7 (rich data with hourly breakdown)
    and 16-day forecast API for days 8-16 (basic data).

    Args:
        units: Temperature units - "metric" for Celsius, "imperial" for Fahrenheit (default)

    Falls back to mock data if:
    - API key is not configured
    - Both API requests fail
    """
    api_key = settings.OPENWEATHERMAP_API_KEY
    if not api_key or api_key == "your-openweathermap-api-key":
        return get_mock_weather(units)

    lat = settings.OPENWEATHERMAP_LAT
    lon = settings.OPENWEATHERMAP_LON

    try:
        async with httpx.AsyncClient() as client:
            one_call_data, daily_16_data = await _fetch_both_apis(client, api_key, lat, lon)

            if one_call_data is None and daily_16_data is None:
                return get_mock_weather(units)

            return _build_response(one_call_data, daily_16_data, units)

    except Exception as e:
        print(f"Unexpected error fetching weather: {e}")
        return get_mock_weather(units)


async def _fetch_both_apis(
    client: httpx.AsyncClient, api_key: str, lat: float, lon: float
) -> tuple[dict | None, dict | None]:
    """Fetch both APIs concurrently."""
    import asyncio

    one_call_task = _fetch_one_call(client, api_key, lat, lon)
    daily_16_task = _fetch_16day(client, api_key, lat, lon)
    one_call_data, daily_16_data = await asyncio.gather(one_call_task, daily_16_task)
    return one_call_data, daily_16_data


def _build_response(
    one_call_data: dict | None, daily_16_data: dict | None, units: str = "imperial"
) -> WeatherResponse:
    """Build WeatherResponse from API data, converting temperatures to requested units."""
    # Current conditions from One Call
    if one_call_data:
        current_data = one_call_data["current"]
        current = WeatherCurrent(
            temperature=convert_temperature(current_data["temp"], units),
            feels_like=convert_temperature(current_data["feels_like"], units),
            condition=_map_condition(current_data["weather"][0]["main"]),
            icon=_map_icon(current_data["weather"][0]["icon"]),
            humidity=current_data.get("humidity", 0),
            wind_speed=current_data.get("wind_speed", 0),
            wind_gust=current_data.get("wind_gust"),
            wind_deg=current_data.get("wind_deg"),
            pressure=current_data.get("pressure"),
            dew_point=convert_temperature(current_data.get("dew_point"), units),
            uvi=current_data.get("uvi"),
            sunrise=_ts_to_iso(current_data["sunrise"]) if "sunrise" in current_data else None,
            sunset=_ts_to_iso(current_data["sunset"]) if "sunset" in current_data else None,
        )
    else:
        # Fallback: use first item from 16-day data
        first_day = daily_16_data["list"][0]
        current = WeatherCurrent(
            temperature=convert_temperature(first_day["temp"]["day"], units),
            feels_like=convert_temperature(first_day["temp"]["day"], units),
            condition=_map_condition(first_day["weather"][0]["main"]),
            icon=_map_icon(first_day["weather"][0]["icon"]),
            humidity=first_day.get("humidity", 0),
            wind_speed=first_day.get("speed", 0),
        )

    # Build daily forecast: days 1-7 from One Call, days 8-16 from 16-day API
    forecast: list[DailyForecast] = []
    seen_dates: set[str] = set()

    # Days 1-7 from One Call (rich data with hourly breakdown)
    if one_call_data and "daily" in one_call_data:
        hourly_data = one_call_data.get("hourly", [])
        for day in one_call_data["daily"]:
            date = _ts_to_date(day["dt"])
            seen_dates.add(date)
            temp = day.get("temp", {})
            feels = day.get("feels_like", {})
            wind = day
            weather = day["weather"][0] if day.get("weather") else {}

            forecast.append(
                DailyForecast(
                    date=date,
                    high=convert_temperature(temp.get("max", 0), units),
                    low=convert_temperature(temp.get("min", 0), units),
                    condition=_map_condition(weather.get("main", "clouds")),
                    icon=_map_icon(weather.get("icon", "03d")),
                    feels_like_day=convert_temperature(feels.get("day"), units),
                    feels_like_night=convert_temperature(feels.get("night"), units),
                    temp_morn=convert_temperature(temp.get("morn"), units),
                    temp_day=convert_temperature(temp.get("day"), units),
                    temp_eve=convert_temperature(temp.get("eve"), units),
                    temp_night=convert_temperature(temp.get("night"), units),
                    humidity=day.get("humidity"),
                    pressure=day.get("pressure"),
                    dew_point=convert_temperature(day.get("dew_point"), units),
                    wind_speed=wind.get("wind_speed"),
                    wind_gust=wind.get("wind_gust"),
                    wind_deg=wind.get("wind_deg"),
                    uvi=day.get("uvi"),
                    pop=day.get("pop"),
                    rain=day.get("rain"),
                    snow=day.get("snow"),
                    clouds=day.get("clouds"),
                    sunrise=_ts_to_iso(day["sunrise"]) if "sunrise" in day else None,
                    sunset=_ts_to_iso(day["sunset"]) if "sunset" in day else None,
                    moonrise=_ts_to_iso(day["moonrise"]) if "moonrise" in day else None,
                    moonset=_ts_to_iso(day["moonset"]) if "moonset" in day else None,
                    moon_phase=day.get("moon_phase"),
                    summary=day.get("summary"),
                    hourly=[
                        HourlyForecast(
                            time=h["time"],
                            temperature=convert_temperature(h["temperature"], units),
                            feels_like=convert_temperature(h["feels_like"], units),
                            condition=h["condition"],
                            icon=h["icon"],
                            humidity=h["humidity"],
                            wind_speed=h["wind_speed"],
                            pop=h["pop"],
                            pressure=h["pressure"],
                            dew_point=convert_temperature(h["dew_point"], units),
                            uvi=h["uvi"],
                        )
                        for h in _parse_hourly(hourly_data, date)
                    ],
                )
            )

    # Days 8-16 from 16-day forecast API (basic data)
    if daily_16_data and "list" in daily_16_data:
        for day in daily_16_data["list"]:
            date = _ts_to_date(day["dt"])
            if date in seen_dates:
                continue
            seen_dates.add(date)
            temp = day.get("temp", {})
            weather = day["weather"][0] if day.get("weather") else {}

            forecast.append(
                DailyForecast(
                    date=date,
                    high=convert_temperature(temp.get("max", 0), units),
                    low=convert_temperature(temp.get("min", 0), units),
                    condition=_map_condition(weather.get("main", "clouds")),
                    icon=_map_icon(weather.get("icon", "03d")),
                    humidity=day.get("humidity"),
                    wind_speed=day.get("speed"),
                    pop=None,  # 16-day API doesn't provide pop directly
                )
            )

    return WeatherResponse(current=current, forecast=forecast)
