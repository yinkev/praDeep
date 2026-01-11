from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class _RagKey:
    kb_base_dir: str | None
    provider: str | None


class Container:
    """
    Lightweight DI container.

    Goals:
    - Centralize singleton lifecycles (prompt manager, metrics, clients, etc.)
    - Enable constructor injection for easier testing (override instances)
    - Avoid adding third-party DI dependencies
    """

    def __init__(self) -> None:
        self._singletons: dict[str, Any] = {}
        self._rag_services: dict[_RagKey, Any] = {}

    def override(self, key: str, instance: Any) -> None:
        self._singletons[key] = instance

    def clear(self, key: str) -> None:
        self._singletons.pop(key, None)

    # ---------------------------------------------------------------------
    # Core services
    # ---------------------------------------------------------------------

    def prompt_manager(self):
        key = "prompt_manager"
        if key not in self._singletons:
            from src.services.prompt import PromptManager

            self._singletons[key] = PromptManager()
        return self._singletons[key]

    def metrics_service(self, enabled: bool = True, save_dir: str | None = None, history_limit: int = 1000):
        key = "metrics_service"
        if key not in self._singletons:
            from src.services.metrics import MetricsService

            self._singletons[key] = MetricsService(
                enabled=enabled,
                save_dir=save_dir,
                history_limit=history_limit,
            )
        return self._singletons[key]

    def llm_client(self, config: Any | None = None):
        key = "llm_client"
        if key not in self._singletons:
            from src.services.llm.client import LLMClient

            self._singletons[key] = LLMClient(config)
        return self._singletons[key]

    def embedding_client(self, config: Any | None = None):
        key = "embedding_client"
        if key not in self._singletons:
            from src.services.embedding.client import EmbeddingClient

            self._singletons[key] = EmbeddingClient(config)
        return self._singletons[key]

    def rag_service(self, kb_base_dir: Optional[str] = None, provider: Optional[str] = None):
        rag_key = _RagKey(kb_base_dir=kb_base_dir, provider=provider)
        if rag_key not in self._rag_services:
            from src.services.rag import RAGService

            self._rag_services[rag_key] = RAGService(kb_base_dir=kb_base_dir, provider=provider)
        return self._rag_services[rag_key]

    def reranker_service(self, config: Any | None = None):
        key = "reranker_service"
        if key not in self._singletons:
            from src.services.reranker.service import RerankerService
            from src.logging import get_logger

            try:
                self._singletons[key] = RerankerService(config)
            except Exception as exc:
                get_logger("RerankerService").warning(f"Reranker unavailable: {exc}")
                self._singletons[key] = None
        return self._singletons[key]

    def paper_recommendation_service(
        self,
        semantic_scholar_api_key: str | None = None,
        openalex_email: str | None = None,
    ):
        key = "paper_recommendation_service"
        if key not in self._singletons:
            import os
            from src.services.paper_recommendation.service import PaperRecommendationService

            if semantic_scholar_api_key is None:
                semantic_scholar_api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
            if openalex_email is None:
                openalex_email = os.getenv("OPENALEX_EMAIL")

            self._singletons[key] = PaperRecommendationService(
                semantic_scholar_api_key=semantic_scholar_api_key,
                openalex_email=openalex_email,
            )
        return self._singletons[key]


_container: Container | None = None


def get_container() -> Container:
    global _container
    if _container is None:
        _container = Container()
    return _container


def set_container(container: Container | None) -> None:
    global _container
    _container = container

