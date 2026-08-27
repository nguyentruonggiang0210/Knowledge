"""NLP preprocessing, TF-IDF embedding và sequence padding bằng stdlib."""

from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from collections.abc import Sequence

Vector = dict[str, float]


def normalize_and_tokenize(text: str) -> list[str]:
    """Normalize Unicode NFC, lowercase và tách word nhưng giữ dấu tiếng Việt."""

    normalized = unicodedata.normalize("NFC", text).lower()
    return re.findall(r"\w+", normalized, flags=re.UNICODE)


def tfidf_vectors(documents: Sequence[str]) -> list[Vector]:
    """Biểu diễn mỗi document bằng TF-IDF dictionary."""

    tokenized = [normalize_and_tokenize(document) for document in documents]
    document_frequency = Counter(
        token for tokens in tokenized for token in set(tokens)
    )
    vectors: list[Vector] = []
    for tokens in tokenized:
        counts = Counter(tokens)
        total = len(tokens) or 1
        vectors.append(
            {
                token: (count / total)
                * (math.log((1 + len(documents)) / (1 + document_frequency[token])) + 1)
                for token, count in counts.items()
            }
        )
    return vectors


def cosine_similarity(left: Vector, right: Vector) -> float:
    """Tính cosine cho hai sparse dictionary vector."""

    dot_product = sum(value * right.get(token, 0.0) for token, value in left.items())
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    return dot_product / (left_norm * right_norm) if left_norm and right_norm else 0.0


def build_vocabulary(token_sequences: Sequence[Sequence[str]]) -> dict[str, int]:
    """Tạo vocabulary ổn định, dành id 0 cho PAD và 1 cho UNK."""

    tokens = sorted({token for sequence in token_sequences for token in sequence})
    return {"<PAD>": 0, "<UNK>": 1, **{token: index + 2 for index, token in enumerate(tokens)}}


def pad_sequences(
    token_sequences: Sequence[Sequence[str]],
    vocabulary: dict[str, int],
    max_length: int,
) -> tuple[list[list[int]], list[list[int]]]:
    """Chuyển token thành id, truncate/pad và tạo mask 1 cho token thật."""

    if max_length < 1:
        raise ValueError("max_length phải >= 1")
    encoded: list[list[int]] = []
    masks: list[list[int]] = []
    for tokens in token_sequences:
        ids = [vocabulary.get(token, vocabulary["<UNK>"]) for token in tokens[:max_length]]
        real_length = len(ids)
        ids.extend([vocabulary["<PAD>"]] * (max_length - real_length))
        encoded.append(ids)
        masks.append([1] * real_length + [0] * (max_length - real_length))
    return encoded, masks


def run_demo() -> None:
    """So khớp ticket hỗ trợ rồi tạo batch token id."""

    documents = [
        "Không thể đăng nhập tài khoản.",
        "Lỗi đăng nhập và quên mật khẩu!",
        "Hóa đơn thanh toán bị tính sai.",
    ]
    vectors = tfidf_vectors(documents)
    login_similarity = cosine_similarity(vectors[0], vectors[1])
    billing_similarity = cosine_similarity(vectors[0], vectors[2])
    assert login_similarity > billing_similarity
    assert normalize_and_tokenize("ĐĂNG NHẬP") == ["đăng", "nhập"]

    sequences = [normalize_and_tokenize(document) for document in documents]
    vocabulary = build_vocabulary(sequences)
    encoded, masks = pad_sequences(sequences, vocabulary, max_length=7)
    assert all(len(row) == 7 for row in encoded)
    assert sum(masks[0]) == len(sequences[0])
    assert encoded[0][-1] == vocabulary["<PAD>"] and masks[0][-1] == 0
    assert all(
        token_id != vocabulary["<PAD>"] or mask == 0
        for row, row_mask in zip(encoded, masks)
        for token_id, mask in zip(row, row_mask)
    )
    print(f"login_similarity={login_similarity:.3f} billing_similarity={billing_similarity:.3f}")
    print(f"token_ids={encoded[0]} mask={masks[0]}")
    print("PASS: Unicode tokenization, embeddings, and sequence masks")


if __name__ == "__main__":
    run_demo()
