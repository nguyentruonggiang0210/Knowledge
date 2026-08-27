"""Build and validate a dependency-aware AI engineering learning roadmap."""

from __future__ import annotations

from collections.abc import Mapping, Sequence, Set

Roadmap = Mapping[str, Sequence[str]]


def learning_order(roadmap: Roadmap) -> list[str]:
    """Return a topological learning order and reject missing nodes or cycles."""
    unknown = {
        prerequisite
        for prerequisites in roadmap.values()
        for prerequisite in prerequisites
        if prerequisite not in roadmap
    }
    if unknown:
        raise ValueError(f"Unknown prerequisites: {sorted(unknown)}")

    visiting: set[str] = set()
    visited: set[str] = set()
    order: list[str] = []

    def visit(topic: str) -> None:
        if topic in visiting:
            raise ValueError(f"Dependency cycle detected at {topic!r}")
        if topic in visited:
            return
        visiting.add(topic)
        for prerequisite in roadmap[topic]:
            visit(prerequisite)
        visiting.remove(topic)
        visited.add(topic)
        order.append(topic)

    for topic in roadmap:
        visit(topic)
    return order


def unlocked_topics(roadmap: Roadmap, completed: Set[str]) -> list[str]:
    """List unfinished topics whose prerequisites are all completed."""
    return sorted(
        topic
        for topic, prerequisites in roadmap.items()
        if topic not in completed and set(prerequisites) <= set(completed)
    )


def main() -> None:
    """Run a practical roadmap self-check."""
    roadmap: dict[str, tuple[str, ...]] = {
        "python": (),
        "math": (),
        "data": ("python",),
        "machine-learning": ("python", "math", "data"),
        "deep-learning": ("machine-learning",),
        "llm-systems": ("deep-learning", "data"),
        "agents": ("llm-systems",),
        "production-ai": ("agents", "machine-learning"),
    }
    order = learning_order(roadmap)
    position = {topic: index for index, topic in enumerate(order)}

    assert position["python"] < position["machine-learning"]
    assert position["machine-learning"] < position["production-ai"]
    assert unlocked_topics(roadmap, {"python"}) == ["data", "math"]

    print("Valid learning order:", " -> ".join(order))
    print("After Python, unlocked:", unlocked_topics(roadmap, {"python"}))
    print("Self-check: OK")


if __name__ == "__main__":
    main()
