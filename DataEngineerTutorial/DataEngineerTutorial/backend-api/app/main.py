"""Entrypoint FastAPI: mount router + Prometheus instrumentator."""
from __future__ import annotations

from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.v1 import routes_languages, routes_organizations, routes_repos
from app.middlewares.metrics import register_custom_metrics

app = FastAPI(title="GitHub Trending Analytics API", version="0.1.0")

app.include_router(routes_repos.router, prefix="/api/v1")
app.include_router(routes_languages.router, prefix="/api/v1")
app.include_router(routes_organizations.router, prefix="/api/v1")

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
register_custom_metrics(app)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
