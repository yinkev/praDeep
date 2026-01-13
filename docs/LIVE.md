# praDeep - Live Project Document

> **Last Updated:** 2026-01-11 05:30 PST
> **Status:** Active Development - ANAT506 KB Successfully Created (171 content blocks)
>
> **Next session starts with:** `cat /Users/kyin/Projects/praDeep/docs/LIVE.md`

---

## What Is This Project?

**praDeep** is an AI-powered PDF tutoring system. It lets users upload PDFs (textbooks, lecture notes, papers) and ask questions. The system retrieves relevant content and generates accurate answers with citations.

**Owner:** kyin - a medical student who needs high accuracy for medical education content.

---

## Hardware & Environment

| Component | Value |
|-----------|-------|
| Machine | MacBook Pro M2 Max |
| RAM | 96 GB Unified Memory |
| OS | macOS (Darwin) |
| Python | 3.12 with venv at `.venv/` |
| Node | For Next.js frontend |
| HF_HOME | `~/Models/huggingface` (moved from ~/.cache) |

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Embedding     │
│   (Next.js)     │     │   (FastAPI)     │     │   (Qwen3-VL)    │
│   Port 3783     │     │   Port 8783     │     │   2048-dim MPS  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
               ┌─────────────────┐ ┌─────────────────┐
               │   CLI Proxy API │ │    Reranker     │
               │   (LLM Router)  │ │  (Qwen3-VL)     │
               │   Port 8317     │ │   Local MPS     │
               └────────┬────────┘ └─────────────────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
      Gemini 3      GPT-5.2      Claude 4
      Flash         Codex        Opus
```

**Pipeline:**
```
Query → Embedding (2048-dim) → Top-20 retrieval → Reranker → Top-5 results → LLM
```

---

## Current .env Configuration

```env
# Server Ports
BACKEND_PORT=8783
FRONTEND_PORT=3783

# LLM (via CLI Proxy)
LLM_MODE=api
LLM_BINDING=openai
LLM_MODEL=gemini-3-flash-preview
LLM_HOST=http://localhost:8317/v1
LLM_API_KEY=sk-proxy

# Embedding (local Qwen3-VL)
EMBEDDING_BINDING=qwen3_vl
EMBEDDING_MODEL=Qwen/Qwen3-VL-Embedding-8B
EMBEDDING_DIMENSION=2048

# Reranker (local Qwen3-VL)
RERANKER_BINDING=qwen3_vl
RERANKER_MODEL=Qwen/Qwen3-VL-Reranker-8B
RERANKER_DEVICE=mps
RERANKER_DTYPE=bfloat16
RERANKER_MAX_LENGTH=512
```

---

## Key Technical Decisions

### 1. Embedding: Qwen3-VL-Embedding-8B (2048-dim)

| Setting | Value |
|---------|-------|
| Model | `Qwen/Qwen3-VL-Embedding-8B` |
| Dimensions | **2048** (was 4096, reduced for reranker strategy) |
| Backend | PyTorch MPS (Apple Silicon) |
| Location | `~/Models/huggingface/` |

**Why 2048 not 4096:** Using reranker compensates for smaller embeddings. 2048 retains ~98% accuracy with Matryoshka, reranker provides precision.

### 2. Reranker: Qwen3-VL-Reranker-8B (NEW)

| Setting | Value |
|---------|-------|
| Model | `Qwen/Qwen3-VL-Reranker-8B` |
| Top-k before | 20 candidates |
| Top-k after | 5 results |
| Backend | PyTorch MPS |

**Why:** Cross-encoder reranking provides precise relevance scoring. Essential for medical content where terminology overlap is high.

### 3. LLM: Gemini 3 Flash (via CLI Proxy)

| Setting | Value |
|---------|-------|
| Model | `gemini-3-flash-preview` |
| Endpoint | `http://localhost:8317/v1` |
| API Key | `sk-proxy` |

### 4. PDF Parser: MinerU

- Best for academic/scientific PDFs
- Handles anatomy diagrams, tables, equations
- Slower but more accurate than alternatives

### 5. Knowledge Graph: LightRAG

- Hybrid search (graph + vector)
- Good for connecting concepts across lectures

---

## Project Structure

```
/Users/kyin/Projects/praDeep/
├── .venv/                          # Python virtual environment
├── .env                            # Configuration
├── src/
│   ├── api/
│   │   ├── main.py                 # Backend entry point
│   │   └── run_server.py           # Use this to start backend
│   └── services/
│       ├── embedding/
│       │   └── adapters/
│       │       └── qwen3_vl.py     # Embedding adapter
│       └── reranker/               # NEW - Reranker service
│           ├── adapters/
│           │   └── qwen3_vl.py     # Reranker adapter
│           ├── config.py
│           └── service.py
├── web/                            # Next.js frontend
├── data/
│   └── knowledge_bases/
│       └── ANAT506/                # First KB created
├── docs/
│   ├── LIVE.md                     # THIS FILE
│   ├── TESTING.md                  # Testing guide
│   └── plans/
│       └── 2026-01-10-qwen3-vl-reranker-design.md
└── ~/Models/huggingface/           # HF model cache (moved here)
```

---

## What's Been Done

| Task | Status | Notes |
|------|--------|-------|
| Install Python deps | ✅ | `pip install -r requirements.txt` |
| Install Node deps | ✅ | `cd web && npm install` |
| Create qwen3_vl embedding adapter | ✅ | Works on MPS |
| Create qwen3_vl reranker adapter | ✅ | Codex GPT-5.2 xhigh |
| Integrate reranker into retrievers | ✅ | dense.py, hybrid.py modified |
| Change ports (8783/3783) | ✅ | Updated .env and web/.env.local |
| Change LLM to gemini-3-flash | ✅ | Faster model |
| Change embedding dim to 2048 | ✅ | For reranker strategy |
| Move HF_HOME to ~/Models | ✅ | Added to .zshrc |
| Create ANAT506 knowledge base | 🔄 | Processing 02.03 Handout.pdf |
| Test RAG query | ⏳ | After KB finishes processing |

---

## What To Do Next

### Step 1: Check if KB finished processing
```bash
# Check backend logs
tail -50 /var/folders/mc/qjwd1ld97_bfhl86xpbfrpp00000gn/T/claude/-Users-kyin/tasks/bb973b3.output
```

Or refresh the Knowledge Bases page at http://localhost:3783/knowledge

### Step 2: Test RAG Query
1. Go to Home (http://localhost:3783)
2. Select RAG mode
3. Select ANAT506 knowledge base
4. Ask: "What are the boundaries of the anterior triangle?"

### Step 3: Verify Reranker Works
Check backend logs for "rerank" messages when querying.

---

## Starting Servers

```bash
cd /Users/kyin/Projects/praDeep
source .venv/bin/activate
export HF_HOME="$HOME/Models/huggingface"

# Backend (port 8783)
python src/api/run_server.py

# Frontend (port 3783) - in another terminal
cd web && npm run dev -- -p 3783
```

---

## Knowledge Base Strategy

| Strategy | Example |
|----------|---------|
| Per Course | `ANAT506`, `BIOC501`, `PHYS502` |

Upload all lectures for a course into one KB. Allows cross-lecture queries like "compare anterior and posterior triangles."

---

## Troubleshooting

### "MPS not available"
```bash
python -c "import torch; print(torch.backends.mps.is_available())"
```

### "Reranker not loading"
- First call downloads ~17GB model
- Check `~/Models/huggingface/hub/` for model files

### "CLI Proxy not responding"
```bash
curl http://localhost:8317/v1/models -H "Authorization: Bearer sk-proxy"
```

### Backend won't start (module not found)
Use `run_server.py` not `main.py` directly:
```bash
python src/api/run_server.py
```

---

## Session History

### 2026-01-11 00:30 PST (Session 3)

1. Changed ports: 8001→8783, 3782→3783
2. Changed LLM: gemini-2.5-pro-preview → gemini-3-flash-preview
3. Changed embedding dimension: 4096 → 2048 (for reranker strategy)
4. Implemented Qwen3-VL-Reranker-8B via Codex GPT-5.2 xhigh
   - Created `src/services/reranker/` service
   - Integrated into dense.py and hybrid.py retrievers
   - Tests passing (6 tests)
5. Moved HF_HOME: ~/.cache/huggingface → ~/Models/huggingface
6. Created first knowledge base: ANAT506
7. Uploaded 02.03 Handout.pdf (Anterior Triangle of Neck)
8. **Next:** Test RAG query on ANAT506

### 2026-01-10 (Session 2)

1. Updated .env to use `EMBEDDING_BINDING=qwen3_vl`
2. Ran adapter tests - all 3 passed
3. Fixed `src/services/embedding/config.py`
4. Started backend via `run_server.py`
5. Started frontend

### 2026-01-10 19:20 PST (Session 1)

1. Installed all Python dependencies
2. Researched multimodal embeddings
3. Chose Qwen3-VL-Embedding-8B
4. Benchmarked on M2 Max - 13.8 texts/sec
5. Created qwen3_vl.py embedding adapter

---

## Quick Reference

| Action | Command |
|--------|---------|
| Activate venv | `source .venv/bin/activate` |
| Set HF_HOME | `export HF_HOME="$HOME/Models/huggingface"` |
| Start backend | `python src/api/run_server.py` |
| Start frontend | `cd web && npm run dev -- -p 3783` |
| Run all tests | `pytest` |
| Run reranker tests | `pytest tests/services/reranker/` |
| Check MPS | `python -c "import torch; print(torch.backends.mps.is_available())"` |
| Test CLI Proxy | `curl http://localhost:8317/v1/models -H "Authorization: Bearer sk-proxy"` |

---

## Component Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| PDF Parser | MinerU | Extract text/images/tables from PDFs |
| Knowledge Graph | LightRAG | Hybrid search (graph + vector) |
| Embedding | Qwen3-VL-Embedding-8B (2048-dim) | Semantic similarity |
| Reranker | Qwen3-VL-Reranker-8B | Precision scoring |
| LLM | Gemini 3 Flash | Answer generation |
| Backend | FastAPI | API server |
| Frontend | Next.js 16 | UI |

---

*This document is the source of truth. Update it as you work.*
