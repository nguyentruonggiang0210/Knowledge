"""Typed shared-context contract for LangGraph and other orchestrators."""

from __future__ import annotations

from typing import Annotated, Any, Mapping, TypedDict


def _merge_records(left: list[dict[str, Any]], right: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    for record in [*left, *right]:
        record_id = str(record.get(key, ""))
        if not record_id:
            continue
        if record_id not in merged:
            order.append(record_id)
            merged[record_id] = dict(record)
        else:
            merged[record_id].update(record)
    return [merged[record_id] for record_id in order]


def merge_evidence(left: list[dict[str, Any]], right: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return _merge_records(left or [], right or [], "chunk_id")


def merge_agent_results(left: list[dict[str, Any]], right: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return _merge_records(left or [], right or [], "result_id")


def merge_conflicts(left: list[dict[str, Any]], right: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return _merge_records(left or [], right or [], "conflict_id")


class KBGraphState(TypedDict, total=False):
    request_id: str
    query: str
    access: dict[str, Any]
    evidence: Annotated[list[dict[str, Any]], merge_evidence]
    evidence_context: str
    citations: list[dict[str, Any]]
    agent_results: Annotated[list[dict[str, Any]], merge_agent_results]
    unresolved_conflicts: Annotated[list[dict[str, Any]], merge_conflicts]
    artifact_refs: list[str]
    answer: str
    verification: dict[str, Any]
    errors: list[dict[str, Any]]


ROLE_FIELDS: dict[str, frozenset[str]] = {
    "researcher": frozenset({"request_id", "query", "access", "evidence", "citations"}),
    "implementer": frozenset({"request_id", "query", "access", "evidence", "citations", "artifact_refs"}),
    "reviewer": frozenset(
        {"request_id", "query", "access", "evidence", "citations", "artifact_refs", "agent_results", "answer"}
    ),
    "verifier": frozenset(
        {
            "request_id",
            "query",
            "access",
            "evidence",
            "citations",
            "artifact_refs",
            "agent_results",
            "unresolved_conflicts",
            "answer",
        }
    ),
}


def project_context(state: Mapping[str, Any], role: str) -> dict[str, Any]:
    """Return the least-privilege state view for one specialist role."""

    if role not in ROLE_FIELDS:
        raise ValueError(f"unknown context role {role!r}")
    return {key: state[key] for key in ROLE_FIELDS[role] if key in state}
