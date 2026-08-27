"""Đọc biến môi trường qua Pydantic Settings."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    db_url: str = "postgresql+asyncpg://gtp:gtp@localhost:5432/github_trending"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cache_ttl_seconds: int = 60


settings = Settings()
