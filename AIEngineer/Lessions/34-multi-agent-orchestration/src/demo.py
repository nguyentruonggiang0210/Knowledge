"""Demo DAG orchestration, worker contract và merge artifact an toàn."""

from __future__ import annotations

from dataclasses import dataclass
import sys
from typing import Callable


Artifact = dict[str, str]
Worker = Callable[[dict[str, Artifact]], Artifact]


@dataclass(frozen=True)
class Task:
    """Task được giao với dependency và output contract rõ ràng."""

    task_id: str
    role: str
    dependencies: tuple[str, ...]
    output_key: str
    required_fields: tuple[str, ...]


def topological_batches(tasks: tuple[Task, ...]) -> tuple[tuple[Task, ...], ...]:
    """Xếp task thành batch độc lập; từ chối ID lạ và cycle/deadlock."""

    by_id = {task.task_id: task for task in tasks}
    if len(by_id) != len(tasks):
        raise ValueError("task_id bị trùng")
    for task in tasks:
        unknown = set(task.dependencies) - set(by_id)
        if unknown:
            raise ValueError(f"Dependency lạ của {task.task_id}: {sorted(unknown)}")

    completed: set[str] = set()
    remaining = dict(by_id)
    batches: list[tuple[Task, ...]] = []
    while remaining:
        ready = tuple(
            task
            for task in tasks
            if task.task_id in remaining and set(task.dependencies) <= completed
        )
        if not ready:
            raise ValueError("Cycle/deadlock trong task graph")
        batches.append(ready)
        for task in ready:
            completed.add(task.task_id)
            remaining.pop(task.task_id)
    return tuple(batches)


def validate_artifact(task: Task, artifact: Artifact) -> None:
    """Đảm bảo worker trả đủ field và không trả field ngoài contract."""

    expected = set(task.required_fields)
    actual = set(artifact)
    if actual != expected or not all(isinstance(value, str) for value in artifact.values()):
        raise ValueError(
            f"Artifact của {task.task_id} sai schema: expected={expected}, actual={actual}"
        )


def orchestrate(
    tasks: tuple[Task, ...], workers: dict[str, Worker]
) -> tuple[dict[str, Artifact], tuple[tuple[str, ...], ...]]:
    """Chạy các batch, validate output và ngăn nhiều task ghi cùng key."""

    artifacts: dict[str, Artifact] = {}
    owners: dict[str, str] = {}
    schedule: list[tuple[str, ...]] = []
    for batch in topological_batches(tasks):
        schedule.append(tuple(task.task_id for task in batch))
        pending: list[tuple[Task, Artifact]] = []
        snapshot = dict(artifacts)
        for task in batch:
            worker = workers.get(task.role)
            if worker is None:
                raise ValueError(f"Không có worker role={task.role}")
            artifact = worker(snapshot)
            validate_artifact(task, artifact)
            pending.append((task, artifact))

        for task, artifact in pending:
            if task.output_key in owners:
                raise ValueError(
                    f"Write conflict: {task.output_key} thuộc cả "
                    f"{owners[task.output_key]} và {task.task_id}"
                )
            owners[task.output_key] = task.task_id
            artifacts[task.output_key] = artifact
    return artifacts, tuple(schedule)


def main() -> None:
    """Chạy workflow ba worker và tự kiểm tra conflict/cycle."""

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    tasks = (
        Task("T1", "implementation", (), "patch", ("summary", "tests")),
        Task("T2", "security", (), "risk", ("finding", "severity")),
        Task(
            "T3",
            "integration",
            ("T1", "T2"),
            "release",
            ("decision", "evidence"),
        ),
    )
    workers: dict[str, Worker] = {
        "implementation": lambda _: {"summary": "validate input", "tests": "12/12"},
        "security": lambda _: {"finding": "no secret in trace", "severity": "low"},
        "integration": lambda state: {
            "decision": "ship",
            "evidence": f"{state['patch']['tests']}; {state['risk']['severity']}",
        },
    }
    artifacts, schedule = orchestrate(tasks, workers)

    assert schedule == (("T1", "T2"), ("T3",))
    assert artifacts["release"]["evidence"] == "12/12; low"

    cyclic = (
        Task("A", "implementation", ("B",), "a", ("summary", "tests")),
        Task("B", "implementation", ("A",), "b", ("summary", "tests")),
    )
    try:
        topological_batches(cyclic)
    except ValueError as exc:
        assert "Cycle/deadlock" in str(exc)
    else:
        raise AssertionError("Cycle phải bị từ chối")

    conflicting = (
        Task("A", "implementation", (), "same", ("summary", "tests")),
        Task("B", "implementation", (), "same", ("summary", "tests")),
    )
    try:
        orchestrate(conflicting, workers)
    except ValueError as exc:
        assert "Write conflict" in str(exc)
    else:
        raise AssertionError("Hai owner cho một artifact phải bị từ chối")

    print("SCHEDULE:", schedule)
    print("RELEASE:", artifacts["release"])
    print("SELF-CHECK: cycle và write conflict đã bị chặn")


if __name__ == "__main__":
    main()
