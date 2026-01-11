"""
Rate Limit API Router
=====================

API endpoints for rate limit status and management.
"""

from typing import Optional

from fastapi import APIRouter, Request

from src.rate_limiting.service import get_rate_limiter

router = APIRouter()


@router.get("/status")
async def get_rate_limit_status(request: Request, endpoint: Optional[str] = None):
    """
    Get current rate limit status for the requesting client.

    Returns:
        Rate limit usage across all time windows
    """
    limiter = get_rate_limiter()

    # Get client identifier (same logic as middleware)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        identifier = forwarded_for.split(",")[0].strip()
    else:
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            identifier = real_ip.strip()
        elif request.client:
            identifier = request.client.host
        else:
            identifier = "unknown"

    # Get plan from headers or default
    plan_name = request.headers.get("X-RateLimit-Plan", limiter.config.default_plan)

    usage = await limiter.get_usage(
        identifier=identifier,
        endpoint=endpoint or "",
        plan_name=plan_name,
    )

    return {
        "identifier": identifier,
        "plan": plan_name,
        "endpoint": endpoint,
        "usage": usage,
    }


@router.get("/plans")
async def get_rate_limit_plans():
    """
    Get all available rate limit plans and their limits.

    Returns:
        Dictionary of plan configurations
    """
    limiter = get_rate_limiter()
    return {
        "plans": {name: plan.to_dict() for name, plan in limiter.config.plans.items()},
        "default_plan": limiter.config.default_plan,
    }


@router.get("/health")
async def rate_limit_health():
    """
    Check rate limiter health status.

    Returns:
        Health status of the rate limiter backend
    """
    limiter = get_rate_limiter()
    health = await limiter.health_check()
    return health


@router.get("/config")
async def get_rate_limit_config():
    """
    Get current rate limiting configuration.

    Returns:
        Rate limiting configuration details
    """
    limiter = get_rate_limiter()
    return {
        "enabled": limiter.config.enabled,
        "backend": limiter.config.backend,
        "default_plan": limiter.config.default_plan,
        "include_headers": limiter.config.include_headers,
        "plans": {name: plan.to_dict() for name, plan in limiter.config.plans.items()},
    }
