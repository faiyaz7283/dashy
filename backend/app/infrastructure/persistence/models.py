"""SQLModel database models."""

from datetime import datetime

from sqlmodel import Field, SQLModel


class FamilyMemberDB(SQLModel, table=True):
    """Family member database model."""

    __tablename__ = "family_members"

    id: int | None = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    name: str
    calendar_id: str
    color: str
    initial: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow}
    )
