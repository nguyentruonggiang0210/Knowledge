"""Fit and evaluate ordinary least-squares simple linear regression."""

from __future__ import annotations

import math
from collections.abc import Sequence
from statistics import mean


def fit_simple_linear_regression(
    features: Sequence[float], targets: Sequence[float]
) -> tuple[float, float]:
    """Return slope and intercept minimizing squared residuals."""
    if len(features) != len(targets) or len(features) < 2:
        raise ValueError("Need at least two aligned samples")
    feature_mean = mean(features)
    target_mean = mean(targets)
    denominator = sum((value - feature_mean) ** 2 for value in features)
    if denominator == 0:
        raise ValueError("Feature must have non-zero variance")
    slope = sum(
        (feature - feature_mean) * (target - target_mean)
        for feature, target in zip(features, targets)
    ) / denominator
    intercept = target_mean - slope * feature_mean
    return slope, intercept


def predict(features: Sequence[float], slope: float, intercept: float) -> list[float]:
    """Predict continuous targets from a fitted line."""
    return [slope * feature + intercept for feature in features]


def regression_metrics(
    targets: Sequence[float], predictions: Sequence[float]
) -> dict[str, float]:
    """Calculate MAE, RMSE, and R-squared for aligned values."""
    if len(targets) != len(predictions) or not targets:
        raise ValueError("Targets and predictions must be aligned and non-empty")
    residuals = [target - prediction for target, prediction in zip(targets, predictions)]
    mae = mean(abs(value) for value in residuals)
    mse = mean(value**2 for value in residuals)
    target_mean = mean(targets)
    total_sum_squares = sum((target - target_mean) ** 2 for target in targets)
    residual_sum_squares = sum(value**2 for value in residuals)
    r_squared = (
        1.0 - residual_sum_squares / total_sum_squares
        if total_sum_squares > 0
        else (1.0 if residual_sum_squares == 0 else 0.0)
    )
    return {"mae": mae, "rmse": math.sqrt(mse), "r_squared": r_squared}


def main() -> None:
    """Estimate batch duration from thousands of input records."""
    thousands_of_records = [1.0, 2.0, 3.0, 4.0, 5.0]
    duration_seconds = [3.5, 5.5, 7.5, 9.5, 11.5]
    slope, intercept = fit_simple_linear_regression(
        thousands_of_records, duration_seconds
    )
    predictions = predict(thousands_of_records, slope, intercept)
    metrics = regression_metrics(duration_seconds, predictions)

    assert math.isclose(slope, 2.0)
    assert math.isclose(intercept, 1.5)
    assert metrics["rmse"] < 1e-12
    assert math.isclose(metrics["r_squared"], 1.0)
    print(f"duration = {slope:.2f} * thousand_records + {intercept:.2f}")
    print("Metrics:", metrics)
    print("Self-check: OK")


if __name__ == "__main__":
    main()
