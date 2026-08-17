"""Family API routes.

Provides endpoints for fetching family member data.
"""

from fastapi import APIRouter

from app.api.deps import FamilyRepositoryDep
from app.api.models.family import FamilyMember
from app.services.mock_data import get_mock_family_members

router = APIRouter(prefix="/family", tags=["family"])


@router.get("", response_model=list[FamilyMember])
async def get_family_members(
    family_repository: FamilyRepositoryDep,
) -> list[FamilyMember]:
    """Get list of family members.

    Returns all configured family members with their calendar colors.

    Args:
        family_repository: Injected family repository instance.

    Returns:
        List of FamilyMember objects.
    """
    # For now, return mock data. In the future, this will use the repository.
    return get_mock_family_members()
