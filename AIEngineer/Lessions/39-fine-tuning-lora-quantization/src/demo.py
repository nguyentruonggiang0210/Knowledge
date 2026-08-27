"""LoRA và symmetric quantization tối giản, không cần thư viện ngoài."""

from __future__ import annotations

from typing import Sequence


Vector = list[float]
Matrix = list[list[float]]


def matvec(matrix: Matrix, vector: Sequence[float]) -> Vector:
    """Nhân matrix-vector với kiểm tra shape."""
    if not matrix or any(len(row) != len(vector) for row in matrix):
        raise ValueError("shape không tương thích")
    return [sum(weight * value for weight, value in zip(row, vector)) for row in matrix]


def lora_forward(base: Matrix, a: Matrix, b: Matrix, x: Sequence[float], alpha: float) -> Vector:
    """Tính Wx + (alpha/r)BAx; A có shape r×in, B có shape out×r."""
    rank = len(a)
    if rank == 0 or any(len(row) != rank for row in b):
        raise ValueError("rank LoRA không hợp lệ")
    base_output = matvec(base, x)
    low_rank = matvec(b, matvec(a, x))
    return [left + alpha / rank * right for left, right in zip(base_output, low_rank)]


def quantize_symmetric(values: Sequence[float], bits: int = 8) -> tuple[list[int], float]:
    """Quantize đối xứng một vector và trả integer codes cùng scale."""
    if bits < 2 or bits > 16:
        raise ValueError("bits phải trong [2, 16]")
    bound = (1 << (bits - 1)) - 1
    peak = max((abs(value) for value in values), default=0.0)
    scale = peak / bound if peak else 1.0
    codes = [max(-bound, min(bound, round(value / scale))) for value in values]
    return codes, scale


def dequantize(codes: Sequence[int], scale: float) -> Vector:
    """Khôi phục gần đúng floating-point values."""
    return [code * scale for code in codes]


def main() -> None:
    base = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]]
    a = [[1.0, -1.0, 0.5]]
    b = [[0.2], [-0.1]]
    output = lora_forward(base, a, b, [2.0, 1.0, 0.0], alpha=1.0)
    assert output == [2.2, 0.9]

    weights = [value for row in base for value in row]
    codes, scale = quantize_symmetric(weights, bits=8)
    restored = dequantize(codes, scale)
    error = max(abs(x - y) for x, y in zip(weights, restored))
    trainable = sum(map(len, a)) + sum(map(len, b))
    full = sum(map(len, base))
    assert trainable < full
    assert error <= scale / 2 + 1e-12
    print({"lora_output": output, "trainable": trainable, "full": full, "int8_max_error": error})


if __name__ == "__main__":
    main()

