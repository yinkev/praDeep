"""
Base Reranker Adapter
=====================

Abstract base class for reranker adapters.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class RerankRequest:
    """
    Standard reranker request structure.

    Args:
        query: Query text
        passages: List of passages to rerank
        model: Optional model override
        max_length: Max token length for the reranker input
    """

    query: str
    passages: List[str]
    model: Optional[str] = None
    max_length: Optional[int] = None


@dataclass
class RerankResponse:
    """Standard reranker response structure."""

    scores: List[float]
    model: str
    usage: Dict[str, Any]


@dataclass
class RerankResult:
    """Ranked rerank result with score and passage."""

    index: int
    score: float
    passage: str


class BaseRerankerAdapter(ABC):
    """
    Base class for all reranker adapters.

    Each adapter implements the rerank interface for a provider.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the adapter with configuration.

        Args:
            config: Dictionary containing:
                - model: Model name to use
                - device: Device string (e.g., "mps", "cpu")
                - dtype: Torch dtype string (e.g., "bfloat16")
                - max_length: Max token length
                - request_timeout: Request timeout in seconds
        """
        self.model = config.get("model")
        self.device = config.get("device")
        self.dtype = config.get("dtype")
        self.max_length = config.get("max_length")
        self.request_timeout = config.get("request_timeout", 30)

    @abstractmethod
    async def rerank(self, request: RerankRequest) -> RerankResponse:
        """
        Rerank passages for a query.

        Args:
            request: RerankRequest with query and passages

        Returns:
            RerankResponse with scores and metadata
        """
        raise NotImplementedError

    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Return information about the configured model.

        Returns:
            Dictionary with model metadata
        """
        raise NotImplementedError
