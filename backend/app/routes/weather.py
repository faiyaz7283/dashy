from fastapi import APIRouter

from app.models import WeatherResponse
from app.services.weather_service import get_weather

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("", response_model=WeatherResponse)
async def get_weather_endpoint():
    """
    Get current weather and 7-day forecast.

    Fetches from OpenWeatherMap API. Falls back to mock data
    when API key is not configured.
    """
    return await get_weather()
