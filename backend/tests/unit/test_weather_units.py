"""Tests for weather unit conversion functionality."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.weather_service import celsius_to_fahrenheit, convert_temperature


@pytest.mark.asyncio
async def test_weather_endpoint_default_units():
    """Test weather endpoint returns Fahrenheit by default."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/weather")
        assert response.status_code == 200
        data = response.json()

        # Should return Fahrenheit values (higher numbers)
        assert "current" in data
        temp = data["current"]["temperature"]
        assert isinstance(temp, (int, float))
        # Mock data: 78°F = 25.6°C, so Fahrenheit should be around 78
        assert temp > 50  # Reasonable Fahrenheit range


@pytest.mark.asyncio
async def test_weather_endpoint_imperial_units():
    """Test weather endpoint with explicit imperial units."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/weather?units=imperial")
        assert response.status_code == 200
        data = response.json()

        temp = data["current"]["temperature"]
        assert isinstance(temp, (int, float))
        assert temp > 50  # Fahrenheit range


@pytest.mark.asyncio
async def test_weather_endpoint_metric_units():
    """Test weather endpoint with metric units returns Celsius."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/weather?units=metric")
        assert response.status_code == 200
        data = response.json()

        temp = data["current"]["temperature"]
        assert isinstance(temp, (int, float))
        # Mock data: 78°F = 25.6°C, so Celsius should be around 25-26
        assert 15 < temp < 35  # Reasonable Celsius range


@pytest.mark.asyncio
async def test_weather_endpoint_invalid_units():
    """Test weather endpoint with invalid units returns validation error."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/weather?units=invalid")
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data


def test_celsius_to_fahrenheit_conversion():
    """Test Celsius to Fahrenheit conversion function."""
    # Freezing point
    assert celsius_to_fahrenheit(0) == 32.0

    # Boiling point
    assert celsius_to_fahrenheit(100) == 212.0

    # Room temperature
    assert abs(celsius_to_fahrenheit(25.6) - 78.08) < 0.1


def test_convert_temperature_metric():
    """Test convert_temperature with metric units returns Celsius as-is."""
    assert convert_temperature(25.6, "metric") == 25.6
    assert convert_temperature(None, "metric") is None


def test_convert_temperature_imperial():
    """Test convert_temperature with imperial units converts to Fahrenheit."""
    result = convert_temperature(25.6, "imperial")
    assert abs(result - 78.08) < 0.1

    assert convert_temperature(None, "imperial") is None


@pytest.mark.asyncio
async def test_weather_forecast_units():
    """Test that forecast data also respects units parameter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Metric request
        response_metric = await client.get("/api/v1/weather?units=metric")
        data_metric = response_metric.json()

        # Imperial request
        response_imperial = await client.get("/api/v1/weather?units=imperial")
        data_imperial = response_imperial.json()

        # Both should have forecast data
        assert len(data_metric["forecast"]) > 0
        assert len(data_imperial["forecast"]) > 0

        # First day high temps should differ (Celsius vs Fahrenheit)
        metric_high = data_metric["forecast"][0]["high"]
        imperial_high = data_imperial["forecast"][0]["high"]

        # Fahrenheit should be higher number than Celsius for same temperature
        assert imperial_high > metric_high
