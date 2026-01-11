"""
Rate Limiting Configuration
===========================

Configuration classes for rate limiting service.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class RateLimitPlan:
    """Rate limit plan configuration for a user tier."""

    name: str
    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    requests_per_day: int = 10000
    burst_size: int = 10  # Max burst above rate limit
    concurrent_connections: int = 5  # For WebSocket limits

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "requests_per_minute": self.requests_per_minute,
            "requests_per_hour": self.requests_per_hour,
            "requests_per_day": self.requests_per_day,
            "burst_size": self.burst_size,
            "concurrent_connections": self.concurrent_connections,
        }


# Default rate limit plans
DEFAULT_PLANS = {
    "free": RateLimitPlan(
        name="free",
        requests_per_minute=10,
        requests_per_hour=100,
        requests_per_day=500,
        burst_size=5,
        concurrent_connections=1,
    ),
    "basic": RateLimitPlan(
        name="basic",
        requests_per_minute=30,
        requests_per_hour=500,
        requests_per_day=5000,
        burst_size=10,
        concurrent_connections=3,
    ),
    "pro": RateLimitPlan(
        name="pro",
        requests_per_minute=100,
        requests_per_hour=2000,
        requests_per_day=20000,
        burst_size=20,
        concurrent_connections=10,
    ),
    "unlimited": RateLimitPlan(
        name="unlimited",
        requests_per_minute=1000,
        requests_per_hour=100000,
        requests_per_day=1000000,
        burst_size=100,
        concurrent_connections=50,
    ),
}


@dataclass
class EndpointConfig:
    """Per-endpoint rate limit configuration."""

    # Multiplier applied to plan limits (0.5 = half the limit)
    limit_multiplier: float = 1.0
    # Whether this endpoint requires a specific minimum plan
    min_plan: str = "free"
    # Whether to skip rate limiting for this endpoint
    exempt: bool = False


# Default endpoint configurations
DEFAULT_ENDPOINT_CONFIGS = {
    # Heavy endpoints get lower multipliers
    "/api/v1/solve": EndpointConfig(limit_multiplier=0.5, min_plan="basic"),
    "/api/v1/chat": EndpointConfig(limit_multiplier=0.5),
    "/api/v1/research": EndpointConfig(limit_multiplier=0.3, min_plan="basic"),
    "/api/v1/question": EndpointConfig(limit_multiplier=0.5),
    "/api/v1/knowledge/upload": EndpointConfig(limit_multiplier=0.2),
    # Light endpoints get normal limits
    "/api/v1/settings": EndpointConfig(limit_multiplier=2.0),
    "/api/v1/dashboard": EndpointConfig(limit_multiplier=2.0),
    "/api/v1/analytics": EndpointConfig(limit_multiplier=2.0),
    # Health/system endpoints are exempt
    "/api/v1/system": EndpointConfig(exempt=True),
    "/health": EndpointConfig(exempt=True),
}


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting service."""

    # Enable/disable rate limiting
    enabled: bool = True

    # Backend type: "memory" or "redis"
    backend: str = "memory"

    # Redis configuration
    redis_url: str = "redis://localhost:6379/0"
    redis_password: Optional[str] = None
    redis_ssl: bool = False

    # Key prefix for Redis
    key_prefix: str = "pradeep:ratelimit"

    # Default plan for unauthenticated requests
    default_plan: str = "free"

    # Rate limit plans
    plans: Dict[str, RateLimitPlan] = field(default_factory=lambda: DEFAULT_PLANS.copy())

    # Per-endpoint configurations
    endpoint_configs: Dict[str, EndpointConfig] = field(
        default_factory=lambda: DEFAULT_ENDPOINT_CONFIGS.copy()
    )

    # Whether to include rate limit headers in responses
    include_headers: bool = True

    # Log rate limit violations
    log_violations: bool = True

    @classmethod
    def from_env(cls) -> "RateLimitConfig":
        """Load configuration from environment variables."""
        return cls(
            enabled=os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true",
            backend=os.getenv("RATE_LIMIT_BACKEND", "memory"),
            redis_url=os.getenv("RATE_LIMIT_REDIS_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0")),
            redis_password=os.getenv("RATE_LIMIT_REDIS_PASSWORD", os.getenv("REDIS_PASSWORD")),
            redis_ssl=os.getenv("RATE_LIMIT_REDIS_SSL", "false").lower() == "true",
            default_plan=os.getenv("RATE_LIMIT_DEFAULT_PLAN", "free"),
            include_headers=os.getenv("RATE_LIMIT_INCLUDE_HEADERS", "true").lower() == "true",
            log_violations=os.getenv("RATE_LIMIT_LOG_VIOLATIONS", "true").lower() == "true",
        )

    def get_plan(self, plan_name: str) -> RateLimitPlan:
        """Get a rate limit plan by name, falling back to default."""
        return self.plans.get(plan_name, self.plans.get(self.default_plan, DEFAULT_PLANS["free"]))

    def get_endpoint_config(self, path: str) -> EndpointConfig:
        """Get endpoint configuration, with prefix matching."""
        # Try exact match first
        if path in self.endpoint_configs:
            return self.endpoint_configs[path]

        # Try prefix matching
        for endpoint_path, config in self.endpoint_configs.items():
            if path.startswith(endpoint_path):
                return config

        # Return default config
        return EndpointConfig()
