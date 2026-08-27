"""Epsilon-greedy bandit và DPO loss tối giản."""

from __future__ import annotations

import math
import random
from dataclasses import dataclass


@dataclass
class Arm:
    pulls: int = 0
    mean_reward: float = 0.0

    def update(self, reward: float) -> None:
        """Cập nhật running mean không lưu toàn bộ lịch sử."""
        self.pulls += 1
        self.mean_reward += (reward - self.mean_reward) / self.pulls


def choose_arm(arms: list[Arm], epsilon: float, rng: random.Random) -> int:
    """Explore với xác suất epsilon, ngược lại chọn estimated best arm."""
    if not 0.0 <= epsilon <= 1.0:
        raise ValueError("epsilon phải thuộc [0,1]")
    if rng.random() < epsilon:
        return rng.randrange(len(arms))
    return max(range(len(arms)), key=lambda index: arms[index].mean_reward)


def dpo_loss(policy_margin: float, reference_margin: float, beta: float = 0.1) -> float:
    """-log sigmoid(beta * (policy_margin-reference_margin)), ổn định số học."""
    score = beta * (policy_margin - reference_margin)
    return math.log1p(math.exp(-abs(score))) + max(-score, 0.0)


def run_bandit(true_rates: list[float], steps: int, epsilon: float, seed: int = 7) -> list[Arm]:
    """Mô phỏng Bernoulli bandit có thể tái lập."""
    rng = random.Random(seed)
    arms = [Arm() for _ in true_rates]
    for _ in range(steps):
        selected = choose_arm(arms, epsilon, rng)
        arms[selected].update(float(rng.random() < true_rates[selected]))
    return arms


def main() -> None:
    arms = run_bandit([0.2, 0.8, 0.5], steps=2_000, epsilon=0.1)
    best = max(range(len(arms)), key=lambda index: arms[index].pulls)
    assert best == 1
    assert dpo_loss(2.0, 0.0) < dpo_loss(-2.0, 0.0)
    print({"pulls": [arm.pulls for arm in arms], "estimates": [round(arm.mean_reward, 3) for arm in arms]})


if __name__ == "__main__":
    main()

