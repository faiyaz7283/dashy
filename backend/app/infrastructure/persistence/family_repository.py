"""Family repository implementation using SQLModel."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.domain.family.models import FamilyMember
from app.domain.family.ports import FamilyRepository
from app.infrastructure.persistence.models import FamilyMemberDB


class FamilyRepositoryImpl(FamilyRepository):
    """SQLModel implementation of FamilyRepository."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with async session."""
        self.session = session

    async def get_all(self) -> list[FamilyMember]:
        """Retrieve all family members from database."""
        statement = select(FamilyMemberDB)
        result = await self.session.execute(statement)
        db_members = result.scalars().all()
        return [self._to_domain(db_member) for db_member in db_members]

    async def get_by_id(self, member_id: str) -> FamilyMember | None:
        """Retrieve a family member by ID."""
        statement = select(FamilyMemberDB).where(FamilyMemberDB.id == member_id)
        result = await self.session.execute(statement)
        db_member = result.scalar_one_or_none()
        return self._to_domain(db_member) if db_member else None

    async def save(self, member: FamilyMember) -> None:
        """Save a family member to database (create or update)."""
        # Check if member already exists
        statement = select(FamilyMemberDB).where(FamilyMemberDB.id == member.id)
        result = await self.session.execute(statement)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing member
            existing.name = member.name
            existing.calendar_id = member.calendar_id
            existing.color = member.color
            existing.initial = member.initial
            self.session.add(existing)
        else:
            # Create new member
            db_member = self._to_db(member)
            self.session.add(db_member)

        await self.session.commit()

    async def delete(self, member_id: str) -> None:
        """Delete a family member from database."""
        statement = select(FamilyMemberDB).where(FamilyMemberDB.id == member_id)
        result = await self.session.execute(statement)
        db_member = result.scalar_one_or_none()
        if db_member:
            await self.session.delete(db_member)
            await self.session.commit()

    def _to_domain(self, db_member: FamilyMemberDB) -> FamilyMember:
        """Convert database model to domain model."""
        return FamilyMember(
            id=db_member.id,
            name=db_member.name,
            calendar_id=db_member.calendar_id,
            color=db_member.color,
            initial=db_member.initial,
        )

    def _to_db(self, member: FamilyMember) -> FamilyMemberDB:
        """Convert domain model to database model."""
        return FamilyMemberDB(
            id=member.id,
            name=member.name,
            calendar_id=member.calendar_id,
            color=member.color,
            initial=member.initial,
        )
