---
title: Agents
description: Multi-agent architecture and usage
---

# Agents

praDeep uses a multi-agent architecture for intelligent tutoring.

## Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│  Agent Router   │  Determines which agent(s) to use
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┐
    ▼         ▼        ▼        ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ Tutor │ │Research│ │Writer │ │Practice│
│ Agent │ │ Agent │ │ Agent │ │ Agent │
└───┬───┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │        │        │
    └────┬────┴────────┴────────┘
         ▼
┌─────────────────┐
│    RAG Layer    │  Retrieves relevant content
└────────┬────────┘
         ▼
┌─────────────────┐
│  LLM Generation │  Generates response
└─────────────────┘
```

## Agent Types

### Tutor Agent

Primary teaching agent for Q&A and explanations.

**Capabilities:**
- Answer questions from knowledge base
- Step-by-step explanations
- Socratic questioning
- Concept clarification

**Example:**
```
User: Explain how backpropagation works
Tutor: [Retrieves relevant chunks] → [Generates explanation with citations]
```

### Research Agent

Explores and synthesizes information.

**Capabilities:**
- Web search integration
- Paper retrieval
- Multi-source synthesis
- Deep research tasks

**Example:**
```
User: Find recent papers on transformer attention
Research: [Searches Semantic Scholar] → [Summarizes findings]
```

### Writer Agent

Assists with content creation.

**Capabilities:**
- Co-writing assistance
- Document annotation
- Editing suggestions
- Content structuring

### Practice Agent

Generates assessments and quizzes.

**Capabilities:**
- Quiz generation from content
- Exam simulation
- Spaced repetition
- Progress tracking

## RAG Pipeline

### Retrieval Flow

1. **Query Embedding**
   ```python
   query_embedding = embed(query)  # Qwen3-VL-Embedding-8B
   ```

2. **Vector Search**
   ```python
   chunks = vector_store.search(
       query_embedding,
       top_k=10,
       threshold=0.7
   )
   ```

3. **Reranking** (optional)
   ```python
   reranked = reranker.rank(query, chunks)
   ```

4. **Context Assembly**
   ```python
   context = format_context(reranked[:5])
   ```

### Embedding Configuration

| Setting | Value |
|---------|-------|
| Model | Qwen3-VL-Embedding-8B |
| Dimensions | 4096 |
| Chunk size | 512 tokens |
| Overlap | 64 tokens |

## Usage Examples

### Basic Query

```python
response = client.chat.completions.create(
    knowledge_base_id="kb_123",
    messages=[{"role": "user", "content": "What is gradient descent?"}]
)
```

### With Agent Selection

```python
response = client.chat.completions.create(
    knowledge_base_id="kb_123",
    agent="research",  # Force research agent
    messages=[{"role": "user", "content": "Find papers on attention"}]
)
```

### Multi-Agent Task

```python
response = client.chat.completions.create(
    knowledge_base_id="kb_123",
    agents=["tutor", "practice"],  # Use multiple agents
    messages=[{"role": "user", "content": "Teach me and quiz me on CNNs"}]
)
```

## Tool Integration

Agents can use external tools:

| Tool | Description |
|------|-------------|
| web_search | Search the web via Perplexity |
| paper_search | Query Semantic Scholar |
| calculator | Wolfram Alpha for math |
| code_exec | Sandboxed Python execution |

## Performance

### Latency Targets

| Operation | Target |
|-----------|--------|
| Query routing | <50ms |
| Retrieval | <200ms |
| Generation | <2s |
| Full pipeline | <3s |

### Throughput

| Metric | Value |
|--------|-------|
| Concurrent users | 50+ |
| Queries/sec | 10+ |
| Embeddings/sec | 13.8 |
