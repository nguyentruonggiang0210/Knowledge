"""Mini coding harness an toàn chạy hoàn toàn trong temporary fixture."""

from __future__ import annotations

import ast
import hashlib
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path


def file_hash(path: Path) -> str:
    """Snapshot content để chống overwrite khi file đã đổi."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_path(root: Path, relative: str) -> Path:
    """Resolve path và bắt buộc target nằm trong root."""
    root = root.resolve()
    target = (root / relative).resolve()
    if target != root and root not in target.parents:
        raise PermissionError(f"path ngoài workspace: {relative}")
    return target


def function_names(source: str) -> list[str]:
    """Dùng AST thay regex để lập symbol list Python."""
    tree = ast.parse(source)
    return [node.name for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]


def exact_patch(path: Path, old: str, new: str, expected_hash: str) -> None:
    """Patch đúng một occurrence và từ chối dirty snapshot."""
    if file_hash(path) != expected_hash:
        raise RuntimeError("file đã thay đổi kể từ lúc agent đọc")
    source = path.read_text(encoding="utf-8")
    if source.count(old) != 1:
        raise ValueError("exact patch cần đúng một match")
    path.write_text(source.replace(old, new), encoding="utf-8")


@dataclass
class Harness:
    root: Path
    max_steps: int = 4
    trace: list[dict[str, object]] = field(default_factory=list)
    steps: int = 0

    def consume(self, action: str, **details: object) -> None:
        """Áp step budget và ghi structured trace."""
        if self.steps >= self.max_steps:
            raise RuntimeError("step budget exceeded")
        self.steps += 1
        self.trace.append({"step": self.steps, "action": action, **details})

    def verify(self, test_file: str) -> bool:
        """Chạy allowlisted Python test trong cwd cố định, timeout và capture output."""
        target = safe_path(self.root, test_file)
        self.consume("verify", file=test_file)
        result = subprocess.run(
            [sys.executable, target.name], cwd=self.root, capture_output=True, text=True,
            timeout=5, check=False, env={"PYTHONIOENCODING": "utf-8"},
        )
        self.trace[-1].update(exit_code=result.returncode, output=result.stdout[-500:])
        return result.returncode == 0


def build_fixture(root: Path) -> None:
    """Tạo repo nhỏ bị lỗi trong temp directory."""
    (root / "calculator.py").write_text(
        'def add(left: int, right: int) -> int:\n    """Return the sum."""\n    raise NotImplementedError\n',
        encoding="utf-8",
    )
    (root / "test_calculator.py").write_text(
        "from calculator import add\nassert add(2, 3) == 5\nassert add(-1, 1) == 0\nprint('tests: ok')\n",
        encoding="utf-8",
    )


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="coding-agent-course-") as directory:
        root = Path(directory)
        build_fixture(root)
        harness = Harness(root)
        source_file = safe_path(root, "calculator.py")
        snapshot = file_hash(source_file)
        harness.consume("inspect", symbols=function_names(source_file.read_text(encoding="utf-8")))
        exact_patch(source_file, "    raise NotImplementedError", "    return left + right", snapshot)
        harness.consume("patch", file="calculator.py")
        assert harness.verify("test_calculator.py")
        try:
            safe_path(root, "../secret.txt")
        except PermissionError:
            harness.trace.append({"action": "policy_denied", "target": "../secret.txt"})
        else:
            raise AssertionError("path traversal phải bị từ chối")
        compile(source_file.read_text(encoding="utf-8"), str(source_file), "exec")
        print({"verified": True, "steps": harness.steps, "trace": harness.trace})


if __name__ == "__main__":
    main()

