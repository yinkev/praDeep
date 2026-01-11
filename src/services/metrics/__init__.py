"""
Performance Metrics Service
============================

Centralized service for tracking real-time performance metrics across all agent modules.
Provides aggregated statistics per agent type with exportable reports.
"""

from .service import (
    AgentMetrics,
    MetricsService,
    get_metrics_service,
    reset_metrics_service,
)

__all__ = [
    "MetricsService",
    "AgentMetrics",
    "get_metrics_service",
    "reset_metrics_service",
]
