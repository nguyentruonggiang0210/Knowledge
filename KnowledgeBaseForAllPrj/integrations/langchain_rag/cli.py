"""Command-line smoke interface for the optional RAG runtime."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import date
from pathlib import Path

from .models import AccessContext
from .runtime import KBRagRuntime, RuntimeConfig


ROOT = Path(__file__).resolve().parents[2]


def _csv(value: str) -> tuple[str, ...]:
    return tuple(item.strip() for item in value.split(",") if item.strip())


def command_check(args: argparse.Namespace) -> int:
    runtime = KBRagRuntime.from_repository(args.root)
    result = {
        "root": str(runtime.root),
        "chunks": len(runtime.chunks),
        "optional_dependencies": {
            name: bool(importlib.util.find_spec(name))
            for name in ("langchain", "langchain_core", "langgraph")
        },
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


def command_search(args: argparse.Namespace) -> int:
    config = RuntimeConfig(final_k=args.limit, candidate_k=max(args.limit, args.candidate_k))
    runtime = KBRagRuntime.from_repository(args.root, config=config)
    access = AccessContext(
        scopes=_csv(args.scopes),
        sensitivities=_csv(args.sensitivities),
        statuses=_csv(args.statuses),
        as_of=date.fromisoformat(args.as_of) if args.as_of else date.today(),
        source_allowlist=_csv(args.sources),
    )
    hits = runtime.search(args.query, access)
    if args.json:
        print(json.dumps([hit.to_dict() for hit in hits], indent=2, ensure_ascii=False))
    else:
        for hit in hits:
            meta = hit.chunk.metadata
            print(
                f"{hit.score:8.5f}  {hit.chunk.page_id}  "
                f"{meta.get('path')}#{meta.get('heading')}  [{','.join(hit.channels)}]"
            )
            preview = " ".join(hit.chunk.content.split())[:240]
            print(f"           {preview}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT, help="repository root")
    subparsers = parser.add_subparsers(dest="command", required=True)

    check = subparsers.add_parser("check", help="load canonical chunks and report optional dependencies")
    check.set_defaults(func=command_check)

    search = subparsers.add_parser("search", help="run the authorized lexical/RRF baseline")
    search.add_argument("query")
    search.add_argument("--scopes", default="shared")
    search.add_argument("--sensitivities", default="public,internal")
    search.add_argument("--statuses", default="approved")
    search.add_argument("--sources", default="", help="optional comma-separated source allowlist")
    search.add_argument("--as-of", default="", help="knowledge validity date; defaults to today")
    search.add_argument("--candidate-k", type=int, default=30)
    search.add_argument("--limit", type=int, default=8)
    search.add_argument("--json", action="store_true")
    search.set_defaults(func=command_search)
    return parser


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    parser = build_parser()
    args = parser.parse_args()
    args.root = args.root.resolve()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
