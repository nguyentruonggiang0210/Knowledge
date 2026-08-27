"""Release bundle, quality gate và canary rollback tối giản."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from typing import Mapping


@dataclass(frozen=True)
class ReleaseBundle:
    model: str
    prompt_version: str
    parser_schema: str
    index_hash: str
    code_commit: str


def artifact_id(bundle: ReleaseBundle) -> str:
    """Tạo content-derived id ổn định, độc lập thứ tự key JSON."""
    payload = json.dumps(asdict(bundle), ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:12]


def quality_gate(metrics: Mapping[str, float], thresholds: Mapping[str, tuple[str, float]]) -> tuple[bool, list[str]]:
    """Đánh giá metric theo min/max thresholds và trả failure reasons."""
    failures: list[str] = []
    for name, (direction, threshold) in thresholds.items():
        if name not in metrics:
            failures.append(f"missing:{name}")
        elif direction == "min" and metrics[name] < threshold:
            failures.append(f"{name}<{threshold}")
        elif direction == "max" and metrics[name] > threshold:
            failures.append(f"{name}>{threshold}")
        elif direction not in {"min", "max"}:
            raise ValueError(f"direction lạ: {direction}")
    return not failures, failures


def canary_decision(baseline_errors: int, baseline_total: int, candidate_errors: int, candidate_total: int, tolerance: float = 0.01) -> str:
    """Promote hay rollback theo error-rate delta; yêu cầu sample không rỗng."""
    if min(baseline_total, candidate_total) <= 0:
        raise ValueError("canary cần traffic")
    delta = candidate_errors / candidate_total - baseline_errors / baseline_total
    return "rollback" if delta > tolerance else "promote"


def main() -> None:
    bundle = ReleaseBundle("local-model-v2", "prompt-v12", "ticket-v3", "idx-a91", "abc123")
    release_id = artifact_id(bundle)
    passed, failures = quality_gate(
        {"task_success": 0.88, "injection_block": 0.99, "p95_ms": 1_200, "cost": 0.03},
        {"task_success": ("min", 0.85), "injection_block": ("min", 0.98), "p95_ms": ("max", 1_500), "cost": ("max", 0.05)},
    )
    assert passed and failures == []
    assert canary_decision(10, 1_000, 8, 100, tolerance=0.01) == "rollback"
    assert release_id != artifact_id(ReleaseBundle("local-model-v3", "prompt-v12", "ticket-v3", "idx-a91", "abc123"))
    print({"release_id": release_id, "offline_gate": "pass", "canary": "rollback"})


if __name__ == "__main__":
    main()

