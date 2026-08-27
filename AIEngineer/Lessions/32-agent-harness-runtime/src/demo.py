"""Mini agent harness offline: adapter, typed tools, policy, budget và trace."""

from __future__ import annotations

from dataclasses import dataclass
import sys
from typing import Callable, Protocol, TypeAlias


@dataclass(frozen=True)
class ToolCall:
    """Yêu cầu gọi một tool với argument chưa được tin cậy."""

    name: str
    arguments: dict[str, object]


@dataclass(frozen=True)
class FinalAnswer:
    """Câu trả lời cuối do model adapter đề xuất."""

    text: str


Action: TypeAlias = ToolCall | FinalAnswer


class ModelAdapter(Protocol):
    """Contract nhỏ để thay model thật bằng adapter có thể kiểm thử."""

    def next_action(self, request: str, observations: tuple[str, ...]) -> Action:
        """Chọn tool call hoặc câu trả lời cuối từ state hiện tại."""


@dataclass(frozen=True)
class TypedTool:
    """Tool có schema kiểu đơn giản và handler thuần Python."""

    name: str
    argument_types: dict[str, type]
    handler: Callable[[dict[str, object]], str]

    def invoke(self, arguments: dict[str, object]) -> str:
        """Validate tên/kiểu chính xác rồi mới chạy handler."""

        if set(arguments) != set(self.argument_types):
            raise ValueError(f"Sai tập argument cho {self.name}")
        for key, expected_type in self.argument_types.items():
            if type(arguments[key]) is not expected_type:
                raise TypeError(f"{key} phải là {expected_type.__name__}")
        return self.handler(arguments)


@dataclass(frozen=True)
class TraceEvent:
    """Một event quan sát được trong agent loop."""

    step: int
    kind: str
    detail: str


class VirtualWorkspace:
    """Kho file trong RAM với allowlist chính xác; không phải OS sandbox."""

    def __init__(self, files: dict[str, str], readable_paths: set[str]) -> None:
        self._files = dict(files)
        self._readable_paths = set(readable_paths)

    def read(self, path: str) -> str:
        """Chỉ đọc path có trong allowlist."""

        if path not in self._readable_paths:
            raise PermissionError(f"Path không được cấp quyền: {path}")
        if path not in self._files:
            raise FileNotFoundError(path)
        return self._files[path]


class ScriptedBudgetModel:
    """Adapter quyết định cố định để minh họa, không giả làm LLM thật."""

    def next_action(self, request: str, observations: tuple[str, ...]) -> Action:
        """Đọc file, cộng hai số, rồi tạo final answer."""

        del request
        if not observations:
            return ToolCall("read_workspace", {"path": "project/budget.txt"})
        if len(observations) == 1:
            left, right = (int(value) for value in observations[0].split(","))
            return ToolCall("add", {"a": left, "b": right})
        return FinalAnswer(f"TOTAL={observations[-1]}")


class LoopingModel:
    """Adapter lỗi luôn gọi tool, dùng để kiểm tra step budget."""

    def next_action(self, request: str, observations: tuple[str, ...]) -> Action:
        """Cố tình không bao giờ trả final answer."""

        del request, observations
        return ToolCall("add", {"a": 1, "b": 1})


class AgentHarness:
    """Controller nhỏ có dispatch, trace, verifier và step budget."""

    def __init__(
        self,
        model: ModelAdapter,
        tools: tuple[TypedTool, ...],
        verifier: Callable[[str], bool],
        *,
        max_steps: int,
    ) -> None:
        if max_steps < 1:
            raise ValueError("max_steps phải dương")
        self.model = model
        self.tools = {tool.name: tool for tool in tools}
        self.verifier = verifier
        self.max_steps = max_steps
        self.trace: list[TraceEvent] = []

    def run(self, request: str) -> str:
        """Chạy agent loop; chỉ trả final answer khi verifier chấp nhận."""

        observations: list[str] = []
        self.trace.clear()
        for step in range(1, self.max_steps + 1):
            action = self.model.next_action(request, tuple(observations))
            if isinstance(action, FinalAnswer):
                passed = self.verifier(action.text)
                self.trace.append(TraceEvent(step, "verify", str(passed)))
                if not passed:
                    raise ValueError("Verifier từ chối final answer")
                return action.text

            tool = self.tools.get(action.name)
            if tool is None:
                raise PermissionError(f"Tool không nằm trong registry: {action.name}")
            self.trace.append(TraceEvent(step, "tool_call", action.name))
            observation = tool.invoke(action.arguments)
            observations.append(observation)
            self.trace.append(TraceEvent(step, "observation", observation))
        raise RuntimeError("Đã hết step budget trước khi có đáp án hợp lệ")


def build_tools(workspace: VirtualWorkspace) -> tuple[TypedTool, ...]:
    """Tạo registry tool đóng trên workspace đã giới hạn quyền."""

    return (
        TypedTool(
            "read_workspace",
            {"path": str},
            lambda args: workspace.read(str(args["path"])),
        ),
        TypedTool(
            "add",
            {"a": int, "b": int},
            lambda args: str(int(args["a"]) + int(args["b"])),
        ),
    )


def main() -> None:
    """Chạy harness và các assertion bảo vệ contract."""

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    workspace = VirtualWorkspace(
        {"project/budget.txt": "120,30", "secrets/key.txt": "DO-NOT-READ"},
        {"project/budget.txt"},
    )
    tools = build_tools(workspace)
    harness = AgentHarness(
        ScriptedBudgetModel(), tools, lambda answer: answer == "TOTAL=150", max_steps=4
    )
    answer = harness.run("Tính tổng ngân sách trong file dự án")

    assert answer == "TOTAL=150"
    assert [event.kind for event in harness.trace] == [
        "tool_call",
        "observation",
        "tool_call",
        "observation",
        "verify",
    ]
    try:
        workspace.read("secrets/key.txt")
    except PermissionError:
        pass
    else:
        raise AssertionError("Allowlist phải chặn secret")

    runaway = AgentHarness(LoopingModel(), tools, lambda _: True, max_steps=2)
    try:
        runaway.run("loop")
    except RuntimeError as exc:
        assert "step budget" in str(exc)
    else:
        raise AssertionError("Runaway loop phải bị step budget chặn")

    print("ANSWER:", answer)
    for event in harness.trace:
        print(f"step={event.step} kind={event.kind} detail={event.detail}")
    print("SELF-CHECK: allowlist và step budget hoạt động")


if __name__ == "__main__":
    main()
