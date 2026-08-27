"""Route an inference request through a latency-weighted service graph."""

from __future__ import annotations

import heapq
import math
from collections.abc import Mapping

Graph = Mapping[str, Mapping[str, float]]


def validate_non_negative(graph: Graph) -> None:
    """Reject edges that violate Dijkstra's non-negative assumption."""
    for source, neighbours in graph.items():
        for target, weight in neighbours.items():
            if weight < 0:
                raise ValueError(f"Negative edge {source!r} -> {target!r}")


def shortest_path(graph: Graph, start: str, goal: str) -> tuple[float, list[str]]:
    """Return minimum total cost and path using Dijkstra's algorithm."""
    if start not in graph or goal not in graph:
        raise ValueError("Start and goal must exist in the graph")
    validate_non_negative(graph)
    distances = {node: math.inf for node in graph}
    distances[start] = 0.0
    previous: dict[str, str] = {}
    queue: list[tuple[float, str]] = [(0.0, start)]

    while queue:
        distance, node = heapq.heappop(queue)
        if distance != distances[node]:
            continue
        if node == goal:
            break
        for neighbour, edge_cost in graph[node].items():
            if neighbour not in graph:
                raise ValueError(f"Unknown neighbour: {neighbour!r}")
            candidate = distance + edge_cost
            if candidate < distances[neighbour]:
                distances[neighbour] = candidate
                previous[neighbour] = node
                heapq.heappush(queue, (candidate, neighbour))

    if math.isinf(distances[goal]):
        raise ValueError(f"No route from {start!r} to {goal!r}")
    path = [goal]
    while path[-1] != start:
        path.append(previous[path[-1]])
    path.reverse()
    return distances[goal], path


def path_cost(graph: Graph, path: list[str]) -> float:
    """Calculate the cost of an explicit path for verification."""
    return sum(graph[source][target] for source, target in zip(path, path[1:]))


def main() -> None:
    """Find the fastest route to a GPU endpoint."""
    graph: dict[str, dict[str, float]] = {
        "client": {"gateway": 8.0, "regional-cache": 5.0},
        "gateway": {"gpu": 20.0, "regional-cache": 2.0},
        "regional-cache": {"gpu": 9.0},
        "gpu": {},
    }
    latency, route = shortest_path(graph, "client", "gpu")
    assert route == ["client", "regional-cache", "gpu"]
    assert latency == 14.0
    assert path_cost(graph, route) == latency
    print("Fastest route:", " -> ".join(route))
    print("Total latency:", latency, "ms")
    print("Self-check: OK")


if __name__ == "__main__":
    main()
