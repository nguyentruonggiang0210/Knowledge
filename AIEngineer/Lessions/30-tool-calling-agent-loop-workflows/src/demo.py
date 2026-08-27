"""Typed tool registry và bounded agent loop hoàn toàn offline."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import Literal

JsonObject = dict[str, object]
ToolHandler = Callable[[JsonObject], JsonObject]


@dataclass(frozen=True)
class FieldSpec:
    """Schema cho một argument tool."""

    expected_type: type
    required: bool = True
    minimum: int | None = None


@dataclass(frozen=True)
class ToolSpec:
    """Typed tool contract và handler do application sở hữu."""

    name: str
    description: str
    fields: Mapping[str, FieldSpec]
    handler: ToolHandler


@dataclass(frozen=True)
class AgentAction:
    """Action do policy/model đề xuất."""

    kind: Literal["tool", "final"]
    name: str = ""
    arguments: JsonObject | None = None
    answer: str = ""


@dataclass(frozen=True)
class AgentResult:
    """Kết quả loop cùng stop reason để audit."""

    answer: str
    steps: int
    completed: bool
    trace: tuple[JsonObject, ...]


def validate_arguments(spec: ToolSpec, arguments: JsonObject) -> None:
    """Validate exact fields, required, type và integer minimum."""

    allowed = set(spec.fields)
    unknown = set(arguments) - allowed
    missing = {name for name, field in spec.fields.items() if field.required and name not in arguments}
    if unknown or missing:
        raise ValueError(f"unknown={sorted(unknown)} missing={sorted(missing)}")
    for name, value in arguments.items():
        field = spec.fields[name]
        if type(value) is not field.expected_type:
            raise ValueError(f"{name} phải có type {field.expected_type.__name__}")
        if field.minimum is not None and isinstance(value, int) and value < field.minimum:
            raise ValueError(f"{name} phải >= {field.minimum}")


def invoke_tool(registry: Mapping[str, ToolSpec], name: str, arguments: JsonObject) -> JsonObject:
    """Dispatch một tool trong allowlist sau schema validation."""

    if name not in registry:
        raise ValueError(f"Tool không được phép: {name}")
    spec = registry[name]
    validate_arguments(spec, arguments)
    return spec.handler(arguments)


def run_agent(
    goal: str,
    decide: Callable[[str, tuple[JsonObject, ...]], AgentAction],
    registry: Mapping[str, ToolSpec],
    max_steps: int,
) -> AgentResult:
    """Chạy observe-decide-act loop với hard step budget."""

    if max_steps < 1:
        raise ValueError("max_steps phải >= 1")
    trace: list[JsonObject] = [{"event": "goal", "content": goal}]
    for step in range(1, max_steps + 1):
        action = decide(goal, tuple(trace))
        if action.kind == "final":
            return AgentResult(action.answer, step, True, tuple(trace))
        if action.kind != "tool" or action.arguments is None:
            return AgentResult("STOP_INVALID_ACTION", step, False, tuple(trace))
        try:
            observation = invoke_tool(registry, action.name, action.arguments)
        except ValueError as exc:
            trace.append({"event": "tool_error", "tool": action.name, "error": str(exc)})
            return AgentResult("STOP_TOOL_ERROR", step, False, tuple(trace))
        trace.append({"event": "tool_result", "tool": action.name, "output": observation})
    return AgentResult("STOP_MAX_STEPS", max_steps, False, tuple(trace))


def run_demo() -> None:
    """Agent kiểm tra tồn kho rồi tạo một đề nghị nhập thêm."""

    inventory = {"SKU-42": 3}
    proposals: list[JsonObject] = []

    def get_inventory(arguments: JsonObject) -> JsonObject:
        sku = str(arguments["sku"])
        return {"sku": sku, "stock": inventory.get(sku, 0)}

    def create_restock(arguments: JsonObject) -> JsonObject:
        proposal = {
            "proposal_id": f"RESTOCK-{len(proposals) + 1}",
            "sku": arguments["sku"],
            "quantity": arguments["quantity"],
        }
        proposals.append(proposal)
        return proposal

    registry = {
        "get_inventory": ToolSpec(
            "get_inventory",
            "Đọc số lượng tồn kho",
            {"sku": FieldSpec(str)},
            get_inventory,
        ),
        "create_restock": ToolSpec(
            "create_restock",
            "Tạo đề nghị nhập hàng",
            {"sku": FieldSpec(str), "quantity": FieldSpec(int, minimum=1)},
            create_restock,
        ),
    }

    def restock_policy(_goal: str, trace: tuple[JsonObject, ...]) -> AgentAction:
        tool_results = [event for event in trace if event.get("event") == "tool_result"]
        if not tool_results:
            return AgentAction("tool", "get_inventory", {"sku": "SKU-42"})
        if len(tool_results) == 1:
            stock = int(tool_results[0]["output"]["stock"])  # type: ignore[index]
            return AgentAction("tool", "create_restock", {"sku": "SKU-42", "quantity": 10 - stock})
        proposal_id = tool_results[-1]["output"]["proposal_id"]  # type: ignore[index]
        return AgentAction("final", answer=f"Đã tạo {proposal_id}")

    result = run_agent("Đưa SKU-42 về mức tồn kho 10", restock_policy, registry, max_steps=5)
    assert result.completed
    assert result.steps == 3
    assert len(proposals) == 1 and proposals[0]["quantity"] == 7

    def endless_policy(_goal: str, _trace: tuple[JsonObject, ...]) -> AgentAction:
        return AgentAction("tool", "get_inventory", {"sku": "SKU-42"})

    bounded = run_agent("Lặp mãi", endless_policy, registry, max_steps=2)
    assert not bounded.completed and bounded.answer == "STOP_MAX_STEPS"
    assert bounded.steps == 2

    try:
        invoke_tool(registry, "create_restock", {"sku": "SKU-42", "quantity": True})
    except ValueError:
        pass
    else:
        raise AssertionError("Typed schema phải từ chối bool thay integer")

    print(f"answer={result.answer!a} steps={result.steps} proposals={proposals}")
    print(f"bounded_loop_stop={bounded.answer}")
    print("PASS: typed tool schema and bounded agent loop")


if __name__ == "__main__":
    run_demo()
