Title: Qwen3-VL-Reranker-8B Integration Design
Date: 2026-01-10
Owner: Codex

Summary
This design adds a local Qwen3-VL-Reranker-8B integration to praDeep. The reranker is optional,
uses PyTorch MPS on Apple Silicon, and integrates into dense and hybrid retrievers. Hybrid retrieval
continues to use RAG-Anything for answer generation, but returns reranked local dense context for
citation accuracy.

Goals
- Add a reranker service mirroring embedding service structure.
- Provide a Qwen3-VL-Reranker-8B adapter using MPS for local inference.
- Integrate reranking into dense and hybrid retrievers with top-k 20 before rerank, 5 after.
- Make reranking optional and gracefully fallback if not configured.
- Include metadata (title, section, page) in reranking passages.

Non-Goals
- Replacing RAG-Anything answer generation.
- Introducing a new vector store backend.
- Adding distributed inference or GPU backends other than MPS.

Architecture
New package: src/services/reranker/
- adapters/base.py: request/response dataclasses and adapter contract
- adapters/qwen3_vl.py: Qwen/Qwen3-VL-Reranker-8B implementation
- config.py: environment-driven configuration
- service.py: RerankerService providing async rerank() and singleton accessor
- __init__.py: exports for public API

Reranking Data Flow
1) DenseRetriever embeds query and scores vector candidates from vector_store/index.json.
2) Select top_k_before=20 candidates by cosine similarity.
3) Build passages by concatenating metadata fields (title, section, page) with content.
4) Reranker ranks (query, passage) pairs and returns scores.
5) Select top_k_after=5 by reranker score.
6) Build content from reranked items (with scores) for response.

HybridRetriever Data Flow
1) RAG-Anything answers the query (unchanged).
2) Local dense retrieval runs against vector_store/index.json (top 20).
3) Reranker reranks and returns top 5.
4) response.answer = RAG-Anything answer (as-is).
5) response.content = reranked dense context for citations.

Configuration
Environment variables:
- RERANKER_BINDING (default: qwen3_vl)
- RERANKER_MODEL (default: Qwen/Qwen3-VL-Reranker-8B)
- RERANKER_DEVICE (default: mps)
- RERANKER_DTYPE (default: bfloat16, fallback float16)
- RERANKER_MAX_LENGTH (default: 512)
- RERANKER_REQUEST_TIMEOUT (default: 30)

Error Handling
- If reranker config is missing or invalid, skip reranking and return pre-rerank results.
- If MPS is unavailable, raise during model initialization; retrievers catch and fallback.
- Log warnings on fallback to keep behavior visible in logs.

Testing Plan (TDD)
- Unit tests for reranker config loading with and without env vars.
- Unit tests for reranker service: ordering and graceful fallback when adapter fails.
- Retriever tests: dense returns reranked top 5; hybrid returns RAG-Anything answer with reranked
  content.

Verification
- Run targeted tests for reranker service and retriever integration.
- Manual smoke: run search with reranker enabled and verify content ordering changes.
