"""Demonstrate safe command representation and Git status interpretation."""

from __future__ import annotations

import shlex
from collections.abc import Iterable, Sequence


def render_command(program: str, arguments: Sequence[str]) -> str:
    """Render a command for display or logging without executing it."""
    parts = (program, *arguments)
    if not program or any("\n" in part or "\r" in part for part in parts):
        raise ValueError("Command parts must be non-empty and single-line")
    return shlex.join(parts)


def classify_git_status(lines: Iterable[str]) -> dict[str, list[str]]:
    """Classify lines from Git short status into useful change groups."""
    groups: dict[str, list[str]] = {
        "untracked": [],
        "added": [],
        "modified": [],
        "deleted": [],
        "renamed": [],
    }
    for raw_line in lines:
        line = raw_line.rstrip("\r\n")
        if len(line) < 4:
            raise ValueError(f"Invalid porcelain line: {line!r}")
        code, path = line[:2], line[3:]
        if code == "??":
            group = "untracked"
        elif "R" in code:
            group = "renamed"
        elif "D" in code:
            group = "deleted"
        elif "A" in code:
            group = "added"
        else:
            group = "modified"
        groups[group].append(path)
    return groups


def changed_file_count(groups: dict[str, list[str]]) -> int:
    """Count all changed paths in a classified status mapping."""
    return sum(len(paths) for paths in groups.values())


def main() -> None:
    """Run deterministic examples and assertions."""
    command = render_command("python", ["src/my demo.py", "--model", "small"])
    status = classify_git_status(
        ["?? notes.md", "A  src/new.py", " M src/app.py", "D  old.txt", "R  a.py -> b.py"]
    )

    assert "src/my demo.py" in command
    assert status["untracked"] == ["notes.md"]
    assert status["modified"] == ["src/app.py"]
    assert changed_file_count(status) == 5

    print("Rendered command:", command)
    print("Change groups:", status)
    print("Self-check: OK")


if __name__ == "__main__":
    main()
