"""API request models.

Pydantic models for API request validation.
"""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class WeatherQuery(BaseModel):
    """Weather API request parameters.

    Attributes:
        units: Temperature units (imperial or metric).
    """

    units: Literal["imperial", "metric"] = Field(
        default="imperial",
        description="Temperature units: imperial (Fahrenheit) or metric (Celsius)",
    )


class CalendarQuery(BaseModel):
    """Calendar API request parameters.

    Attributes:
        start_date: Start date for calendar range (ISO format).
        end_date: End date for calendar range (ISO format).
    """

    start_date: date | None = Field(
        default=None,
        description="Start date for calendar range (ISO format, e.g., 2024-01-01)",
    )
    end_date: date | None = Field(
        default=None,
        description="End date for calendar range (ISO format, e.g., 2024-12-31)",
    )

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v: date | None, info) -> date | None:
        """Validate that end_date is after start_date if both provided."""
        if v is not None and info.data.get("start_date") is not None:
            start = info.data["start_date"]
            if v < start:
                raise ValueError("end_date must be after start_date")
        return v
