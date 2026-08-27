"""Custom Prometheus metrics (request count, latency histogram)."""
from __future__ import annotations

import time

from fastapi import FastAPI, Request
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    "app_request_count", "Số request theo route và status", ["method", "path", "status"]
)
REQUEST_LATENCY = Histogram(
    "app_request_latency_seconds", "Độ trễ request theo route", ["method", "path"]
)


def register_custom_metrics(app: FastAPI) -> None:
    """Gắn middleware ghi custom metrics vào app."""

    @app.middleware("http")
    async def _record(request: Request, call_next):
        started = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - started
        path = request.url.path
        REQUEST_LATENCY.labels(request.method, path).observe(elapsed)
        REQUEST_COUNT.labels(request.method, path, str(response.status_code)).inc()
        return response
