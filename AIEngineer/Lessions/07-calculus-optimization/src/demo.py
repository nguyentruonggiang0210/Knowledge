"""Fit a linear model with analytic gradients and gradient descent."""

from __future__ import annotations

from collections.abc import Sequence


def predict(features: Sequence[float], weight: float, bias: float) -> list[float]:
    """Apply a one-feature linear model."""
    return [weight * value + bias for value in features]


def mean_squared_error(predictions: Sequence[float], targets: Sequence[float]) -> float:
    """Return mean squared prediction error."""
    if len(predictions) != len(targets) or not targets:
        raise ValueError("Predictions and non-empty targets must have equal length")
    return sum((guess - target) ** 2 for guess, target in zip(predictions, targets)) / len(
        targets
    )


def mse_gradients(
    features: Sequence[float],
    targets: Sequence[float],
    weight: float,
    bias: float,
) -> tuple[float, float]:
    """Compute analytic MSE gradients for weight and bias."""
    if len(features) != len(targets) or not targets:
        raise ValueError("Features and targets must be non-empty and aligned")
    errors = [
        weight * feature + bias - target
        for feature, target in zip(features, targets)
    ]
    scale = 2.0 / len(targets)
    weight_gradient = scale * sum(
        error * feature for error, feature in zip(errors, features)
    )
    bias_gradient = scale * sum(errors)
    return weight_gradient, bias_gradient


def fit_linear_model(
    features: Sequence[float],
    targets: Sequence[float],
    learning_rate: float = 0.03,
    steps: int = 2_000,
) -> tuple[float, float, list[float]]:
    """Optimize a linear model and return parameters plus sampled loss history."""
    if learning_rate <= 0 or steps <= 0:
        raise ValueError("learning_rate and steps must be positive")
    weight = bias = 0.0
    history: list[float] = []
    for step in range(steps):
        gradient_w, gradient_b = mse_gradients(features, targets, weight, bias)
        weight -= learning_rate * gradient_w
        bias -= learning_rate * gradient_b
        if step % 200 == 0 or step == steps - 1:
            history.append(mean_squared_error(predict(features, weight, bias), targets))
    return weight, bias, history


def main() -> None:
    """Learn processing time from number of order items."""
    items = [0.0, 1.0, 2.0, 3.0, 4.0]
    minutes = [2.0, 5.0, 8.0, 11.0, 14.0]
    weight, bias, losses = fit_linear_model(items, minutes)

    assert abs(weight - 3.0) < 0.01
    assert abs(bias - 2.0) < 0.02
    assert losses[-1] < losses[0]
    print(f"Model: minutes = {weight:.4f} * items + {bias:.4f}")
    print("Initial/final loss:", f"{losses[0]:.6f}", "->", f"{losses[-1]:.8f}")
    print("Self-check: OK")


if __name__ == "__main__":
    main()
