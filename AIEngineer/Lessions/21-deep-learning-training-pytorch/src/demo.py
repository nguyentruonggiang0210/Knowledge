"""Pure-Python minibatch trainer mô phỏng các thành phần cốt lõi của PyTorch."""

from __future__ import annotations

import random
from collections.abc import Iterator, Sequence

Sample = tuple[tuple[float, ...], float]


def make_batches(
    samples: Sequence[Sample], batch_size: int, seed: int
) -> Iterator[list[Sample]]:
    """Shuffle xác định và yield minibatch giống vai trò DataLoader."""

    if batch_size < 1:
        raise ValueError("batch_size phải >= 1")
    indices = list(range(len(samples)))
    random.Random(seed).shuffle(indices)
    for start in range(0, len(indices), batch_size):
        yield [samples[index] for index in indices[start : start + batch_size]]


def predict(features: Sequence[float], weights: Sequence[float], bias: float) -> float:
    """Forward pass của một linear module."""

    if len(features) != len(weights):
        raise ValueError("features và weights phải cùng chiều")
    return sum(feature * weight for feature, weight in zip(features, weights)) + bias


def batch_gradients(
    batch: Sequence[Sample], weights: Sequence[float], bias: float
) -> tuple[float, list[float], float]:
    """Tính MSE cùng gradient trung bình cho weight và bias."""

    grad_weights = [0.0] * len(weights)
    grad_bias = 0.0
    loss = 0.0
    for features, target in batch:
        error = predict(features, weights, bias) - target
        loss += error * error
        for index, feature in enumerate(features):
            grad_weights[index] += 2.0 * error * feature
        grad_bias += 2.0 * error
    scale = 1.0 / len(batch)
    return loss * scale, [gradient * scale for gradient in grad_weights], grad_bias * scale


def train(
    samples: Sequence[Sample],
    epochs: int = 200,
    batch_size: int = 2,
    learning_rate: float = 0.08,
) -> tuple[list[float], float, list[float]]:
    """Train linear ETA model bằng minibatch SGD."""

    weights = [0.0] * len(samples[0][0])
    bias = 0.0
    history: list[float] = []
    for epoch in range(epochs):
        epoch_losses: list[float] = []
        for batch in make_batches(samples, batch_size, seed=epoch):
            loss, grad_weights, grad_bias = batch_gradients(batch, weights, bias)
            weights = [
                weight - learning_rate * gradient
                for weight, gradient in zip(weights, grad_weights)
            ]
            bias -= learning_rate * grad_bias
            epoch_losses.append(loss)
        history.append(sum(epoch_losses) / len(epoch_losses))
    return weights, bias, history


def mean_absolute_error(samples: Sequence[Sample], weights: Sequence[float], bias: float) -> float:
    """Đánh giá MAE ở chế độ inference không cập nhật gradient."""

    return sum(abs(predict(features, weights, bias) - target) for features, target in samples) / len(samples)


def run_demo() -> None:
    """Học ETA chuẩn hóa từ khoảng cách và tín hiệu mưa."""

    # ETA = 0.5 + 1.2 * distance_scaled + 0.8 * rain.
    samples: list[Sample] = [
        ((0.0, 0.0), 0.5),
        ((0.2, 0.0), 0.74),
        ((0.5, 0.0), 1.10),
        ((0.8, 0.0), 1.46),
        ((0.1, 1.0), 1.42),
        ((0.4, 1.0), 1.78),
        ((0.7, 1.0), 2.14),
        ((1.0, 1.0), 2.50),
    ]
    weights, bias, history = train(samples)
    mae = mean_absolute_error(samples, weights, bias)
    assert history[-1] < history[0] * 0.02
    assert mae < 0.04
    assert abs(weights[0] - 1.2) < 0.1
    assert abs(weights[1] - 0.8) < 0.1
    print(f"weights={[round(value, 3) for value in weights]} bias={bias:.3f} mae={mae:.4f}")
    print("PASS: pure-Python trainer converged with PyTorch-like steps")


if __name__ == "__main__":
    run_demo()
