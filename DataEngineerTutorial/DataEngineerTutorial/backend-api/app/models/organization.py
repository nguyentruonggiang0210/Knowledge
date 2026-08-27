"""ORM model cho bảng organizations."""
from __future__ import annotations

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    login: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
