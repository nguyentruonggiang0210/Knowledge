"""Route languages: GET /languages/stats."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.language_schema import LanguageStat
from app.services import repo_service

router = APIRouter(tags=["languages"])


@router.get("/languages/stats", response_model=list[LanguageStat])
async def language_stats(
    session: AsyncSession = Depends(get_session),
) -> list[LanguageStat]:
    return await repo_service.get_language_stats(session)
