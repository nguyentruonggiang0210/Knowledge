"""Business logic tách khỏi route (dễ test, dễ cache).

NOTE: đây là skeleton — các hàm trả về stub, cần nối query thật vào Postgres.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.language_schema import LanguageStat
from app.schemas.repo_schema import RepoGrowthPoint, TrendingRepo
from app.services.cache_service import cache


@cache(ttl=60)
async def get_trending(
    session: AsyncSession, category: str | None, limit: int
) -> list[TrendingRepo]:
    # TODO: chạy query top_trending_by_category.sql qua session
    raise NotImplementedError


async def get_growth(session: AsyncSession, repo_id: int) -> list[RepoGrowthPoint]:
    # TODO: chạy query growth_rate_window.sql qua session
    raise NotImplementedError


@cache(ttl=300)
async def get_language_stats(session: AsyncSession) -> list[LanguageStat]:
    # TODO: chạy query language_popularity.sql qua session
    raise NotImplementedError


async def get_org_summary(session: AsyncSession, org_id: int) -> dict:
    # TODO: tổng hợp số repo / tổng star của org
    raise NotImplementedError
