"""Mô phỏng batching, TTL/LRU cache và backpressure."""

from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass
from typing import Generic, Iterable, TypeVar


T = TypeVar("T")


@dataclass(frozen=True)
class Request:
    request_id: str
    arrived_ms: int
    tokens: int


def dynamic_batches(requests: Iterable[Request], max_size: int, max_wait_ms: int) -> list[list[Request]]:
    """Gom batch theo size hoặc thời gian chờ tính từ item đầu batch."""
    if max_size < 1 or max_wait_ms < 0:
        raise ValueError("batch configuration không hợp lệ")
    batches: list[list[Request]] = []
    current: list[Request] = []
    for request in sorted(requests, key=lambda item: item.arrived_ms):
        if current and (len(current) >= max_size or request.arrived_ms - current[0].arrived_ms > max_wait_ms):
            batches.append(current)
            current = []
        current.append(request)
    if current:
        batches.append(current)
    return batches


class TTLCache(Generic[T]):
    """TTL cache giới hạn size; clock được truyền vào để test deterministic."""

    def __init__(self, capacity: int, ttl_ms: int) -> None:
        if capacity < 1 or ttl_ms < 1:
            raise ValueError("cache configuration không hợp lệ")
        self.capacity = capacity
        self.ttl_ms = ttl_ms
        self._items: OrderedDict[str, tuple[int, T]] = OrderedDict()

    def put(self, key: str, value: T, now_ms: int) -> None:
        self._items[key] = (now_ms + self.ttl_ms, value)
        self._items.move_to_end(key)
        while len(self._items) > self.capacity:
            self._items.popitem(last=False)

    def get(self, key: str, now_ms: int) -> T | None:
        item = self._items.get(key)
        if item is None:
            return None
        expires, value = item
        if now_ms >= expires:
            del self._items[key]
            return None
        self._items.move_to_end(key)
        return value


def admit(queue_depth: int, max_queue: int, tokens: int, max_tokens: int) -> tuple[bool, str]:
    """Từ chối sớm thay vì để overload thành timeout dây chuyền."""
    if tokens > max_tokens:
        return False, "request_too_large"
    if queue_depth >= max_queue:
        return False, "overloaded_retry_later"
    return True, "accepted"


def main() -> None:
    requests = [Request("a", 0, 10), Request("b", 5, 12), Request("c", 40, 8)]
    batches = dynamic_batches(requests, max_size=2, max_wait_ms=20)
    assert [[item.request_id for item in batch] for batch in batches] == [["a", "b"], ["c"]]
    cache: TTLCache[str] = TTLCache(capacity=2, ttl_ms=10)
    cache.put("tenant:model:prompt", "answer", now_ms=0)
    assert cache.get("tenant:model:prompt", 9) == "answer"
    assert cache.get("tenant:model:prompt", 10) is None
    assert admit(10, 10, 100, 1_000) == (False, "overloaded_retry_later")
    print({"batches": len(batches), "batch_sizes": list(map(len, batches)), "overload_is_bounded": True})


if __name__ == "__main__":
    main()

