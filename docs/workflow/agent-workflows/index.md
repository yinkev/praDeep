---
title: Agent Workflows
description: Sequence diagrams and flow docs for the core agent workflows
---

# Agent Workflows

praDeep has multiple agent workflows with different orchestration patterns. This section documents the core flows with:

- A **flowchart** (high-level orchestration)
- A **sequence diagram** (message-level ordering)

## Workflows

- [Solve](/workflow/agent-workflows/solve)
- [Research](/workflow/agent-workflows/research)
- [Question Generation](/workflow/agent-workflows/question-generation)
- [Guide](/workflow/agent-workflows/guide)
- [Co-Writer](/workflow/agent-workflows/co-writer)
- [IdeaGen](/workflow/agent-workflows/ideagen)
- [Chat](/workflow/agent-workflows/chat)

## Conventions

- **API Router** refers to `src/api/routers/*.py`
- **Workflow entrypoint** refers to the `src/agents/<workflow>/...` module that coordinates sub-agents/tools
- **Tools** include retrieval (RAG), web search, file parsing, and model calls
