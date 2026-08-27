"""Demo chọn/compact memory và consultant chỉ-đọc trước planning."""

from __future__ import annotations

from dataclasses import dataclass
import math
import re
import sys


@dataclass(frozen=True)
class Memory:
    """Một memory có provenance tối thiểu và metadata để xếp hạng."""

    memory_id: str
    text: str
    source: str
    age_days: float
    importance: float


@dataclass(frozen=True)
class ContextBundle:
    """Context đã chọn và summary trỏ về các memory bị nén."""

    selected: tuple[Memory, ...]
    compacted_summary: str
    omitted_ids: tuple[str, ...]


def terms(text: str) -> set[str]:
    """Tách token chữ/số đơn giản để demo lexical relevance."""

    return set(re.findall(r"\w+", text.lower(), flags=re.UNICODE))


def score_memory(query: str, memory: Memory) -> float:
    """Kết hợp relevance, freshness và importance thành điểm [0, 1]."""

    query_terms = terms(query)
    overlap = len(query_terms & terms(memory.text)) / max(1, len(query_terms))
    freshness = math.exp(-max(0.0, memory.age_days) / 30.0)
    importance = min(1.0, max(0.0, memory.importance))
    return 0.55 * overlap + 0.25 * freshness + 0.20 * importance


def select_and_compact(
    query: str, memories: tuple[Memory, ...], *, word_budget: int
) -> ContextBundle:
    """Chọn memory theo score trong budget, tóm tắt phần còn lại kèm ID nguồn."""

    if word_budget < 1:
        raise ValueError("word_budget phải dương")
    ranked = sorted(memories, key=lambda item: score_memory(query, item), reverse=True)
    selected: list[Memory] = []
    omitted: list[Memory] = []
    used = 0
    for memory in ranked:
        size = len(memory.text.split())
        if used + size <= word_budget:
            selected.append(memory)
            used += size
        else:
            omitted.append(memory)
    omitted_ids = tuple(memory.memory_id for memory in omitted)
    summary = ""
    if omitted:
        previews = [f"{item.memory_id}:{' '.join(item.text.split()[:5])}" for item in omitted]
        summary = "COMPACTED (mở nguồn trước khi tin): " + " | ".join(previews)
    return ContextBundle(tuple(selected), summary, omitted_ids)


def preplanning_consultant(goal: str, bundle: ContextBundle) -> tuple[str, ...]:
    """Trả advice chỉ-đọc từ context; không tạo action hay sửa state."""

    corpus = " ".join(memory.text.lower() for memory in bundle.selected)
    advice: list[str] = []
    if "payment" in goal.lower() and "idempotency" in corpus:
        advice.append("Ràng buộc: giữ idempotency key và test retry.")
    if "api key" in corpus or "secret" in corpus:
        advice.append("Rủi ro: redact secret khỏi log và trace.")
    if not advice:
        advice.append("Chưa đủ memory liên quan; planner phải hỏi thêm thay vì đoán.")
    return tuple(advice)


def main() -> None:
    """Chạy retrieval/compaction và kiểm tra consultant không đổi state."""

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    memories = (
        Memory(
            "M1",
            "Payment retry phải giữ idempotency key để không trừ tiền hai lần",
            "architecture/adr-12.md",
            2,
            1.0,
        ),
        Memory(
            "M2",
            "Không ghi API key hoặc secret vào log và trace",
            "security/policy.md",
            1,
            1.0,
        ),
        Memory(
            "M3",
            "Màu nút dashboard cũ là xanh dương",
            "notes/ui.txt",
            180,
            0.1,
        ),
        Memory(
            "M4",
            "Sprint trước nhóm đã đổi tên một test giao diện",
            "meeting/old.md",
            90,
            0.2,
        ),
    )
    bundle = select_and_compact(
        "Lập kế hoạch sửa payment retry an toàn", memories, word_budget=22
    )
    state_before = {"phase": "not_planned", "actions": 0}
    advice = preplanning_consultant("Sửa payment retry", bundle)
    state_after = dict(state_before)

    selected_ids = {memory.memory_id for memory in bundle.selected}
    assert "M1" in selected_ids and "M2" in selected_ids
    assert set(bundle.omitted_ids) == {"M3", "M4"}
    assert "M3:" in bundle.compacted_summary
    assert any("idempotency" in item for item in advice)
    assert any("secret" in item for item in advice)
    assert state_after == state_before  # consultant chỉ đọc
    assert score_memory("payment retry", memories[0]) > score_memory(
        "payment retry", memories[2]
    )

    print("SELECTED:", sorted(selected_ids))
    print(bundle.compacted_summary)
    print("CONSULTANT:", *advice, sep="\n- ")
    print("STATE UNCHANGED:", state_after)


if __name__ == "__main__":
    main()
