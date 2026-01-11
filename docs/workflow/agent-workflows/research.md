---
title: Research Workflow
description: Dynamic topic queue research pipeline (planning → researching → reporting)
---

# Research Workflow

**Goal:** turn a broad topic into a structured report using a three-phase pipeline and a dynamic topic queue.

**Key entrypoints**
- API: `src/api/routers/research.py`
- Orchestrator: `src/agents/research/research_pipeline.py`
- Agents: `src/agents/research/agents/`

## Flow

```mermaid
flowchart TD
  U[User topic] --> API[FastAPI /research]
  API --> RP[ResearchPipeline]

  subgraph P1[Phase 1: Planning]
    RE[RephraseAgent\n(topic refine)] --> DE[DecomposeAgent\n(subtopics)]
    DE --> Q[DynamicTopicQueue\n(TopicBlocks)]
  end

  subgraph P2[Phase 2: Researching]
    M[ManagerAgent\n(schedule next topic)] --> RA[ResearchAgent\n(sufficiency + query plan)]
    RA --> TOOL[Tools\n(RAG/Web/Paper/Code)]
    TOOL --> NA[NoteAgent\n(compress + ToolTrace)]
    NA --> M
  end

  subgraph P3[Phase 3: Reporting]
    REP[ReportingAgent\n(outline + write)] --> OUT[Markdown report\n(with citations)]
  end

  RP --> P1 --> P2 --> P3
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend
  participant API as API Router
  participant RP as ResearchPipeline
  participant RE as RephraseAgent
  participant DE as DecomposeAgent
  participant M as ManagerAgent
  participant RA as ResearchAgent
  participant TOOL as Tools
  participant NA as NoteAgent
  participant REP as ReportingAgent

  UI->>API: WS/POST /research (topic, preset)
  API->>RP: run(topic)
  RP->>RE: optimize topic (optional multi-turn)
  RE-->>RP: refined topic
  RP->>DE: generate subtopics (RAG-enhanced)
  DE-->>RP: subtopics
  RP->>M: init queue(subtopics)
  loop For each TopicBlock (series/parallel)
    M->>RA: take next topic
    loop Iterations (fixed/flexible)
      RA->>RA: check_sufficiency()
      RA->>RA: generate_query_plan()
      RA->>TOOL: execute selected tool
      TOOL-->>RA: raw results
      RA->>NA: compress + citations + ToolTrace
      NA-->>M: updated topic state
    end
  end
  RP->>REP: dedupe + outline + write
  REP-->>API: report path + metadata
  API-->>UI: streamed progress + final report
```

## Notes

- The dynamic queue supports **discovery** (new subtopics) and **scheduling** (series vs parallel).
- Reporting intentionally happens after research to avoid “premature narrative lock-in.”
