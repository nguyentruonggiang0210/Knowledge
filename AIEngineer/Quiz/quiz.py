"""Interactive quiz runner cho AI Engineer course."""

from __future__ import annotations

import argparse
import json
import random
import sys
from collections import Counter
from pathlib import Path
from typing import Any


BANK = Path(__file__).with_name("questions.json")
LETTERS = "ABCD"


def load_questions(path: Path = BANK) -> list[dict[str, Any]]:
    """Đọc và validate question bank để lỗi authoring không làm sai điểm."""
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list) or not data:
        raise ValueError("Question bank phải là list không rỗng")
    ids: set[str] = set()
    for item in data:
        required = {"id", "phase", "lesson", "question", "choices", "answer", "explanation"}
        missing = required - set(item)
        if missing:
            raise ValueError(f"{item.get('id', '?')} thiếu {sorted(missing)}")
        if item["id"] in ids:
            raise ValueError(f"Trùng id {item['id']}")
        ids.add(item["id"])
        if len(item["choices"]) != 4 or not 0 <= item["answer"] < 4:
            raise ValueError(f"{item['id']} phải có 4 choices và answer 0..3")
    return data


def select_questions(bank: list[dict[str, Any]], phase: str | None, limit: int | None, shuffle: bool, seed: int) -> list[dict[str, Any]]:
    """Lọc và xáo trộn reproducibly."""
    selected = [item for item in bank if phase is None or item["phase"] == phase]
    if not selected:
        raise ValueError(f"Không có câu cho phase {phase!r}")
    if shuffle:
        random.Random(seed).shuffle(selected)
    return selected[:limit] if limit else selected


def ask(item: dict[str, Any]) -> bool:
    """Hỏi một câu, chỉ tiết lộ giải thích sau khi nhận đáp án hợp lệ."""
    print(f"\n[{item['id']}] Lesson {item['lesson']}: {item['question']}")
    for letter, choice in zip(LETTERS, item["choices"]):
        print(f"  {letter}. {choice}")
    while True:
        raw = input("Đáp án (A-D, Q để dừng): ").strip().upper()
        if raw == "Q":
            raise KeyboardInterrupt
        if raw in LETTERS:
            break
        print("Hãy nhập A, B, C hoặc D.")
    correct = LETTERS.index(raw) == item["answer"]
    expected = LETTERS[item["answer"]]
    print(("ĐÚNG" if correct else f"SAI — đáp án {expected}") + f": {item['explanation']}")
    return correct


def run(items: list[dict[str, Any]]) -> int:
    """Chạy quiz và in score cùng lesson cần ôn."""
    correct = 0
    wrong_lessons: Counter[str] = Counter()
    attempted = 0
    try:
        for item in items:
            attempted += 1
            if ask(item):
                correct += 1
            else:
                wrong_lessons[item["lesson"]] += 1
    except (KeyboardInterrupt, EOFError):
        print("\nĐã dừng quiz.")
    if attempted == 0:
        return 1
    score = correct / attempted
    print(f"\nKết quả: {correct}/{attempted} = {score:.0%} — {'ĐẠT' if score >= 0.8 else 'CHƯA ĐẠT'}")
    if wrong_lessons:
        print("Ôn lại:", ", ".join(f"lesson {lesson} ({count} câu)" for lesson, count in wrong_lessons.most_common()))
    return 0 if score >= 0.8 else 2


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Quiz AI Engineer")
    selection = parser.add_mutually_exclusive_group()
    selection.add_argument("--phase")
    selection.add_argument("--all", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--shuffle", action="store_true")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--check", action="store_true", help="chỉ validate question bank")
    return parser


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = build_parser().parse_args()
    bank = load_questions()
    phases = sorted({item["phase"] for item in bank})
    if args.check:
        print(f"QUESTION BANK: OK — {len(bank)} questions; phases={', '.join(phases)}")
        return 0
    if not args.phase and not args.all:
        raise SystemExit(f"Chọn --phase ({', '.join(phases)}) hoặc --all")
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit phải >= 1")
    items = select_questions(bank, args.phase, args.limit, args.shuffle, args.seed)
    return run(items)


if __name__ == "__main__":
    raise SystemExit(main())
