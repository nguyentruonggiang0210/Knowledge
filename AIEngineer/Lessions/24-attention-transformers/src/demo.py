"""Scaled dot-product attention có causal/padding mask bằng Python chuẩn."""

from __future__ import annotations

import math
from collections.abc import Sequence

Vector = list[float]
Matrix = list[Vector]
Mask = list[list[bool]]


def dot(left: Sequence[float], right: Sequence[float]) -> float:
    """Tính dot product của hai vector cùng chiều."""

    if len(left) != len(right):
        raise ValueError("Hai vector phải cùng chiều")
    return sum(a * b for a, b in zip(left, right))


def softmax(values: Sequence[float]) -> Vector:
    """Softmax ổn định số; từ chối hàng bị mask toàn bộ."""

    finite = [value for value in values if value != -math.inf]
    if not finite:
        raise ValueError("Không thể softmax một hàng bị mask toàn bộ")
    maximum = max(finite)
    exponentials = [0.0 if value == -math.inf else math.exp(value - maximum) for value in values]
    total = sum(exponentials)
    return [value / total for value in exponentials]


def causal_mask(length: int) -> Mask:
    """Cho phép query i chỉ nhìn key j khi j <= i."""

    if length < 1:
        raise ValueError("length phải >= 1")
    return [[key_index <= query_index for key_index in range(length)] for query_index in range(length)]


def combine_with_key_padding(mask: Mask, key_is_real: Sequence[bool]) -> Mask:
    """Kết hợp mask hiện có với padding mask theo chiều key."""

    if any(len(row) != len(key_is_real) for row in mask):
        raise ValueError("Padding mask không khớp số key")
    return [
        [allowed and key_is_real[key_index] for key_index, allowed in enumerate(row)]
        for row in mask
    ]


def scaled_dot_product_attention(
    queries: Sequence[Sequence[float]],
    keys: Sequence[Sequence[float]],
    values: Sequence[Sequence[float]],
    mask: Mask,
) -> tuple[Matrix, Matrix]:
    """Trả attention output và weight matrix."""

    if not queries or not keys or len(keys) != len(values):
        raise ValueError("Q/K/V không hợp lệ")
    dimension = len(queries[0])
    if any(len(query) != dimension for query in queries) or any(
        len(key) != dimension for key in keys
    ):
        raise ValueError("Q và K phải cùng head dimension")
    if len(mask) != len(queries) or any(len(row) != len(keys) for row in mask):
        raise ValueError("Mask phải có shape query_length × key_length")

    all_weights: Matrix = []
    outputs: Matrix = []
    for query_index, query in enumerate(queries):
        logits = [
            dot(query, key) / math.sqrt(dimension) if mask[query_index][key_index] else -math.inf
            for key_index, key in enumerate(keys)
        ]
        weights = softmax(logits)
        output = [
            sum(weight * value[dimension_index] for weight, value in zip(weights, values))
            for dimension_index in range(len(values[0]))
        ]
        all_weights.append(weights)
        outputs.append(output)
    return outputs, all_weights


def run_demo() -> None:
    """Tự attention trên ba event, event cuối là padding."""

    embeddings: Matrix = [[1.0, 0.0], [0.8, 0.2], [0.0, 0.0]]
    mask = combine_with_key_padding(causal_mask(3), [True, True, False])
    outputs, weights = scaled_dot_product_attention(embeddings, embeddings, embeddings, mask)

    assert weights[0] == [1.0, 0.0, 0.0]
    assert weights[1][2] == 0.0
    assert weights[2][2] == 0.0
    assert all(math.isclose(sum(row), 1.0, rel_tol=1e-9) for row in weights)
    assert len(outputs) == 3 and all(len(row) == 2 for row in outputs)
    print(f"attention_weights={[[round(v, 3) for v in row] for row in weights]}")
    print(f"outputs={[[round(v, 3) for v in row] for row in outputs]}")
    print("PASS: scaled attention with causal and padding masks")


if __name__ == "__main__":
    run_demo()
