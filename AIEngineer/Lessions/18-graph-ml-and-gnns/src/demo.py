"""Một lớp GNN message-passing tối giản bằng Python standard library."""

from __future__ import annotations

from collections.abc import Mapping, Sequence

Vector = list[float]
Graph = Mapping[str, Sequence[str]]


def mean_aggregate(node: str, graph: Graph, features: Mapping[str, Vector]) -> Vector:
    """Tính vector trung bình của hàng xóm; isolated node nhận vector zero."""

    neighbors = list(graph.get(node, ()))
    dimensions = len(features[node])
    if not neighbors:
        return [0.0] * dimensions
    return [
        sum(features[neighbor][dimension] for neighbor in neighbors) / len(neighbors)
        for dimension in range(dimensions)
    ]


def linear(vector: Sequence[float], weights: Sequence[Sequence[float]], bias: Sequence[float]) -> Vector:
    """Áp dụng phép biến đổi vector nhân ma trận theo output dimension."""

    if len(weights) != len(bias):
        raise ValueError("Mỗi output cần một hàng weight và một bias")
    return [
        sum(value * coefficient for value, coefficient in zip(vector, row)) + offset
        for row, offset in zip(weights, bias)
    ]


def gnn_layer(
    graph: Graph,
    features: Mapping[str, Vector],
    weights: Sequence[Sequence[float]],
    bias: Sequence[float],
) -> dict[str, Vector]:
    """Kết hợp self và neighbor mean rồi áp dụng linear + ReLU."""

    output: dict[str, Vector] = {}
    for node, own_features in features.items():
        neighborhood = mean_aggregate(node, graph, features)
        combined = list(own_features) + neighborhood
        transformed = linear(combined, weights, bias)
        output[node] = [max(0.0, value) for value in transformed]
    return output


def run_demo() -> None:
    """Lan truyền tín hiệu risk giữa các tài khoản liên kết."""

    graph: dict[str, list[str]] = {
        "new-account": ["fraud-a", "fraud-b"],
        "normal-account": ["normal-friend"],
        "fraud-a": ["new-account"],
        "fraud-b": ["new-account"],
        "normal-friend": ["normal-account"],
        "isolated": [],
    }
    # Feature: [transaction_amount_normalized, known_risk].
    features: dict[str, Vector] = {
        "new-account": [0.2, 0.0],
        "normal-account": [0.2, 0.0],
        "fraud-a": [0.5, 1.0],
        "fraud-b": [0.4, 0.9],
        "normal-friend": [0.3, 0.0],
        "isolated": [0.1, 0.0],
    }
    # Combined vector: [self_amount, self_risk, neighbor_amount, neighbor_risk].
    weights = [
        [0.0, 0.4, 0.0, 1.0],  # learned-like risk representation
        [0.5, 0.0, 0.5, 0.0],  # activity representation
    ]
    embeddings = gnn_layer(graph, features, weights, bias=[0.0, 0.0])

    assert embeddings["new-account"][0] > 0.9
    assert embeddings["normal-account"][0] == 0.0
    assert embeddings["isolated"][0] == 0.0
    assert mean_aggregate("new-account", graph, features) == [0.45, 0.95]

    print(f"new_account_embedding={embeddings['new-account']}")
    print(f"normal_account_embedding={embeddings['normal-account']}")
    print("PASS: GNN message passing propagated neighborhood risk")


if __name__ == "__main__":
    run_demo()
