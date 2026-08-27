"""Capacity estimation, task sharding và fault recovery."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


def estimate_inference_gib(parameters: int, bits_per_weight: int, kv_cache_gib: float = 0.0, headroom: float = 0.2) -> float:
    """Ước lượng GiB = weights + KV cache + headroom."""
    if parameters <= 0 or bits_per_weight <= 0 or not 0 <= headroom < 2:
        raise ValueError("capacity input không hợp lệ")
    weights = parameters * bits_per_weight / 8 / (1024**3)
    return (weights + kv_cache_gib) * (1 + headroom)


def greedy_shard(costs: Iterable[int], workers: int) -> list[list[int]]:
    """Phân task cost lớn trước vào worker đang ít tải nhất."""
    if workers < 1:
        raise ValueError("cần ít nhất một worker")
    shards: list[list[int]] = [[] for _ in range(workers)]
    loads = [0] * workers
    for cost in sorted(costs, reverse=True):
        target = min(range(workers), key=loads.__getitem__)
        shards[target].append(cost)
        loads[target] += cost
    return shards


@dataclass
class Job:
    job_id: str
    attempts: int = 0
    done: bool = False


def execute_with_retry(job: Job, failing_attempts: set[int], max_attempts: int = 3) -> Job:
    """Mô phỏng worker failure với bounded retries và idempotent done state."""
    while not job.done and job.attempts < max_attempts:
        job.attempts += 1
        if job.attempts in failing_attempts:
            continue
        job.done = True
    return job


def main() -> None:
    fp16 = estimate_inference_gib(7_000_000_000, 16, kv_cache_gib=2.0)
    int4 = estimate_inference_gib(7_000_000_000, 4, kv_cache_gib=2.0)
    assert int4 < fp16
    shards = greedy_shard([9, 8, 7, 6, 5, 4], workers=3)
    loads = [sum(shard) for shard in shards]
    assert max(loads) - min(loads) <= 2
    job = execute_with_retry(Job("embed-batch-42"), {1, 2})
    assert job.done and job.attempts == 3
    print({"fp16_gib": round(fp16, 2), "int4_gib": round(int4, 2), "worker_loads": loads, "attempts": job.attempts})


if __name__ == "__main__":
    main()

