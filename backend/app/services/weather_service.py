"""
OpenWeatherMap service using One Call API 4.0.

Fetches current weather and forecast from OpenWeatherMap API 4.0.
- Current weather: /data/4.0/onecall/current
- Hourly forecast: /data/4.0/onecall/timeline/1h (anchored at today's midnight, 24 hours)
- Daily forecast: /data/4.0/onecall/timeline/1day (anchored at today, fetches 20 days, returns 19)

All timeline queries are anchored at "today" in the local timezone (Eastern Time),
so no historical data is fetched. Pagination is limited to the required window.

In development (WEATHER_USE_MOCK=true), returns mock data to stay within API limits.
In production (WEATHER_USE_MOCK=false), calls the real API.
"""

from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings
from app.models import (
    DailyForecast,
    HourlyForecast,
    WeatherCondition,
    WeatherCurrent,
    WeatherResponse,
)
from app.services.mock_data import get_mock_weather

# Valid OWM weather.main values — 1:1 mapping, no grouping.
_VALID_CONDITIONS: set[str] = {
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
}

# How many records to fetch from each timeline endpoint.
_MAX_DAILY_RECORDS = 20  # Fetch 20 to ensure 19 remain after filtering past entries
_MAX_HOURLY_RECORDS = 48  # 2 full days


def _map_condition(weather_main: str) -> WeatherCondition:
    """Map OpenWeatherMap weather.main to our condition type (1:1, no grouping)."""
    normalized = weather_main.lower()
    if normalized in _VALID_CONDITIONS:
        return normalized  # type: ignore[return-value]
    return "clouds"  # safe fallback


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
    """Extract day/night suffix from OWM icon code (e.g., '01d' -> 'd', '01n' -> 'n')."""
    if len(icon_code) >= 3:
        return icon_code[2]  # 'd' or 'n'
    return "d"  # default to day


def _ts_to_iso(ts: int, tz_offset: int = 0) -> str:
    """Convert Unix timestamp to ISO time string (HH:MM) in local timezone."""
    local_tz = timezone(timedelta(seconds=tz_offset))
    return datetime.fromtimestamp(ts, tz=local_tz).strftime("%H:%M")


def _ts_to_datetime(ts: int, tz_offset: int = 0) -> str:
    """Convert Unix timestamp to ISO datetime string in local timezone."""
    local_tz = timezone(timedelta(seconds=tz_offset))
    return datetime.fromtimestamp(ts, tz=local_tz).strftime("%Y-%m-%dT%H:%M:%S")


def _ts_to_date(ts: int, tz_offset: int = 0) -> str:
    """Convert Unix timestamp to ISO date string (YYYY-MM-DD) in local timezone."""
    local_tz = timezone(timedelta(seconds=tz_offset))
    return datetime.fromtimestamp(ts, tz=local_tz).strftime("%Y-%m-%d")


def _get_today_midnight_timestamp(tz_offset: int) -> int:
    """
    Get Unix timestamp for today's midnight in the given timezone.

    This ensures "today" is calculated in the local timezone (Eastern Time),
    not UTC. The tz_offset comes from the OWM API response and accounts for DST.
    """
    local_tz = timezone(timedelta(seconds=tz_offset))
    now = datetime.now(local_tz)
    today_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return int(today_midnight.timestamp())


def _parse_hourly_from_data(
    hourly_data: list[dict], day_date: str, tz_offset: int = 0, units: str = "imperial"
) -> list[HourlyForecast]:
    """Parse hourly data for a specific day from One Call API 4.0 response."""
    result = []
    for h in hourly_data:
        h_date = _ts_to_date(h["dt"], tz_offset)
        if h_date != day_date:
            continue
        condition = _map_condition(h["weather"][0]["main"])
        result.append(
            HourlyForecast(
                time=_ts_to_datetime(h["dt"], tz_offset),
                temperature=convert_temperature(h["temp"], units),
                feels_like=convert_temperature(h["feels_like"], units),
                condition=condition,
                icon=condition,  # Use condition name, not day/night suffix
                humidity=h.get("humidity", 0),
                wind_speed=h.get("wind_speed", 0),
                pop=h.get("pop", 0),
                pressure=h.get("pressure"),
                dew_point=h.get("dew_point"),
                uvi=h.get("uvi"),
            )
        )
    return result


async def _fetch_current(
    client: httpx.AsyncClient, api_key: str, lat: float, lon: float
) -> dict | None:
    """Fetch current weather from One Call API 4.0."""
    try:
        response = await client.get(
            "https://api.openweathermap.org/data/4.0/onecall/current",
            params={
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric",
            },
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        print(f"Current weather API error: {e}")
        return None


async def _fetch_hourly(
    client: httpx.AsyncClient,
    api_key: str,
    lat: float,
    lon: float,
    start: int | None = None,
    max_records: int = _MAX_HOURLY_RECORDS,
) -> list[dict] | None:
    """
    Fetch hourly forecast from One Call API 4.0 with pagination.

    Anchored at 'start' timestamp (today's midnight in local timezone).
    Limited to max_records to avoid fetching historical data.
    """
    try:
        all_hourly: list[dict] = []
        url = "https://api.openweathermap.org/data/4.0/onecall/timeline/1h"
        params: dict = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
        }
        if start is not None:
            params["start"] = start

        # Fetch first page
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        all_hourly.extend(data.get("data", []))

        # Follow pagination until we have enough records or no more pages
        while "next" in data and len(all_hourly) < max_records:
            next_url = data["next"]
            response = await client.get(next_url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            all_hourly.extend(data.get("data", []))

        # Trim to max_records
        return all_hourly[:max_records]
    except httpx.HTTPError as e:
        print(f"Hourly forecast API error: {e}")
        return None


async def _fetch_daily(
    client: httpx.AsyncClient,
    api_key: str,
    lat: float,
    lon: float,
    start: int | None = None,
    max_records: int = _MAX_DAILY_RECORDS,
) -> list[dict] | None:
    """
    Fetch daily forecast from One Call API 4.0 with pagination.

    Anchored at 'start' timestamp (today's midnight in local timezone).
    Limited to max_records (20 days) to ensure 19 remain after filtering past entries.
    """
    try:
        all_daily: list[dict] = []
        url = "https://api.openweathermap.org/data/4.0/onecall/timeline/1day"
        params: dict = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
        }
        if start is not None:
            params["start"] = start

        # Fetch first page
        response = await client.get(url, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        all_daily.extend(data.get("data", []))

        # Follow pagination until we have enough records or no more pages
        while "next" in data and len(all_daily) < max_records:
            next_url = data["next"]
            response = await client.get(next_url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            all_daily.extend(data.get("data", []))

        # DEBUG: Log first few dates from API to check if buffer is needed
        if all_daily:
            from datetime import datetime, timezone as tz
            sample_dates = []
            for i, record in enumerate(all_daily[:5]):
                dt = record.get("dt", 0)
                date_str = datetime.fromtimestamp(dt, tz=tz.utc).strftime("%Y-%m-%d")
                sample_dates.append(f"record[{i}]={date_str}")
            print(f"[Weather Debug] API returned {len(all_daily)} daily records. First 5: {', '.join(sample_dates)}", flush=True)

        # Trim to max_records
        return all_daily[:max_records]
    except httpx.HTTPError as e:
        print(f"Daily forecast API error: {e}")
        return None


async def get_weather(units: str = "imperial") -> WeatherResponse:
    """
    Fetch current weather and 19-day forecast from OpenWeatherMap API 4.0.

    In development (WEATHER_USE_MOCK=true), returns mock data.
    In production (WEATHER_USE_MOCK=false), calls the real API.

    The timeline is anchored at today's midnight in the local timezone (Eastern Time),
    so only future data is fetched — no historical data leakage.

    API call budget (at 10-minute refresh = 144 calls/day):
    - Current: 1 call
    - Hourly: 24 records ÷ 20/page = 2 pages = 2 calls
    - Daily: 20 records ÷ 10/page = 2 pages = 2 calls (fetches 20, returns 19 after filtering)
    - Total: 5 calls/refresh × 144 = 720 calls/day (under 1000 free limit)

    Args:
        units: Temperature units - "metric" for Celsius, "imperial" for Fahrenheit (default)
    """
    # Check if we should use mock data (development mode)
    if settings.WEATHER_USE_MOCK:
        return get_mock_weather(units)

    api_key = settings.OPENWEATHERMAP_API_KEY
    if not api_key or api_key == "your-openweathermap-api-key":
        return get_mock_weather(units)

    lat = settings.OPENWEATHERMAP_LAT
    lon = settings.OPENWEATHERMAP_LON

    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Fetch current weather to get timezone_offset
            current_data = await _fetch_current(client, api_key, lat, lon)
            if current_data is None:
                print("Current weather API failed, falling back to mock data")
                return get_mock_weather(units)

            # Step 2: Calculate start timestamp (today's midnight in local timezone)
            # The timezone_offset from OWM accounts for DST automatically.
            tz_offset = current_data.get("timezone_offset", 0)
            start_ts = _get_today_midnight_timestamp(tz_offset)

            # Step 3: Fetch daily and hourly concurrently with start parameter
            import asyncio

            daily_task = _fetch_daily(client, api_key, lat, lon, start=start_ts)
            hourly_task = _fetch_hourly(client, api_key, lat, lon, start=start_ts)

            daily_data, hourly_data = await asyncio.gather(daily_task, hourly_task)

            # If both failed, fall back to mock
            if daily_data is None and hourly_data is None:
                print("Daily and hourly API calls failed, falling back to mock data")
                return get_mock_weather(units)

            return _build_response(current_data, hourly_data, daily_data, tz_offset, units)

    except Exception as e:
        print(f"Unexpected error fetching weather: {e}")
        return get_mock_weather(units)


def _build_response(
    current_data: dict,
    hourly_data: list[dict] | None,
    daily_data: list[dict] | None,
    tz_offset: int,
    units: str = "imperial",
) -> WeatherResponse:
    """Build WeatherResponse from One Call API 4.0 data."""
    # Build current weather
    if "data" in current_data and len(current_data["data"]) > 0:
        current_record = current_data["data"][0]
        current_condition = _map_condition(current_record["weather"][0]["main"])

        # Calculate is_night based on sunrise/sunset times
        is_night = False
        if "sunrise" in current_record and "sunset" in current_record:
            local_tz = timezone(timedelta(seconds=tz_offset))
            now = datetime.now(local_tz)
            sunrise_ts = current_record["sunrise"]
            sunset_ts = current_record["sunset"]
            now_ts = now.timestamp()
            is_night = now_ts < sunrise_ts or now_ts > sunset_ts

        current = WeatherCurrent(
            temperature=convert_temperature(current_record.get("temp"), units),
            feels_like=convert_temperature(current_record.get("feels_like"), units),
            condition=current_condition,
            icon=current_condition,  # Use condition name, not day/night suffix
            is_night=is_night,
            humidity=current_record.get("humidity", 0),
            wind_speed=current_record.get("wind_speed", 0),
            wind_gust=current_record.get("wind_gust"),
            wind_deg=current_record.get("wind_deg"),
            pressure=current_record.get("pressure"),
            dew_point=convert_temperature(current_record.get("dew_point"), units),
            uvi=current_record.get("uvi"),
            sunrise=_ts_to_iso(current_record["sunrise"], tz_offset)
            if "sunrise" in current_record
            else None,
            sunset=_ts_to_iso(current_record["sunset"], tz_offset)
            if "sunset" in current_record
            else None,
        )
    else:
        # Should not reach here since we already checked current_data, but fallback
        return get_mock_weather(units)

    # Build daily forecast
    forecast: list[DailyForecast] = []
    seen_dates: set[str] = set()

    # Get today's date in local timezone to filter out past days
    local_tz = timezone(timedelta(seconds=tz_offset))
    now_ts = int(datetime.now(local_tz).timestamp())
    today_date = _ts_to_date(now_ts, tz_offset)

    if daily_data:
        # DEBUG: Log what we're about to filter
        print(f"[Weather Debug] Filtering daily data. Today's date (local): {today_date}, Total records from API: {len(daily_data)}", flush=True)
        filtered_count = 0
        for day in daily_data:
            date = _ts_to_date(day["dt"], tz_offset)
            # Skip past dates and duplicates
            if date < today_date or date in seen_dates:
                filtered_count += 1
                print(f"[Weather Debug] Filtering out date: {date} (reason: {'past' if date < today_date else 'duplicate'})", flush=True)
                continue
            seen_dates.add(date)

            temp = day.get("temp", {})
            feels = day.get("feels_like", {})
            weather = day["weather"][0] if day.get("weather") else {}
            day_condition = _map_condition(weather.get("main", "clouds"))

            # Get hourly data for this day
            day_hourly = []
            if hourly_data:
                day_hourly = _parse_hourly_from_data(hourly_data, date, tz_offset, units)

            forecast.append(
                DailyForecast(
                    date=date,
                    high=convert_temperature(temp.get("max", 0), units),
                    low=convert_temperature(temp.get("min", 0), units),
                    condition=day_condition,
                    icon=day_condition,  # Use condition name, not day/night suffix
                    feels_like_day=convert_temperature(feels.get("day"), units),
                    feels_like_night=convert_temperature(feels.get("night"), units),
                    temp_morn=convert_temperature(temp.get("morn"), units),
                    temp_day=convert_temperature(temp.get("day"), units),
                    temp_eve=convert_temperature(temp.get("eve"), units),
                    temp_night=convert_temperature(temp.get("night"), units),
                    humidity=day.get("humidity"),
                    pressure=day.get("pressure"),
                    dew_point=convert_temperature(day.get("dew_point"), units),
                    wind_speed=day.get("wind_speed"),
                    wind_gust=day.get("wind_gust"),
                    wind_deg=day.get("wind_deg"),
                    uvi=day.get("uvi"),
                    pop=day.get("pop"),
                    rain=day.get("rain"),
                    snow=day.get("snow"),
                    clouds=day.get("clouds"),
                    sunrise=_ts_to_iso(day["sunrise"], tz_offset) if "sunrise" in day else None,
                    sunset=_ts_to_iso(day["sunset"], tz_offset) if "sunset" in day else None,
                    moonrise=_ts_to_iso(day["moonrise"], tz_offset) if "moonrise" in day else None,
                    moonset=_ts_to_iso(day["moonset"], tz_offset) if "moonset" in day else None,
                    moon_phase=day.get("moon_phase"),
                    summary=None,  # daily.summary removed in 4.0
                    hourly=day_hourly,
                )
            )

    # DEBUG: Log final count after filtering
    print(f"[Weather Debug] After filtering: {len(forecast)} days remain (filtered out {filtered_count if daily_data else 0})", flush=True)

    # Ensure exactly 19 days (today + 18 future days)
    forecast = forecast[:19]

    return WeatherResponse(current=current, forecast=forecast)
