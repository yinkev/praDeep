---
title: Co-Writer Workflow
description: Editing (rewrite/shorten/expand) and narration (script + TTS)
---

# Co-Writer Workflow

**Goal:** help users revise text (optionally with context) and optionally generate narration + TTS audio.

**Key entrypoints**
- API: `src/api/routers/co_writer.py`
- Agents: `src/agents/co_writer/edit_agent.py`, `src/agents/co_writer/narrator_agent.py`

## Flow

```mermaid
flowchart TD
  U[User text + instruction] --> API1[FastAPI /co_writer/edit]
  API1 --> EA[EditAgent]
  EA --> SRC{Context source?}
  SRC -->|None| LLM[LLM edit]
  SRC -->|RAG| RAG[RAG retrieve]
  SRC -->|Web| WEB[Web search]
  RAG --> LLM
  WEB --> LLM
  LLM --> OUT1[Edited text + operation_id]

  U2[User content to narrate] --> API2[FastAPI /co_writer/narrate]
  API2 --> NA[NarratorAgent]
  NA --> SCRIPT[Generate narration script]
  SCRIPT --> TTS[TTS provider]
  TTS --> OUT2[Audio file + URL + script]
```

## Sequence (Edit)

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend
  participant API as API Router
  participant EA as EditAgent
  participant CTX as Context Tool
  participant LLM as LLM
  participant FS as Storage

  UI->>API: POST /co_writer/edit (text, instruction, action, source?)
  API->>EA: process(...)
  opt source = rag/web
    EA->>CTX: retrieve context
    CTX-->>EA: context + traces
  end
  EA->>LLM: generate edited text
  LLM-->>EA: edited text
  EA->>FS: persist history + tool_calls
  EA-->>API: edited_text + operation_id
  API-->>UI: response
```

## Notes

- Co-Writer persists edit/narration history under `data/user/co-writer/`.
- Narration splits into **script generation** (LLM) and **audio generation** (TTS provider).
