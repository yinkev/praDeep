---
title: Question Generation Workflow
description: Dual-mode question generation (KB-driven custom + exam mimic)
---

# Question Generation Workflow

**Goal:** generate practice questions either from a knowledge base (custom mode) or by mimicking a reference exam (mimic mode).

**Key entrypoints**
- API: `src/api/routers/question.py`
- Coordinator: `src/agents/question/coordinator.py`
- Validation: `src/agents/question/validation_workflow.py`
- Mimic tool: `src/agents/question/tools/exam_mimic.py`

## Flow

```mermaid
flowchart TD
  U[User request] --> API[FastAPI /question]
  API --> C[AgentCoordinator]
  C --> MODE{Mode?}

  MODE -->|Custom| Q1[Generate RAG queries]
  Q1 --> BK[Retrieve background knowledge]
  BK --> PLAN[Create question plan]
  PLAN --> LOOP[For each question]
  LOOP --> GA[GenerationAgent]
  GA --> VW[ValidationWorkflow\n(single-pass)]
  VW --> SAVE1[Persist results\n(JSON per question)]

  MODE -->|Mimic| PDF[Parse PDF / MinerU]
  PDF --> EXT[Extract reference questions]
  EXT --> LOOP2[For each reference question]
  LOOP2 --> GA2[GenerationAgent]
  GA2 --> VW2[ValidationWorkflow]
  VW2 --> SAVE2[Persist mimic outputs\n(folder + JSON)]
```

## Sequence (Custom Mode)

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend
  participant API as API Router
  participant C as AgentCoordinator
  participant RAG as RAG Tool
  participant GA as GenerationAgent
  participant VW as ValidationWorkflow

  UI->>API: POST /question (requirement_text, count, difficulty, type)
  API->>C: generate_questions_custom(...)
  C->>C: generate_search_queries_from_text()
  C->>RAG: retrieve background chunks
  RAG-->>C: background knowledge
  C->>C: create_question_plan()
  loop Each planned question
    C->>GA: generate_question(requirement)
    GA->>RAG: retrieve supporting context (optional)
    RAG-->>GA: context
    GA->>VW: validate(question + kb coverage)
    VW-->>GA: relevance + issues + suggestions
    GA-->>C: question + validation
  end
  C-->>API: results + output paths
  API-->>UI: response (and WS progress, if enabled)
```

## Notes

- Validation is designed as **single-pass** analysis (“approve” with diagnostics) to maximize throughput and reduce rejection loops.
- Mimic mode adds a **document parsing/extraction** stage before generation.
