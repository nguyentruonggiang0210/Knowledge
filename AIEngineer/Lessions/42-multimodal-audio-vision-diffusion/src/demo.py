"""Feature extraction và diffusion trực giác bằng dữ liệu nhỏ."""

from __future__ import annotations

import math
import random
from typing import Sequence


def image_features(pixels: Sequence[Sequence[float]]) -> tuple[float, float]:
    """Trả mean brightness và horizontal contrast của ảnh grayscale."""
    if not pixels or not pixels[0] or any(len(row) != len(pixels[0]) for row in pixels):
        raise ValueError("ảnh phải là ma trận chữ nhật không rỗng")
    flat = [value for row in pixels for value in row]
    contrast_terms = [abs(row[index] - row[index - 1]) for row in pixels for index in range(1, len(row))]
    return sum(flat) / len(flat), sum(contrast_terms) / max(1, len(contrast_terms))


def audio_features(samples: Sequence[float]) -> tuple[float, float]:
    """Trả RMS energy và zero-crossing rate."""
    if not samples:
        raise ValueError("audio rỗng")
    rms = math.sqrt(sum(value * value for value in samples) / len(samples))
    crossings = sum((a >= 0) != (b >= 0) for a, b in zip(samples, samples[1:]))
    return rms, crossings / max(1, len(samples) - 1)


def late_fusion(vision_score: float, audio_score: float, vision_reliable: bool = True) -> float:
    """Kết hợp score và giảm trọng số modality bị đánh dấu kém tin cậy."""
    vision_weight = 0.7 if vision_reliable else 0.2
    return vision_weight * vision_score + (1.0 - vision_weight) * audio_score


def add_diffusion_noise(signal: Sequence[float], alpha: float, seed: int = 3) -> list[float]:
    """Forward diffusion x_t=sqrt(alpha)x_0+sqrt(1-alpha)epsilon."""
    if not 0.0 <= alpha <= 1.0:
        raise ValueError("alpha phải thuộc [0,1]")
    rng = random.Random(seed)
    return [math.sqrt(alpha) * value + math.sqrt(1 - alpha) * rng.gauss(0, 1) for value in signal]


def main() -> None:
    brightness, contrast = image_features([[0.0, 1.0], [0.0, 1.0]])
    energy, crossing = audio_features([-1.0, 1.0, -1.0, 1.0])
    fused = late_fusion(contrast, energy)
    noisy = add_diffusion_noise([1.0, 1.0, 1.0], alpha=0.8)
    assert brightness == 0.5 and contrast == 1.0
    assert energy == 1.0 and crossing == 1.0
    assert abs(fused - 1.0) < 1e-12 and noisy != [1.0, 1.0, 1.0]
    print({"image": (brightness, contrast), "audio": (energy, crossing), "fusion": fused, "noisy": noisy})


if __name__ == "__main__":
    main()

