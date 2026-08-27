"""Implement core vector operations used by embedding retrieval."""

from __future__ import annotations

import math
from collections.abc import Sequence

Vector = Sequence[float]
Matrix = Sequence[Sequence[float]]


def dot(left: Vector, right: Vector) -> float:
    """Return the dot product of equally sized vectors."""
    if len(left) != len(right):
        raise ValueError("Vector dimensions must match")
    return sum(a * b for a, b in zip(left, right))


def l2_norm(vector: Vector) -> float:
    """Return Euclidean length of a vector."""
    return math.sqrt(dot(vector, vector))


def cosine_similarity(left: Vector, right: Vector) -> float:
    """Measure directional similarity, rejecting zero vectors."""
    denominator = l2_norm(left) * l2_norm(right)
    if denominator == 0:
        raise ValueError("Cosine similarity is undefined for a zero vector")
    return dot(left, right) / denominator


def matrix_vector(matrix: Matrix, vector: Vector) -> list[float]:
    """Multiply a rectangular matrix by a compatible vector."""
    if not matrix:
        return []
    width = len(matrix[0])
    if width != len(vector) or any(len(row) != width for row in matrix):
        raise ValueError("Matrix must be rectangular and shape-compatible")
    return [dot(row, vector) for row in matrix]


def rank_documents(query: Vector, documents: dict[str, Vector]) -> list[tuple[str, float]]:
    """Rank document embeddings by descending cosine similarity."""
    scored = [
        (document_id, cosine_similarity(query, embedding))
        for document_id, embedding in documents.items()
    ]
    return sorted(scored, key=lambda item: (-item[1], item[0]))


def main() -> None:
    """Rank tiny semantic embeddings and verify the math."""
    query = [1.0, 0.8, 0.0]
    documents = {
        "python-ml": [0.9, 0.7, 0.1],
        "cooking": [0.0, 0.1, 1.0],
        "data-pipeline": [0.7, 0.9, 0.0],
    }
    ranking = rank_documents(query, documents)
    projection = matrix_vector([[1.0, 0.0, 1.0], [0.0, 2.0, 0.0]], query)

    assert ranking[0][0] == "python-ml"
    assert math.isclose(dot([1.0, 2.0], [3.0, 4.0]), 11.0)
    assert projection == [1.0, 1.6]

    for name, score in ranking:
        print(f"{name:14} cosine={score:.4f}")
    print("Linear projection:", projection)
    print("Self-check: OK")


if __name__ == "__main__":
    main()
