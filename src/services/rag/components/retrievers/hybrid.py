"""
Hybrid Retriever
================

Hybrid retriever combining multiple retrieval strategies.
"""

from pathlib import Path
import sys
import json
from typing import Any, Dict, Optional

from ..base import BaseComponent


class HybridRetriever(BaseComponent):
    """
    Hybrid retriever combining graph and vector retrieval.

    Uses LightRAG's hybrid mode for retrieval.
    """

    name = "hybrid_retriever"
    _instances: Dict[str, any] = {}

    def __init__(self, kb_base_dir: Optional[str] = None):
        """
        Initialize hybrid retriever.

        Args:
            kb_base_dir: Base directory for knowledge bases
        """
        super().__init__()
        self.kb_base_dir = kb_base_dir or str(
            Path(__file__).resolve().parent.parent.parent.parent.parent.parent
            / "data"
            / "knowledge_bases"
        )

    def _get_rag_instance(self, kb_name: str):
        """Get or create a RAGAnything instance."""
        working_dir = str(Path(self.kb_base_dir) / kb_name / "rag_storage")

        if working_dir in self._instances:
            return self._instances[working_dir]

        # Add RAG-Anything path
        project_root = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        raganything_path = project_root.parent / "raganything" / "RAG-Anything"
        if raganything_path.exists() and str(raganything_path) not in sys.path:
            sys.path.insert(0, str(raganything_path))

        try:
            from lightrag.llm.openai import openai_complete_if_cache
            from raganything import RAGAnything, RAGAnythingConfig

            from src.services.embedding import get_embedding_client
            from src.services.llm import get_llm_client

            llm_client = get_llm_client()
            embed_client = get_embedding_client()

            def llm_model_func(prompt, system_prompt=None, history_messages=[], **kwargs):
                return openai_complete_if_cache(
                    llm_client.config.model,
                    prompt,
                    system_prompt=system_prompt,
                    history_messages=history_messages,
                    api_key=llm_client.config.api_key,
                    base_url=llm_client.config.base_url,
                    **kwargs,
                )

            config = RAGAnythingConfig(
                working_dir=working_dir,
                enable_image_processing=True,
                enable_table_processing=True,
                enable_equation_processing=True,
            )

            rag = RAGAnything(
                config=config,
                llm_model_func=llm_model_func,
                embedding_func=embed_client.get_embedding_func(),
            )

            self._instances[working_dir] = rag
            return rag

        except ImportError as e:
            self.logger.error(f"Failed to import RAG-Anything: {e}")
            raise

    async def process(
        self,
        query: str,
        kb_name: str,
        mode: str = "hybrid",
        only_need_context: bool = False,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Search using hybrid retrieval.

        Args:
            query: Search query
            kb_name: Knowledge base name
            mode: Search mode (hybrid, local, global, naive)
            only_need_context: Whether to only return context without answer
            **kwargs: Additional arguments

        Returns:
            Search results dictionary
        """
        self.logger.info(f"Hybrid search ({mode}) in {kb_name}: {query[:50]}...")

        from src.logging.adapters import LightRAGLogContext

        with LightRAGLogContext(scene="rag_search"):
            rag = self._get_rag_instance(kb_name)
            await rag._ensure_lightrag_initialized()

            answer = await rag.aquery(query, mode=mode, only_need_context=only_need_context)
            answer_str = answer if isinstance(answer, str) else str(answer)
            dense_context = await self._get_reranked_context(query, kb_name)

            return {
                "query": query,
                "answer": answer_str,
                "content": dense_context,
                "mode": mode,
                "provider": "hybrid",
            }

    async def _get_reranked_context(self, query: str, kb_name: str) -> str:
        from src.services.embedding import get_embedding_client

        kb_dir = Path(self.kb_base_dir) / kb_name / "vector_store"
        index_file = kb_dir / "index.json"

        if not index_file.exists():
            self.logger.warning(f"No vector index found at {index_file}")
            return ""

        try:
            with open(index_file, "r", encoding="utf-8") as f:
                index_data = json.load(f)
        except Exception as exc:
            self.logger.warning(f"Failed to load vector index: {exc}")
            return ""

        try:
            client = get_embedding_client()
            query_embedding = (await client.embed([query]))[0]
        except Exception as exc:
            self.logger.warning(f"Failed to embed query for dense rerank: {exc}")
            return ""

        results = []
        for item in index_data:
            if item.get("embedding"):
                similarity = self._cosine_similarity(query_embedding, item["embedding"])
                results.append((similarity, item))

        results.sort(key=lambda x: x[0], reverse=True)

        top_k_after = 5
        top_k_before = max(top_k_after, 20)
        candidates = results[:top_k_before]
        if not candidates:
            return ""

        reranked_results = None

        try:
            from src.services.reranker import get_reranker_service

            reranker = get_reranker_service()
            if reranker:
                passages = [self._build_rerank_passage(item) for _, item in candidates]
                rerank_results = await reranker.rerank(query, passages)
                reranked_results = []
                for rerank_result in rerank_results[:top_k_after]:
                    _, item = candidates[rerank_result.index]
                    reranked_results.append((rerank_result.score, item))
        except Exception as exc:
            self.logger.warning(f"Reranker unavailable, using similarity order: {exc}")

        if reranked_results is None:
            reranked_results = candidates[:top_k_after]

        content_parts = []
        for score, item in reranked_results:
            content_parts.append(f"[Score: {score:.3f}] {item['content'][:500]}")

        return "\n\n".join(content_parts)

    def _build_rerank_passage(self, item: Dict[str, Any]) -> str:
        metadata = item.get("metadata") or {}
        parts = []

        title = metadata.get("title")
        if title:
            parts.append(f"Title: {title}")

        section = metadata.get("section")
        if section:
            parts.append(f"Section: {section}")

        if "page" in metadata and metadata.get("page") is not None:
            parts.append(f"Page: {metadata.get('page')}")

        header = " | ".join(parts)
        content = item.get("content", "")

        if header:
            return f"{header}\n\n{content}"
        return content

    def _cosine_similarity(self, a, b) -> float:
        import math

        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)
