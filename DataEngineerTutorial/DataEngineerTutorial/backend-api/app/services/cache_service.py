"""In-memory (hoặc Redis) cache cho query nặng.

Skeleton: decorator cache đơn giản theo TTL, cho phép thay bằng Redis sau.
"""
from __future__ import annotations

import functools
import time
from collections.abc import Awaitable, Callable
from typing import Any

_store: dict[str, tuple[float, Any]] = {}


def cache(ttl: int = 60) -> Callable[[Callable[..., Awaitable[Any]]], Callable[..., Awaitable[Any]]]:
    """Decorator cache kết quả coroutine theo TTL (giây)."""

    def decorator(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            key = f"{func.__name__}:{args[1:]!r}:{kwargs!r}"
            now = time.time()
            hit = _store.get(key)
            if hit and hit[0] > now:
                return hit[1]
            result = await func(*args, **kwargs)
            _store[key] = (now + ttl, result)
            return result

        return wrapper

    return decorator
