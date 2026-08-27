"""Portfolio evidence rubric và capacity estimate cho system-design interview."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Mapping


WEIGHTS = {
    "reproducible": 15,
    "tests": 15,
    "evals": 20,
    "architecture": 10,
    "security": 15,
    "operations": 15,
    "communication": 10,
}


def portfolio_score(evidence: Mapping[str, bool]) -> tuple[int, list[str]]:
    """Chỉ cấp điểm khi có evidence, trả gaps theo trọng số giảm dần."""
    score = sum(weight for item, weight in WEIGHTS.items() if evidence.get(item, False))
    gaps = sorted((item for item in WEIGHTS if not evidence.get(item, False)), key=WEIGHTS.get, reverse=True)
    return score, gaps


@dataclass(frozen=True)
class Capacity:
    peak_requests_per_second: float
    average_input_tokens: int
    average_output_tokens: int
    worker_tokens_per_second: float
    utilization_target: float = 0.7


def required_workers(capacity: Capacity) -> int:
    """Lower-bound throughput estimate; production còn cần latency/memory/headroom test."""
    if capacity.worker_tokens_per_second <= 0 or not 0 < capacity.utilization_target <= 1:
        raise ValueError("capacity configuration không hợp lệ")
    demand = capacity.peak_requests_per_second * (capacity.average_input_tokens + capacity.average_output_tokens)
    safe_supply = capacity.worker_tokens_per_second * capacity.utilization_target
    return max(1, math.ceil(demand / safe_supply))


def system_design_order() -> list[str]:
    """Checklist tránh nhảy thẳng vào tên vendor/framework."""
    return ["requirements_and_risk", "slo_and_estimates", "data_and_eval", "api_and_components", "security", "observability", "rollout_and_rollback"]


def main() -> None:
    evidence = {"reproducible": True, "tests": True, "evals": True, "architecture": True, "communication": True}
    score, gaps = portfolio_score(evidence)
    workers = required_workers(Capacity(10, 800, 200, worker_tokens_per_second=5_000))
    assert score == 70 and gaps == ["security", "operations"]
    assert workers == 3
    assert system_design_order()[0] == "requirements_and_risk"
    print({"portfolio_score": score, "priority_gaps": gaps, "minimum_workers": workers})


if __name__ == "__main__":
    main()

