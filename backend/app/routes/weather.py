"""Weather API routes.

Provides endpoints for fetching current weather and forecast data.
"""

from fastapi import APIRouter, Depends

from app.api.deps import CacheDep, WeatherProviderDep
from app.api.models.requests import WeatherQuery
from app.api.models.weather import WeatherResponse
from app.config import settings
from app.services.mock_data import get_mock_weather

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("", response_model=WeatherResponse)
async def get_weather_endpoint(
    weather_provider: WeatherProviderDep,
    cache: CacheDep,
    query: WeatherQuery = Depends(),
) -> WeatherResponse:
    """Get current weather and 19-day forecast.

    Fetches from OpenWeatherMap API. Falls back to mock data
    when API key is not configured. Results are cached for 10 minutes.

    Args:
        weather_provider: Injected weather provider instance.
        cache: Injected cache instance.
        query: Validated query parameters.

    Returns:
        WeatherResponse with current conditions and forecast.
    """
    cache_key = f"weather:{query.units}"

    # Try cache first
    cached = await cache.get(cache_key)
    if cached is not None:
        return WeatherResponse(**cached)

    # Fetch from provider
    try:
        result = await weather_provider.get_weather(query.units)
        # Cache the result
        await cache.set(cache_key, result.model_dump(), settings.WEATHER_CACHE_TTL)
        return result
    except Exception:
        # Fail-open: return mock data on any failure
        return get_mock_weather(query.units)
