---
title: Council Mode (Multi-Model Verification)
description: On-demand multi-model deliberation for higher-accuracy chat answers and stricter question validation.
---

# Council Mode (Multi-Model Verification)

## Goal

Provide an **on-demand** “council” workflow that uses **multiple LLMs** to (1) verify chat answers against available context (RAG/web) and (2) optionally validate generated questions more strictly — optimized for **higher accuracy and fewer hallucinations**.

The workflow is designed for an OMS1 medical student use case where correctness matters more than speed, but we still want a fast default experience.

## UX: Fast by default, verify when needed

- **Default chat** remains fast/streaming.
- A per-message **“Verify (Council)”** action re-runs the answer in a slower, more rigorous multi-model process.
- Question generation has an optional toggle: **Council-backed validation**.

This avoids paying the latency/cost of multi-model deliberation on every message.

## How models “communicate”

Instead of independent answers that never interact, the council runs in **rounds**:

1. **Members draft** answers (parallel) while constrained by context.
2. A **Reviewer** compares drafts, extracts disagreements/unsupported claims, and writes **strict JSON**:
   - `resolved`
   - `issues`
   - `disagreements`
   - `cross_exam_questions`
   - `notes_for_chairman`
3. If unresolved, the Reviewer’s questions become a **cross-exam** round that members respond to.
4. A **Chairman** synthesizes the final answer using member outputs + reviewer notes.

This is the “communication layer”: reviewer → cross-exam questions → member revisions → chairman synthesis.

## Backend architecture

### Orchestrator

`src/services/council/orchestrator.py` implements two entrypoints:

- `run_chat_verify(...)` → produces a verified chat answer (grounded in retrieved context).
- `run_question_validate(...)` → produces a **strict JSON** validation decision for generated questions.

### Types + config

`src/services/council/` contains:

- `config.py`: dataclass config (`CouncilConfig`, `CouncilModels`, `CouncilBudgets`) loaded from `config/main.yaml`.
- `types.py`: Pydantic models for logs (`CouncilRun`, `CouncilRound`, `CouncilCall`, etc.).
- `storage.py`: `CouncilLogStore` for saving/loading council transcripts.

The package exports the stable import surface used across the app:

```py
from src.services.council import CouncilOrchestrator, CouncilLogStore, load_council_config
```

### Storage

Council transcripts are stored under `data/user/council/<task>/`:

- `chat_verify/`
- `question_validate/`

Rationale: keep chat sessions small (don’t bloat `chat_sessions.json`), but allow UI to fetch rich council traces.

## API integration

### Chat verification

- WebSocket `/api/v1/chat` supports `action: "verify"`.
- REST `GET /api/v1/chat/council/{council_id}` loads a stored transcript for UI rendering.

### Question generation validation

- WebSocket `/api/v1/question/generate` accepts `enable_council_validation`.
- When enabled, the validation workflow calls `run_question_validate(...)` and stores a transcript.

## Prompting strategy

Prompts live in:

- `src/agents/chat/prompts/<lang>/council.yaml`
- `src/agents/question/prompts/<lang>/council_validation.yaml`

Key constraints:

- Members are told to **only use provided context** and explicitly mark “not supported”.
- Reviewer must output **strict JSON** so we can reliably parse and decide whether to cross-examine.
- Chairman produces the final answer (or strict JSON for question validation).

## Configuration (models + budgets)

`config/main.yaml` provides:

- `council.enabled`
- `council.models.{chairman, reviewer, members[]}`
- `council.budgets.*` (round count, time limit, token limits, temperatures)

The intent is to let you swap providers/models via your OpenAI-compatible endpoint (e.g., `cli-proxy-api`) without code changes.

## Using with `cli-proxy-api`

Council calls use the same OpenAI-compatible client configuration as the rest of praDeep:

- `.env`: `LLM_HOST` (e.g. `http://localhost:8317/v1`) and `LLM_API_KEY` (whatever your proxy expects)
- `config/main.yaml`: `council.models.*` should be model IDs that your proxy can route

## Extending Council Mode (recommended next features)

1. **Question council log UI**: mirror the chat council transcript viewer for `question_validate`.
2. **Medical-source constraints**: add a “clinical reliability” variant prompt that forces:
   - explicit uncertainty
   - guideline-style phrasing
   - “what would change the answer” checklists
3. **Citations mode**: require the chairman to output citations tied to retrieved sources when RAG/web is enabled.
4. **Disagreement heatmap**: show which claims were disputed and how they were resolved (useful for study review).
5. **Automatic trigger rules**: auto-run council only when confidence is low or when the user flags “high-stakes”.

## Known limitations

- Council is non-streaming in MVP; it returns a final result once complete.
- The system is only as grounded as the retrieval context when web is disabled.
- Model availability depends on your OpenAI-compatible proxy/provider.
