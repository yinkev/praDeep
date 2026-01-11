---
title: Guide Workflow
description: Guided learning workflow from notebook → plan → interactive learning → summary
---

# Guide Workflow

**Goal:** build a guided learning session from notebook history, then support interactive study with context-aware chat and generated pages.

**Key entrypoints**
- API: `src/api/routers/guide.py`
- Session manager: `src/agents/guide/guide_manager.py`
- Agents: `src/agents/guide/agents/`

## Flow

```mermaid
flowchart TD
  U[User selects notebook] --> API[FastAPI /guide]
  API --> GM[GuideManager]
  GM --> LOC[LocateAgent\n(extract knowledge points)]
  LOC --> PLAN[Learning plan\n(3-5 points)]
  PLAN --> INT[InteractiveAgent\n(generate HTML page)]
  INT --> LOOP{Study loop}
  LOOP -->|Ask| CHAT[ChatAgent\n(context Q&A)]
  LOOP -->|Next| INT
  LOOP -->|Complete| SUM[SummaryAgent]
  SUM --> OUT[Session JSON + summary]
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend
  participant API as API Router
  participant GM as GuideManager
  participant LOC as LocateAgent
  participant INT as InteractiveAgent
  participant CHAT as ChatAgent
  participant SUM as SummaryAgent

  UI->>API: POST /guide/create_session (notebook_id)
  API->>GM: create_session()
  GM->>LOC: analyze notebook records
  LOC-->>GM: knowledge points + ordering
  GM-->>API: session_id + plan
  API-->>UI: show learning plan

  UI->>API: POST /guide/start (session_id)
  API->>GM: start()
  GM->>INT: generate HTML for point #1
  INT-->>GM: html
  GM-->>UI: html + progress

  loop While session active
    alt User asks question
      UI->>API: POST /guide/chat (message)
      API->>GM: chat()
      GM->>CHAT: answer with point context + history
      CHAT-->>GM: response
      GM-->>UI: streamed answer
    else User advances
      UI->>API: POST /guide/next
      API->>GM: next()
      GM->>INT: generate HTML for next point
      INT-->>GM: html
      GM-->>UI: html + updated progress
    end
  end

  GM->>SUM: generate learning summary
  SUM-->>GM: summary
  GM-->>API: persisted session JSON
```

## Notes

- The guide workflow is **stateful**: progress and history persist per session in `user/guide/`.
- HTML generation includes a “fix HTML” path for iterative repair when the generated page is invalid.
