"""Choose a fraud-classification threshold under a recall constraint."""

from __future__ import annotations

from collections.abc import Sequence


def confusion_counts(
    scores: Sequence[float], labels: Sequence[bool], threshold: float
) -> dict[str, int]:
    """Return TP, FP, TN, and FN at a score threshold."""
    if len(scores) != len(labels) or not labels:
        raise ValueError("Scores and labels must be aligned and non-empty")
    counts = {"tp": 0, "fp": 0, "tn": 0, "fn": 0}
    for score, label in zip(scores, labels):
        predicted = score >= threshold
        if predicted and label:
            counts["tp"] += 1
        elif predicted:
            counts["fp"] += 1
        elif label:
            counts["fn"] += 1
        else:
            counts["tn"] += 1
    return counts


def classification_metrics(counts: dict[str, int]) -> dict[str, float]:
    """Calculate accuracy, precision, recall, specificity, and F1 safely."""
    tp, fp, tn, fn = (counts[key] for key in ("tp", "fp", "tn", "fn"))

    def divide(numerator: int, denominator: int) -> float:
        return numerator / denominator if denominator else 0.0

    precision = divide(tp, tp + fp)
    recall = divide(tp, tp + fn)
    return {
        "accuracy": divide(tp + tn, tp + fp + tn + fn),
        "precision": precision,
        "recall": recall,
        "specificity": divide(tn, tn + fp),
        "f1": divide(2 * precision * recall, precision + recall),
    }


def choose_threshold(
    scores: Sequence[float], labels: Sequence[bool], minimum_recall: float
) -> tuple[float, dict[str, float]]:
    """Choose the highest-F1 observed threshold satisfying minimum recall."""
    if not 0 <= minimum_recall <= 1:
        raise ValueError("minimum_recall must be between 0 and 1")
    candidates: list[tuple[float, dict[str, float]]] = []
    for threshold in sorted(set(scores), reverse=True):
        metrics = classification_metrics(confusion_counts(scores, labels, threshold))
        if metrics["recall"] >= minimum_recall:
            candidates.append((threshold, metrics))
    if not candidates:
        raise ValueError("No threshold satisfies the recall constraint")
    return max(candidates, key=lambda item: (item[1]["f1"], item[0]))


def main() -> None:
    """Tune a threshold on an imbalanced validation sample."""
    scores = [0.92, 0.80, 0.65, 0.50, 0.40, 0.35, 0.30, 0.20, 0.10, 0.05, 0.02, 0.01]
    labels = [True, False, True, False, False, True, False, False, False, False, False, False]
    threshold, metrics = choose_threshold(scores, labels, minimum_recall=0.80)
    all_negative = classification_metrics(confusion_counts(scores, labels, threshold=1.01))

    assert threshold == 0.35
    assert metrics["recall"] == 1.0
    assert all_negative["accuracy"] == 0.75
    assert all_negative["recall"] == 0.0
    print(f"Selected threshold: {threshold:.2f}")
    print("Metrics:", {name: round(value, 3) for name, value in metrics.items()})
    print("Baseline all-negative:", all_negative)
    print("Self-check: OK")


if __name__ == "__main__":
    main()
