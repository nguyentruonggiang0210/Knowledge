"""Baseline dự báo, content recommender và ranking metric bằng stdlib."""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence


def moving_average_forecast(history: Sequence[float], window: int) -> float:
    """Dự báo điểm kế tiếp bằng trung bình của cửa sổ gần nhất."""

    if window < 1 or len(history) < window:
        raise ValueError("window phải dương và không lớn hơn lịch sử")
    return sum(history[-window:]) / window


def chronological_split(values: Sequence[float], train_ratio: float) -> tuple[list[float], list[float]]:
    """Chia train/test theo trật tự thời gian, tuyệt đối không shuffle."""

    if not 0 < train_ratio < 1:
        raise ValueError("train_ratio phải nằm giữa 0 và 1")
    boundary = max(1, min(len(values) - 1, int(len(values) * train_ratio)))
    return list(values[:boundary]), list(values[boundary:])


def recommend_by_tags(
    liked_items: Sequence[str],
    item_tags: Mapping[str, set[str]],
    top_k: int,
) -> list[str]:
    """Xếp hạng item chưa xem theo overlap với hồ sơ tag của người dùng."""

    profile: set[str] = set()
    for item_id in liked_items:
        profile.update(item_tags[item_id])
    candidates = []
    for item_id, tags in item_tags.items():
        if item_id in liked_items:
            continue
        overlap = len(profile & tags)
        union = len(profile | tags) or 1
        candidates.append((overlap / union, item_id))
    candidates.sort(key=lambda row: (-row[0], row[1]))
    return [item_id for _, item_id in candidates[:top_k]]


def ndcg_at_k(ranked_items: Sequence[str], relevance: Mapping[str, int], k: int) -> float:
    """Tính normalized discounted cumulative gain tại k."""

    def dcg(scores: Sequence[int]) -> float:
        return sum((2**score - 1) / math.log2(position + 2) for position, score in enumerate(scores))

    actual_scores = [relevance.get(item, 0) for item in ranked_items[:k]]
    ideal_scores = sorted(relevance.values(), reverse=True)[:k]
    denominator = dcg(ideal_scores)
    return dcg(actual_scores) / denominator if denominator else 0.0


def run_demo() -> None:
    """Dự báo nhu cầu và gợi ý sản phẩm cho một cửa hàng nhỏ."""

    demand = [90, 94, 96, 102, 105, 108, 111, 115, 117, 120]
    train, test = chronological_split(demand, 0.8)
    assert train[-1] < test[0], "Scenario tăng dần giúp phát hiện split sai thứ tự"
    forecast = moving_average_forecast(train, window=3)
    assert math.isclose(forecast, (108 + 111 + 115) / 3)

    item_tags = {
        "python-basic": {"python", "beginner"},
        "ml-basic": {"python", "ml"},
        "deep-learning": {"python", "ml", "neural"},
        "sql": {"database", "sql"},
        "gardening": {"garden"},
    }
    ranked = recommend_by_tags(["python-basic", "ml-basic"], item_tags, top_k=3)
    assert ranked[0] == "deep-learning"
    relevance = {"deep-learning": 3, "sql": 1, "gardening": 0}
    score = ndcg_at_k(ranked, relevance, 3)
    assert 0.9 <= score <= 1.0
    bad_score = ndcg_at_k(list(reversed(ranked)), relevance, 3)
    assert score > bad_score

    print(f"next_day_forecast={forecast:.2f} first_actual={test[0]}")
    print(f"recommendations={ranked} ndcg@3={score:.3f}")
    print("PASS: chronological forecast and recommender ranking")


if __name__ == "__main__":
    run_demo()
