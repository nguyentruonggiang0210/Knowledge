#!/usr/bin/env python3
"""Build and validate the local KB learning site.

The hand-authored lessons explain the architecture. The technique atlas is
generated from TECHNIQUES.md so its maturity and source locations cannot drift.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "kb_lessions"
TECHNIQUES = ROOT / "TECHNIQUES.md"
EXPECTED_HTML = {
    "index.html",
    "01-foundations.html",
    "02-retrieval-rag.html",
    "03-agent-orchestration.html",
    "04-bmad-delivery.html",
    "05-governance-evals.html",
    "06-end-to-end.html",
    "07-hands-on-labs.html",
    "techniques.html",
}
CATEGORY_SLUGS = {
    "Knowledge architecture": "knowledge",
    "Retrieval và grounding": "retrieval",
    "Multi-agent và skills": "agents",
    "Evaluation và self-improvement": "evaluation",
    "Security, governance và reliability": "security",
}
FLOW_TEMPLATES = {
    "knowledge": "Nguồn → chuẩn hóa/provenance → {name} → canonical hoặc derived artifact → validator",
    "retrieval": "Query → ACL/time filter → {name} → evidence có locator → answer hoặc abstain",
    "agents": "Intent → task contract/DAG → {name} → integrate tuần tự → independent verification",
    "evaluation": "Trace/output → dataset/rubric → {name} → release decision → promote hoặc rollback",
    "security": "Input/retrieved data → trust boundary → {name} → allow/deny/escalate → audit evidence",
}
FLOW_OVERRIDES = {
    "Canonical Markdown": "Owner-approved claim → Markdown + frontmatter → validate → index dẫn xuất → retrieve có citation",
    "Stable semantic IDs": "Tạo ID theo nghĩa → giữ ID khi rename/move → relations/index tham chiếu ID → validator chặn trùng",
    "Bitemporal knowledge": "Fact có hiệu lực (valid time) → KB ghi nhận (recorded time) → query chọn as-of → trả đúng phiên bản",
    "Human-reviewed memory promotion": "Trace/lesson → promotion queue → provenance/conflict/security check → owner approve → canonical",
    "Hybrid sparse+dense": "Query → BM25 và vector search song song → post-filter ACL → RRF → rerank → evidence pack",
    "Reciprocal Rank Fusion": "Hai ranking độc lập → đổi rank thành 1/(k+rank) → cộng theo chunk ID → sort → top evidence",
    "GraphRAG local/global": "Query multi-hop/global → entity/relation graph → neighborhood/community expansion → source leaves → answer",
    "2-Step RAG execution graph": "Trusted access context → retrieve → evidence envelope → model answer → verifier → pass/abstain",
    "Manager + agents-as-tools": "Manager giữ intent → gọi specialist có scope hẹp → nhận structured result → integrate → trả lời cuối",
    "Dependency DAG": "Tách task thành nodes → khai báo depends_on/read/write → topo waves → execute → join",
    "Machine-readable hierarchical fan-out/join": "Inventory JSON → validate dependency/write scope → fan-out subworkflows → all-accepted join → integrate",
    "Read/write-set conflict detection": "Hai node ready → so static write prefixes/resources/locks → conflict thì tuần tự, không conflict thì song song",
    "BMAD-compatible right-sized planning": "Classify Direct/Quick/Epic/Project → tạo artifact tối thiểu → readiness → build → verify/retro",
    "Implementation readiness gate": "Artifact versions → coverage/dependency/risk checks → PASS/CONCERNS/FAIL → owner disposition",
    "Golden queries": "Câu hỏi thật + relevant pages/claims → chạy candidate → score → regression gate",
    "Deterministic graders first": "Schema/link/test/command checks → chỉ phần nuance mới dùng LLM judge → human review khi low confidence",
    "Evaluation-driven promotion": "Candidate technique → golden + holdout + red-team → compare baseline → approve → canary → promote/rollback",
    "Permission-aware retrieval": "Trusted caller cấp scope → pre-filter candidates → vector/lexical search → post-filter → evidence",
    "Retrieved-content/data boundary": "Retrieved text → mark untrusted data → escape envelope → model không nhận instruction authority → cite/abstain",
    "Prompt-injection red teaming": "Malicious document/query → retrieval path → guardrails/ACL/tool checks → detect leak/bypass → regression case",
}


def parse_techniques() -> list[dict[str, str]]:
    category = ""
    result: list[dict[str, str]] = []
    for line in TECHNIQUES.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            heading = line[3:].strip()
            category = CATEGORY_SLUGS.get(heading, "")
            continue
        if not category or not line.startswith("| "):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) != 5 or cells[0] in {"Kỹ thuật", "---"}:
            continue
        name, maturity, use_case, source, tradeoff = cells
        if not maturity.startswith(("Implemented", "Blueprint", "Experimental")):
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-")
        flow = FLOW_OVERRIDES.get(name, FLOW_TEMPLATES[category].format(name=name))
        result.append(
            {
                "id": slug,
                "name": name.replace("`", ""),
                "category": category,
                "maturity": maturity,
                "use_case": use_case.replace("`", ""),
                "source": source.replace("`", ""),
                "tradeoff": tradeoff.replace("`", ""),
                "flow": flow.replace("`", ""),
            }
        )
    return result


def write_atlas_data(techniques: list[dict[str, str]]) -> Path:
    target = LESSONS / "assets" / "techniques-data.js"
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(techniques, ensure_ascii=False, indent=2)
    target.write_text(
        f"window.KB_TECHNIQUES = {payload};\n"
        f"window.KB_LESSON_BUILD = {json.dumps(date.today().isoformat())};\n",
        encoding="utf-8",
    )
    return target


def validate_site(technique_count: int) -> list[str]:
    errors: list[str] = []
    actual = {path.name for path in LESSONS.glob("*.html")}
    missing = sorted(EXPECTED_HTML - actual)
    if missing:
        errors.append(f"missing lesson pages: {missing}")
    if technique_count < 100:
        errors.append(f"expected at least 100 techniques, found {technique_count}")
    link_re = re.compile(r"(?:href|src)=\"([^\"]+)\"")
    for html_path in LESSONS.glob("*.html"):
        text = html_path.read_text(encoding="utf-8")
        if "<title>" not in text or 'lang="vi"' not in text:
            errors.append(f"{html_path.name}: missing Vietnamese document contract")
        for raw in link_re.findall(text):
            if raw.startswith(("http://", "https://", "mailto:", "#", "data:")):
                continue
            parsed = urlparse(raw)
            relative = unquote(parsed.path)
            if relative and not (html_path.parent / relative).resolve().exists():
                errors.append(f"{html_path.name}: broken local reference {raw!r}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="validate without rewriting generated data")
    args = parser.parse_args()
    techniques = parse_techniques()
    if not args.check:
        generated = write_atlas_data(techniques)
        print(f"Generated {generated.relative_to(ROOT)} with {len(techniques)} techniques.")
    errors = validate_site(len(techniques))
    if errors:
        for error in errors:
            print(f"ERROR {error}")
        return 1
    print(f"Validated {len(EXPECTED_HTML)} lesson pages and {len(techniques)} techniques.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
