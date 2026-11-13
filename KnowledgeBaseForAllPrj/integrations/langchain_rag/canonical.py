"""Canonical Markdown loader and structure-aware chunker."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Iterable

from scripts.kb import Page, load_pages, validate_repository

from .models import EvidenceChunk


HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")


def _sections(body: str) -> list[tuple[str, str]]:
    sections: list[tuple[str, str]] = []
    heading = "Document"
    lines: list[str] = []
    for line in body.splitlines():
        match = HEADING_RE.match(line)
        if match:
            if lines:
                sections.append((heading, "\n".join(lines).strip()))
            heading = match.group(2).strip()
            lines = [line]
        else:
            lines.append(line)
    if lines:
        sections.append((heading, "\n".join(lines).strip()))
    return [(name, text) for name, text in sections if text]


def _blocks(section: str) -> list[str]:
    """Split on blank lines while keeping fenced code blocks intact."""

    result: list[str] = []
    current: list[str] = []
    in_fence = False
    fence_marker = ""
    for line in section.splitlines():
        stripped = line.lstrip()
        if stripped.startswith(("```", "~~~")):
            marker = stripped[:3]
            if not in_fence:
                in_fence = True
                fence_marker = marker
            elif marker == fence_marker:
                in_fence = False
            current.append(line)
            continue
        if not line.strip() and not in_fence:
            if current:
                result.append("\n".join(current).strip())
                current = []
            continue
        current.append(line)
    if current:
        result.append("\n".join(current).strip())
    return [block for block in result if block]


def _pack_blocks(blocks: Iterable[str], max_characters: int) -> list[str]:
    packed: list[str] = []
    current = ""
    for block in blocks:
        candidate = f"{current}\n\n{block}".strip() if current else block
        if current and len(candidate) > max_characters:
            packed.append(current)
            current = block
        else:
            current = candidate
    if current:
        packed.append(current)
    return packed


def _page_chunks(page: Page, root: Path, max_characters: int) -> list[EvidenceChunk]:
    metadata = page.metadata
    page_id = str(metadata["id"])
    chunks: list[EvidenceChunk] = []
    for heading, section in _sections(page.body):
        for content in _pack_blocks(_blocks(section), max_characters):
            digest = hashlib.sha256(f"{page_id}\n{heading}\n{content}".encode("utf-8")).hexdigest()[:16]
            chunk_metadata = {
                "chunk_id": f"{page_id}::{digest}",
                "page_id": page_id,
                "title": metadata.get("title"),
                "summary": metadata.get("summary"),
                "heading": heading,
                "kind": metadata.get("kind"),
                "scope": metadata.get("scope"),
                "status": metadata.get("status"),
                "sensitivity": metadata.get("sensitivity"),
                "valid_from": metadata.get("valid_from"),
                "valid_to": metadata.get("valid_to"),
                "last_verified": metadata.get("last_verified"),
                "review_by": metadata.get("review_by"),
                "sources": list(metadata.get("sources", [])),
                "relations": list(metadata.get("relations", [])),
                "path": page.path.relative_to(root).as_posix(),
                "canonical": True,
                "trust_boundary": "untrusted-retrieved-data",
            }
            chunks.append(
                EvidenceChunk(
                    chunk_id=chunk_metadata["chunk_id"],
                    page_id=page_id,
                    content=content,
                    metadata=chunk_metadata,
                )
            )
    return chunks


def load_canonical_chunks(
    root: Path,
    *,
    max_characters: int = 1800,
    validate_repository_state: bool = True,
) -> list[EvidenceChunk]:
    """Load only canonical pages selected by the repository's core loader."""

    if max_characters < 256:
        raise ValueError("max_characters must be >= 256")
    resolved_root = root.resolve()
    if validate_repository_state:
        errors, _warnings, _pages = validate_repository(resolved_root)
        if errors:
            preview = "; ".join(errors[:5])
            suffix = f"; plus {len(errors) - 5} more" if len(errors) > 5 else ""
            raise ValueError(f"refusing to index an invalid repository: {preview}{suffix}")
    chunks: list[EvidenceChunk] = []
    for page in load_pages(resolved_root):
        chunks.extend(_page_chunks(page, resolved_root, max_characters))
    return chunks
