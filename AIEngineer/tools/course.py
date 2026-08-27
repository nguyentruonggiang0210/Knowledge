"""CLI quản lý giáo trình, chỉ dùng Python standard library."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "course_manifest.json"


def load_manifest(path: Path = MANIFEST_PATH) -> dict[str, Any]:
    """Đọc và kiểm tra phần tối thiểu của curriculum manifest."""
    data = json.loads(path.read_text(encoding="utf-8"))
    lessons = data.get("lessons")
    if not isinstance(lessons, list) or not lessons:
        raise ValueError("Manifest phải có danh sách lessons không rỗng")
    ids = [item["id"] for item in lessons]
    if len(ids) != len(set(ids)):
        raise ValueError("Lesson id bị trùng")
    known = set(ids)
    for item in lessons:
        unknown = set(item.get("prerequisites", [])) - known
        if unknown:
            raise ValueError(f"{item['id']} tham chiếu prerequisite lạ: {unknown}")
    return data


def lesson_dir(item: dict[str, Any]) -> Path:
    """Trả về đường dẫn chuẩn của một lesson."""
    return ROOT / "Lessions" / f"{item['id']}-{item['slug']}"


def resolve_lesson(query: str, manifest: dict[str, Any]) -> dict[str, Any]:
    """Tìm lesson bằng id chính xác hoặc một phần slug duy nhất."""
    exact = [x for x in manifest["lessons"] if x["id"] == query]
    if exact:
        return exact[0]
    matches = [x for x in manifest["lessons"] if query.lower() in x["slug"].lower()]
    if len(matches) != 1:
        raise ValueError(f"Cần một lesson duy nhất, tìm thấy {len(matches)} cho {query!r}")
    return matches[0]


def doctor(manifest: dict[str, Any]) -> int:
    """Kiểm tra Python, cấu trúc folder và file bắt buộc."""
    problems: list[str] = []
    if sys.version_info < (3, 11):
        problems.append("Cần Python >= 3.11")
    for item in manifest["lessons"]:
        folder = lesson_dir(item)
        for relative in ("README.md", "src/demo.py"):
            target = folder / relative
            if not target.is_file():
                problems.append(f"Thiếu {target.relative_to(ROOT)}")
    if problems:
        print("COURSE DOCTOR: FAIL")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print(f"COURSE DOCTOR: OK — {len(manifest['lessons'])} lessons, Python {sys.version.split()[0]}")
    return 0


def list_lessons(manifest: dict[str, Any], phase: str | None) -> int:
    """In curriculum theo phase."""
    for item in manifest["lessons"]:
        if phase and item["phase"] != phase:
            continue
        dependencies = ",".join(item["prerequisites"]) or "—"
        print(f"{item['id']}  {item['slug']:<48} phase={item['phase']:<22} needs={dependencies}")
    return 0


def run_demo(item: dict[str, Any], *, quiet: bool = False) -> int:
    """Chạy demo của một lesson trong chính thư mục lesson đó."""
    script = lesson_dir(item) / "src" / "demo.py"
    if not script.is_file():
        print(f"Thiếu demo: {script.relative_to(ROOT)}", file=sys.stderr)
        return 1
    if not quiet:
        print(f"\n=== Lesson {item['id']}: {item['slug']} ===")
    environment = os.environ.copy()
    environment["PYTHONIOENCODING"] = "utf-8"
    result = subprocess.run([sys.executable, str(script)], cwd=script.parent, check=False, env=environment)
    return result.returncode


def smoke(manifest: dict[str, Any], phase: str | None) -> int:
    """Chạy tuần tự mọi demo; dừng ở demo đầu tiên lỗi."""
    selected = [x for x in manifest["lessons"] if phase is None or x["phase"] == phase]
    for index, item in enumerate(selected, start=1):
        print(f"[{index:02}/{len(selected):02}] {item['id']}-{item['slug']}", flush=True)
        code = run_demo(item, quiet=True)
        if code:
            print(f"SMOKE: FAIL tại lesson {item['id']}", file=sys.stderr)
            return code
    print(f"SMOKE: OK — {len(selected)} demos")
    return 0


def build_parser() -> argparse.ArgumentParser:
    """Tạo command-line parser."""
    parser = argparse.ArgumentParser(description="AI Engineer course helper")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("doctor", help="kiểm tra cấu trúc và môi trường")
    listing = sub.add_parser("list", help="liệt kê lessons")
    listing.add_argument("--phase")
    running = sub.add_parser("run", help="chạy một demo theo id hoặc slug")
    running.add_argument("lesson")
    smoking = sub.add_parser("smoke", help="chạy tất cả demo")
    smoking.add_argument("--phase")
    return parser


def main(argv: list[str] | None = None) -> int:
    """Entry point."""
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = build_parser().parse_args(argv)
    manifest = load_manifest()
    if args.command == "doctor":
        return doctor(manifest)
    if args.command == "list":
        return list_lessons(manifest, args.phase)
    if args.command == "run":
        return run_demo(resolve_lesson(args.lesson, manifest))
    if args.command == "smoke":
        return smoke(manifest, args.phase)
    raise AssertionError("unreachable")


if __name__ == "__main__":
    raise SystemExit(main())
