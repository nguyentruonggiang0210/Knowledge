"""Toy distillation pipeline: generate, filter, deduplicate, train student."""

from __future__ import annotations

import math
from collections import Counter, defaultdict
from dataclasses import dataclass


@dataclass(frozen=True)
class Example:
    text: str
    label: str
    confidence: float
    source: str


def clean_examples(examples: list[Example], min_confidence: float = 0.8) -> list[Example]:
    """Lọc confidence và exact duplicate sau normalization."""
    seen: set[str] = set()
    result: list[Example] = []
    for item in examples:
        key = " ".join(item.text.lower().split())
        if item.confidence < min_confidence or key in seen:
            continue
        seen.add(key)
        result.append(Example(key, item.label, item.confidence, item.source))
    return result


def train_naive_bayes(examples: list[Example]) -> tuple[dict[str, Counter[str]], Counter[str]]:
    """Học word counts theo class cho student Bernoulli-like đơn giản."""
    words: dict[str, Counter[str]] = defaultdict(Counter)
    classes: Counter[str] = Counter()
    for item in examples:
        classes[item.label] += 1
        words[item.label].update(set(item.text.split()))
    return dict(words), classes


def predict(text: str, model: tuple[dict[str, Counter[str]], Counter[str]]) -> str:
    """Dự đoán bằng smoothed log likelihood."""
    words, classes = model
    total = sum(classes.values())
    tokens = set(text.lower().split())
    scores: dict[str, float] = {}
    for label, count in classes.items():
        score = math.log(count / total)
        denominator = count + 2
        score += sum(math.log((words[label][token] + 1) / denominator) for token in tokens)
        scores[label] = score
    return max(scores, key=scores.get)


def main() -> None:
    raw = [
        Example("không đăng nhập được", "auth", 0.98, "teacher-v1"),
        Example("  KHÔNG đăng nhập được ", "auth", 0.98, "teacher-v1"),
        Example("quên mật khẩu", "auth", 0.95, "human"),
        Example("hóa đơn bị tính hai lần", "billing", 0.97, "human"),
        Example("cần hoàn tiền hóa đơn", "billing", 0.93, "teacher-v1"),
        Example("câu mơ hồ", "billing", 0.51, "teacher-v1"),
    ]
    clean = clean_examples(raw)
    assert len(clean) == 4
    model = train_naive_bayes(clean)
    assert predict("không thể đăng nhập mật khẩu", model) == "auth"
    assert predict("hoàn tiền hóa đơn", model) == "billing"
    print({"raw": len(raw), "accepted": len(clean), "labels": dict(model[1])})


if __name__ == "__main__":
    main()

