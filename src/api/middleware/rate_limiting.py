"""
Rate Limiting Middleware
========================

FastAPI middleware for rate limiting requests.
"""

from typing import Callable, Optional

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.logging import get_logger
from src.rate_limiting.config import RateLimitConfig
from src.rate_limiting.service import get_rate_limiter


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using token bucket algorithm.

    Applies per-user and per-endpoint rate limits based on configuration.
    Identifies users by IP address (or X-Forwarded-For header behind proxy).
    """

    def __init__(
        self,
        app: ASGIApp,
        config: Optional[RateLimitConfig] = None,
        get_identifier: Optional[Callable[[Request], str]] = None,
        get_plan: Optional[Callable[[Request], str]] = None,
    ):
        """
        Initialize rate limiting middleware.

        Args:
            app: ASGI application
            config: Rate limit configuration (loads from env if not provided)
            get_identifier: Custom function to extract client identifier from request
            get_plan: Custom function to determine rate limit plan from request
        """
        super().__init__(app)
        self.config = config or RateLimitConfig.from_env()
        self.limiter = get_rate_limiter(self.config)
        self.logger = get_logger("RateLimitMiddleware")
        self._get_identifier = get_identifier or self._default_get_identifier
        self._get_plan = get_plan or self._default_get_plan

    def _default_get_identifier(self, request: Request) -> str:
        """
        Extract client identifier from request.

        Uses X-Forwarded-For header if present (for proxy setups),
        otherwise falls back to client IP.
        """
        # Check for forwarded IP (behind reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain (original client)
            return forwarded_for.split(",")[0].strip()

        # Check for real IP header (common in nginx setups)
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Fall back to direct client IP
        if request.client:
            return request.client.host

        return "unknown"

    def _default_get_plan(self, request: Request) -> str:
        """
        Determine rate limit plan from request.

        Override this method or provide get_plan callback to implement
        user-based tier determination from JWT tokens, API keys, etc.
        """
        # Check for plan in headers (for API key based auth)
        plan_header = request.headers.get("X-RateLimit-Plan")
        if plan_header:
            return plan_header

        # Check for plan in query params (for testing)
        plan_param = request.query_params.get("_rate_limit_plan")
        if plan_param:
            return plan_param

        # Default to free plan
        return self.config.default_plan

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through rate limiter."""
        # Skip if rate limiting is disabled
        if not self.config.enabled:
            return await call_next(request)

        # Get client identifier and plan
        identifier = self._get_identifier(request)
        plan_name = self._get_plan(request)
        endpoint = request.url.path

        # Check rate limit
        result = await self.limiter.check_rate_limit(
            identifier=identifier,
            endpoint=endpoint,
            plan_name=plan_name,
        )

        if not result.allowed:
            # Rate limit exceeded - return 429
            response = JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": result.retry_after,
                },
            )

            # Add rate limit headers
            if self.config.include_headers:
                for key, value in result.to_headers().items():
                    response.headers[key] = value

            return response

        # Process the request
        response = await call_next(request)

        # Add rate limit headers to successful responses
        if self.config.include_headers:
            for key, value in result.to_headers().items():
                response.headers[key] = value

        return response
