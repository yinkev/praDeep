"""
Adapters Package
================

Embedding adapters for different providers.
"""

from .base import BaseEmbeddingAdapter, EmbeddingRequest, EmbeddingResponse
from .cohere import CohereEmbeddingAdapter
from .jina import JinaEmbeddingAdapter
from .ollama import OllamaEmbeddingAdapter
from .openai_compatible import OpenAICompatibleEmbeddingAdapter
from .qwen3_vl import Qwen3VLEmbeddingAdapter

__all__ = [
    "BaseEmbeddingAdapter",
    "EmbeddingRequest",
    "EmbeddingResponse",
    "OpenAICompatibleEmbeddingAdapter",
    "JinaEmbeddingAdapter",
    "CohereEmbeddingAdapter",
    "OllamaEmbeddingAdapter",
    "Qwen3VLEmbeddingAdapter",
]
