"""
Rate Limiting Service
=====================

Token bucket rate limiter with Redis and in-memory backends.
"""

import asyncio
import time
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

from src.logging import get_logger

from .config import EndpointConfig, RateLimitConfig, RateLimitPlan


@dataclass
class RateLimitResult:
    """Result of a rate limit check."""

    allowed: bool
    remaining: int
    limit: int
    reset_at: float  # Unix timestamp when bucket refills
    retry_after: Optional[int] = None  # Seconds until next allowed request

    def to_headers(self) -> Dict[str, str]:
        """Convert to rate limit headers."""
        headers = {
            "X-RateLimit-Limit": str(self.limit),
            "X-RateLimit-Remaining": str(max(0, self.remaining)),
            "X-RateLimit-Reset": str(int(self.reset_at)),
        }
        if self.retry_after is not None:
            headers["Retry-After"] = str(self.retry_after)
        return headers


@dataclass
class TokenBucket:
    """Token bucket state."""

    tokens: float
    last_update: float
    window_start: float
    window_count: int


class InMemoryBackend:
    """In-memory token bucket backend."""

    def __init__(self):
        self._buckets: Dict[str, TokenBucket] = {}
        self._lock = asyncio.Lock()

    async def get_bucket(self, key: str) -> Optional[TokenBucket]:
        """Get bucket state."""
        return self._buckets.get(key)

    async def set_bucket(self, key: str, bucket: TokenBucket) -> None:
        """Set bucket state."""
        async with self._lock:
            self._buckets[key] = bucket

    async def delete_bucket(self, key: str) -> None:
        """Delete bucket."""
        async with self._lock:
            self._buckets.pop(key, None)

    async def cleanup_expired(self, max_age: float = 3600) -> int:
        """Remove expired buckets."""
        now = time.time()
        expired = []
        async with self._lock:
            for key, bucket in self._buckets.items():
                if now - bucket.last_update > max_age:
                    expired.append(key)
            for key in expired:
                del self._buckets[key]
        return len(expired)


class RedisBackend:
    """Redis token bucket backend."""

    def __init__(self, config: RateLimitConfig):
        self.config = config
        self._redis = None
        self._connected = False

    async def _get_redis(self):
        """Get or create Redis connection."""
        if self._redis is None:
            try:
                import redis.asyncio as aioredis

                self._redis = aioredis.from_url(
                    self.config.redis_url,
                    password=self.config.redis_password,
                    ssl=self.config.redis_ssl,
                    decode_responses=True,
                )
                await self._redis.ping()
                self._connected = True
            except ImportError:
                raise ImportError(
                    "redis package required for Redis backend. "
                    "Install with: pip install redis>=5.0.0"
                )
            except Exception as e:
                self._connected = False
                raise ConnectionError(f"Failed to connect to Redis: {e}")
        return self._redis

    def _make_key(self, key: str) -> str:
        """Create full key with prefix."""
        return f"{self.config.key_prefix}:{key}"

    async def get_bucket(self, key: str) -> Optional[TokenBucket]:
        """Get bucket state from Redis."""
        try:
            redis = await self._get_redis()
            full_key = self._make_key(key)
            data = await redis.hgetall(full_key)
            if not data:
                return None
            return TokenBucket(
                tokens=float(data.get("tokens", 0)),
                last_update=float(data.get("last_update", 0)),
                window_start=float(data.get("window_start", 0)),
                window_count=int(data.get("window_count", 0)),
            )
        except Exception:
            return None

    async def set_bucket(self, key: str, bucket: TokenBucket, ttl: int = 86400) -> None:
        """Set bucket state in Redis with TTL."""
        try:
            redis = await self._get_redis()
            full_key = self._make_key(key)
            await redis.hset(
                full_key,
                mapping={
                    "tokens": str(bucket.tokens),
                    "last_update": str(bucket.last_update),
                    "window_start": str(bucket.window_start),
                    "window_count": str(bucket.window_count),
                },
            )
            await redis.expire(full_key, ttl)
        except Exception:
            pass

    async def delete_bucket(self, key: str) -> None:
        """Delete bucket from Redis."""
        try:
            redis = await self._get_redis()
            await redis.delete(self._make_key(key))
        except Exception:
            pass

    async def close(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            self._connected = False


class RateLimiter:
    """
    Token bucket rate limiter.

    Implements a token bucket algorithm with support for:
    - Per-minute, per-hour, and per-day limits
    - Burst allowance
    - Per-endpoint configuration
    - Tiered rate limit plans
    """

    def __init__(self, config: Optional[RateLimitConfig] = None):
        self.config = config or RateLimitConfig.from_env()
        self.logger = get_logger("RateLimiter")
        self._backend = None

        if self.config.enabled:
            self._init_backend()

    def _init_backend(self) -> None:
        """Initialize the backend."""
        try:
            if self.config.backend == "redis":
                self._backend = RedisBackend(self.config)
                self.logger.info(f"Initialized Redis rate limit backend: {self.config.redis_url}")
            else:
                self._backend = InMemoryBackend()
                self.logger.info("Initialized in-memory rate limit backend")
        except Exception as e:
            self.logger.warning(f"Failed to initialize rate limit backend: {e}. Rate limiting disabled.")
            self.config.enabled = False

    def _make_key(self, identifier: str, window: str, endpoint: str = "") -> str:
        """Create rate limit key."""
        parts = [identifier, window]
        if endpoint:
            # Normalize endpoint path
            endpoint = endpoint.replace("/", "_").strip("_")
            parts.append(endpoint)
        return ":".join(parts)

    async def check_rate_limit(
        self,
        identifier: str,
        endpoint: str = "",
        plan_name: Optional[str] = None,
    ) -> RateLimitResult:
        """
        Check if request is allowed under rate limits.

        Uses token bucket algorithm with multiple time windows.

        Args:
            identifier: Client identifier (IP address or user ID)
            endpoint: API endpoint path
            plan_name: Rate limit plan name (defaults to config default)

        Returns:
            RateLimitResult with allowed status and rate limit info
        """
        if not self.config.enabled or not self._backend:
            return RateLimitResult(allowed=True, remaining=1000, limit=1000, reset_at=time.time() + 60)

        # Get plan and endpoint config
        plan = self.config.get_plan(plan_name or self.config.default_plan)
        endpoint_config = self.config.get_endpoint_config(endpoint)

        # Check if endpoint is exempt
        if endpoint_config.exempt:
            return RateLimitResult(allowed=True, remaining=1000, limit=1000, reset_at=time.time() + 60)

        # Check if plan meets minimum requirement
        if endpoint_config.min_plan != "free":
            plan_order = ["free", "basic", "pro", "unlimited"]
            if plan.name in plan_order and endpoint_config.min_plan in plan_order:
                if plan_order.index(plan.name) < plan_order.index(endpoint_config.min_plan):
                    return RateLimitResult(
                        allowed=False,
                        remaining=0,
                        limit=0,
                        reset_at=time.time(),
                        retry_after=None,
                    )

        # Apply endpoint multiplier
        multiplier = endpoint_config.limit_multiplier

        # Check minute-level rate limit (primary)
        result = await self._check_window(
            identifier=identifier,
            endpoint=endpoint,
            window="minute",
            window_seconds=60,
            limit=int(plan.requests_per_minute * multiplier),
            burst=plan.burst_size,
        )

        if not result.allowed:
            if self.config.log_violations:
                self.logger.warning(
                    f"Rate limit exceeded: {identifier} on {endpoint} "
                    f"(minute limit: {result.limit})"
                )
            return result

        # Check hour-level rate limit
        hour_result = await self._check_window(
            identifier=identifier,
            endpoint=endpoint,
            window="hour",
            window_seconds=3600,
            limit=int(plan.requests_per_hour * multiplier),
            burst=plan.burst_size * 10,
        )

        if not hour_result.allowed:
            if self.config.log_violations:
                self.logger.warning(
                    f"Rate limit exceeded: {identifier} on {endpoint} "
                    f"(hour limit: {hour_result.limit})"
                )
            return hour_result

        # Check day-level rate limit
        day_result = await self._check_window(
            identifier=identifier,
            endpoint=endpoint,
            window="day",
            window_seconds=86400,
            limit=int(plan.requests_per_day * multiplier),
            burst=plan.burst_size * 100,
        )

        if not day_result.allowed:
            if self.config.log_violations:
                self.logger.warning(
                    f"Rate limit exceeded: {identifier} on {endpoint} "
                    f"(day limit: {day_result.limit})"
                )
            return day_result

        # Return the most restrictive remaining count
        return RateLimitResult(
            allowed=True,
            remaining=min(result.remaining, hour_result.remaining, day_result.remaining),
            limit=result.limit,
            reset_at=result.reset_at,
        )

    async def _check_window(
        self,
        identifier: str,
        endpoint: str,
        window: str,
        window_seconds: int,
        limit: int,
        burst: int,
    ) -> RateLimitResult:
        """
        Check rate limit for a specific time window using token bucket.

        Args:
            identifier: Client identifier
            endpoint: API endpoint
            window: Window name (minute, hour, day)
            window_seconds: Window duration in seconds
            limit: Max requests per window
            burst: Allowed burst above limit

        Returns:
            RateLimitResult for this window
        """
        key = self._make_key(identifier, window, endpoint)
        now = time.time()

        # Get or create bucket
        bucket = await self._backend.get_bucket(key)

        if bucket is None:
            # Create new bucket with full tokens
            bucket = TokenBucket(
                tokens=float(limit + burst),
                last_update=now,
                window_start=now,
                window_count=0,
            )

        # Calculate token refill
        # Tokens refill at rate of limit per window_seconds
        elapsed = now - bucket.last_update
        refill_rate = limit / window_seconds
        tokens_to_add = elapsed * refill_rate

        # Update tokens (capped at limit + burst)
        bucket.tokens = min(limit + burst, bucket.tokens + tokens_to_add)
        bucket.last_update = now

        # Check if request is allowed
        if bucket.tokens >= 1:
            # Consume a token
            bucket.tokens -= 1
            bucket.window_count += 1

            # Save updated bucket
            await self._backend.set_bucket(key, bucket, ttl=window_seconds * 2)

            # Calculate reset time
            reset_at = now + (1 / refill_rate) if bucket.tokens < limit else now + window_seconds

            return RateLimitResult(
                allowed=True,
                remaining=int(bucket.tokens),
                limit=limit,
                reset_at=reset_at,
            )
        else:
            # Calculate retry time
            tokens_needed = 1 - bucket.tokens
            retry_after = int(tokens_needed / refill_rate) + 1

            # Save bucket state
            await self._backend.set_bucket(key, bucket, ttl=window_seconds * 2)

            return RateLimitResult(
                allowed=False,
                remaining=0,
                limit=limit,
                reset_at=now + retry_after,
                retry_after=retry_after,
            )

    async def get_usage(
        self,
        identifier: str,
        endpoint: str = "",
        plan_name: Optional[str] = None,
    ) -> Dict[str, dict]:
        """
        Get current rate limit usage for an identifier.

        Args:
            identifier: Client identifier
            endpoint: API endpoint path
            plan_name: Rate limit plan name

        Returns:
            Dict with usage info for each window
        """
        if not self.config.enabled or not self._backend:
            return {}

        plan = self.config.get_plan(plan_name or self.config.default_plan)
        endpoint_config = self.config.get_endpoint_config(endpoint)
        multiplier = endpoint_config.limit_multiplier

        usage = {}
        now = time.time()

        for window, window_seconds, limit_attr in [
            ("minute", 60, "requests_per_minute"),
            ("hour", 3600, "requests_per_hour"),
            ("day", 86400, "requests_per_day"),
        ]:
            key = self._make_key(identifier, window, endpoint)
            bucket = await self._backend.get_bucket(key)

            limit = int(getattr(plan, limit_attr) * multiplier)

            if bucket:
                elapsed = now - bucket.last_update
                refill_rate = limit / window_seconds
                tokens = min(limit + plan.burst_size, bucket.tokens + elapsed * refill_rate)
                usage[window] = {
                    "remaining": int(tokens),
                    "limit": limit,
                    "used": bucket.window_count,
                    "reset_at": bucket.window_start + window_seconds,
                }
            else:
                usage[window] = {
                    "remaining": limit,
                    "limit": limit,
                    "used": 0,
                    "reset_at": now + window_seconds,
                }

        return usage

    async def reset_limits(self, identifier: str, endpoint: str = "") -> bool:
        """
        Reset rate limits for an identifier.

        Args:
            identifier: Client identifier
            endpoint: API endpoint (empty for all endpoints)

        Returns:
            True if reset successful
        """
        if not self._backend:
            return False

        try:
            for window in ["minute", "hour", "day"]:
                key = self._make_key(identifier, window, endpoint)
                await self._backend.delete_bucket(key)
            return True
        except Exception:
            return False

    async def health_check(self) -> Dict[str, any]:
        """Check rate limiter health."""
        if not self.config.enabled:
            return {"status": "disabled"}

        if not self._backend:
            return {"status": "error", "error": "No backend initialized"}

        try:
            if isinstance(self._backend, RedisBackend):
                redis = await self._backend._get_redis()
                await redis.ping()
            return {"status": "healthy", "backend": self.config.backend}
        except Exception as e:
            return {"status": "unhealthy", "backend": self.config.backend, "error": str(e)}

    async def close(self) -> None:
        """Close backend connections."""
        if isinstance(self._backend, RedisBackend):
            await self._backend.close()


# Singleton instance
_limiter: Optional[RateLimiter] = None


def get_rate_limiter(config: Optional[RateLimitConfig] = None) -> RateLimiter:
    """
    Get or create the singleton rate limiter.

    Args:
        config: Optional configuration. Only used on first call.

    Returns:
        RateLimiter instance
    """
    global _limiter
    if _limiter is None:
        _limiter = RateLimiter(config)
    return _limiter


def reset_rate_limiter() -> None:
    """Reset the singleton rate limiter."""
    global _limiter
    _limiter = None
