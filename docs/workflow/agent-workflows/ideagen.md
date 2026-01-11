---
title: IdeaGen Workflow
description: Notebook-driven research idea generation with multi-stage filtering
---

# IdeaGen Workflow

**Goal:** extract knowledge points from notebook records and generate high-quality research ideas through staged filtering.

**Key entrypoints**
- API: `src/api/routers/ideagen.py`
- Orchestrator: `src/agents/ideagen/idea_generation_workflow.py`
- Extractor: `src/agents/ideagen/material_organizer_agent.py`

## Flow

```mermaid
flowchart TD
  U[User selects notebook] --> API[FastAPI /ideagen/generate]
  API --> REC[Load notebook records]
  REC --> MO[MaterialOrganizerAgent\n(extract knowledge points)]
  MO --> LF[Loose filter\n(remove unsuitable points)]
  LF --> EI[Explore ideas\n(>=5 per point)]
  EI --> SF[Strict filter\n(keep >=1, remove >=2)]
  SF --> MD[Generate markdown\n(structured output)]
  MD --> OUT[Ideas markdown + JSON artifacts]
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend
  participant API as API Router
  participant NB as Notebook Manager
  participant MO as MaterialOrganizerAgent
  participant WF as IdeaGenerationWorkflow
  participant LLM as LLM

  UI->>API: POST /ideagen/generate (notebook_id, user_thoughts?)
  API->>NB: fetch notebook records
  NB-->>API: records
  API->>MO: process(records, user_thoughts)
  MO->>LLM: extract knowledge points
  LLM-->>MO: points
  API->>WF: loose_filter(points)
  WF->>LLM: filter points
  LLM-->>WF: filtered points
  loop Each knowledge point
    WF->>LLM: explore_ideas(point)
    LLM-->>WF: ideas
    WF->>LLM: strict_filter(point, ideas)
    LLM-->>WF: filtered ideas
  end
  WF->>LLM: generate_markdown(points, ideas_map)
  LLM-->>WF: markdown
  WF-->>API: markdown + artifacts
  API-->>UI: response
```

## Notes

- The staged filters enforce a **quality bar** while guaranteeing at least one idea per retained knowledge point.
- IdeaGen is notebook-driven: the quality of notebook records strongly affects the output.
