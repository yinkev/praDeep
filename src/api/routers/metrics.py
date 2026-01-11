"""
Performance Metrics API Router
==============================

Provides endpoints for real-time performance monitoring:
- GET /metrics/summary - Overall metrics summary
- GET /metrics/agents - Per-agent aggregated stats
- GET /metrics/modules - Per-module statistics
- GET /metrics/history - Historical metrics data
- POST /metrics/export - Export metrics report
- POST /metrics/reset - Reset all metrics
- WebSocket /metrics/stream - Real-time metrics stream
"""

import asyncio
import json
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from src.di import get_container
from src.services.metrics import AgentMetrics

router = APIRouter()


# Response models
class MetricsSummaryResponse(BaseModel):
    """Overall metrics summary."""

    total_calls: int
    total_tokens: int
    total_cost_usd: float
    total_errors: int
    success_rate: float
    active_count: int
    history_count: int
    modules: list[str]
    unique_agents: int


class ModuleStats(BaseModel):
    """Statistics for a single module."""

    total_calls: int
    total_tokens: int
    total_cost_usd: float
    total_errors: int
    unique_agents: int
    error_rate: float


class AgentStats(BaseModel):
    """Aggregated statistics for an agent."""

    agent_name: str
    module_name: str
    total_invocations: int
    successful_invocations: int
    failed_invocations: int
    total_duration_ms: float
    avg_duration_ms: float
    min_duration_ms: float
    max_duration_ms: float
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    avg_tokens_per_call: float
    total_api_calls: int
    total_errors: int
    total_cost_usd: float
    success_rate: float
    first_seen: str | None
    last_seen: str | None


class ExportResponse(BaseModel):
    """Response for export endpoint."""

    success: bool
    filepath: str | None = None
    error: str | None = None


class HistoryEntry(BaseModel):
    """Single history entry."""

    agent_name: str
    module_name: str
    start_time: float
    end_time: float | None
    duration_ms: float | None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    api_calls: int
    errors: int
    success: bool
    cost_usd: float
    model: str | None
    metadata: dict[str, Any]
    timestamp: str


@router.get("/summary", response_model=MetricsSummaryResponse)
async def get_metrics_summary():
    """
    Get overall metrics summary.

    Returns aggregated statistics across all modules and agents.
    """
    service = get_container().metrics_service()
    return service.get_summary()


@router.get("/agents")
async def get_agent_stats(module: str | None = Query(None, description="Filter by module name")):
    """
    Get per-agent aggregated statistics.

    Args:
        module: Optional filter by module name

    Returns:
        Dictionary of agent stats keyed by "module:agent_name"
    """
    service = get_container().metrics_service()
    return service.get_aggregated_stats(module=module)


@router.get("/modules")
async def get_module_stats():
    """
    Get statistics aggregated by module.

    Returns statistics for each module (solve, research, guide, etc.)
    """
    service = get_container().metrics_service()
    return service.get_module_stats()


@router.get("/history")
async def get_metrics_history(
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
    module: str | None = Query(None, description="Filter by module name"),
):
    """
    Get historical metrics data.

    Args:
        limit: Maximum number of records (default 100, max 1000)
        module: Optional filter by module name

    Returns:
        List of historical metric entries
    """
    service = get_container().metrics_service()
    return service.get_history(limit=limit, module=module)


@router.get("/active")
async def get_active_metrics():
    """
    Get currently active (running) agent metrics.

    Returns list of agents currently being tracked.
    """
    service = get_container().metrics_service()
    return service.get_active_metrics()


@router.post("/export", response_model=ExportResponse)
async def export_metrics_report():
    """
    Export metrics report to JSON file.

    Saves a comprehensive report with summary, module stats,
    agent stats, and recent history.

    Returns:
        Path to the exported file
    """
    try:
        service = get_container().metrics_service()
        filepath = service.export_report()
        return ExportResponse(success=True, filepath=filepath)
    except Exception as e:
        return ExportResponse(success=False, error=str(e))


@router.post("/reset")
async def reset_metrics():
    """
    Reset all metrics data.

    Clears all active, historical, and aggregated metrics.
    """
    service = get_container().metrics_service()
    service.reset()
    return {"success": True, "message": "All metrics have been reset"}


# WebSocket connections for real-time streaming
_websocket_connections: set[WebSocket] = set()


async def broadcast_metrics(metrics: AgentMetrics):
    """Broadcast metrics to all connected WebSocket clients."""
    if not _websocket_connections:
        return

    message = json.dumps(
        {
            "type": "metrics_update",
            "data": metrics.to_dict(),
            "timestamp": datetime.now().isoformat(),
        }
    )

    disconnected = set()
    for ws in _websocket_connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.add(ws)

    # Clean up disconnected clients
    for ws in disconnected:
        _websocket_connections.discard(ws)


@router.websocket("/stream")
async def websocket_metrics_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time metrics streaming.

    Clients receive updates whenever agent metrics are recorded.

    Message format:
    {
        "type": "metrics_update",
        "data": { ...agent metrics... },
        "timestamp": "ISO timestamp"
    }
    """
    await websocket.accept()
    _websocket_connections.add(websocket)

    # Register callback for metrics updates
    service = get_container().metrics_service()
    service.add_async_callback(broadcast_metrics)

    # Send initial summary
    try:
        summary = service.get_summary()
        await websocket.send_text(
            json.dumps(
                {
                    "type": "initial_summary",
                    "data": summary,
                    "timestamp": datetime.now().isoformat(),
                }
            )
        )

        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for client messages (ping/pong, requests)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)

                # Handle client requests
                try:
                    message = json.loads(data)
                    if message.get("type") == "get_summary":
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "summary",
                                    "data": service.get_summary(),
                                    "timestamp": datetime.now().isoformat(),
                                }
                            )
                        )
                    elif message.get("type") == "get_agents":
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "agents",
                                    "data": service.get_aggregated_stats(),
                                    "timestamp": datetime.now().isoformat(),
                                }
                            )
                        )
                    elif message.get("type") == "get_modules":
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "modules",
                                    "data": service.get_module_stats(),
                                    "timestamp": datetime.now().isoformat(),
                                }
                            )
                        )
                    elif message.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                except json.JSONDecodeError:
                    pass

            except asyncio.TimeoutError:
                # Send heartbeat
                try:
                    await websocket.send_text(json.dumps({"type": "heartbeat"}))
                except Exception:
                    break

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        _websocket_connections.discard(websocket)
        service.remove_callback(broadcast_metrics)
