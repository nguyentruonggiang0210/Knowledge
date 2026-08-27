"""Exact vector search và local INT8-like classifier bằng Python chuẩn."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from collections.abc import Mapping, Sequence


@dataclass(frozen=True)
class QuantizedVector:
    """Integer values và scale để xấp xỉ vector float."""

    values: tuple[int, ...]
    scale: float


def quantize_symmetric(values: Sequence[float], bits: int = 8) -> QuantizedVector:
    """Quantize symmetric signed integer với một scale cho cả vector."""

    if bits < 2 or bits > 16:
        raise ValueError("bits phải nằm trong 2..16")
    limit = 2 ** (bits - 1) - 1
    maximum = max((abs(value) for value in values), default=0.0)
    scale = maximum / limit if maximum else 1.0
    integers = tuple(max(-limit, min(limit, round(value / scale))) for value in values)
    return QuantizedVector(integers, scale)


def dequantize(vector: QuantizedVector) -> list[float]:
    """Khôi phục xấp xỉ float từ integer và scale."""

    return [value * vector.scale for value in vector.values]


def embed_text(text: str, vocabulary: Sequence[str]) -> list[float]:
    """Bag-of-words embedding nhỏ, dùng cùng vocabulary cho query/document."""

    tokens = re.findall(r"\w+", text.lower(), flags=re.UNICODE)
    return [float(tokens.count(term)) for term in vocabulary]


def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    """Tính cosine similarity giữa hai dense vector."""

    if len(left) != len(right):
        raise ValueError("Vector phải cùng chiều")
    numerator = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    return numerator / (left_norm * right_norm) if left_norm and right_norm else 0.0


def vector_search(
    query: Sequence[float], documents: Mapping[str, Sequence[float]], top_k: int
) -> list[tuple[str, float]]:
    """Exact top-k search, sort ổn định theo score rồi document id."""

    if top_k < 1:
        raise ValueError("top_k phải >= 1")
    scored = [(document_id, cosine_similarity(query, vector)) for document_id, vector in documents.items()]
    return sorted(scored, key=lambda item: (-item[1], item[0]))[:top_k]


def local_intent_inference(
    features: Sequence[float],
    quantized_weights: Mapping[str, QuantizedVector],
) -> tuple[str, dict[str, float]]:
    """Local linear classifier dùng dequantized INT weights."""

    scores = {
        label: sum(feature * weight for feature, weight in zip(features, dequantize(row)))
        for label, row in quantized_weights.items()
    }
    return max(scores, key=scores.get), scores  # type: ignore[arg-type]


def run_demo() -> None:
    """Phân loại intent và tìm bài hướng dẫn phù hợp hoàn toàn offline."""

    vocabulary = ["đăng", "nhập", "mật", "khẩu", "hóa", "đơn", "thanh", "toán"]
    knowledge_base = {
        "login-guide": "hướng dẫn đăng nhập và đặt lại mật khẩu",
        "billing-guide": "kiểm tra hóa đơn và lịch sử thanh toán",
        "profile-guide": "cập nhật hồ sơ cá nhân",
    }
    document_vectors = {
        document_id: embed_text(text, vocabulary)
        for document_id, text in knowledge_base.items()
    }
    query = embed_text("tôi quên mật khẩu đăng nhập", vocabulary)
    results = vector_search(query, document_vectors, top_k=2)
    assert results[0][0] == "login-guide"
    assert results[0][1] > results[1][1]

    float_weights = {
        "login": [1.0, 1.1, 0.9, 0.9, 0.0, 0.0, 0.0, 0.0],
        "billing": [0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.9, 1.1],
    }
    quantized = {label: quantize_symmetric(weights) for label, weights in float_weights.items()}
    intent, scores = local_intent_inference(query, quantized)
    assert intent == "login"

    original = [0.1, -0.7, 0.3]
    round_trip = dequantize(quantize_symmetric(original))
    max_error = max(abs(a - b) for a, b in zip(original, round_trip))
    assert max_error < 0.01
    print(f"intent={intent} scores={{{', '.join(f'{k}: {v:.2f}' for k, v in scores.items())}}}")
    print(f"top_documents={results} int8_roundtrip_max_error={max_error:.5f}")
    print("PASS: local quantized inference and exact vector search")


if __name__ == "__main__":
    run_demo()
