"""Analyze a conversion experiment with standard-library statistics."""

from __future__ import annotations

import math


def conversion_rate(successes: int, trials: int) -> float:
    """Return a validated binomial conversion estimate."""
    if trials <= 0 or not 0 <= successes <= trials:
        raise ValueError("Require 0 <= successes <= positive trials")
    return successes / trials


def two_proportion_z_test(
    successes_a: int,
    trials_a: int,
    successes_b: int,
    trials_b: int,
) -> tuple[float, float]:
    """Return z statistic and two-sided p-value for two proportions."""
    rate_a = conversion_rate(successes_a, trials_a)
    rate_b = conversion_rate(successes_b, trials_b)
    pooled = (successes_a + successes_b) / (trials_a + trials_b)
    standard_error = math.sqrt(
        pooled * (1.0 - pooled) * (1.0 / trials_a + 1.0 / trials_b)
    )
    if standard_error == 0:
        raise ValueError("Experiment has zero estimated variance")
    z_score = (rate_b - rate_a) / standard_error
    two_sided_p = math.erfc(abs(z_score) / math.sqrt(2.0))
    return z_score, two_sided_p


def wilson_interval(successes: int, trials: int, z: float = 1.96) -> tuple[float, float]:
    """Return a Wilson score interval for a binomial proportion."""
    estimate = conversion_rate(successes, trials)
    denominator = 1.0 + z * z / trials
    centre = (estimate + z * z / (2.0 * trials)) / denominator
    radius = (
        z
        * math.sqrt(
            estimate * (1.0 - estimate) / trials + z * z / (4.0 * trials**2)
        )
        / denominator
    )
    return centre - radius, centre + radius


def main() -> None:
    """Evaluate a prompt-onboarding experiment."""
    control = (40, 1_000)
    treatment = (70, 1_000)
    z_score, p_value = two_proportion_z_test(*control, *treatment)
    control_ci = wilson_interval(*control)
    treatment_ci = wilson_interval(*treatment)
    absolute_lift = conversion_rate(*treatment) - conversion_rate(*control)

    assert math.isclose(absolute_lift, 0.03)
    assert p_value < 0.01
    assert control_ci[0] < conversion_rate(*control) < control_ci[1]
    print(f"Absolute lift: {absolute_lift:.2%}")
    print(f"z={z_score:.3f}, p={p_value:.5f}")
    print(f"Control 95% CI:   {control_ci[0]:.2%} .. {control_ci[1]:.2%}")
    print(f"Treatment 95% CI: {treatment_ci[0]:.2%} .. {treatment_ci[1]:.2%}")
    print("Self-check: OK")


if __name__ == "__main__":
    main()
