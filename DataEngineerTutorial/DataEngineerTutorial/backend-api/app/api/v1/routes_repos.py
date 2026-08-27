"""Route repos: GET /repos/trending, /repos/{id}/growth."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.repo_schema import RepoGrowthPoint, TrendingRepo
from app.services import repo_service

router = APIRouter(tags=["repos"])


@router.get("/repos/trending", response_model=list[TrendingRepo])
async def trending(
    category: str | None = None,
    limit: int = 25,
    session: AsyncSession = Depends(get_session),
) -> list[TrendingRepo]:
    return await repo_service.get_trending(session, category=category, limit=limit)


@router.get("/repos/{repo_id}/growth", response_model=list[RepoGrowthPoint])
async def growth(
    repo_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[RepoGrowthPoint]:
    return await repo_service.get_growth(session, repo_id=repo_id)
