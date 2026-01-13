"""
Embedding Client
================

Unified embedding client for all praDeep services.
Now supports multiple providers through adapters.
Includes intelligent caching to reduce redundant embedding computations.
"""

import os
from typing import List, Optional

from src.logging import get_logger

from .adapters.base import EmbeddingRequest
from .config import EmbeddingConfig, get_embedding_config
from .provider import EmbeddingProviderManager, get_embedding_provider_manager


class EmbeddingClient:
    """
    Unified embedding client for all services.

    Delegates to provider-specific adapters based on configuration.
    Supports: OpenAI, Azure OpenAI, Cohere, Ollama, Jina, HuggingFace, Google.
    Includes caching layer to reduce redundant API calls.
    """

    def __init__(
        self, config: Optional[EmbeddingConfig] = None, enable_cache: Optional[bool] = None
    ):
        """
        Initialize embedding client.

        Args:
            config: Embedding configuration. If None, loads from environment.
            enable_cache: Enable embedding caching. Defaults to CACHE_ENABLED env var.
        """
        self.config = config or get_embedding_config()
        self.logger = get_logger("EmbeddingClient")
        self.manager: EmbeddingProviderManager = get_embedding_provider_manager()

        # Initialize cache
        if enable_cache is None:
            enable_cache = os.getenv("CACHE_ENABLED", "true").lower() == "true"
        self._cache_enabled = enable_cache
        self._cache = None
        if enable_cache:
            try:
                from src.services.cache import get_cache_client

                self._cache = get_cache_client()
            except Exception as e:
                self.logger.warning(f"Failed to initialize cache: {e}")

        # Initialize adapter based on binding configuration
        try:
            adapter = self.manager.get_adapter(
                self.config.binding,
                {
                    "api_key": self.config.api_key,
                    "base_url": self.config.base_url,
                    "model": self.config.model,
                    "dimensions": self.config.dim,
                    "request_timeout": self.config.request_timeout,
                },
            )
            self.manager.set_adapter(adapter)

            self.logger.info(
                f"Initialized embedding client with {self.config.binding} adapter "
                f"(model: {self.config.model}, dimensions: {self.config.dim})"
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize embedding adapter: {e}")
            raise

    async def embed(self, texts: List[str], skip_cache: bool = False) -> List[List[float]]:
        """
        Get embeddings for texts using the configured adapter.

        Uses caching to avoid redundant embedding computations.
        Embeddings are cached with a 30-day TTL by default.

        Args:
            texts: List of texts to embed
            skip_cache: Skip cache lookup (force fresh embeddings)

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        # Check cache for existing embeddings
        cached_embeddings = [None] * len(texts)
        uncached_indices = list(range(len(texts)))

        if self._cache_enabled and self._cache and not skip_cache:
            cached_embeddings, uncached_indices = await self._cache.get_embeddings(texts)

            if not uncached_indices:
                # All embeddings found in cache
                self.logger.debug(f"All {len(texts)} embeddings from cache")
                return cached_embeddings

        # Get embeddings for uncached texts
        if uncached_indices:
            uncached_texts = [texts[i] for i in uncached_indices]
            adapter = self.manager.get_active_adapter()

            request = EmbeddingRequest(
                texts=uncached_texts,
                model=self.config.model,
                dimensions=self.config.dim,
                input_type=self.config.input_type,
            )

            try:
                response = await adapter.embed(request)
                new_embeddings = response.embeddings

                self.logger.debug(
                    f"Generated {len(new_embeddings)} embeddings using {self.config.binding} "
                    f"({len(texts) - len(uncached_indices)} from cache)"
                )

                # Cache the new embeddings
                if self._cache_enabled and self._cache:
                    await self._cache.set_embeddings(uncached_texts, new_embeddings)

                # Merge cached and new embeddings
                for idx, embedding in zip(uncached_indices, new_embeddings):
                    cached_embeddings[idx] = embedding

            except Exception as e:
                self.logger.error(f"Embedding request failed: {e}")
                raise

        return cached_embeddings

    def embed_sync(self, texts: List[str]) -> List[List[float]]:
        """
        Synchronous wrapper for embed().

        Use this when you need to call from non-async context.
        """
        import asyncio

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(asyncio.run, self.embed(texts))
                    return future.result()
            else:
                return loop.run_until_complete(self.embed(texts))
        except RuntimeError:
            return asyncio.run(self.embed(texts))

    def get_embedding_func(self):
        """
        Get an EmbeddingFunc compatible with LightRAG.

        Returns:
            EmbeddingFunc instance
        """
        from lightrag.utils import EmbeddingFunc
        import numpy as np

        # Create async wrapper that uses our adapter system
        async def embedding_wrapper(texts: List[str]) -> "np.ndarray":
            embeddings = await self.embed(texts)
            return np.asarray(embeddings, dtype=np.float32)

        return EmbeddingFunc(
            embedding_dim=self.config.dim,
            max_token_size=self.config.max_tokens,
            func=embedding_wrapper,
        )


# Singleton instance
_client: Optional[EmbeddingClient] = None


def get_embedding_client(config: Optional[EmbeddingConfig] = None) -> EmbeddingClient:
    """
    Get or create the singleton embedding client.

    Args:
        config: Optional configuration. Only used on first call.

    Returns:
        EmbeddingClient instance
    """
    from src.di import get_container

    return get_container().embedding_client(config)


def reset_embedding_client():
    """Reset the singleton embedding client."""
    from src.di import get_container

    get_container().clear("embedding_client")
    global _client
    _client = None
