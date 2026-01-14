import asyncio
import json
import re
from pathlib import Path
import sys

project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))

from src.services.rag.components.retrievers.dense import DenseRetriever
from src.services.rag.components.retrievers.hybrid import HybridRetriever
from src.services.reranker.adapters.base import RerankResult


class StubEmbeddingClient:
    async def embed(self, texts):
        return [[1.0, 0.0]]


class StubRerankerService:
    async def rerank(self, query, passages):
        results = []
        for idx, passage in enumerate(passages):
            match = re.search(r"doc(\d+)", passage)
            score = float(match.group(1)) if match else 0.0
            results.append(RerankResult(index=idx, score=score, passage=passage))
        results.sort(key=lambda item: item.score, reverse=True)
        return results


class StubRAG:
    async def _ensure_lightrag_initialized(self):
        return None

    async def aquery(self, query, mode="hybrid", only_need_context=False):
        return "rag-answer"


def _write_index(tmp_path: Path, kb_name: str) -> None:
    kb_dir = tmp_path / kb_name / "vector_store"
    kb_dir.mkdir(parents=True, exist_ok=True)

    index_data = []
    for i in range(6):
        index_data.append(
            {
                "id": i,
                "content": f"doc{i}",
                "type": "text",
                "metadata": {"title": "Title", "section": "S1", "page": i + 1},
                "embedding": [6 - i, 0.0],
            }
        )

    (kb_dir / "index.json").write_text(json.dumps(index_data), encoding="utf-8")


def test_dense_retriever_reranks_results(monkeypatch, tmp_path):
    _write_index(tmp_path, "kb")

    monkeypatch.setattr(
        "src.services.embedding.get_embedding_client",
        lambda: StubEmbeddingClient(),
    )
    monkeypatch.setattr(
        "src.services.reranker.get_reranker_service",
        lambda: StubRerankerService(),
    )

    retriever = DenseRetriever(kb_base_dir=str(tmp_path), top_k=5)
    response = asyncio.run(retriever.process("query", "kb"))

    contents = [item["content"] for item in response["results"]]
    assert contents == ["doc5", "doc4", "doc3", "doc2", "doc1"]
    assert response["content"].startswith("[Score:")


def test_hybrid_retriever_keeps_answer_and_reranks_context(monkeypatch, tmp_path):
    _write_index(tmp_path, "kb")

    monkeypatch.setattr(
        "src.services.embedding.get_embedding_client",
        lambda: StubEmbeddingClient(),
    )
    monkeypatch.setattr(
        "src.services.reranker.get_reranker_service",
        lambda: StubRerankerService(),
    )

    retriever = HybridRetriever(kb_base_dir=str(tmp_path))
    monkeypatch.setattr(retriever, "_get_rag_instance", lambda kb_name: StubRAG())

    response = asyncio.run(retriever.process("query", "kb"))

    assert response["answer"] == "rag-answer"
    assert response["content"] != "rag-answer"
    assert "doc5" in response["content"]
    assert "doc1" in response["content"]
