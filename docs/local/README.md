# Local Fork Notes (praDeep)

This folder is for **fork-specific / local development docs** so we can keep track of changes without touching upstream documentation structure.

## Quick commands

```bash
# Start backend (8783) + frontend (3783)
./scripts/start

# Stop backend + frontend
./scripts/stop
```

## Local defaults

- Backend: `http://localhost:8783` (docs at `/docs`)
- Frontend: `http://localhost:3783`
- Preferred Python: project venv at `.venv/` (the launcher re-execs into it when available)

## Proxy + models

praDeep uses an OpenAI-compatible endpoint. In this fork we typically route through `cli-proxy-api`:

```env
LLM_HOST=http://localhost:8317/v1
LLM_API_KEY=sk-proxy
```

### Embeddings (local)

We use local Qwen3-VL embeddings + reranker on Apple Silicon (MPS):

```env
EMBEDDING_BINDING=qwen3_vl
EMBEDDING_MODEL=Qwen/Qwen3-VL-Embedding-8B
EMBEDDING_DIMENSION=2048

RERANKER_BINDING=qwen3_vl
RERANKER_MODEL=Qwen/Qwen3-VL-Reranker-8B
RERANKER_DEVICE=mps
RERANKER_DTYPE=bfloat16
RERANKER_MAX_LENGTH=512
```

## Council mode

- “Verify (Council)” runs a multi-model deliberation after the main chat response (no mid-stream interruptions).
- UI toggles live in **Settings → Council Verification**.
- Design notes: `docs/plans/2026-01-13-council-mode-design.md`.

