"""
RAG Service
===========

Unified RAG service providing a single entry point for all RAG operations.
Includes intelligent caching layer for query results.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.logging import get_logger
from src.services.cache import get_cache_client

# Default knowledge base directory
DEFAULT_KB_BASE_DIR = str(
    Path(__file__).resolve().parent.parent.parent.parent / "data" / "knowledge_bases"
)


class RAGService:
    """
    Unified RAG service entry point.

    Provides a clean interface for RAG operations:
    - Knowledge base initialization
    - Search/retrieval
    - Knowledge base deletion

    Usage:
        # Default configuration
        service = RAGService()
        await service.initialize("my_kb", ["doc1.pdf"])
        result = await service.search("query", "my_kb")

        # Custom configuration for testing
        service = RAGService(kb_base_dir="/tmp/test_kb", provider="llamaindex")
        await service.initialize("test", ["test.txt"])
    """

    def __init__(
        self,
        kb_base_dir: Optional[str] = None,
        provider: Optional[str] = None,
        enable_cache: Optional[bool] = None,
    ):
        """
        Initialize RAG service.

        Args:
            kb_base_dir: Base directory for knowledge bases.
                         Defaults to data/knowledge_bases.
            provider: RAG pipeline provider to use.
                      Defaults to RAG_PROVIDER env var or "raganything".
            enable_cache: Enable query result caching.
                          Defaults to CACHE_ENABLED env var or True.
        """
        self.logger = get_logger("RAGService")
        self.kb_base_dir = kb_base_dir or DEFAULT_KB_BASE_DIR
        self.provider = provider or os.getenv("RAG_PROVIDER", "raganything")
        self._pipeline = None

        # Initialize cache
        if enable_cache is None:
            enable_cache = os.getenv("CACHE_ENABLED", "true").lower() == "true"
        self._cache_enabled = enable_cache
        self._cache = get_cache_client() if enable_cache else None

    def _get_pipeline(self):
        """Get or create pipeline instance."""
        if self._pipeline is None:
            from .factory import get_pipeline

            self._pipeline = get_pipeline(self.provider, kb_base_dir=self.kb_base_dir)
        return self._pipeline

    async def initialize(self, kb_name: str, file_paths: List[str], **kwargs) -> bool:
        """
        Initialize a knowledge base with documents.

        Args:
            kb_name: Knowledge base name
            file_paths: List of file paths to process
            **kwargs: Additional arguments passed to pipeline

        Returns:
            True if successful

        Example:
            service = RAGService()
            success = await service.initialize("my_kb", ["doc1.pdf", "doc2.txt"])
        """
        self.logger.info(f"Initializing KB '{kb_name}' with provider '{self.provider}'")
        pipeline = self._get_pipeline()
        return await pipeline.initialize(kb_name=kb_name, file_paths=file_paths, **kwargs)

    async def search(
        self,
        query: str,
        kb_name: str,
        mode: str = "hybrid",
        skip_cache: bool = False,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Search a knowledge base.

        Args:
            query: Search query
            kb_name: Knowledge base name
            mode: Search mode (hybrid, local, global, naive)
            skip_cache: Skip cache lookup (force fresh query)
            **kwargs: Additional arguments passed to pipeline

        Returns:
            Search results dictionary with keys:
            - query: Original query
            - answer: Generated answer
            - content: Retrieved content
            - mode: Search mode used
            - provider: Pipeline provider used
            - cached: Whether result was from cache

        Example:
            service = RAGService()
            result = await service.search("What is ML?", "textbook")
            print(result["answer"])
        """
        self.logger.info(f"Searching KB '{kb_name}' with query: {query[:50]}...")

        # Check cache first
        if self._cache_enabled and self._cache and not skip_cache:
            cached_result = await self._cache.get_query_result(query, kb_name, mode)
            if cached_result:
                self.logger.info(f"Cache HIT for query: {query[:50]}...")
                cached_result["cached"] = True
                return cached_result

        pipeline = self._get_pipeline()
        result = await pipeline.search(query=query, kb_name=kb_name, mode=mode, **kwargs)

        # Ensure consistent return format
        if "query" not in result:
            result["query"] = query
        if "answer" not in result and "content" in result:
            result["answer"] = result["content"]
        if "content" not in result and "answer" in result:
            result["content"] = result["answer"]
        if "provider" not in result:
            result["provider"] = self.provider
        if "mode" not in result:
            result["mode"] = mode
        result["cached"] = False

        # Store in cache
        if self._cache_enabled and self._cache:
            await self._cache.set_query_result(query, kb_name, mode, result)
            self.logger.debug(f"Cached result for query: {query[:50]}...")

        return result

    async def delete(self, kb_name: str) -> bool:
        """
        Delete a knowledge base.

        Args:
            kb_name: Knowledge base name

        Returns:
            True if successful

        Example:
            service = RAGService()
            success = await service.delete("old_kb")
        """
        self.logger.info(f"Deleting KB '{kb_name}'")

        # Invalidate cache entries for this KB
        if self._cache_enabled and self._cache:
            deleted_count = await self._cache.invalidate_kb(kb_name)
            self.logger.info(f"Invalidated {deleted_count} cache entries for KB '{kb_name}'")

        pipeline = self._get_pipeline()

        if hasattr(pipeline, "delete"):
            return await pipeline.delete(kb_name=kb_name)

        # Fallback: delete directory manually
        import shutil

        kb_dir = Path(self.kb_base_dir) / kb_name
        if kb_dir.exists():
            shutil.rmtree(kb_dir)
            self.logger.info(f"Deleted KB directory: {kb_dir}")
            return True
        return False

    async def invalidate_cache(self, kb_name: Optional[str] = None) -> int:
        """
        Invalidate cache entries.

        Args:
            kb_name: Optional KB name to invalidate. If None, invalidates all.

        Returns:
            Number of entries invalidated
        """
        if not self._cache:
            return 0

        if kb_name:
            return await self._cache.invalidate_kb(kb_name)
        else:
            return await self._cache.clear_all()

    async def get_cache_stats(self) -> dict:
        """
        Get cache statistics.

        Returns:
            Cache stats dictionary with hits, misses, hit_rate, etc.
        """
        if not self._cache:
            return {"enabled": False}

        health = await self._cache.health_check()
        return {
            "enabled": self._cache_enabled,
            **health,
        }

    @staticmethod
    def list_providers() -> List[Dict[str, str]]:
        """
        List available RAG pipeline providers.

        Returns:
            List of provider info dictionaries

        Example:
            providers = RAGService.list_providers()
            for p in providers:
                print(f"{p['id']}: {p['description']}")
        """
        from .factory import list_pipelines

        return list_pipelines()

    @staticmethod
    def get_current_provider() -> str:
        """
        Get the currently configured default provider.

        Returns:
            Provider name from RAG_PROVIDER env var or default
        """
        return os.getenv("RAG_PROVIDER", "raganything")

    @staticmethod
    def has_provider(name: str) -> bool:
        """
        Check if a provider is available.

        Args:
            name: Provider name

        Returns:
            True if provider exists
        """
        from .factory import has_pipeline

        return has_pipeline(name)
