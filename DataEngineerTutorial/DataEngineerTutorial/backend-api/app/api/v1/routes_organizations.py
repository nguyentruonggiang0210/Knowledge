"""Route organizations: GET /organizations/{id}/summary."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.services import repo_service

router = APIRouter(tags=["organizations"])


@router.get("/organizations/{org_id}/summary")
async def summary(
    org_id: int,
    session: AsyncSession = Depends(get_session),
) -> dict:
    return await repo_service.get_org_summary(session, org_id=org_id)
