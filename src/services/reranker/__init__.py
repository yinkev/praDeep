"""
Reranker Service
================

Unified reranker service for praDeep.
"""

from .adapters import (
    BaseRerankerAdapter,
    Qwen3VLRerankerAdapter,
    RerankRequest,
    RerankResponse,
    RerankResult,
)
from .config import RerankerConfig, get_reranker_config
from .service import RerankerService, get_reranker_service, reset_reranker_service

__all__ = [
    "RerankerService",
    "RerankerConfig",
    "get_reranker_service",
    "get_reranker_config",
    "reset_reranker_service",
    "BaseRerankerAdapter",
    "RerankRequest",
    "RerankResponse",
    "RerankResult",
    "Qwen3VLRerankerAdapter",
]
