"""
Reranker Service
===============

Unified reranker service for all praDeep modules.
"""

from typing import List, Optional

from src.logging import get_logger

from .adapters import BaseRerankerAdapter, Qwen3VLRerankerAdapter, RerankRequest, RerankResult
from .config import RerankerConfig, get_reranker_config


class RerankerService:
    """
    Unified reranker service.

    Delegates to provider-specific adapters based on configuration.
    """

    ADAPTER_MAPPING = {
        "qwen3_vl": Qwen3VLRerankerAdapter,
    }

    def __init__(
        self,
        config: Optional[RerankerConfig] = None,
        adapter: Optional[BaseRerankerAdapter] = None,
    ):
        """
        Initialize reranker service.

        Args:
            config: Reranker configuration. If None, loads from environment.
            adapter: Optional adapter override (useful for testing).
        """
        self.config = config or get_reranker_config()
        self.logger = get_logger("RerankerService")

        if adapter is not None:
            self.adapter = adapter
        else:
            self.adapter = self._init_adapter()

        self.logger.info(
            f"Initialized reranker service with {self.config.binding} adapter "
            f"(model: {self.config.model})"
        )

    async def rerank(self, query: str, passages: List[str]) -> List[RerankResult]:
        """
        Rerank passages for a query.

        Args:
            query: Query text
            passages: Passages to rerank

        Returns:
            List of RerankResult sorted by score (descending)
        """
        if not passages:
            return []

        request = RerankRequest(
            query=query,
            passages=passages,
            model=self.config.model,
            max_length=self.config.max_length,
        )

        try:
            response = await self.adapter.rerank(request)
        except Exception as exc:
            if "MPS" in str(exc):
                self.logger.warning(f"Reranker failed due to MPS: {exc}")
                raise

            self.logger.warning(f"Reranker failed, using original order: {exc}")
            return [
                RerankResult(index=i, score=0.0, passage=passages[i])
                for i in range(len(passages))
            ]

        if len(response.scores) != len(passages):
            self.logger.warning(
                f"Reranker returned {len(response.scores)} scores for {len(passages)} passages; "
                "using original order"
            )
            return [
                RerankResult(index=i, score=0.0, passage=passages[i])
                for i in range(len(passages))
            ]

        results = [
            RerankResult(index=i, score=score, passage=passages[i])
            for i, score in enumerate(response.scores)
        ]
        results.sort(key=lambda item: item.score, reverse=True)
        return results

    def _init_adapter(self) -> BaseRerankerAdapter:
        adapter_class = self.ADAPTER_MAPPING.get(self.config.binding)
        if not adapter_class:
            supported = ", ".join(self.ADAPTER_MAPPING.keys())
            raise ValueError(
                f"Unknown reranker binding: '{self.config.binding}'. "
                f"Supported providers: {supported}"
            )

        return adapter_class(
            {
                "model": self.config.model,
                "device": self.config.device,
                "dtype": self.config.dtype,
                "max_length": self.config.max_length,
                "request_timeout": self.config.request_timeout,
            }
        )


_service: Optional[RerankerService] = None


def get_reranker_service(
    config: Optional[RerankerConfig] = None,
) -> Optional[RerankerService]:
    """
    Get or create the singleton reranker service.

    Args:
        config: Optional configuration. Only used on first call.

    Returns:
        RerankerService instance or None if initialization fails
    """
    global _service
    if _service is None:
        try:
            _service = RerankerService(config)
        except Exception as exc:
            logger = get_logger("RerankerService")
            logger.warning(f"Reranker unavailable: {exc}")
            return None
    return _service


def reset_reranker_service() -> None:
    """Reset the singleton reranker service."""
    global _service
    _service = None
