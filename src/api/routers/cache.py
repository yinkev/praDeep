"""
Cache Management API Router
============================

Provides endpoints for managing the RAG query cache.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.logging import get_logger
from src.services.cache import get_cache_client

logger = get_logger("CacheAPI")
router = APIRouter()


class CacheStatsResponse(BaseModel):
    """Response model for cache statistics."""

    enabled: bool
    status: str
    backend: Optional[str] = None
    stats: Optional[dict] = None
    error: Optional[str] = None


class CacheInvalidateRequest(BaseModel):
    """Request model for cache invalidation."""

    kb_name: Optional[str] = None


class CacheInvalidateResponse(BaseModel):
    """Response model for cache invalidation."""

    success: bool
    deleted_count: int
    message: str


@router.get("/stats", response_model=CacheStatsResponse)
async def get_cache_stats():
    """
    Get cache statistics.

    Returns cache health status, hit/miss counts, and hit rate.
    """
    try:
        cache = get_cache_client()
        health = await cache.health_check()

        return CacheStatsResponse(
            enabled=cache.config.enabled,
            status=health.get("status", "unknown"),
            backend=health.get("backend"),
            stats=health.get("stats"),
        )
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        return CacheStatsResponse(
            enabled=False,
            status="error",
            error=str(e),
        )


@router.post("/invalidate", response_model=CacheInvalidateResponse)
async def invalidate_cache(request: CacheInvalidateRequest):
    """
    Invalidate cache entries.

    If kb_name is provided, only invalidates entries for that knowledge base.
    Otherwise, invalidates all cache entries.
    """
    try:
        cache = get_cache_client()

        if request.kb_name:
            deleted = await cache.invalidate_kb(request.kb_name)
            message = f"Invalidated {deleted} cache entries for KB '{request.kb_name}'"
        else:
            deleted = await cache.clear_all()
            message = f"Cleared all {deleted} cache entries"

        logger.info(message)

        return CacheInvalidateResponse(
            success=True,
            deleted_count=deleted,
            message=message,
        )
    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def cache_health():
    """
    Check cache health.

    Returns simple health status for monitoring.
    """
    try:
        cache = get_cache_client()
        health = await cache.health_check()

        return {
            "healthy": health.get("status") == "healthy",
            "backend": health.get("backend"),
        }
    except Exception as e:
        return {
            "healthy": False,
            "error": str(e),
        }
