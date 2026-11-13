#!/usr/bin/env python3
"""Validate, index, and search the repository knowledge base.

The tool intentionally uses only the Python standard library. Canonical Markdown is
the source of truth; generated catalogs are disposable derived artifacts.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_METADATA = {
    "id", "title", "summary", "kind", "scope", "status", "owners", "tags",
    "valid_from", "recorded_at", "last_verified", "review_by", "confidence",
    "sensitivity", "sources", "relations",
}
KINDS = {
    "catalog", "principle", "pattern", "standard", "runbook", "overview",
    "architecture", "requirement", "interface", "decision", "change", "lesson",
}
STATUSES = {"draft", "proposed", "approved", "deprecated", "superseded"}
CONFIDENCE = {"low", "medium", "high"}
SENSITIVITY = {"public", "internal", "confidential", "restricted"}
ID_RE = re.compile(r"^[a-z0-9]+(?:[.-][a-z0-9]+)*$")
LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)


@dataclass
class Page:
    path: Path
    metadata: dict[str, Any]
    body: str


def _parse_value(raw: str) -> Any:
    value = raw.strip()
    if value in {"null", "~"}:
        return None
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        return [part.strip().strip("\"'") for part in inner.split(",")]
    return value.strip("\"'")


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        return {}, text
    metadata: dict[str, Any] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = _parse_value(value)
    return metadata, "\n".join(lines[end + 1 :]).lstrip()


def canonical_markdown_paths(root: Path) -> list[Path]:
    paths = [root / "kb" / "index.md"]
    for area in (root / "kb" / "catalog", root / "kb" / "shared"):
        if area.exists():
            paths.extend(area.rglob("*.md"))
    projects = root / "kb" / "projects"
    if projects.exists():
        for project in projects.iterdir():
            if project.is_dir() and project.name != "_template":
                paths.extend(project.rglob("*.md"))
    return sorted({path for path in paths if path.exists()})


def load_pages(root: Path) -> list[Page]:
    pages = []
    for path in canonical_markdown_paths(root):
        metadata, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        pages.append(Page(path=path, metadata=metadata, body=body))
    return pages


def _valid_date(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False


def validate_source_registry(root: Path) -> tuple[set[str], list[str]]:
    errors: list[str] = []
    path = root / "kb" / "sources" / "registry.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return set(), [f"{path}: cannot read source registry: {exc}"]
    if not _valid_date(data.get("checked_at")):
        errors.append(f"{path}: checked_at must be an ISO date")
    ids: set[str] = set()
    for index, source in enumerate(data.get("sources", [])):
        label = f"{path}: sources[{index}]"
        required = {"id", "title", "uri", "kind", "authority_tier", "topics"}
        missing = required - set(source)
        if missing:
            errors.append(f"{label}: missing {sorted(missing)}")
            continue
        source_id = source["id"]
        if source_id in ids:
            errors.append(f"{label}: duplicate source id {source_id}")
        ids.add(source_id)
        parsed = urlparse(source["uri"])
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            errors.append(f"{label}: uri must be an absolute HTTP(S) URL")
        if source["authority_tier"] not in {1, 2, 3, 4}:
            errors.append(f"{label}: authority_tier must be 1..4")
    return ids, errors


def validate_pages(root: Path, source_ids: set[str]) -> tuple[list[Page], list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    pages = load_pages(root)
    seen: dict[str, Path] = {}
    today = date.today()
    for page in pages:
        rel = page.path.relative_to(root)
        meta = page.metadata
        missing = REQUIRED_METADATA - set(meta)
        if missing:
            errors.append(f"{rel}: missing metadata {sorted(missing)}")
            continue
        page_id = meta["id"]
        if not isinstance(page_id, str) or not ID_RE.fullmatch(page_id):
            errors.append(f"{rel}: invalid stable id {page_id!r}")
        elif page_id in seen:
            errors.append(f"{rel}: duplicate id {page_id}; first seen at {seen[page_id].relative_to(root)}")
        else:
            seen[page_id] = page.path
        if meta["kind"] not in KINDS:
            errors.append(f"{rel}: invalid kind {meta['kind']!r}")
        if meta["status"] not in STATUSES:
            errors.append(f"{rel}: invalid status {meta['status']!r}")
        if meta["confidence"] not in CONFIDENCE:
            errors.append(f"{rel}: invalid confidence {meta['confidence']!r}")
        if meta["sensitivity"] not in SENSITIVITY:
            errors.append(f"{rel}: invalid sensitivity {meta['sensitivity']!r}")
        for field in ("valid_from", "recorded_at", "last_verified", "review_by"):
            if not _valid_date(meta[field]):
                errors.append(f"{rel}: {field} must be an ISO date")
        if meta.get("valid_to") is not None and not _valid_date(meta.get("valid_to")):
            errors.append(f"{rel}: valid_to must be null or an ISO date")
        for field in ("owners", "tags", "sources", "relations"):
            if not isinstance(meta[field], list):
                errors.append(f"{rel}: {field} must be an inline list")
        if isinstance(meta.get("owners"), list) and not meta["owners"]:
            errors.append(f"{rel}: owners cannot be empty")
        if isinstance(meta.get("sources"), list):
            for source_id in meta["sources"]:
                if source_id not in source_ids:
                    errors.append(f"{rel}: unknown source id {source_id!r}")
        if _valid_date(meta.get("review_by")) and date.fromisoformat(meta["review_by"]) < today:
            warnings.append(f"{rel}: review_by {meta['review_by']} is overdue")
    return pages, errors, warnings


def validate_links(root: Path) -> list[str]:
    errors: list[str] = []
    for path in root.rglob("*.md"):
        if any(part in {".git", "__pycache__"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8")
        for raw in LINK_RE.findall(text):
            link = raw.strip().strip("<>")
            if " " in link and not link.startswith(("http://", "https://")):
                link = link.split(" ", 1)[0]
            if link.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target_text = unquote(link.split("#", 1)[0])
            if not target_text:
                continue
            target = (path.parent / target_text).resolve()
            if not target.exists():
                errors.append(f"{path.relative_to(root)}: broken link {raw!r}")
    return errors


def _static_prefix(pattern: str) -> str:
    normalized = pattern.replace("\\", "/").rstrip("/")
    wildcard_positions = [pos for token in ("*", "?", "[") if (pos := normalized.find(token)) >= 0]
    if wildcard_positions:
        normalized = normalized[: min(wildcard_positions)].rstrip("/")
    return normalized


def write_patterns_overlap(left: str, right: str) -> bool:
    a, b = _static_prefix(left), _static_prefix(right)
    if not a or not b:
        return True
    return a == b or a.startswith(b + "/") or b.startswith(a + "/")


def validate_workflow_data(
    data: dict[str, Any],
    label: str,
    skill_names: set[str],
    workflow_ids: set[str] | None = None,
    authority_names: set[str] | None = None,
) -> list[str]:
    errors: list[str] = []
    required_root = {"schema_version", "id", "intent", "owner", "budget", "nodes"}
    missing_root = required_root - set(data)
    if missing_root:
        return [f"{label}: missing root fields {sorted(missing_root)}"]
    if data.get("schema_version") != "1.0":
        errors.append(f"{label}: schema_version must be 1.0")
    budget = data.get("budget")
    if not isinstance(budget, dict):
        errors.append(f"{label}: budget must be an object")
        budget = {}
    max_concurrency = budget.get("max_concurrency")
    max_retries = budget.get("max_retries_per_node")
    if type(max_concurrency) is not int or max_concurrency < 1:
        errors.append(f"{label}: budget.max_concurrency must be an integer >= 1")
    if type(max_retries) is not int or max_retries < 0:
        errors.append(f"{label}: budget.max_retries_per_node must be an integer >= 0")
        max_retries = 0
    nodes = data.get("nodes")
    if not isinstance(nodes, list) or not nodes:
        return errors + [f"{label}: nodes must be a non-empty list"]
    required_node = {
        "id", "skill", "objective", "depends_on", "execution", "parallel_group",
        "read_set", "write_set", "output", "acceptance", "risk", "approval", "effects", "retry",
    }
    by_id: dict[str, dict[str, Any]] = {}
    for index, node in enumerate(nodes):
        node_label = f"{label}: nodes[{index}]"
        if not isinstance(node, dict):
            errors.append(f"{node_label}: must be an object")
            continue
        missing = required_node - set(node)
        if missing:
            errors.append(f"{node_label}: missing {sorted(missing)}")
            continue
        node_id = node["id"]
        if node_id in by_id:
            errors.append(f"{node_label}: duplicate node id {node_id}")
        by_id[node_id] = node
        if node["skill"] not in skill_names:
            errors.append(f"{node_label}: unknown skill {node['skill']!r}")
        if node["execution"] not in {"manager", "read-only", "shared-workspace", "isolated-worktree", "approval-gate"}:
            errors.append(f"{node_label}: invalid execution {node['execution']!r}")
        if node["approval"] not in {"none", "before-run", "before-side-effect", "human"}:
            errors.append(f"{node_label}: invalid approval {node['approval']!r}")
        if node["execution"] == "approval-gate" and node["approval"] == "none":
            errors.append(f"{node_label}: approval-gate requires a non-none approval")
        if node["risk"] not in {"low", "medium", "high"}:
            errors.append(f"{node_label}: invalid risk {node['risk']!r}")
        if node["risk"] == "high" and node["approval"] == "none":
            errors.append(f"{node_label}: high-risk node requires approval")
        authorities = node.get("required_authorities", [])
        if not isinstance(authorities, list) or not all(isinstance(item, str) and item for item in authorities):
            errors.append(f"{node_label}: required_authorities must be a list of non-empty strings")
            authorities = []
        if node["risk"] == "high" and node["approval"] == "human" and not authorities:
            errors.append(f"{node_label}: high-risk human approval requires required_authorities")
        if authority_names is not None:
            unknown_authorities = sorted(set(authorities) - authority_names)
            if unknown_authorities:
                errors.append(f"{node_label}: unknown approval authorities {unknown_authorities}")
        if not isinstance(node["objective"], str) or not node["objective"].strip():
            errors.append(f"{node_label}: objective must be a non-empty string")
        if not isinstance(node["output"], str) or not node["output"].strip():
            errors.append(f"{node_label}: output must be a non-empty string")
        if node["parallel_group"] is not None and not isinstance(node["parallel_group"], str):
            errors.append(f"{node_label}: parallel_group must be a string or null")
        for field in ("depends_on", "read_set", "write_set", "acceptance"):
            if not isinstance(node[field], list):
                errors.append(f"{node_label}: {field} must be a list")
        if isinstance(node["acceptance"], list) and not node["acceptance"]:
            errors.append(f"{node_label}: acceptance cannot be empty")
        if node["skill"] == "verify-delivery" and node["execution"] != "read-only":
            errors.append(f"{node_label}: verify-delivery must execute read-only")
        if node["skill"] in {"review-code", "review-doc"} and node["execution"] not in {"read-only", "manager"}:
            errors.append(f"{node_label}: {node['skill']} must execute read-only or as a read-only manager")
        if node["skill"] in {"verify-delivery", "review-code", "review-doc"}:
            if node["write_set"]:
                errors.append(f"{node_label}: {node['skill']} cannot declare a write_set")

        effects = node["effects"]
        effect_fields = {"resources", "side_effects", "idempotency_key", "exclusive_locks"}
        if not isinstance(effects, dict):
            errors.append(f"{node_label}: effects must be an object")
            effects = {}
        missing_effects = effect_fields - set(effects)
        if missing_effects:
            errors.append(f"{node_label}: effects missing {sorted(missing_effects)}")
        for field in ("resources", "side_effects", "exclusive_locks"):
            value = effects.get(field)
            if not isinstance(value, list) or not all(isinstance(item, str) and item for item in value):
                errors.append(f"{node_label}: effects.{field} must be a list of non-empty strings")
        idempotency_key = effects.get("idempotency_key")
        if idempotency_key is not None and (not isinstance(idempotency_key, str) or not idempotency_key):
            errors.append(f"{node_label}: effects.idempotency_key must be a non-empty string or null")

        retry = node["retry"]
        if not isinstance(retry, dict):
            errors.append(f"{node_label}: retry must be an object")
            retry = {}
        attempts = retry.get("max_attempts")
        if type(attempts) is not int or attempts < 1:
            errors.append(f"{node_label}: retry.max_attempts must be an integer >= 1")
        elif attempts - 1 > max_retries:
            errors.append(f"{node_label}: retry exceeds workflow max_retries_per_node")
        if type(retry.get("transient_only")) is not bool:
            errors.append(f"{node_label}: retry.transient_only must be boolean")
        side_effects = effects.get("side_effects", [])
        if isinstance(side_effects, list) and side_effects and not effects.get("resources"):
            errors.append(f"{node_label}: declared side effects require at least one resource")
        if isinstance(side_effects, list) and side_effects and isinstance(attempts, int) and attempts > 1 and not idempotency_key:
            errors.append(f"{node_label}: retried side effects require an idempotency_key")

        fanout = node.get("fanout")
        if fanout is not None:
            required_fanout = {
                "source", "inventory_kind", "items_field", "item_id_field", "dependency_field", "subworkflow",
                "completion", "max_concurrency", "instance_write_set_field", "required_parameter_fields",
                "write_scope_parameter", "allowed_locked_shared_write_set",
            }
            if not isinstance(fanout, dict):
                errors.append(f"{node_label}: fanout must be an object")
            else:
                missing_fanout = required_fanout - set(fanout)
                if missing_fanout:
                    errors.append(f"{node_label}: fanout missing {sorted(missing_fanout)}")
                for field in ("source", "inventory_kind", "items_field", "item_id_field", "dependency_field", "subworkflow", "instance_write_set_field", "write_scope_parameter"):
                    if not isinstance(fanout.get(field), str) or not fanout.get(field):
                        errors.append(f"{node_label}: fanout.{field} must be a non-empty string")
                for field in ("required_parameter_fields", "allowed_locked_shared_write_set"):
                    values = fanout.get(field)
                    if not isinstance(values, list) or not all(isinstance(value, str) and value for value in values):
                        errors.append(f"{node_label}: fanout.{field} must be a list of non-empty strings")
                if fanout.get("completion") not in {"all-accepted", "all-terminal"}:
                    errors.append(f"{node_label}: fanout.completion must be all-accepted or all-terminal")
                if type(fanout.get("max_concurrency")) is not int or fanout.get("max_concurrency") < 1:
                    errors.append(f"{node_label}: fanout.max_concurrency must be an integer >= 1")
                if workflow_ids is not None and fanout.get("subworkflow") not in workflow_ids:
                    errors.append(f"{node_label}: fanout references unknown subworkflow {fanout.get('subworkflow')!r}")

        join = node.get("join")
        if join is not None:
            if not isinstance(join, dict):
                errors.append(f"{node_label}: join must be an object")
            else:
                missing_join = {"fanout_node", "require", "allow_partial"} - set(join)
                if missing_join:
                    errors.append(f"{node_label}: join missing {sorted(missing_join)}")
                if not isinstance(join.get("fanout_node"), str) or not join.get("fanout_node"):
                    errors.append(f"{node_label}: join.fanout_node must be a non-empty string")
                if join.get("require") not in {"all-accepted", "all-terminal"}:
                    errors.append(f"{node_label}: join.require must be all-accepted or all-terminal")
                if type(join.get("allow_partial")) is not bool:
                    errors.append(f"{node_label}: join.allow_partial must be boolean")
                if join.get("require") == "all-accepted" and join.get("allow_partial") is True:
                    errors.append(f"{node_label}: all-accepted join cannot allow partial completion")
    for node_id, node in by_id.items():
        for dependency in node.get("depends_on", []):
            if dependency not in by_id:
                errors.append(f"{label}: node {node_id} has unknown dependency {dependency}")

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node_id: str) -> None:
        if node_id in visited:
            return
        if node_id in visiting:
            errors.append(f"{label}: dependency cycle reaches {node_id}")
            return
        visiting.add(node_id)
        for dependency in by_id.get(node_id, {}).get("depends_on", []):
            if dependency in by_id:
                visit(dependency)
        visiting.remove(node_id)
        visited.add(node_id)

    for node_id in by_id:
        visit(node_id)

    def has_dependency_path(start: str, target: str, seen: set[str] | None = None) -> bool:
        seen = set() if seen is None else seen
        if start in seen:
            return False
        seen.add(start)
        for dependency in by_id.get(start, {}).get("depends_on", []):
            if dependency == target or has_dependency_path(dependency, target, seen):
                return True
        return False

    for node_id, node in by_id.items():
        join = node.get("join")
        if not isinstance(join, dict):
            continue
        fanout_node = join.get("fanout_node")
        if fanout_node not in by_id:
            errors.append(f"{label}: node {node_id} joins unknown fanout node {fanout_node!r}")
            continue
        if not isinstance(by_id[fanout_node].get("fanout"), dict):
            errors.append(f"{label}: node {node_id} joins {fanout_node}, which has no fanout contract")
        if not has_dependency_path(node_id, fanout_node):
            errors.append(f"{label}: join node {node_id} must depend on fanout node {fanout_node}")
        fanout_completion = by_id[fanout_node].get("fanout", {}).get("completion")
        if join.get("require") != fanout_completion:
            errors.append(
                f"{label}: join node {node_id} requires {join.get('require')!r} but "
                f"fanout {fanout_node} completes as {fanout_completion!r}"
            )
        for verifier_id, verifier in by_id.items():
            if verifier.get("skill") != "verify-delivery":
                continue
            if has_dependency_path(verifier_id, fanout_node) and not has_dependency_path(verifier_id, node_id):
                errors.append(
                    f"{label}: verifier {verifier_id} is downstream of fanout {fanout_node} "
                    f"but bypasses integration join {node_id}"
                )

    completion = data.get("completion_contract")
    if completion is not None:
        completion_label = f"{label}: completion_contract"
        required_completion = {"terminal_node", "verdict_source_node", "verdict_field", "accepted_values"}
        if not isinstance(completion, dict):
            errors.append(f"{completion_label} must be an object")
        else:
            missing_completion = required_completion - set(completion)
            if missing_completion:
                errors.append(f"{completion_label} missing {sorted(missing_completion)}")
            terminal = completion.get("terminal_node")
            verdict_source = completion.get("verdict_source_node")
            for field, value in (("terminal_node", terminal), ("verdict_source_node", verdict_source), ("verdict_field", completion.get("verdict_field"))):
                if not isinstance(value, str) or not value:
                    errors.append(f"{completion_label}.{field} must be a non-empty string")
            accepted_values = completion.get("accepted_values")
            if not isinstance(accepted_values, list) or not accepted_values or not all(isinstance(value, str) and value for value in accepted_values):
                errors.append(f"{completion_label}.accepted_values must be a non-empty string list")
            if terminal not in by_id:
                errors.append(f"{completion_label}.terminal_node references unknown node {terminal!r}")
            if verdict_source not in by_id:
                errors.append(f"{completion_label}.verdict_source_node references unknown node {verdict_source!r}")
            if terminal in by_id and verdict_source in by_id and terminal != verdict_source and not has_dependency_path(terminal, verdict_source):
                errors.append(f"{completion_label}.terminal_node must depend on verdict_source_node")

    groups: dict[str, list[dict[str, Any]]] = {}
    for node in by_id.values():
        group = node.get("parallel_group")
        if group:
            groups.setdefault(group, []).append(node)
    for group, grouped_nodes in groups.items():
        for i, left in enumerate(grouped_nodes):
            for right in grouped_nodes[i + 1 :]:
                if has_dependency_path(left["id"], right["id"]) or has_dependency_path(right["id"], left["id"]):
                    errors.append(
                        f"{label}: parallel_group {group!r} contains dependency-related nodes "
                        f"{left['id']} and {right['id']}"
                    )
                overlaps = [
                    (a, b)
                    for a in left.get("write_set", [])
                    for b in right.get("write_set", [])
                    if write_patterns_overlap(a, b)
                ]
                if overlaps:
                    errors.append(
                        f"{label}: parallel_group {group!r} has write conflict between "
                        f"{left['id']} and {right['id']}: {overlaps}"
                    )
                left_effects = left.get("effects", {})
                right_effects = right.get("effects", {})
                shared_resources = set(left_effects.get("resources", [])) & set(right_effects.get("resources", []))
                if shared_resources and (left_effects.get("side_effects") or right_effects.get("side_effects")):
                    errors.append(
                        f"{label}: parallel_group {group!r} mutates shared external resources "
                        f"between {left['id']} and {right['id']}: {sorted(shared_resources)}"
                    )
                shared_locks = set(left_effects.get("exclusive_locks", [])) & set(right_effects.get("exclusive_locks", []))
                if shared_locks:
                    errors.append(
                        f"{label}: parallel_group {group!r} shares exclusive locks between "
                        f"{left['id']} and {right['id']}: {sorted(shared_locks)}"
                    )
    return errors


def validate_work_item_inventory(
    data: dict[str, Any],
    label: str,
    fanout: dict[str, Any],
    subworkflow: dict[str, Any] | None = None,
) -> list[str]:
    errors: list[str] = []
    if data.get("schema_version") != "1.0":
        errors.append(f"{label}: schema_version must be 1.0")
    if data.get("kind") != fanout.get("inventory_kind"):
        errors.append(f"{label}: kind must be {fanout.get('inventory_kind')!r}")
    items_field = fanout.get("items_field")
    id_field = fanout.get("item_id_field")
    dependency_field = fanout.get("dependency_field")
    write_field = fanout.get("instance_write_set_field")
    items = data.get(items_field)
    if not isinstance(items, list) or not items:
        return errors + [f"{label}: {items_field} must be a non-empty list"]

    by_id: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(items):
        item_label = f"{label}: {items_field}[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{item_label}: must be an object")
            continue
        item_id = item.get(id_field)
        if not isinstance(item_id, str) or not item_id:
            errors.append(f"{item_label}: {id_field} must be a non-empty string")
            continue
        if item_id in by_id:
            errors.append(f"{item_label}: duplicate item id {item_id}")
        by_id[item_id] = item
        dependencies = item.get(dependency_field)
        if not isinstance(dependencies, list) or not all(isinstance(value, str) and value for value in dependencies):
            errors.append(f"{item_label}: {dependency_field} must be a list of non-empty strings")
        writes = item.get(write_field)
        if not isinstance(writes, list) or not writes or not all(isinstance(value, str) and value for value in writes):
            errors.append(f"{item_label}: {write_field} must be a non-empty string list")
        parameters = item.get("parameters")
        if not isinstance(parameters, dict):
            errors.append(f"{item_label}: parameters must be an object")
        else:
            missing_parameters = sorted(set(fanout.get("required_parameter_fields", [])) - set(parameters))
            if missing_parameters:
                errors.append(f"{item_label}: missing required parameters {missing_parameters}")
            empty_parameters = sorted(
                key for key, value in parameters.items()
                if not isinstance(value, str) or not value
            )
            if empty_parameters:
                errors.append(f"{item_label}: parameters must have non-empty string values: {empty_parameters}")

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(item_id: str) -> None:
        if item_id in visited:
            return
        if item_id in visiting:
            errors.append(f"{label}: dependency cycle reaches {item_id}")
            return
        visiting.add(item_id)
        dependencies = by_id.get(item_id, {}).get(dependency_field, [])
        if isinstance(dependencies, list):
            for dependency in dependencies:
                if dependency not in by_id:
                    errors.append(f"{label}: item {item_id} has unknown dependency {dependency}")
                else:
                    visit(dependency)
        visiting.remove(item_id)
        visited.add(item_id)

    for item_id in by_id:
        visit(item_id)

    def has_path(start: str, target: str, seen: set[str] | None = None) -> bool:
        seen = set() if seen is None else seen
        if start in seen:
            return False
        seen.add(start)
        dependencies = by_id.get(start, {}).get(dependency_field, [])
        if not isinstance(dependencies, list):
            return False
        return any(dependency == target or has_path(dependency, target, seen) for dependency in dependencies if dependency in by_id)

    item_ids = list(by_id)
    for index, left_id in enumerate(item_ids):
        for right_id in item_ids[index + 1:]:
            if has_path(left_id, right_id) or has_path(right_id, left_id):
                continue
            left_writes = by_id[left_id].get(write_field, [])
            right_writes = by_id[right_id].get(write_field, [])
            overlaps = [
                (left, right)
                for left in left_writes if isinstance(left, str)
                for right in right_writes if isinstance(right, str)
                if write_patterns_overlap(left, right)
            ]
            if overlaps:
                errors.append(
                    f"{label}: dependency-independent items {left_id} and {right_id} "
                    f"have overlapping {write_field}: {overlaps}"
                )

    if isinstance(subworkflow, dict):
        write_scope_token = f"<{fanout.get('write_scope_parameter')}>"
        allowed_locked = fanout.get("allowed_locked_shared_write_set", [])

        def resolve(pattern: str, parameters: dict[str, Any]) -> str:
            resolved = pattern
            for key, value in parameters.items():
                if isinstance(value, str):
                    resolved = resolved.replace(f"<{key}>", value)
            return resolved

        def covers(container: str, candidate: str) -> bool:
            container_prefix = _static_prefix(container)
            candidate_prefix = _static_prefix(candidate)
            return bool(container_prefix) and (
                candidate_prefix == container_prefix or candidate_prefix.startswith(container_prefix + "/")
            )

        for node in subworkflow.get("nodes", []):
            if not isinstance(node, dict):
                continue
            locks = node.get("effects", {}).get("exclusive_locks", [])
            for declared_write in node.get("write_set", []):
                if not isinstance(declared_write, str):
                    continue
                if write_scope_token in declared_write:
                    continue
                for item_id, item in by_id.items():
                    parameters = item.get("parameters", {})
                    if not isinstance(parameters, dict):
                        continue
                    resolved_write = resolve(declared_write, parameters)
                    instance_writes = [
                        resolve(pattern, parameters)
                        for pattern in item.get(write_field, [])
                        if isinstance(pattern, str)
                    ]
                    if any(covers(pattern, resolved_write) for pattern in instance_writes):
                        continue
                    allowed_by_lock = bool(locks) and any(
                        covers(resolve(pattern, parameters), resolved_write)
                        for pattern in allowed_locked if isinstance(pattern, str)
                    )
                    if allowed_by_lock:
                        continue
                    errors.append(
                        f"{label}: subworkflow {fanout.get('subworkflow')} node {node.get('id')} "
                        f"writes {resolved_write!r} outside item {item_id} {write_field} and locked shared scopes"
                    )
    return errors


def compile_fanout_plan(data: dict[str, Any], fanout: dict[str, Any], completion_contract: dict[str, Any]) -> dict[str, Any]:
    items = data[fanout["items_field"]]
    id_field = fanout["item_id_field"]
    dependency_field = fanout["dependency_field"]
    write_field = fanout["instance_write_set_field"]
    pending = {item[id_field]: item for item in items}
    completed: set[str] = set()
    waves: list[list[dict[str, Any]]] = []
    while pending:
        ready = sorted(
            (item_id for item_id, item in pending.items() if set(item[dependency_field]) <= completed),
        )
        if not ready:
            raise ValueError("inventory contains a dependency cycle or unresolved dependency")
        for offset in range(0, len(ready), fanout["max_concurrency"]):
            wave_ids = ready[offset: offset + fanout["max_concurrency"]]
            waves.append([
                {
                    "instance_id": item_id,
                    "subworkflow": fanout["subworkflow"],
                    "depends_on": pending[item_id][dependency_field],
                    "write_set": pending[item_id][write_field],
                    "parameters": pending[item_id]["parameters"],
                    "acceptance": completion_contract,
                }
                for item_id in wave_ids
            ])
            completed.update(wave_ids)
            for item_id in wave_ids:
                pending.pop(item_id)
    return {
        "schema_version": "1.0",
        "subworkflow": fanout["subworkflow"],
        "completion": fanout["completion"],
        "waves": waves,
    }


def validate_workflows(root: Path, skill_names: set[str]) -> list[str]:
    errors: list[str] = []
    loaded: list[tuple[Path, dict[str, Any]]] = []
    workflow_ids: set[str] = set()
    workflow_by_id: dict[str, dict[str, Any]] = {}
    authority_names: set[str] = set()
    try:
        policy = json.loads((root / "orchestration" / "policy.json").read_text(encoding="utf-8"))
        authority_policy = policy.get("approval_authorities", {})
        allowed = authority_policy.get("allowed", [])
        forbidden = set(authority_policy.get("forbidden_generic", []))
        if not isinstance(allowed, list) or not allowed or not all(isinstance(value, str) and value for value in allowed):
            errors.append("orchestration/policy.json: approval_authorities.allowed must be a non-empty string list")
        else:
            authority_names = set(allowed)
            generic = sorted(authority_names & forbidden)
            if generic:
                errors.append(f"orchestration/policy.json: generic authorities cannot be allowed: {generic}")
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"orchestration/policy.json: cannot load approval authority policy: {exc}")
    for path in sorted((root / "orchestration" / "workflows").glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{path.relative_to(root)}: invalid JSON: {exc}")
            continue
        loaded.append((path, data))
        workflow_id = data.get("id")
        if isinstance(workflow_id, str):
            if workflow_id in workflow_ids:
                errors.append(f"{path.relative_to(root)}: duplicate workflow id {workflow_id}")
            workflow_ids.add(workflow_id)
            workflow_by_id[workflow_id] = data
    for path, data in loaded:
        errors.extend(validate_workflow_data(data, str(path.relative_to(root)), skill_names, workflow_ids, authority_names))

    fanout_by_kind: dict[str, dict[str, Any]] = {}
    for path, data in loaded:
        for node in data.get("nodes", []):
            fanout = node.get("fanout") if isinstance(node, dict) else None
            if not isinstance(fanout, dict):
                continue
            subworkflow = workflow_by_id.get(fanout.get("subworkflow"), {})
            if fanout.get("completion") == "all-accepted" and not isinstance(subworkflow.get("completion_contract"), dict):
                errors.append(
                    f"{path.relative_to(root)}: fanout node {node.get('id')} requires all-accepted "
                    f"but subworkflow {fanout.get('subworkflow')!r} has no completion_contract"
                )
            source = fanout.get("source", "")
            if not isinstance(source, str) or not source.endswith(".json"):
                errors.append(f"{path.relative_to(root)}: fanout node {node.get('id')} source must be a JSON inventory")
            if "story-inventory" in source:
                fanout_by_kind["story-inventory"] = fanout
            elif "epic-map" in source:
                fanout_by_kind["epic-map"] = fanout

    inventory_names = {"story-inventory.json", "story-inventory.template.json", "epic-map.json", "epic-map.template.json"}
    for path in root.rglob("*.json"):
        if path.name not in inventory_names:
            continue
        try:
            inventory = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        kind = inventory.get("kind")
        fanout = fanout_by_kind.get(kind)
        if fanout is None:
            errors.append(f"{path.relative_to(root)}: no fanout contract registered for inventory kind {kind!r}")
            continue
        subworkflow = workflow_by_id.get(fanout.get("subworkflow"))
        errors.extend(validate_work_item_inventory(inventory, str(path.relative_to(root)), fanout, subworkflow))
    return errors


def validate_skills(root: Path) -> tuple[set[str], list[str]]:
    errors: list[str] = []
    names: set[str] = set()
    skills_dir = root / ".agents" / "skills"
    for skill_dir in sorted(path for path in skills_dir.iterdir() if path.is_dir()):
        manifest = skill_dir / "SKILL.md"
        if not manifest.exists():
            errors.append(f"{skill_dir.relative_to(root)}: missing SKILL.md")
            continue
        text = manifest.read_text(encoding="utf-8")
        meta, _ = parse_frontmatter(text)
        name = meta.get("name")
        description = meta.get("description")
        if name != skill_dir.name:
            errors.append(f"{manifest.relative_to(root)}: name must match directory")
        elif name in names:
            errors.append(f"{manifest.relative_to(root)}: duplicate skill name")
        else:
            names.add(name)
        if not isinstance(description, str) or len(description) < 30:
            errors.append(f"{manifest.relative_to(root)}: description is missing or too vague")
        if "TODO" in text:
            errors.append(f"{manifest.relative_to(root)}: unfinished TODO scaffold")
        ui = skill_dir / "agents" / "openai.yaml"
        if not ui.exists():
            errors.append(f"{skill_dir.relative_to(root)}: missing agents/openai.yaml")
        else:
            ui_text = ui.read_text(encoding="utf-8")
            if f"${skill_dir.name}" not in ui_text:
                errors.append(f"{ui.relative_to(root)}: default_prompt must mention ${skill_dir.name}")
    return names, errors


def validate_json_and_jsonl(root: Path) -> list[str]:
    errors: list[str] = []
    excluded = {root / "kb" / "sources" / "registry.json"}
    for path in root.rglob("*.json"):
        if path in excluded or any(part in {".git", "__pycache__"} for part in path.parts):
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{path.relative_to(root)}: invalid JSON: {exc}")
    for path in root.rglob("*.jsonl"):
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if not line.strip():
                continue
            try:
                json.loads(line)
            except json.JSONDecodeError as exc:
                errors.append(f"{path.relative_to(root)}:{line_number}: invalid JSONL: {exc}")
    return errors


def validate_repository(root: Path = ROOT) -> tuple[list[str], list[str], list[Page]]:
    source_ids, source_errors = validate_source_registry(root)
    pages, page_errors, warnings = validate_pages(root, source_ids)
    skill_names, skill_errors = validate_skills(root)
    errors = source_errors + page_errors + skill_errors
    errors += validate_links(root)
    errors += validate_json_and_jsonl(root)
    errors += validate_workflows(root, skill_names)
    return sorted(set(errors)), sorted(set(warnings)), pages


def _tokenize(text: str) -> list[str]:
    return [token.casefold() for token in TOKEN_RE.findall(text)]


def rank_pages(query: str, pages: Iterable[Page], limit: int = 10) -> list[tuple[float, Page]]:
    docs = []
    for page in pages:
        meta = page.metadata
        boosted = " ".join([
            str(meta.get("title", "")) + " " + str(meta.get("title", "")),
            str(meta.get("summary", "")) + " " + str(meta.get("summary", "")),
            str(meta.get("id", "")),
            " ".join(meta.get("tags", []) if isinstance(meta.get("tags"), list) else []),
            page.body,
        ])
        docs.append((page, _tokenize(boosted)))
    query_terms = _tokenize(query)
    if not query_terms or not docs:
        return []
    document_frequency = Counter()
    for _, tokens in docs:
        document_frequency.update(set(tokens))
    average_length = sum(len(tokens) for _, tokens in docs) / len(docs)
    k1, b = 1.5, 0.75
    ranked = []
    for page, tokens in docs:
        frequencies = Counter(tokens)
        score = 0.0
        for term in query_terms:
            frequency = frequencies[term]
            if not frequency:
                continue
            df = document_frequency[term]
            idf = math.log(1 + (len(docs) - df + 0.5) / (df + 0.5))
            denominator = frequency + k1 * (1 - b + b * len(tokens) / max(average_length, 1))
            score += idf * frequency * (k1 + 1) / denominator
        if score > 0:
            ranked.append((score, page))
    ranked.sort(key=lambda item: (-item[0], item[1].metadata.get("id", "")))
    return ranked[:limit]


def build_index(root: Path, pages: list[Page]) -> tuple[Path, Path]:
    entries = []
    for page in sorted(pages, key=lambda item: item.metadata.get("id", "")):
        meta = page.metadata
        entries.append({
            "id": meta.get("id"),
            "title": meta.get("title"),
            "summary": meta.get("summary"),
            "kind": meta.get("kind"),
            "scope": meta.get("scope"),
            "status": meta.get("status"),
            "owners": meta.get("owners"),
            "tags": meta.get("tags"),
            "last_verified": meta.get("last_verified"),
            "review_by": meta.get("review_by"),
            "sensitivity": meta.get("sensitivity"),
            "path": page.path.relative_to(root).as_posix(),
        })
    output_dir = root / "kb" / "indexes"
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "catalog.json"
    markdown_path = output_dir / "catalog.md"
    json_path.write_text(
        json.dumps({"schema_version": "1.0", "generated_from": "canonical-markdown", "pages": entries}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    lines = [
        "# Generated knowledge catalog",
        "",
        "Do not edit. Rebuild with `python scripts/kb.py build-index`.",
        "",
        "| ID | Kind | Scope | Status | Title | Path |",
        "|---|---|---|---|---|---|",
    ]
    for entry in entries:
        lines.append(
            f"| `{entry['id']}` | {entry['kind']} | {entry['scope']} | {entry['status']} | "
            f"{entry['title']} | [{entry['path']}](../../{entry['path']}) |"
        )
    markdown_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path, markdown_path


def command_validate(args: argparse.Namespace) -> int:
    errors, warnings, pages = validate_repository(args.root)
    result = {"ok": not errors, "pages": len(pages), "errors": errors, "warnings": warnings}
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Validated {len(pages)} canonical pages: {len(errors)} error(s), {len(warnings)} warning(s).")
        for warning in warnings:
            print(f"WARN  {warning}")
        for error in errors:
            print(f"ERROR {error}")
    return 1 if errors else 0


def command_build_index(args: argparse.Namespace) -> int:
    errors, warnings, pages = validate_repository(args.root)
    if errors:
        for error in errors:
            print(f"ERROR {error}", file=sys.stderr)
        print("Index not built because validation failed.", file=sys.stderr)
        return 1
    json_path, markdown_path = build_index(args.root, pages)
    print(f"Built {json_path.relative_to(args.root)} and {markdown_path.relative_to(args.root)} from {len(pages)} pages.")
    if warnings:
        print(f"Completed with {len(warnings)} freshness warning(s).")
    return 0


def command_search(args: argparse.Namespace) -> int:
    pages = load_pages(args.root)
    ranked = rank_pages(args.query, pages, args.limit)
    if args.json:
        print(json.dumps([
            {
                "score": round(score, 6),
                "id": page.metadata.get("id"),
                "title": page.metadata.get("title"),
                "summary": page.metadata.get("summary"),
                "path": page.path.relative_to(args.root).as_posix(),
            }
            for score, page in ranked
        ], indent=2, ensure_ascii=False))
    else:
        for score, page in ranked:
            print(f"{score:7.3f}  {page.metadata.get('id')}  {page.path.relative_to(args.root)}")
            print(f"         {page.metadata.get('summary')}")
    return 0


def command_compile_fanout(args: argparse.Namespace) -> int:
    workflows: dict[str, dict[str, Any]] = {}
    for path in sorted((args.root / "orchestration" / "workflows").glob("*.json")):
        try:
            workflow = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            print(f"ERROR {path.relative_to(args.root)}: invalid JSON: {exc}", file=sys.stderr)
            return 1
        if isinstance(workflow.get("id"), str):
            workflows[workflow["id"]] = workflow
    workflow = workflows.get(args.workflow)
    if workflow is None:
        print(f"ERROR unknown workflow {args.workflow!r}", file=sys.stderr)
        return 1
    node = next((item for item in workflow.get("nodes", []) if item.get("id") == args.node), None)
    if node is None or not isinstance(node.get("fanout"), dict):
        print(f"ERROR node {args.node!r} is missing or has no fanout contract", file=sys.stderr)
        return 1
    fanout = node["fanout"]
    subworkflow = workflows.get(fanout.get("subworkflow"), {})
    completion = subworkflow.get("completion_contract")
    if not isinstance(completion, dict):
        print(f"ERROR subworkflow {fanout.get('subworkflow')!r} has no completion_contract", file=sys.stderr)
        return 1
    try:
        inventory = json.loads(args.inventory.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR cannot load inventory {args.inventory}: {exc}", file=sys.stderr)
        return 1
    errors = validate_work_item_inventory(inventory, str(args.inventory), fanout, subworkflow)
    if errors:
        for error in errors:
            print(f"ERROR {error}", file=sys.stderr)
        return 1
    plan = compile_fanout_plan(inventory, fanout, completion)
    print(json.dumps(plan, indent=2, ensure_ascii=False))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT, help="repository root")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate", help="validate KB, skills, links, and workflows")
    validate_parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    validate_parser.set_defaults(func=command_validate)

    index_parser = subparsers.add_parser("build-index", help="build disposable catalog artifacts")
    index_parser.set_defaults(func=command_build_index)

    search_parser = subparsers.add_parser("search", help="search canonical pages with an offline lexical baseline")
    search_parser.add_argument("query")
    search_parser.add_argument("--limit", type=int, default=10)
    search_parser.add_argument("--json", action="store_true")
    search_parser.set_defaults(func=command_search)

    compile_parser = subparsers.add_parser("compile-fanout", help="validate an inventory and compile deterministic subworkflow waves")
    compile_parser.add_argument("--workflow", required=True, help="workflow id containing the fanout node")
    compile_parser.add_argument("--node", required=True, help="fanout node id")
    compile_parser.add_argument("--inventory", required=True, type=Path, help="materialized JSON work-item inventory")
    compile_parser.set_defaults(func=command_compile_fanout)
    return parser


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    parser = build_parser()
    args = parser.parse_args()
    args.root = args.root.resolve()
    if hasattr(args, "inventory"):
        args.inventory = args.inventory.resolve()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
