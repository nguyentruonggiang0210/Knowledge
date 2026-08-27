"""Markdown parser, hybrid retrieval, RRF, graph expansion và citation eval."""

from __future__ import annotations

import math
import re
from collections import Counter
from collections.abc import Mapping, Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class Chunk:
    """Parsed chunk giữ source và heading để citation."""

    chunk_id: str
    source_id: str
    heading: str
    text: str


def lexical_tokenize(text: str) -> list[str]:
    """Tokenize giữ nguyên term cho retriever BM25 lexical."""

    return re.findall(r"\w+", text.lower(), flags=re.UNICODE)


def semantic_tokenize(text: str) -> list[str]:
    """Canonicalize một số synonym phục vụ dense-like demo."""

    synonyms = {
        "trả": "payment",
        "tiền": "payment",
        "thanh": "payment",
        "toán": "payment",
        "ngừng": "outage",
        "down": "outage",
        "lỗi": "outage",
    }
    raw = lexical_tokenize(text)
    return [synonyms.get(token, token) for token in raw]


def parse_markdown(source_id: str, markdown: str) -> list[Chunk]:
    """Parse Markdown theo heading, bỏ dòng trống nhưng giữ provenance."""

    chunks: list[Chunk] = []
    heading = "Untitled"
    buffer: list[str] = []

    def flush() -> None:
        if buffer:
            index = len(chunks)
            chunks.append(
                Chunk(
                    chunk_id=f"{source_id}#section-{index}",
                    source_id=source_id,
                    heading=heading,
                    text=" ".join(buffer).strip(),
                )
            )
            buffer.clear()

    for raw_line in markdown.splitlines():
        line = raw_line.strip()
        if line.startswith("#"):
            flush()
            heading = line.lstrip("#").strip() or "Untitled"
        elif line:
            buffer.append(line)
    flush()
    return chunks


def bm25_rank(query: str, chunks: Sequence[Chunk], k1: float = 1.5, b: float = 0.75) -> list[str]:
    """Xếp hạng BM25 lexical trên parsed chunks."""

    corpus_tokens = [lexical_tokenize(f"{chunk.heading} {chunk.text}") for chunk in chunks]
    average_length = sum(map(len, corpus_tokens)) / len(corpus_tokens)
    query_terms = lexical_tokenize(query)
    document_frequency = {
        term: sum(term in tokens for tokens in corpus_tokens) for term in set(query_terms)
    }
    scored: list[tuple[float, str]] = []
    for chunk, tokens in zip(chunks, corpus_tokens):
        counts = Counter(tokens)
        score = 0.0
        for term in query_terms:
            frequency = counts[term]
            if not frequency:
                continue
            df = document_frequency[term]
            inverse_document_frequency = math.log(1 + (len(chunks) - df + 0.5) / (df + 0.5))
            denominator = frequency + k1 * (1 - b + b * len(tokens) / average_length)
            score += inverse_document_frequency * frequency * (k1 + 1) / denominator
        scored.append((score, chunk.chunk_id))
    return [chunk_id for score, chunk_id in sorted(scored, key=lambda item: (-item[0], item[1])) if score > 0]


def dense_like_rank(query: str, chunks: Sequence[Chunk]) -> list[str]:
    """Semantic-like cosine dùng synonym canonicalization, đủ minh họa offline."""

    query_counts = Counter(semantic_tokenize(query))

    def cosine(document: str) -> float:
        document_counts = Counter(semantic_tokenize(document))
        numerator = sum(value * document_counts[term] for term, value in query_counts.items())
        left = math.sqrt(sum(value * value for value in query_counts.values()))
        right = math.sqrt(sum(value * value for value in document_counts.values()))
        return numerator / (left * right) if left and right else 0.0

    scored = [(cosine(f"{chunk.heading} {chunk.text}"), chunk.chunk_id) for chunk in chunks]
    return [chunk_id for score, chunk_id in sorted(scored, key=lambda item: (-item[0], item[1])) if score > 0]


def reciprocal_rank_fusion(rankings: Sequence[Sequence[str]], rank_constant: int = 60) -> list[str]:
    """Hợp nhất nhiều ranking bằng RRF, không trộn raw score."""

    scores: Counter[str] = Counter()
    for ranking in rankings:
        for rank, item_id in enumerate(ranking, start=1):
            scores[item_id] += 1.0 / (rank_constant + rank)
    return [item_id for item_id, _ in sorted(scores.items(), key=lambda item: (-item[1], item[0]))]


def expand_graph(seed: str, graph: Mapping[str, set[str]], max_hops: int = 1) -> set[str]:
    """Breadth-first expansion có giới hạn hop cho GraphRAG context."""

    visited = {seed}
    frontier = {seed}
    for _ in range(max_hops):
        frontier = {neighbor for node in frontier for neighbor in graph.get(node, set())} - visited
        visited.update(frontier)
    return visited


def evaluate_citations(cited_ids: Sequence[str], retrieved_ids: Sequence[str]) -> dict[str, float]:
    """Đo tỷ lệ citation hợp lệ và coverage của retrieved evidence được cite."""

    retrieved = set(retrieved_ids)
    valid = sum(citation in retrieved for citation in cited_ids)
    validity = valid / len(cited_ids) if cited_ids else 0.0
    coverage = len(set(cited_ids) & retrieved) / len(retrieved) if retrieved else 0.0
    return {"validity": validity, "retrieved_coverage": coverage}


def run_demo() -> None:
    """Hybrid retrieve một incident runbook và mở rộng service graph."""

    documents = {
        "checkout-runbook": (
            "# Sự cố Checkout\n"
            "Checkout phụ thuộc PaymentAPI để hoàn tất giao dịch. Kiểm tra mã PAY-503.\n"
            "# Khôi phục\n"
            "Chuyển traffic sang vùng dự phòng nếu PaymentAPI outage."
        ),
        "payment-runbook": (
            "# PaymentAPI\n"
            "PaymentAPI kết nối Database. Khi dịch vụ thanh toán ngừng, kiểm tra connection pool."
        ),
        "search-runbook": "# Search\nSearchAPI phục vụ tìm kiếm sản phẩm.",
    }
    chunks = [
        chunk
        for source_id, markdown in documents.items()
        for chunk in parse_markdown(source_id, markdown)
    ]
    assert len(chunks) == 4
    query = "Checkout lỗi vì dịch vụ trả tiền bị ngừng"
    lexical = bm25_rank(query, chunks)
    semantic = dense_like_rank(query, chunks)
    fused = reciprocal_rank_fusion([lexical, semantic])
    assert {
        "checkout-runbook#section-0",
        "payment-runbook#section-0",
    }.issubset(set(fused[:3]))

    service_graph = {
        "Checkout": {"PaymentAPI"},
        "PaymentAPI": {"Database"},
        "Database": set(),
    }
    one_hop = expand_graph("Checkout", service_graph, max_hops=1)
    two_hops = expand_graph("Checkout", service_graph, max_hops=2)
    assert one_hop == {"Checkout", "PaymentAPI"}
    assert "Database" in two_hops

    citation_metrics = evaluate_citations([fused[0]], fused[:2])
    invalid_metrics = evaluate_citations([fused[0], "invented#chunk"], fused[:2])
    assert citation_metrics["validity"] == 1.0
    assert invalid_metrics["validity"] == 0.5
    print(f"bm25={lexical} dense={semantic} fused={fused}")
    print(f"graph_context={sorted(two_hops)} citation_metrics={citation_metrics}")
    print("PASS: parser, hybrid retrieval, RRF, graph expansion, and citation eval")


if __name__ == "__main__":
    run_demo()
