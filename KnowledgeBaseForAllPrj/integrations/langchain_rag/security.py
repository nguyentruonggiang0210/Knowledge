"""Retrieval authorization and temporal filtering.

Filtering happens before scoring whenever the local runtime owns the candidates,
and is repeated after an external vector store returns results.
"""

from __future__ import annotations

from datetime import date
from typing import Any, Iterable, Mapping

from .models import AccessContext, EvidenceChunk


def _parse_date(value: Any) -> date | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def is_authorized(chunk: EvidenceChunk, access: AccessContext) -> bool:
    metadata = chunk.metadata
    if metadata.get("canonical") is not True:
        return False
    if str(metadata.get("scope")) not in access.scopes:
        return False
    if str(metadata.get("sensitivity")) not in access.sensitivities:
        return False
    if str(metadata.get("status")) not in access.statuses:
        return False
    if access.source_allowlist:
        sources = metadata.get("sources", [])
        if not isinstance(sources, list) or not sources or any(source not in access.source_allowlist for source in sources):
            return False
    valid_from = _parse_date(metadata.get("valid_from"))
    raw_valid_to = metadata.get("valid_to")
    valid_to = _parse_date(raw_valid_to)
    if valid_from is None:
        return False
    if raw_valid_to not in (None, "") and valid_to is None:
        return False
    if valid_from > access.as_of:
        return False
    if valid_to and valid_to < access.as_of:
        return False
    return True


def filter_authorized(chunks: Iterable[EvidenceChunk], access: AccessContext) -> list[EvidenceChunk]:
    return [chunk for chunk in chunks if is_authorized(chunk, access)]


def backend_filter(access: AccessContext) -> dict[str, Any]:
    """Provider-neutral filter contract for vector-store adapters."""

    result: dict[str, Any] = {
        "scope": {"$in": list(access.scopes)},
        "sensitivity": {"$in": list(access.sensitivities)},
        "status": {"$in": list(access.statuses)},
        "canonical": True,
    }
    if access.source_allowlist:
        result["sources"] = {"$all_in": list(access.source_allowlist)}
    result["as_of"] = access.as_of.isoformat()
    return result


def sanitize_retrieved_text(value: str) -> str:
    """Prevent retrieved text from terminating the evidence envelope."""

    return value.replace("</retrieved-evidence>", "&lt;/retrieved-evidence&gt;")
