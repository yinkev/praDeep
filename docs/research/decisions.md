---
title: Architecture Decisions
description: Key technical decisions and their rationale for praDeep
---

# Architecture Decisions

This document records significant technical decisions made during praDeep's development, following the Architecture Decision Record (ADR) format.

## ADR-001: Embedding Model Selection

**Date:** 2024-12-15
**Status:** Accepted
**Deciders:** Core Team

### Context

praDeep requires high-quality text embeddings for semantic search across educational documents. We needed to choose between:

1. Cloud APIs (OpenAI, Cohere, Voyage)
2. Open-source models (Qwen, BGE, Nomic)
3. Fine-tuned domain-specific models

### Decision

**Primary:** Qwen3-VL-Embedding-8B for local deployment
**Fallback:** OpenAI text-embedding-3-large for API deployment

### Rationale

1. **Quality:** Qwen3-VL-Embedding-8B achieves state-of-the-art results on MTEB
2. **Multimodal:** Native support for image+text embeddings (diagrams, figures)
3. **Cost:** Eliminates API costs for high-volume deployments
4. **Privacy:** Data never leaves the local environment
5. **Apple Silicon:** Excellent performance on M-series Macs

### Consequences

**Positive:**
- 85% cost reduction vs API at scale
- Full data privacy
- Offline capability

**Negative:**
- Requires 32GB+ memory
- Higher initial setup complexity
- Slightly slower than API calls

### Alternatives Considered

| Model | Quality | Speed | Cost | Why Rejected |
|-------|---------|-------|------|--------------|
| text-embedding-3-large | A | A+ | $$$ | Cost at scale |
| ColQwen2 | B+ | A+ | Free | Lower absolute quality |
| bge-large | B | A+ | Free | Short context, no multimodal |
| voyage-large-2 | A | A | $$$ | Cost, no local option |

---

## ADR-002: Vector Database Selection

**Date:** 2024-11-20
**Status:** Accepted
**Deciders:** Core Team

### Context

Need a vector database for storing and searching document embeddings. Requirements:

- Support 4096-dimensional vectors
- Handle millions of vectors
- Support metadata filtering
- Work locally and in production

### Decision

**Development:** ChromaDB
**Production:** Qdrant

### Rationale

**ChromaDB for development:**
- Zero-configuration setup
- SQLite-backed persistence
- Good Python integration
- Sufficient for small-medium datasets

**Qdrant for production:**
- Horizontal scaling
- Advanced filtering
- Better performance at scale
- Cloud-managed option available

### Consequences

**Positive:**
- Fast development iteration with ChromaDB
- Production-ready scaling with Qdrant
- Same API abstraction

**Negative:**
- Two systems to maintain
- Migration complexity
- Slight behavior differences

---

## ADR-003: Multi-Agent Architecture

**Date:** 2024-10-15
**Status:** Accepted
**Deciders:** Core Team

### Context

praDeep needs to handle diverse tasks:
- Tutoring and Q&A
- Research and literature review
- Writing assistance
- Practice problem generation

Single-prompt approaches struggle with task diversity.

### Decision

Implement a multi-agent system with specialized agents:

1. **Router Agent** - Classifies intent, delegates to specialists
2. **Tutor Agent** - Handles learning and explanation
3. **Research Agent** - Conducts literature search and synthesis
4. **Writer Agent** - Assists with writing and editing
5. **Practice Agent** - Generates questions and assessments

### Rationale

1. **Specialization:** Each agent optimized for specific tasks
2. **Modularity:** Easy to add/modify agents
3. **Context efficiency:** Smaller, focused prompts
4. **Collaboration:** Agents can delegate to each other
5. **Observability:** Clear responsibility boundaries

### Consequences

**Positive:**
- Better task-specific performance
- Easier prompt engineering
- Clear debugging paths
- Extensible architecture

**Negative:**
- Coordination overhead
- Potential routing errors
- Increased complexity
- More components to test

---

## ADR-004: Streaming Response Architecture

**Date:** 2024-09-01
**Status:** Accepted
**Deciders:** Core Team

### Context

LLM responses can take 5-30 seconds for complex queries. Users need immediate feedback.

### Decision

Implement streaming responses using Server-Sent Events (SSE):

```
Client -> HTTP POST /chat
Server -> SSE stream
  data: {"token": "The"}
  data: {"token": " answer"}
  data: {"token": " is..."}
  data: {"done": true, "citations": [...]}
```

### Rationale

1. **Perceived latency:** Users see tokens immediately
2. **Cancellation:** Users can stop long responses
3. **Progress:** Clear indication of processing
4. **Compatibility:** SSE works in browsers without WebSocket

### Consequences

**Positive:**
- Sub-second perceived latency
- Better UX for long responses
- Easy to implement with FastAPI

**Negative:**
- More complex client handling
- Citation handling at end only
- Connection management complexity

---

## ADR-005: Chunking Strategy

**Date:** 2024-08-15
**Status:** Accepted
**Deciders:** Core Team

### Context

Documents must be split into chunks for embedding. Chunking strategy affects retrieval quality.

### Decision

Implement multiple chunking strategies:

| Strategy | Use Case | Parameters |
|----------|----------|------------|
| Fixed | General | 512 tokens, 64 overlap |
| Semantic | Academic | Section-aware, 1024 max |
| Recursive | Mixed | Nested structure preservation |

Default: Semantic chunking for academic content.

### Rationale

1. **Semantic boundaries:** Splitting at section/paragraph breaks
2. **Context preservation:** Overlap ensures context continuity
3. **Retrieval quality:** Section-level chunks match query intent
4. **Flexibility:** Different strategies for different content

### Consequences

**Positive:**
- Better retrieval accuracy (+15% on academic docs)
- Meaningful chunk boundaries
- Preserved section structure

**Negative:**
- More complex implementation
- Variable chunk sizes
- Requires document structure detection

---

## ADR-006: Citation System

**Date:** 2024-07-20
**Status:** Accepted
**Deciders:** Core Team

### Context

Academic integrity requires citing sources. Users need to verify AI-generated content.

### Decision

Implement inline citations with verification:

```markdown
The transformer architecture [1] uses self-attention [2] to process sequences.

---
[1] Vaswani et al., "Attention Is All You Need", p.3
[2] lecture_notes.pdf, Section 2.1
```

### Rationale

1. **Verifiability:** Users can check original sources
2. **Academic standard:** Familiar citation format
3. **Source attribution:** Clear origin of information
4. **Trust:** Builds confidence in responses

### Consequences

**Positive:**
- Verifiable claims
- Academic credibility
- Source transparency

**Negative:**
- Longer responses
- Citation accuracy challenges
- UI complexity for linking

---

## ADR-007: Local-First Architecture

**Date:** 2024-06-01
**Status:** Accepted
**Deciders:** Core Team

### Context

Users want privacy and offline capability. Cloud-only approaches limit adoption.

### Decision

Support fully local deployment as a first-class option:

- Local embedding models (Qwen3-VL)
- Local LLMs (Llama, Mistral via Ollama)
- Local vector store (ChromaDB)
- Local document storage

### Rationale

1. **Privacy:** Sensitive educational data stays local
2. **Compliance:** Meets data residency requirements
3. **Cost:** Eliminates API costs
4. **Offline:** Works without internet
5. **Apple Silicon:** M-series Macs are capable platforms

### Consequences

**Positive:**
- Full data privacy
- No API costs at scale
- Offline operation
- User trust

**Negative:**
- Hardware requirements
- Setup complexity
- Quality trade-offs vs GPT-4
- Maintenance burden

---

## Decision Log Summary

| ADR | Decision | Date | Status |
|-----|----------|------|--------|
| 001 | Qwen3-VL-Embedding-8B for embeddings | 2024-12-15 | Accepted |
| 002 | ChromaDB (dev) + Qdrant (prod) | 2024-11-20 | Accepted |
| 003 | Multi-agent architecture | 2024-10-15 | Accepted |
| 004 | SSE streaming responses | 2024-09-01 | Accepted |
| 005 | Semantic chunking default | 2024-08-15 | Accepted |
| 006 | Inline citation system | 2024-07-20 | Accepted |
| 007 | Local-first architecture | 2024-06-01 | Accepted |

## Pending Decisions

- **ADR-008:** Fine-tuned vs base models for domain-specific tasks
- **ADR-009:** Conversation memory architecture (session vs persistent)
- **ADR-010:** Multi-language support implementation
