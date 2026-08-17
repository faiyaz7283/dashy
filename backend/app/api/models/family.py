"""Family API models.

Pydantic models for family API requests and responses.
"""

from pydantic import BaseModel


class FamilyMember(BaseModel):
    """A family member with calendar and display preferences.

    Attributes:
        name: Display name.
        key: Unique identifier for the family member.
        calendar_id: Google Calendar ID for this member.
        color: Hex color code for calendar events.
        initial: Single character initial for display.
    """

    name: str
    key: str
    calendar_id: str
    color: str
    initial: str
