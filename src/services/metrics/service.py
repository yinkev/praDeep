"""
Centralized Performance Metrics Service
========================================

Tracks real-time performance metrics across all agent modules:
- Response times
- Token efficiency
- Success rates
- Error patterns

Provides aggregated statistics per agent type with exportable reports.
"""

import asyncio
import json
import threading
import time
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from src.logging.stats import MODEL_PRICING, get_pricing


@dataclass
class AgentMetrics:
    """Metrics for a single agent invocation."""

    agent_name: str
    module_name: str
    start_time: float
    end_time: float | None = None
    duration_ms: float | None = None

    # Token metrics
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    # Request metrics
    api_calls: int = 0
    errors: int = 0
    success: bool = True

    # Cost tracking
    cost_usd: float = 0.0
    model: str | None = None

    # Additional context
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def mark_end(self, success: bool = True):
        """Mark the end of agent execution."""
        self.end_time = time.time()
        if self.start_time:
            self.duration_ms = (self.end_time - self.start_time) * 1000
        self.success = success

    def add_tokens(self, prompt: int = 0, completion: int = 0, model: str | None = None):
        """Add token usage."""
        self.prompt_tokens += prompt
        self.completion_tokens += completion
        self.total_tokens = self.prompt_tokens + self.completion_tokens

        if model:
            self.model = model
            pricing = get_pricing(model)
            self.cost_usd = (self.prompt_tokens / 1000.0) * pricing["input"] + (
                self.completion_tokens / 1000.0
            ) * pricing["output"]

    def add_api_call(self):
        """Increment API call count."""
        self.api_calls += 1

    def add_error(self):
        """Increment error count."""
        self.errors += 1
        self.success = False

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


@dataclass
class AggregatedStats:
    """Aggregated statistics for an agent type."""

    agent_name: str
    module_name: str
    total_invocations: int = 0
    successful_invocations: int = 0
    failed_invocations: int = 0

    # Timing stats
    total_duration_ms: float = 0.0
    avg_duration_ms: float = 0.0
    min_duration_ms: float = float("inf")
    max_duration_ms: float = 0.0

    # Token stats
    total_prompt_tokens: int = 0
    total_completion_tokens: int = 0
    total_tokens: int = 0
    avg_tokens_per_call: float = 0.0

    # API stats
    total_api_calls: int = 0
    total_errors: int = 0

    # Cost stats
    total_cost_usd: float = 0.0

    # Success rate
    success_rate: float = 0.0

    # Time range
    first_seen: str | None = None
    last_seen: str | None = None

    def update_from_metrics(self, metrics: AgentMetrics):
        """Update aggregated stats from a single metric."""
        self.total_invocations += 1

        if metrics.success:
            self.successful_invocations += 1
        else:
            self.failed_invocations += 1

        if metrics.duration_ms is not None:
            self.total_duration_ms += metrics.duration_ms
            self.min_duration_ms = min(self.min_duration_ms, metrics.duration_ms)
            self.max_duration_ms = max(self.max_duration_ms, metrics.duration_ms)
            self.avg_duration_ms = self.total_duration_ms / self.total_invocations

        self.total_prompt_tokens += metrics.prompt_tokens
        self.total_completion_tokens += metrics.completion_tokens
        self.total_tokens += metrics.total_tokens
        self.avg_tokens_per_call = self.total_tokens / self.total_invocations

        self.total_api_calls += metrics.api_calls
        self.total_errors += metrics.errors
        self.total_cost_usd += metrics.cost_usd

        self.success_rate = (
            (self.successful_invocations / self.total_invocations) * 100
            if self.total_invocations > 0
            else 0.0
        )

        if self.first_seen is None:
            self.first_seen = metrics.timestamp
        self.last_seen = metrics.timestamp

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        result = asdict(self)
        # Handle infinity for min_duration_ms when no data
        if result["min_duration_ms"] == float("inf"):
            result["min_duration_ms"] = 0.0
        return result


class MetricsService:
    """
    Centralized service for tracking performance metrics across all agent modules.

    Features:
    - Real-time metric collection
    - Aggregated statistics per agent type and module
    - Historical data storage
    - Export capabilities (JSON)
    - Callback system for real-time updates
    """

    def __init__(self, enabled: bool = True, save_dir: str | None = None, history_limit: int = 1000):
        """
        Initialize metrics service.

        Args:
            enabled: Whether metrics collection is enabled
            save_dir: Directory to save metrics (None uses default)
            history_limit: Maximum number of historical records to keep in memory
        """
        self.enabled = enabled
        self.history_limit = history_limit
        self._lock = threading.Lock()

        # Storage
        self._active_metrics: dict[str, AgentMetrics] = {}  # Currently running
        self._history: list[AgentMetrics] = []  # Completed metrics
        self._aggregated: dict[str, AggregatedStats] = {}  # Per-agent aggregations
        self._module_stats: dict[str, dict[str, Any]] = defaultdict(
            lambda: {
                "total_calls": 0,
                "total_tokens": 0,
                "total_cost_usd": 0.0,
                "total_errors": 0,
                "agents": set(),
            }
        )

        # Callbacks for real-time updates
        self._callbacks: list[Callable[[AgentMetrics], None]] = []
        self._async_callbacks: list[Callable[[AgentMetrics], Any]] = []

        # Save directory
        if save_dir is None:
            project_root = Path(__file__).parent.parent.parent.parent
            self.save_dir = project_root / "data" / "user" / "metrics"
        else:
            self.save_dir = Path(save_dir)

        if self.enabled:
            self.save_dir.mkdir(parents=True, exist_ok=True)

    def start_tracking(self, agent_name: str, module_name: str) -> AgentMetrics:
        """
        Start tracking metrics for an agent invocation.

        Args:
            agent_name: Name of the agent
            module_name: Name of the module (solve, research, etc.)

        Returns:
            AgentMetrics instance for updating during execution
        """
        if not self.enabled:
            return AgentMetrics(agent_name=agent_name, module_name=module_name, start_time=time.time())

        metrics = AgentMetrics(agent_name=agent_name, module_name=module_name, start_time=time.time())

        # Create a unique key for this invocation
        key = f"{module_name}:{agent_name}:{time.time()}"

        with self._lock:
            self._active_metrics[key] = metrics

        return metrics

    def end_tracking(self, metrics: AgentMetrics, success: bool = True):
        """
        End tracking and record completed metrics.

        Args:
            metrics: The metrics instance from start_tracking
            success: Whether the execution was successful
        """
        if not self.enabled:
            return

        metrics.mark_end(success)

        with self._lock:
            # Remove from active
            key_to_remove = None
            for key, m in self._active_metrics.items():
                if m is metrics:
                    key_to_remove = key
                    break
            if key_to_remove:
                del self._active_metrics[key_to_remove]

            # Add to history (with limit)
            self._history.append(metrics)
            if len(self._history) > self.history_limit:
                self._history = self._history[-self.history_limit :]

            # Update aggregated stats
            agg_key = f"{metrics.module_name}:{metrics.agent_name}"
            if agg_key not in self._aggregated:
                self._aggregated[agg_key] = AggregatedStats(
                    agent_name=metrics.agent_name, module_name=metrics.module_name
                )
            self._aggregated[agg_key].update_from_metrics(metrics)

            # Update module stats
            module_stats = self._module_stats[metrics.module_name]
            module_stats["total_calls"] += 1
            module_stats["total_tokens"] += metrics.total_tokens
            module_stats["total_cost_usd"] += metrics.cost_usd
            module_stats["total_errors"] += metrics.errors
            module_stats["agents"].add(metrics.agent_name)

        # Fire callbacks
        self._fire_callbacks(metrics)

    def _fire_callbacks(self, metrics: AgentMetrics):
        """Fire registered callbacks."""
        for callback in self._callbacks:
            try:
                callback(metrics)
            except Exception:
                pass  # Don't let callback errors affect main flow

        # Fire async callbacks
        for async_callback in self._async_callbacks:
            try:
                asyncio.create_task(async_callback(metrics))
            except RuntimeError:
                # No event loop running
                pass
            except Exception:
                pass

    def add_callback(self, callback: Callable[[AgentMetrics], None]):
        """Register a callback for metric updates."""
        self._callbacks.append(callback)

    def add_async_callback(self, callback: Callable[[AgentMetrics], Any]):
        """Register an async callback for metric updates."""
        self._async_callbacks.append(callback)

    def remove_callback(self, callback: Callable):
        """Remove a registered callback."""
        if callback in self._callbacks:
            self._callbacks.remove(callback)
        if callback in self._async_callbacks:
            self._async_callbacks.remove(callback)

    def get_active_metrics(self) -> list[dict[str, Any]]:
        """Get currently active (running) metrics."""
        with self._lock:
            return [m.to_dict() for m in self._active_metrics.values()]

    def get_history(self, limit: int = 100, module: str | None = None) -> list[dict[str, Any]]:
        """
        Get historical metrics.

        Args:
            limit: Maximum number of records to return
            module: Filter by module name (optional)
        """
        with self._lock:
            history = self._history
            if module:
                history = [m for m in history if m.module_name == module]
            return [m.to_dict() for m in history[-limit:]]

    def get_aggregated_stats(self, module: str | None = None) -> dict[str, dict[str, Any]]:
        """
        Get aggregated statistics per agent.

        Args:
            module: Filter by module name (optional)
        """
        with self._lock:
            result = {}
            for key, stats in self._aggregated.items():
                if module is None or stats.module_name == module:
                    result[key] = stats.to_dict()
            return result

    def get_module_stats(self) -> dict[str, dict[str, Any]]:
        """Get statistics aggregated by module."""
        with self._lock:
            result = {}
            for module, stats in self._module_stats.items():
                result[module] = {
                    "total_calls": stats["total_calls"],
                    "total_tokens": stats["total_tokens"],
                    "total_cost_usd": stats["total_cost_usd"],
                    "total_errors": stats["total_errors"],
                    "unique_agents": len(stats["agents"]),
                    "error_rate": (
                        (stats["total_errors"] / stats["total_calls"]) * 100
                        if stats["total_calls"] > 0
                        else 0.0
                    ),
                }
            return result

    def get_summary(self) -> dict[str, Any]:
        """Get overall summary of all metrics."""
        with self._lock:
            total_calls = sum(s["total_calls"] for s in self._module_stats.values())
            total_tokens = sum(s["total_tokens"] for s in self._module_stats.values())
            total_cost = sum(s["total_cost_usd"] for s in self._module_stats.values())
            total_errors = sum(s["total_errors"] for s in self._module_stats.values())

            # Calculate overall success rate from aggregated stats
            total_invocations = sum(s.total_invocations for s in self._aggregated.values())
            successful_invocations = sum(s.successful_invocations for s in self._aggregated.values())

            return {
                "total_calls": total_calls,
                "total_tokens": total_tokens,
                "total_cost_usd": total_cost,
                "total_errors": total_errors,
                "success_rate": (
                    (successful_invocations / total_invocations) * 100
                    if total_invocations > 0
                    else 0.0
                ),
                "active_count": len(self._active_metrics),
                "history_count": len(self._history),
                "modules": list(self._module_stats.keys()),
                "unique_agents": len(self._aggregated),
            }

    def export_report(self, filepath: str | None = None) -> str:
        """
        Export metrics report to JSON file.

        Args:
            filepath: Path to save file (None for auto-generated)

        Returns:
            Path to saved file
        """
        if not self.enabled:
            return ""

        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = self.save_dir / f"metrics_report_{timestamp}.json"
        else:
            filepath = Path(filepath)

        report = {
            "generated_at": datetime.now().isoformat(),
            "summary": self.get_summary(),
            "module_stats": self.get_module_stats(),
            "agent_stats": self.get_aggregated_stats(),
            "recent_history": self.get_history(limit=100),
        }

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2, default=str)

        return str(filepath)

    def reset(self):
        """Reset all metrics."""
        with self._lock:
            self._active_metrics.clear()
            self._history.clear()
            self._aggregated.clear()
            self._module_stats.clear()


# Singleton instance
_metrics_service: MetricsService | None = None


def get_metrics_service(
    enabled: bool = True, save_dir: str | None = None, history_limit: int = 1000
) -> MetricsService:
    """
    Get the singleton metrics service instance.

    Args:
        enabled: Whether metrics collection is enabled
        save_dir: Directory to save metrics
        history_limit: Maximum historical records to keep

    Returns:
        MetricsService instance
    """
    global _metrics_service
    if _metrics_service is None:
        _metrics_service = MetricsService(enabled=enabled, save_dir=save_dir, history_limit=history_limit)
    return _metrics_service


def reset_metrics_service():
    """Reset the singleton metrics service."""
    global _metrics_service
    if _metrics_service is not None:
        _metrics_service.reset()
    _metrics_service = None
