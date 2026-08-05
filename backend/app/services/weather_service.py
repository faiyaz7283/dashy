"""
OpenWeatherMap service.

Fetches current weather and forecast from OpenWeatherMap API.
Falls back to mock data when API key is not available.
"""

import httpx

from app.config import settings
from app.models import WeatherCurrent, WeatherForecast, WeatherResponse
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


def _map_icon(icon_code: str) -> str:
    """Map OpenWeatherMap icon code to our icon identifiers."""
    # OpenWeatherMap icon codes: https://openweathermap.org/weather-conditions
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


async def get_weather() -> WeatherResponse:
    """
    Fetch current weather and 7-day forecast from OpenWeatherMap.

    Falls back to mock data if:
    - API key is not configured
    - API request fails
    """
    api_key = settings.OPENWEATHERMAP_API_KEY
    if not api_key or api_key == "your-openweathermap-api-key":
        return get_mock_weather()

    lat = settings.OPENWEATHERMAP_LAT
    lon = settings.OPENWEATHERMAP_LON

    try:
        async with httpx.AsyncClient() as client:
            # Fetch current weather + 7-day forecast in one call
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": api_key,
                    "units": "imperial",  # Fahrenheit
                    "cnt": 40,  # 3-hour intervals, 40 = ~5 days
                },
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()

            # Current conditions (first item)
            current_data = data["list"][0]
            current = WeatherCurrent(
                temperature=current_data["main"]["temp"],
                feels_like=current_data["main"]["feels_like"],
                condition=_map_condition(current_data["weather"][0]["main"]),
                icon=_map_icon(current_data["weather"][0]["icon"]),
                humidity=current_data["main"]["humidity"],
                wind_speed=current_data["wind"]["speed"],
            )

            # Daily forecast (aggregate 3-hour intervals into daily)
            daily_data: dict[str, dict] = {}
            for item in data["list"]:
                date = item["dt_txt"].split(" ")[0]
                if date not in daily_data:
                    daily_data[date] = {
                        "high": item["main"]["temp_max"],
                        "low": item["main"]["temp_min"],
                        "condition": _map_condition(item["weather"][0]["main"]),
                        "icon": _map_icon(item["weather"][0]["icon"]),
                    }
                else:
                    daily_data[date]["high"] = max(
                        daily_data[date]["high"], item["main"]["temp_max"]
                    )
                    daily_data[date]["low"] = min(daily_data[date]["low"], item["main"]["temp_min"])

            forecast = [
                WeatherForecast(
                    date=date,
                    high=info["high"],
                    low=info["low"],
                    condition=info["condition"],
                    icon=info["icon"],
                )
                for date, info in sorted(daily_data.items())
            ]

            return WeatherResponse(current=current, forecast=forecast)

    except httpx.HTTPError as e:
        print(f"OpenWeatherMap API error: {e}")
        return get_mock_weather()
    except Exception as e:
        print(f"Unexpected error fetching weather: {e}")
        return get_mock_weather()
