---
title: Solve Workflow
description: Dual-loop solve workflow orchestration (analysis loop + solve loop)
---

# Solve Workflow

**Goal:** transform a user problem into a validated solution using a dual-loop system (analysis → solve).

**Key entrypoints**
- API: `src/api/routers/solve.py`
- Orchestrator: `src/agents/solve/main_solver.py`
- Loops: `src/agents/solve/analysis_loop/`, `src/agents/solve/solve_loop/`

## Flow

```mermaid
flowchart TD
  U[User question] --> API[FastAPI /solve]
  API --> MS[MainSolver]

  subgraph AL[Analysis Loop]
    I[InvestigateAgent\n(tool planning + calls)] --> N[NoteAgent\n(summarize + cite)]
    N --> I
  end

  subgraph SL[Solve Loop]
    M[ManagerAgent\n(block plan)] --> S[SolveAgent\n(step solve)]
    S --> T[ToolAgent\n(RAG/Web/Code)]
    T --> R[ResponseAgent\n(aggregate)]
    R --> C[Check/PrecisionAnswer\n(QA + finalize)]
    C --> M
  end

  MS --> AL
  AL --> SL
  SL --> OUT[Final answer + citations + artifacts]
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend
  participant API as API Router
  participant MS as MainSolver
  participant INV as InvestigateAgent
  participant NOTE as NoteAgent
  participant MGR as ManagerAgent
  participant SOL as SolveAgent
  participant TOOL as ToolAgent
  participant CHK as Check/Response

  UI->>API: POST /solve (question, settings)
  API->>MS: solve(question)
  loop Analysis iterations (until stop)
    MS->>INV: plan queries + choose tools
    INV->>TOOL: execute (RAG/Web/...)
    TOOL-->>INV: raw results + cite_ids
    INV->>NOTE: compress + attach citations
    NOTE-->>MS: updated investigation memory
  end
  loop Solve blocks (until complete)
    MS->>MGR: create/refresh block plan
    MGR->>SOL: solve next step
    SOL->>TOOL: tool calls as needed
    TOOL-->>SOL: tool results
    SOL->>CHK: validate + format
    CHK-->>MS: accepted step / corrections
  end
  MS-->>API: response payload + artifact paths
  API-->>UI: final answer
```

## Notes

- The **analysis loop** is optimized for “what do we need to know?”; the **solve loop** is optimized for “execute a plan and verify it.”
- Both loops persist state via JSON memories under `src/agents/solve/memory/`.
