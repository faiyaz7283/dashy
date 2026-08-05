import json

from pydantic_settings import BaseSettings


class FamilyMemberConfig:
    def __init__(self, name: str, key: str, calendar_id: str, color: str):
        self.name = name
        self.key = key
        self.calendar_id = calendar_id
        self.color = color


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"

    # Google Calendar
    GOOGLE_CALENDAR_ID: str
    GOOGLE_SERVICE_ACCOUNT_JSON: str

    # OpenWeatherMap
    OPENWEATHERMAP_API_KEY: str
    OPENWEATHERMAP_LAT: float = 40.7259
    OPENWEATHERMAP_LON: float = -73.5143

    # Family
    FAMILY_MEMBERS: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_family_members(self) -> list[FamilyMemberConfig]:
        """Parse FAMILY_MEMBERS JSON into list of FamilyMemberConfig objects."""
        members = json.loads(self.FAMILY_MEMBERS)
        return [
            FamilyMemberConfig(
                name=m["name"],
                key=m["key"],
                calendar_id=m["calendar_id"],
                color=m["color"],
            )
            for m in members
        ]


settings = Settings()
