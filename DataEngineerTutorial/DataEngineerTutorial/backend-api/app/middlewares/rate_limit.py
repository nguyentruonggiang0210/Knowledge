"""Rate limit middleware (skeleton, token-bucket đơn giản theo IP)."""
from __future__ import annotations

import time
from collections import defaultdict

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        recent = [t for t in self._hits[ip] if t > now - self.window]
        if len(recent) >= self.max_requests:
            return JSONResponse({"detail": "rate limit exceeded"}, status_code=429)
        recent.append(now)
        self._hits[ip] = recent
        return await call_next(request)
