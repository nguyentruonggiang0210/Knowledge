"""Provider-neutral data contracts used by the optional RAG runtime."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Any, Mapping


@dataclass(frozen=True)
class AccessContext:
    """Immutable retrieval authority supplied by trusted application code.

    Agents may choose a query, but they must not be allowed to widen this
    context. Shared knowledge must therefore be explicitly included in scopes.
    """

    scopes: tuple[str, ...] = ("shared",)
    sensitivities: tuple[str, ...] = ("public", "internal")
    statuses: tuple[str, ...] = ("approved",)
    as_of: date = field(default_factory=date.today)
    source_allowlist: tuple[str, ...] = ()

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any] | None) -> "AccessContext":
        data = value or {}
        raw_as_of = data.get("as_of")
        if raw_as_of in (None, ""):
            parsed_as_of = date.today()
        elif isinstance(raw_as_of, date):
            parsed_as_of = raw_as_of
        elif isinstance(raw_as_of, str):
            parsed_as_of = date.fromisoformat(raw_as_of)
        else:
            raise ValueError("access.as_of must be an ISO date")
        return cls(
            scopes=tuple(data.get("scopes", ("shared",))),
            sensitivities=tuple(data.get("sensitivities", ("public", "internal"))),
            statuses=tuple(data.get("statuses", ("approved",))),
            as_of=parsed_as_of,
            source_allowlist=tuple(data.get("source_allowlist", ())),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "scopes": list(self.scopes),
            "sensitivities": list(self.sensitivities),
            "statuses": list(self.statuses),
            "as_of": self.as_of.isoformat(),
            "source_allowlist": list(self.source_allowlist),
        }


@dataclass(frozen=True)
class EvidenceChunk:
    """A derived, rebuildable chunk that preserves canonical provenance."""

    chunk_id: str
    page_id: str
    content: str
    metadata: Mapping[str, Any] = field(default_factory=dict)

    @property
    def retrieval_text(self) -> str:
        return "\n".join(
            part
            for part in (
                str(self.metadata.get("title", "")),
                str(self.metadata.get("summary", "")),
                str(self.metadata.get("heading", "")),
                self.content,
            )
            if part
        )

    def to_dict(self, *, include_content: bool = True) -> dict[str, Any]:
        result = {
            "chunk_id": self.chunk_id,
            "page_id": self.page_id,
            "metadata": dict(self.metadata),
        }
        if include_content:
            result["content"] = self.content
        return result

    @classmethod
    def from_dict(cls, value: Mapping[str, Any]) -> "EvidenceChunk":
        return cls(
            chunk_id=str(value["chunk_id"]),
            page_id=str(value["page_id"]),
            content=str(value.get("content", "")),
            metadata=dict(value.get("metadata", {})),
        )


@dataclass(frozen=True)
class SearchHit:
    chunk: EvidenceChunk
    score: float
    channels: tuple[str, ...] = ()
    ranks: Mapping[str, int] = field(default_factory=dict)

    def to_dict(self, *, include_content: bool = True) -> dict[str, Any]:
        return {
            "chunk": self.chunk.to_dict(include_content=include_content),
            "score": self.score,
            "channels": list(self.channels),
            "ranks": dict(self.ranks),
        }


@dataclass(frozen=True)
class EvidencePack:
    """Prompt-safe envelope plus exact citations used to build it."""

    context: str
    citations: tuple[dict[str, Any], ...]
    truncated: bool
    used_characters: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "context": self.context,
            "citations": list(self.citations),
            "truncated": self.truncated,
            "used_characters": self.used_characters,
        }
