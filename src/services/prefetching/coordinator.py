from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from src.logging import get_logger

from .graph import TaskGraph


Loader = Callable[[], Any] | Callable[[], Awaitable[Any]]


@dataclass(frozen=True)
class PrefetchResource:
    id: str
    loader: Loader
    node_id: str


class PrefetchCoordinator:
    """
    Schedules best-effort prefetch tasks based on a task dependency graph.

    This is intentionally conservative: it will never block the main pipeline
    unless `await_resource()` is explicitly called.
    """

    def __init__(
        self,
        graph: TaskGraph,
        *,
        enabled: bool = True,
        max_prefetch_depth: int = 2,
        name: str = "Prefetch",
    ) -> None:
        self.graph = graph
        self.enabled = enabled
        self.max_prefetch_depth = max_prefetch_depth
        self.logger = get_logger(name)

        self._resources_by_node: dict[str, list[PrefetchResource]] = {}
        self._tasks: dict[str, asyncio.Task] = {}

    def register(self, *, node_id: str, resource_id: str, loader: Loader) -> None:
        self._resources_by_node.setdefault(node_id, []).append(
            PrefetchResource(id=resource_id, loader=loader, node_id=node_id)
        )

    def trigger(self, node_id: str) -> None:
        """
        Trigger prefetch for likely next nodes (successors/descendants).
        """
        if not self.enabled:
            return

        for future_node_id in self.graph.descendants(node_id, max_depth=self.max_prefetch_depth):
            for resource in self._resources_by_node.get(future_node_id, []):
                self._schedule(resource)

    async def await_resource(self, resource_id: str) -> Any:
        task = self._tasks.get(resource_id)
        if not task:
            raise KeyError(f"Prefetch resource not scheduled: {resource_id}")
        return await task

    def _schedule(self, resource: PrefetchResource) -> None:
        if resource.id in self._tasks:
            return

        async def runner():
            try:
                value = resource.loader()
                if asyncio.iscoroutine(value):
                    value = await value
                self.logger.debug(
                    f"Prefetched {resource.id} (node={resource.node_id})"
                )
                return value
            except Exception as e:
                self.logger.warning(
                    f"Prefetch failed for {resource.id} (node={resource.node_id}): {e}"
                )
                raise

        self._tasks[resource.id] = asyncio.create_task(runner(), name=f"prefetch:{resource.id}")

