"""Demonstrate temporal validation and train-only preprocessing."""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date
from statistics import mean


@dataclass(frozen=True, slots=True)
class Observation:
    """One dated feature/target observation."""

    observed_on: date
    feature: float
    target: float


@dataclass(frozen=True, slots=True)
class Standardizer:
    """Mean and scale learned exclusively from training data."""

    centre: float
    scale: float

    def transform(self, value: float) -> float:
        """Apply the fitted standardization."""
        return (value - self.centre) / self.scale


def temporal_split(
    observations: Sequence[Observation], validation_size: int
) -> tuple[list[Observation], list[Observation]]:
    """Sort by time and reserve the newest observations for validation."""
    if validation_size <= 0 or validation_size >= len(observations):
        raise ValueError("validation_size must leave non-empty train and validation")
    ordered = sorted(observations, key=lambda item: item.observed_on)
    boundary = len(ordered) - validation_size
    return ordered[:boundary], ordered[boundary:]


def fit_standardizer(values: Sequence[float]) -> Standardizer:
    """Fit population mean and standard deviation on non-empty training values."""
    if not values:
        raise ValueError("Training values cannot be empty")
    centre = mean(values)
    variance = mean([(value - centre) ** 2 for value in values])
    scale = math.sqrt(variance)
    if scale == 0:
        raise ValueError("Cannot standardize a constant feature")
    return Standardizer(centre, scale)


def mean_absolute_error(predictions: Sequence[float], targets: Sequence[float]) -> float:
    """Return MAE for aligned, non-empty sequences."""
    if len(predictions) != len(targets) or not targets:
        raise ValueError("Predictions and targets must be aligned and non-empty")
    return mean(abs(prediction - target) for prediction, target in zip(predictions, targets))


def main() -> None:
    """Split a shifted time series and verify no future data enters fitting."""
    observations = [
        Observation(date(2026, 1, month), float(month), float(month * 2))
        for month in range(1, 7)
    ]
    train, validation = temporal_split(observations, validation_size=2)
    scaler = fit_standardizer([item.feature for item in train])
    baseline = mean(item.target for item in train)
    validation_mae = mean_absolute_error(
        [baseline] * len(validation), [item.target for item in validation]
    )
    full_data_mean = mean(item.feature for item in observations)

    assert max(item.observed_on for item in train) < min(
        item.observed_on for item in validation
    )
    assert scaler.centre == 2.5
    assert scaler.centre != full_data_mean
    assert math.isclose(mean(scaler.transform(item.feature) for item in train), 0.0)
    print("Train:", [item.observed_on.isoformat() for item in train])
    print("Validation:", [item.observed_on.isoformat() for item in validation])
    print(f"Train-only feature mean={scaler.centre:.2f}; full mean={full_data_mean:.2f}")
    print(f"Validation baseline MAE={validation_mae:.2f}")
    print("Self-check: OK")


if __name__ == "__main__":
    main()
