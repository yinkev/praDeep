from __future__ import annotations

import hashlib
import json
import re
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class ConceptNode:
    node_id: str
    label: str


@dataclass(frozen=True)
class ConceptEdge:
    source: str
    target: str


_TOKEN_RE = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9\\-]{2,}")


def _clean_label(label: str) -> str:
    label = (label or "").strip()
    label = re.sub(r"\s+", " ", label)
    return label


def _stable_id(label: str) -> str:
    return hashlib.sha1(label.encode("utf-8")).hexdigest()[:12]


def _iter_content_list_items(content_list_dir: Path) -> Iterable[dict]:
    if not content_list_dir.exists() or not content_list_dir.is_dir():
        return []

    json_files = sorted(content_list_dir.glob("*.json"))
    items: list[dict] = []
    for file_path in json_files:
        try:
            with open(file_path, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                items.extend([x for x in data if isinstance(x, dict)])
        except Exception:
            continue

    return items


def build_concept_hierarchy_graph(content_list_dir: Path) -> tuple[list[ConceptNode], list[ConceptEdge]]:
    """
    Build a simple prerequisite-style graph from KB extracted content lists.

    Heuristic:
    - Treat `text_level` entries as outline headings.
    - Connect parent heading -> child heading (prerequisite -> dependent).
    """
    label_to_id: dict[str, str] = {}
    nodes: dict[str, ConceptNode] = {}
    edges: set[tuple[str, str]] = set()

    # Stack of the most recent node at each outline level.
    level_stack: dict[int, str] = {}

    for item in _iter_content_list_items(content_list_dir):
        if item.get("type") != "text":
            continue
        if "text_level" not in item:
            continue

        try:
            level = int(item.get("text_level") or 0)
        except Exception:
            continue

        if level <= 0:
            continue

        label = _clean_label(str(item.get("text") or ""))
        if not label:
            continue

        node_id = label_to_id.get(label)
        if node_id is None:
            node_id = _stable_id(label)
            label_to_id[label] = node_id
            nodes[node_id] = ConceptNode(node_id=node_id, label=label)

        parent_id = level_stack.get(level - 1)
        if parent_id and parent_id != node_id:
            edges.add((parent_id, node_id))

        level_stack[level] = node_id
        # Clear deeper levels when we see a heading at this level.
        for deeper in [k for k in level_stack.keys() if k > level]:
            level_stack.pop(deeper, None)

    return list(nodes.values()), [ConceptEdge(source=s, target=t) for (s, t) in sorted(edges)]


def match_focus_nodes(nodes: Iterable[ConceptNode], query: str, max_focus: int = 5) -> list[str]:
    query = (query or "").strip().lower()
    if not query:
        return []

    tokens = [t.lower() for t in _TOKEN_RE.findall(query)]
    if not tokens:
        return []

    scored: list[tuple[int, str]] = []
    for node in nodes:
        label_lower = node.label.lower()
        score = sum(1 for t in tokens if t in label_lower)
        if score:
            scored.append((score, node.node_id))

    scored.sort(key=lambda x: (-x[0], x[1]))
    return [node_id for (_score, node_id) in scored[:max_focus]]


def extract_subgraph(
    nodes: Iterable[ConceptNode],
    edges: Iterable[ConceptEdge],
    focus_node_ids: Iterable[str],
    *,
    ancestor_depth: int = 3,
    descendant_depth: int = 2,
    max_nodes: int = 120,
) -> tuple[list[ConceptNode], list[ConceptEdge]]:
    node_map = {n.node_id: n for n in nodes}
    parent_map: dict[str, set[str]] = {}
    child_map: dict[str, set[str]] = {}

    edge_list = list(edges)
    for edge in edge_list:
        parent_map.setdefault(edge.target, set()).add(edge.source)
        child_map.setdefault(edge.source, set()).add(edge.target)

    selected: set[str] = set()
    queue: deque[tuple[str, int, str]] = deque()

    for node_id in focus_node_ids:
        if node_id in node_map:
            selected.add(node_id)
            queue.append((node_id, 0, "anc"))
            queue.append((node_id, 0, "des"))

    while queue and len(selected) < max_nodes:
        current, depth, direction = queue.popleft()
        if direction == "anc":
            if depth >= ancestor_depth:
                continue
            for parent in parent_map.get(current, set()):
                if parent in node_map and parent not in selected:
                    selected.add(parent)
                    queue.append((parent, depth + 1, "anc"))
        else:
            if depth >= descendant_depth:
                continue
            for child in child_map.get(current, set()):
                if child in node_map and child not in selected:
                    selected.add(child)
                    queue.append((child, depth + 1, "des"))

    selected_nodes = [node_map[nid] for nid in selected if nid in node_map]
    selected_edges = [
        e for e in edge_list if e.source in selected and e.target in selected and e.source != e.target
    ]

    # Stable ordering for UI determinism.
    selected_nodes.sort(key=lambda n: (n.label.lower(), n.node_id))
    selected_edges.sort(key=lambda e: (e.source, e.target))
    return selected_nodes, selected_edges

