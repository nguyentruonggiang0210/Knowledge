"""Một RAG pipeline extractive có chunk, retrieval và citation."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from collections.abc import Mapping, Sequence


@dataclass(frozen=True)
class Chunk:
    """Đơn vị retrieval gắn source ổn định."""

    chunk_id: str
    source_id: str
    text: str


@dataclass(frozen=True)
class Answer:
    """Câu trả lời grounded hoặc no-answer."""

    text: str
    citations: tuple[str, ...]


def tokenize(text: str) -> list[str]:
    """Tách token Unicode đơn giản cho demo."""

    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def chunk_document(source_id: str, text: str, words_per_chunk: int = 18, overlap: int = 3) -> list[Chunk]:
    """Chia document theo word window và giữ source/chunk id."""

    if words_per_chunk < 1 or overlap < 0 or overlap >= words_per_chunk:
        raise ValueError("Cấu hình chunk không hợp lệ")
    words = text.split()
    chunks: list[Chunk] = []
    step = words_per_chunk - overlap
    for index, start in enumerate(range(0, len(words), step)):
        piece = words[start : start + words_per_chunk]
        if piece:
            chunks.append(Chunk(f"{source_id}#chunk-{index}", source_id, " ".join(piece)))
        if start + words_per_chunk >= len(words):
            break
    return chunks


def sparse_vector(text: str) -> dict[str, float]:
    """Tạo normalized term-frequency vector."""

    tokens = tokenize(text)
    if not tokens:
        return {}
    counts = {token: tokens.count(token) / len(tokens) for token in set(tokens)}
    return counts


def cosine(left: Mapping[str, float], right: Mapping[str, float]) -> float:
    """Cosine giữa hai sparse vector."""

    dot_product = sum(value * right.get(term, 0.0) for term, value in left.items())
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    return dot_product / (left_norm * right_norm) if left_norm and right_norm else 0.0


def retrieve(query: str, chunks: Sequence[Chunk], top_k: int = 2) -> list[tuple[Chunk, float]]:
    """Xếp hạng chunk theo cosine và bỏ kết quả zero-score."""

    query_vector = sparse_vector(query)
    scored = [(chunk, cosine(query_vector, sparse_vector(chunk.text))) for chunk in chunks]
    return [
        item
        for item in sorted(scored, key=lambda item: (-item[1], item[0].chunk_id))
        if item[1] > 0
    ][:top_k]


def answer_extractively(query: str, retrieved: Sequence[tuple[Chunk, float]]) -> Answer:
    """Chọn câu evidence overlap nhiều nhất; không bịa khi không có evidence."""

    if not retrieved:
        return Answer("Không đủ thông tin trong tài liệu.", ())
    query_terms = set(tokenize(query))
    candidates: list[tuple[int, str, str]] = []
    for chunk, _ in retrieved:
        for sentence in re.split(r"(?<=[.!?])\s+", chunk.text):
            overlap = len(query_terms & set(tokenize(sentence)))
            candidates.append((overlap, sentence, chunk.chunk_id))
    best_overlap, sentence, citation = max(candidates, key=lambda item: (item[0], item[2]))
    if best_overlap == 0:
        return Answer("Không đủ thông tin trong tài liệu.", ())
    return Answer(sentence, (citation,))


def run_demo() -> None:
    """Hỏi chính sách nghỉ phép và kiểm tra no-answer."""

    documents = {
        "hr-policy-v3": (
            "Nhân viên chính thức có 12 ngày nghỉ phép có lương mỗi năm. "
            "Đơn nghỉ từ ba ngày cần gửi trước ít nhất năm ngày làm việc."
        ),
        "it-policy-v2": (
            "Mật khẩu phải có ít nhất 12 ký tự. Không chia sẻ mật khẩu qua email."
        ),
    }
    chunks = [
        chunk
        for source_id, text in documents.items()
        for chunk in chunk_document(source_id, text)
    ]
    query = "Nhân viên có bao nhiêu ngày nghỉ phép?"
    results = retrieve(query, chunks)
    answer = answer_extractively(query, results)
    assert "12 ngày" in answer.text
    assert answer.citations and answer.citations[0].startswith("hr-policy-v3")
    assert all(citation in {chunk.chunk_id for chunk in chunks} for citation in answer.citations)

    unknown_query = "Bãi đỗ xe máy ở đâu?"
    unknown_results = retrieve(unknown_query, chunks)
    unknown_answer = answer_extractively(unknown_query, unknown_results)
    # Query không có term chung với documents nên retrieval phải rỗng.
    assert unknown_answer.citations == ()
    assert unknown_answer.text.startswith("Không đủ")
    print(f"answer={answer.text!a} citations={answer.citations}")
    print(f"unknown={unknown_answer.text!a}")
    print("PASS: RAG retrieval, grounded citation, and no-answer")


if __name__ == "__main__":
    run_demo()
