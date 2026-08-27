"""Clustering và anomaly detection nhỏ gọn, không cần NumPy."""

from __future__ import annotations

import math
from collections.abc import Sequence

Point = tuple[float, ...]


def euclidean(left: Point, right: Point) -> float:
    """Tính khoảng cách Euclid giữa hai vector cùng chiều."""

    if len(left) != len(right):
        raise ValueError("Hai vector phải cùng chiều")
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(left, right)))


def kmeans(
    points: Sequence[Point], initial_centroids: Sequence[Point], iterations: int = 20
) -> tuple[list[int], list[Point]]:
    """Phân cụm k-means xác định với centroid khởi tạo do caller cung cấp."""

    if not points or not initial_centroids:
        raise ValueError("Cần ít nhất một point và một centroid")
    dimensions = len(points[0])
    if any(len(point) != dimensions for point in points):
        raise ValueError("Mọi point phải cùng chiều")
    centroids = list(initial_centroids)
    labels = [0] * len(points)

    for _ in range(iterations):
        labels = [
            min(range(len(centroids)), key=lambda index: euclidean(point, centroids[index]))
            for point in points
        ]
        updated: list[Point] = []
        for cluster_id, old_centroid in enumerate(centroids):
            members = [point for point, label in zip(points, labels) if label == cluster_id]
            if not members:
                updated.append(old_centroid)
                continue
            updated.append(
                tuple(sum(point[d] for point in members) / len(members) for d in range(dimensions))
            )
        if all(euclidean(a, b) < 1e-9 for a, b in zip(centroids, updated)):
            centroids = updated
            break
        centroids = updated
    return labels, centroids


def anomaly_scores(
    points: Sequence[Point], centroids: Sequence[Point]
) -> list[float]:
    """Dùng khoảng cách tới centroid gần nhất làm anomaly score."""

    return [min(euclidean(point, centroid) for centroid in centroids) for point in points]


def principal_direction_2d(points: Sequence[Point], steps: int = 30) -> Point:
    """Ước lượng principal component đầu bằng power iteration."""

    if not points or any(len(point) != 2 for point in points):
        raise ValueError("Demo PCA yêu cầu point hai chiều")
    mean_x = sum(point[0] for point in points) / len(points)
    mean_y = sum(point[1] for point in points) / len(points)
    centered = [(x - mean_x, y - mean_y) for x, y in points]
    covariance = (
        (sum(x * x for x, _ in centered) / len(points), sum(x * y for x, y in centered) / len(points)),
        (sum(x * y for x, y in centered) / len(points), sum(y * y for _, y in centered) / len(points)),
    )
    vector: Point = (1.0, 1.0)
    for _ in range(steps):
        projected = (
            covariance[0][0] * vector[0] + covariance[0][1] * vector[1],
            covariance[1][0] * vector[0] + covariance[1][1] * vector[1],
        )
        norm = math.sqrt(sum(value * value for value in projected))
        if norm == 0:
            return (1.0, 0.0)
        vector = (projected[0] / norm, projected[1] / norm)
    return vector


def run_demo() -> None:
    """Tìm hai chế độ máy bình thường và một sensor anomaly."""

    normal: list[Point] = [
        (40.0, 1.0),
        (41.0, 1.2),
        (39.5, 0.9),
        (75.0, 4.0),
        (76.0, 4.2),
        (74.0, 3.8),
    ]
    labels, centroids = kmeans(normal, [normal[0], normal[3]])
    assert labels[:3] == [0, 0, 0]
    assert labels[3:] == [1, 1, 1]

    candidates = normal + [(120.0, 12.0)]
    scores = anomaly_scores(candidates, centroids)
    anomaly_index = max(range(len(scores)), key=scores.__getitem__)
    assert anomaly_index == len(candidates) - 1
    assert scores[anomaly_index] > 3 * max(scores[:-1])

    direction = principal_direction_2d(normal)
    assert math.isclose(math.sqrt(sum(value * value for value in direction)), 1.0, rel_tol=1e-6)
    print(f"centroids={centroids}")
    print(f"anomaly={candidates[anomaly_index]} score={scores[anomaly_index]:.2f}")
    print(f"first_principal_direction=({direction[0]:.3f}, {direction[1]:.3f})")
    print("PASS: clustering, PCA direction, and anomaly score")


if __name__ == "__main__":
    run_demo()
