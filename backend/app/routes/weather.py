from fastapi import APIRouter, Query

from app.models import WeatherResponse
from app.services.weather_service import get_weather

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("", response_model=WeatherResponse)
async def get_weather_endpoint(
    units: str = Query(
        "imperial",
        description="Temperature units: metric (Celsius) or imperial (Fahrenheit)",
    ),
):
    """
    Get current weather and 16-day forecast.

    Fetches from OpenWeatherMap API. Falls back to mock data
    when API key is not configured.

    Args:
        units: Temperature units - "metric" for Celsius, "imperial" for Fahrenheit (default)
    """
    if units not in ["metric", "imperial"]:
        units = "imperial"
    return await get_weather(units)
