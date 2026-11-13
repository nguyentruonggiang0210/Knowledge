"""Deterministic lexical, dense-adapter, and hybrid retrieval."""

from __future__ import annotations

import math
import re
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from typing import Callable, Protocol, Sequence

from .models import AccessContext, EvidenceChunk, SearchHit
from .security import backend_filter, filter_authorized, is_authorized


TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)


def _tokens(value: str) -> list[str]:
    return [token.casefold() for token in TOKEN_RE.findall(value)]


class DenseBackend(Protocol):
    def search(self, query: str, *, k: int, filters: dict[str, object]) -> Sequence[SearchHit]: ...


class LexicalRetriever:
    """Small transparent BM25 baseline over canonical chunks."""

    def __init__(self, chunks: Sequence[EvidenceChunk]):
        self._chunks = tuple(chunks)

    def search(self, query: str, access: AccessContext, *, k: int = 10) -> list[SearchHit]:
        if k < 1:
            raise ValueError("k must be >= 1")
        query_terms = _tokens(query)
        candidates = filter_authorized(self._chunks, access)
        if not query_terms or not candidates:
            return []
        documents = [(chunk, _tokens(chunk.retrieval_text)) for chunk in candidates]
        document_frequency: Counter[str] = Counter()
        for _, tokens in documents:
            document_frequency.update(set(tokens))
        average_length = sum(len(tokens) for _, tokens in documents) / len(documents)
        k1, b = 1.5, 0.75
        ranked: list[SearchHit] = []
        for chunk, tokens in documents:
            frequencies = Counter(tokens)
            score = 0.0
            for term in query_terms:
                frequency = frequencies[term]
                if not frequency:
                    continue
                df = document_frequency[term]
                inverse_frequency = math.log(1 + (len(documents) - df + 0.5) / (df + 0.5))
                denominator = frequency + k1 * (1 - b + b * len(tokens) / max(average_length, 1))
                score += inverse_frequency * frequency * (k1 + 1) / denominator
            if score > 0:
                ranked.append(SearchHit(chunk=chunk, score=score, channels=("lexical",)))
        ranked.sort(key=lambda hit: (-hit.score, hit.chunk.chunk_id))
        return [replace(hit, ranks={"lexical": index}) for index, hit in enumerate(ranked[:k], 1)]


def reciprocal_rank_fusion(
    rankings: Sequence[tuple[str, Sequence[SearchHit]]],
    *,
    constant: int = 60,
    limit: int = 10,
) -> list[SearchHit]:
    if constant < 1 or limit < 1:
        raise ValueError("constant and limit must be >= 1")
    fused: dict[str, dict[str, object]] = {}
    for channel, hits in rankings:
        for rank, hit in enumerate(hits, 1):
            record = fused.setdefault(
                hit.chunk.chunk_id,
                {"chunk": hit.chunk, "score": 0.0, "channels": set(), "ranks": {}},
            )
            record["score"] = float(record["score"]) + 1.0 / (constant + rank)
            record["channels"].add(channel)  # type: ignore[union-attr]
            record["ranks"][channel] = rank  # type: ignore[index]
    results = [
        SearchHit(
            chunk=record["chunk"],  # type: ignore[arg-type]
            score=float(record["score"]),
            channels=tuple(sorted(record["channels"])),  # type: ignore[arg-type]
            ranks=dict(record["ranks"]),  # type: ignore[arg-type]
        )
        for record in fused.values()
    ]
    results.sort(key=lambda hit: (-hit.score, hit.chunk.chunk_id))
    return results[:limit]


class HybridRetriever:
    """Run lexical and optional dense retrieval, then fuse and rerank."""

    def __init__(
        self,
        lexical: LexicalRetriever,
        dense: DenseBackend | None = None,
        *,
        reranker: Callable[[str, Sequence[SearchHit]], Sequence[SearchHit]] | None = None,
        rrf_constant: int = 60,
    ):
        self.lexical = lexical
        self.dense = dense
        self.reranker = reranker
        self.rrf_constant = rrf_constant

    def search(
        self,
        query: str,
        access: AccessContext,
        *,
        candidate_k: int = 30,
        final_k: int = 8,
    ) -> list[SearchHit]:
        if candidate_k < final_k or final_k < 1:
            raise ValueError("candidate_k must be >= final_k >= 1")
        if self.dense is None:
            lexical_hits = self.lexical.search(query, access, k=candidate_k)
            fused = reciprocal_rank_fusion(
                [("lexical", lexical_hits)], constant=self.rrf_constant, limit=candidate_k
            )
        else:
            with ThreadPoolExecutor(max_workers=2, thread_name_prefix="kb-retrieval") as executor:
                lexical_future = executor.submit(self.lexical.search, query, access, k=candidate_k)
                dense_future = executor.submit(
                    self.dense.search,
                    query,
                    k=candidate_k,
                    filters=backend_filter(access),
                )
                lexical_hits = lexical_future.result()
                dense_hits = [hit for hit in dense_future.result() if is_authorized(hit.chunk, access)]
            fused = reciprocal_rank_fusion(
                [("lexical", lexical_hits), ("dense", dense_hits)],
                constant=self.rrf_constant,
                limit=candidate_k,
            )
        if self.reranker:
            fused = list(self.reranker(query, fused))
        return fused[:final_k]
