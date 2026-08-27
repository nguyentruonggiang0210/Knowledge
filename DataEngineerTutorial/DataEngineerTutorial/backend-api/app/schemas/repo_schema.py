"""Pydantic request/response schema cho repo."""
from __future__ import annotations

import datetime as dt

from pydantic import BaseModel


class TrendingRepo(BaseModel):
    repo_id: int
    name: str
    category: str | None
    stars: int
    rank: int


class RepoGrowthPoint(BaseModel):
    recorded_at: dt.datetime
    stars: int
    star_delta: int | None
    growth_rate: float | None
