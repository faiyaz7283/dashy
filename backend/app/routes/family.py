from fastapi import APIRouter

from app.models import FamilyMember
from app.services.mock_data import get_mock_family_members

router = APIRouter(prefix="/api/family", tags=["family"])


@router.get("", response_model=list[FamilyMember])
def get_family_members():
    """
    Get list of family members.

    Returns all configured family members with their calendar colors.
    """
    return get_mock_family_members()
