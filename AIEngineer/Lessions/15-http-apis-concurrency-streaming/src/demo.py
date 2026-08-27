"""Minh họa HTTP contract, idempotency và async retry bằng Python chuẩn."""

from __future__ import annotations

import asyncio
import hashlib
import json
from dataclasses import dataclass
from typing import Awaitable, Callable


@dataclass(frozen=True)
class Response:
    """Response HTTP tối giản dùng trong demo."""

    status: int
    body: dict[str, object]


def make_idempotency_key(client_id: str, payload: dict[str, object]) -> str:
    """Tạo khóa ổn định từ client và payload đã canonicalize."""

    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(f"{client_id}:{canonical}".encode("utf-8")).hexdigest()


def create_invoice_job(
    payload: dict[str, object],
    idempotency_key: str,
    store: dict[str, dict[str, object]],
) -> Response:
    """Validate request và chỉ tạo một job cho mỗi idempotency key."""

    if not isinstance(payload.get("invoice_id"), str) or not isinstance(
        payload.get("amount"), (int, float)
    ):
        return Response(400, {"error": "invoice_id và amount là bắt buộc"})
    if float(payload["amount"]) <= 0:
        return Response(400, {"error": "amount phải lớn hơn 0"})
    if idempotency_key in store:
        return Response(200, {**store[idempotency_key], "deduplicated": True})

    job = {
        "job_id": f"job-{len(store) + 1:04d}",
        "invoice_id": payload["invoice_id"],
        "state": "queued",
        "deduplicated": False,
    }
    store[idempotency_key] = job
    return Response(201, dict(job))


async def retry_async(
    operation: Callable[[], Awaitable[str]],
    max_attempts: int = 3,
    base_delay_seconds: float = 0.001,
) -> str:
    """Retry lỗi tạm thời với exponential backoff và số lần hữu hạn."""

    if max_attempts < 1:
        raise ValueError("max_attempts phải >= 1")
    last_error: RuntimeError | None = None
    for attempt in range(max_attempts):
        try:
            return await operation()
        except RuntimeError as exc:
            last_error = exc
            if attempt + 1 == max_attempts:
                break
            await asyncio.sleep(base_delay_seconds * (2**attempt))
    raise RuntimeError("dịch vụ vẫn lỗi sau retry") from last_error


async def run_scenario() -> None:
    """Chạy scenario client gửi lại request và upstream tạm lỗi."""

    store: dict[str, dict[str, object]] = {}
    payload: dict[str, object] = {"invoice_id": "INV-2026-001", "amount": 1_250_000}
    key = make_idempotency_key("customer-42", payload)

    first = create_invoice_job(payload, key, store)
    duplicate = create_invoice_job(payload, key, store)
    invalid = create_invoice_job({"invoice_id": "INV-BAD", "amount": -1}, "bad", store)

    assert first.status == 201
    assert duplicate.status == 200
    assert first.body["job_id"] == duplicate.body["job_id"]
    assert len(store) == 1, "Request lặp không được tạo side effect thứ hai"
    assert invalid.status == 400

    calls = 0

    async def flaky_upstream() -> str:
        nonlocal calls
        calls += 1
        if calls < 3:
            raise RuntimeError("503 Service Unavailable")
        return "analysis-complete"

    result = await retry_async(flaky_upstream)
    assert result == "analysis-complete"
    assert calls == 3
    print(f"job={first.body['job_id']} duplicate=safe upstream_calls={calls}")
    print("PASS: HTTP contract, idempotency, and bounded retry")


if __name__ == "__main__":
    asyncio.run(run_scenario())
