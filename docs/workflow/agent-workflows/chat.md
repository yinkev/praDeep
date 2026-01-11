---
title: Chat Workflow
description: Multi-turn chat with optional RAG/web augmentation and session persistence
---

# Chat Workflow

**Goal:** provide a lightweight multi-turn conversational interface with optional augmentation and persistent session history.

**Key entrypoints**
- API: `src/api/routers/chat.py`
- Agent: `src/agents/chat/chat_agent.py`
- Sessions: `src/agents/chat/session_manager.py`

## Flow

```mermaid
flowchart TD
  U[User message] --> API[FastAPI /chat]
  API --> SM[SessionManager\n(load/create session)]
  SM --> CA[ChatAgent\n(history + config)]
  CA --> AUG{Augment?}
  AUG -->|RAG| RAG[RAG retrieve]
  AUG -->|Web| WEB[Web search]
  AUG -->|None| LLM[LLM response]
  RAG --> LLM
  WEB --> LLM
  LLM --> SAVE[Persist session]
  SAVE --> OUT[Streamed reply]
```

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant UI as Frontend
  participant API as API Router
  participant SM as SessionManager
  participant CA as ChatAgent
  participant AUG as RAG/Web Tools
  participant LLM as LLM

  UI->>API: POST /chat (message, session_id?, enable_rag?, enable_web_search?)
  API->>SM: load_or_create_session()
  SM-->>API: session + history
  API->>CA: process(message, history, flags)
  opt augmentation enabled
    CA->>AUG: retrieve context
    AUG-->>CA: context
  end
  CA->>LLM: generate response (with truncated history)
  LLM-->>CA: assistant message
  CA->>SM: update_session(messages)
  SM-->>API: persisted session_id
  API-->>UI: streamed reply + session_id
```

## Notes

- The chat workflow is optimized for **low-latency** turns; history is truncated to stay within token limits.
- Session state is persisted so the UI can present “recent chats” and allow resuming.
