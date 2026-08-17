"""Family domain entities.

Domain entities representing family members.
"""

from dataclasses import dataclass


@dataclass
class FamilyMember:
    """Family member entity.

    Represents a person in the family with their associated calendar and preferences.

    Attributes:
        id: Unique identifier (typically member key).
        name: Display name.
        calendar_id: Google Calendar ID (email address).
        color: Hex color code for calendar events.
        initial: Single character initial for display.
    """

    id: str
    name: str
    calendar_id: str
    color: str
    initial: str

    def __eq__(self, other: object) -> bool:
        """Check equality based on identity (id).

        Args:
            other: Another object to compare.

        Returns:
            True if same id, False otherwise.
        """
        if not isinstance(other, FamilyMember):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash based on identity (id).

        Returns:
            Hash value based on id.
        """
        return hash(self.id)
