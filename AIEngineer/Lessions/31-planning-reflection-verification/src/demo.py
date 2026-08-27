"""Demo offline cho vòng plan -> execute -> reflect -> verify."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Callable


@dataclass(frozen=True)
class Step:
    """Một bước có tên và các dependency phải hoàn thành trước."""

    name: str
    dependencies: tuple[str, ...]


def validate_plan(steps: tuple[Step, ...]) -> None:
    """Từ chối tên trùng, dependency lạ hoặc dependency nằm sai thứ tự."""

    positions = {step.name: index for index, step in enumerate(steps)}
    if len(positions) != len(steps):
        raise ValueError("Tên bước bị trùng")
    for index, step in enumerate(steps):
        for dependency in step.dependencies:
            if dependency not in positions:
                raise ValueError(f"Dependency không tồn tại: {dependency}")
            if positions[dependency] >= index:
                raise ValueError(f"Dependency chưa sẵn sàng: {dependency} -> {step.name}")


def execute_plan(
    steps: tuple[Step, ...], actions: dict[str, Callable[[dict[str, Decimal]], None]]
) -> tuple[dict[str, Decimal], list[str]]:
    """Chạy plan hợp lệ và trả trạng thái cùng trace observation."""

    validate_plan(steps)
    state: dict[str, Decimal] = {}
    trace: list[str] = []
    for step in steps:
        action = actions.get(step.name)
        if action is None:
            raise ValueError(f"Thiếu action cho {step.name}")
        action(state)
        trace.append(f"{step.name}: {state.copy()}")
    return state, trace


def reflect(state: dict[str, Decimal]) -> list[str]:
    """Sinh nhận xét chẩn đoán; đây không phải bằng chứng pass/fail cuối."""

    concerns: list[str] = []
    if state.get("discount", Decimal("0")) < 0:
        concerns.append("discount không được âm")
    if "total" not in state:
        concerns.append("chưa tạo total")
    if state.get("total", Decimal("0")) < 0:
        concerns.append("total không được âm")
    return concerns


def verify(state: dict[str, Decimal], expected: Decimal) -> tuple[bool, list[str]]:
    """Kiểm tra các invariant quyết định và giá trị mong đợi."""

    errors: list[str] = []
    required = {"subtotal", "discount", "total"}
    if not required.issubset(state):
        errors.append(f"thiếu trường: {sorted(required - state.keys())}")
    if state.get("discount", Decimal("0")) < 0:
        errors.append("discount âm")
    if state.get("total") != expected:
        errors.append(f"total phải bằng {expected}")
    return not errors, errors


def main() -> None:
    """Chạy happy path và hai self-check cho failure mode."""

    plan = (
        Step("subtotal", ()),
        Step("discount", ("subtotal",)),
        Step("total", ("discount",)),
    )
    actions: dict[str, Callable[[dict[str, Decimal]], None]] = {
        "subtotal": lambda state: state.update(subtotal=Decimal("150")),
        "discount": lambda state: state.update(discount=Decimal("20")),
        "total": lambda state: state.update(
            total=state["subtotal"] - state["discount"]
        ),
    }
    state, trace = execute_plan(plan, actions)
    passed, errors = verify(state, Decimal("130"))

    assert reflect(state) == []
    assert passed and errors == []
    assert len(trace) == 3 and state["total"] == Decimal("130")

    broken = dict(state, discount=Decimal("-5"), total=Decimal("155"))
    assert "discount không được âm" in reflect(broken)
    assert verify(broken, Decimal("130"))[0] is False

    try:
        validate_plan((Step("total", ("subtotal",)), Step("subtotal", ())))
    except ValueError as exc:
        assert "chưa sẵn sàng" in str(exc)
    else:
        raise AssertionError("Plan sai dependency phải bị từ chối")

    print("PLAN:", " -> ".join(step.name for step in plan))
    print("TRACE:", *trace, sep="\n- ")
    print("VERIFIER: PASS, total =", state["total"])


if __name__ == "__main__":
    main()
