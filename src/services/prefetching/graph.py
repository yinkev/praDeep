from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class TaskNode:
    id: str
    depends_on: frozenset[str] = frozenset()


class TaskGraph:
    """
    Minimal DAG representation for pipeline stage dependencies.

    Nodes are identified by string IDs and may depend on other node IDs.
    """

    def __init__(self, nodes: Iterable[TaskNode]):
        self._nodes: dict[str, TaskNode] = {n.id: n for n in nodes}
        self._children: dict[str, set[str]] = {n.id: set() for n in self._nodes.values()}
        for node in self._nodes.values():
            for dep in node.depends_on:
                if dep in self._children:
                    self._children[dep].add(node.id)

    def successors(self, node_id: str) -> list[str]:
        return sorted(self._children.get(node_id, set()))

    def descendants(self, node_id: str, *, max_depth: int | None = None) -> list[str]:
        if node_id not in self._nodes:
            return []

        out: list[str] = []
        queue: list[tuple[str, int]] = [(node_id, 0)]
        seen: set[str] = {node_id}

        while queue:
            current, depth = queue.pop(0)
            if max_depth is not None and depth >= max_depth:
                continue
            for child in self._children.get(current, set()):
                if child in seen:
                    continue
                seen.add(child)
                out.append(child)
                queue.append((child, depth + 1))

        return out

