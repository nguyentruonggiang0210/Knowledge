"""Pydantic response schema cho language stats."""
from __future__ import annotations

import datetime as dt

from pydantic import BaseModel


class LanguageStat(BaseModel):
    language: str
    month: dt.datetime
    total_stars: int
    repo_count: int
