"""ORM model cho bảng repo_daily_stats (partitioned)."""
from __future__ import annotations

import datetime as dt

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RepoDailyStat(Base):
    __tablename__ = "repo_daily_stats"

    repo_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("repositories.id"), primary_key=True
    )
    recorded_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    stars: Mapped[int] = mapped_column(Integer, default=0)
    forks: Mapped[int] = mapped_column(Integer, default=0)
    watchers: Mapped[int] = mapped_column(Integer, default=0)
