"""Train a decision stump and a bagged random-feature stump ensemble."""

from __future__ import annotations

import random
from collections.abc import Sequence
from dataclasses import dataclass

Features = tuple[float, ...]
Example = tuple[Features, bool]


@dataclass(frozen=True, slots=True)
class DecisionStump:
    """A depth-one classification tree."""

    feature_index: int
    threshold: float
    left_prediction: bool
    right_prediction: bool


def majority_label(labels: Sequence[bool]) -> bool:
    """Return deterministic majority label, resolving ties as positive."""
    if not labels:
        raise ValueError("Cannot vote over an empty label sequence")
    return sum(labels) * 2 >= len(labels)


def gini_impurity(labels: Sequence[bool]) -> float:
    """Measure binary class impurity from zero (pure) to 0.5."""
    if not labels:
        return 0.0
    positive_rate = sum(labels) / len(labels)
    return 1.0 - positive_rate**2 - (1.0 - positive_rate) ** 2


def predict_stump(stump: DecisionStump, features: Features) -> bool:
    """Predict one example by following the stump split."""
    if stump.feature_index >= len(features):
        raise ValueError("Feature vector is too short")
    return (
        stump.left_prediction
        if features[stump.feature_index] <= stump.threshold
        else stump.right_prediction
    )


def train_stump(
    examples: Sequence[Example], allowed_features: Sequence[int] | None = None
) -> DecisionStump:
    """Find the minimum-training-error split over allowed features."""
    if not examples or not examples[0][0]:
        raise ValueError("Examples and their feature vectors must be non-empty")
    width = len(examples[0][0])
    if any(len(features) != width for features, _ in examples):
        raise ValueError("All feature vectors must share the same width")
    feature_indices = list(allowed_features) if allowed_features is not None else list(range(width))
    if not feature_indices or any(index < 0 or index >= width for index in feature_indices):
        raise ValueError("Allowed feature index is invalid")

    best: tuple[int, int, float, DecisionStump] | None = None
    overall = majority_label([label for _, label in examples])
    for feature_index in feature_indices:
        values = sorted({features[feature_index] for features, _ in examples})
        thresholds = [values[0] - 1.0]
        thresholds.extend((left + right) / 2.0 for left, right in zip(values, values[1:]))
        thresholds.append(values[-1] + 1.0)
        for threshold in thresholds:
            left_labels = [
                label
                for features, label in examples
                if features[feature_index] <= threshold
            ]
            right_labels = [
                label
                for features, label in examples
                if features[feature_index] > threshold
            ]
            left_prediction = majority_label(left_labels) if left_labels else overall
            right_prediction = majority_label(right_labels) if right_labels else overall
            stump = DecisionStump(
                feature_index, threshold, left_prediction, right_prediction
            )
            errors = sum(
                predict_stump(stump, features) != label
                for features, label in examples
            )
            candidate = (errors, feature_index, threshold, stump)
            if best is None or candidate[:3] < best[:3]:
                best = candidate
    if best is None:
        raise RuntimeError("No stump candidate was generated")
    return best[3]


def train_bagged_stumps(
    examples: Sequence[Example], number_of_trees: int, seed: int
) -> list[DecisionStump]:
    """Train bootstrap stumps, choosing one random feature for each tree."""
    if number_of_trees <= 0:
        raise ValueError("number_of_trees must be positive")
    generator = random.Random(seed)
    width = len(examples[0][0])
    forest: list[DecisionStump] = []
    for _ in range(number_of_trees):
        bootstrap = [generator.choice(examples) for _ in examples]
        feature_index = generator.randrange(width)
        forest.append(train_stump(bootstrap, [feature_index]))
    return forest


def predict_forest(forest: Sequence[DecisionStump], features: Features) -> bool:
    """Combine tree predictions by majority vote."""
    if not forest:
        raise ValueError("Forest cannot be empty")
    return majority_label([predict_stump(tree, features) for tree in forest])


def main() -> None:
    """Detect incidents from latency and error-rate features."""
    examples: list[Example] = [
        ((90.0, 0.01), False),
        ((110.0, 0.02), False),
        ((180.0, 0.03), False),
        ((250.0, 0.08), True),
        ((420.0, 0.03), True),
        ((150.0, 0.12), True),
        ((95.0, 0.16), True),
        ((130.0, 0.01), False),
    ]
    stump = train_stump(examples)
    forest = train_bagged_stumps(examples, number_of_trees=31, seed=7)
    stump_accuracy = sum(
        predict_stump(stump, features) == label for features, label in examples
    ) / len(examples)
    forest_accuracy = sum(
        predict_forest(forest, features) == label for features, label in examples
    ) / len(examples)

    assert len(forest) == 31
    assert stump_accuracy >= 0.75
    assert predict_forest(forest, (500.0, 0.20)) is True
    assert predict_forest(forest, (80.0, 0.01)) is False
    assert gini_impurity([True, True, False, False]) == 0.5
    print("Best stump:", stump)
    print(f"Training accuracy: stump={stump_accuracy:.3f}, ensemble={forest_accuracy:.3f}")
    print("Self-check: OK")


if __name__ == "__main__":
    main()
