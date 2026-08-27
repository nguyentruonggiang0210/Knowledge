"""ORM model cho bảng repositories."""
from __future__ import annotations

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    organization_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("organizations.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String)
    language: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
