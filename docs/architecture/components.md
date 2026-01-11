---
title: Components
description: Detailed documentation of praDeep's core components
---

# Components

This document provides detailed documentation for each component in the praDeep architecture.

## Document Processing Pipeline

### Ingestion Service

Handles document upload, parsing, and preprocessing.

**Supported Formats:**
- PDF (text, scanned with OCR)
- Word documents (.docx, .doc)
- Markdown files
- Plain text
- HTML pages

**Processing Steps:**

1. **Format Detection**: Identify document type and encoding
2. **Text Extraction**: Parse content using format-specific extractors
3. **Cleaning**: Remove boilerplate, normalize whitespace
4. **Chunking**: Split into semantic chunks with overlap

```python
# Chunking configuration
CHUNK_SIZE = 512        # tokens per chunk
CHUNK_OVERLAP = 64      # overlapping tokens
SEPARATOR = "\n\n"      # preferred split points
```

### Chunking Strategies

| Strategy | Use Case | Configuration |
|----------|----------|---------------|
| Fixed | General documents | 512 tokens, 64 overlap |
| Semantic | Academic papers | Section-aware splitting |
| Recursive | Mixed content | Nested structure preservation |

## Embedding Service

Transforms text into dense vector representations.

### Supported Models

| Model | Dimensions | Context | Best For |
|-------|------------|---------|----------|
| OpenAI text-embedding-3-large | 3072 | 8192 | General purpose |
| OpenAI text-embedding-3-small | 1536 | 8192 | Cost-effective |
| Qwen3-VL-Embedding-8B | 4096 | 32768 | Local/multimodal |
| ColQwen2 | 128 | 8192 | Late interaction |

### Batch Processing

```python
# Embedding configuration
BATCH_SIZE = 32         # documents per batch
MAX_RETRIES = 3         # retry on transient errors
RATE_LIMIT = 3000       # requests per minute (OpenAI)
```

## Retrieval Service

Implements hybrid search combining dense and sparse retrieval.

### Search Pipeline

1. **Query Embedding**: Convert query to vector
2. **Dense Search**: Approximate nearest neighbor search
3. **Sparse Search**: BM25 keyword matching (optional)
4. **Fusion**: Reciprocal Rank Fusion (RRF)
5. **Reranking**: Cross-encoder reranking (optional)

### Configuration

```yaml
retrieval:
  top_k: 10                    # candidates to retrieve
  similarity_threshold: 0.7    # minimum similarity score
  use_reranker: true          # enable cross-encoder
  reranker_model: "cross-encoder/ms-marco-MiniLM-L-12-v2"
```

## Generation Service

Orchestrates LLM inference with retrieval context.

### Prompt Templates

Located in `config/prompts/`:

- `tutor_system.md` - Tutor agent system prompt
- `research_system.md` - Research agent system prompt
- `citation_format.md` - Citation formatting rules

### Context Window Management

```python
MAX_CONTEXT_TOKENS = 8000    # reserved for context
MAX_OUTPUT_TOKENS = 2000     # maximum response length
SYSTEM_PROMPT_TOKENS = 500   # system prompt budget
```

### Streaming

Responses are streamed using Server-Sent Events (SSE):

```
event: token
data: {"content": "The", "finish_reason": null}

event: token
data: {"content": " answer", "finish_reason": null}

event: token
data: {"content": " is...", "finish_reason": "stop"}
```

## Vector Store

### ChromaDB (Default)

Local-first vector database with persistence.

```python
# Configuration
CHROMA_PERSIST_DIR = "./data/chroma"
CHROMA_COLLECTION = "documents"
DISTANCE_FUNCTION = "cosine"
```

### Qdrant (Production)

Distributed vector search engine for production deployments.

```yaml
qdrant:
  host: "localhost"
  port: 6333
  collection: "documents"
  vectors:
    size: 3072
    distance: "Cosine"
  optimizers:
    memmap_threshold: 20000
```

## Cache Service

Redis-based caching for performance optimization.

### Cache Layers

| Cache | TTL | Purpose |
|-------|-----|---------|
| Response Cache | 1 hour | Identical query responses |
| Embedding Cache | 24 hours | Document embeddings |
| Session Cache | 30 min | User session state |

### Cache Keys

```
response:{hash(query + context)}
embedding:{document_id}:{chunk_id}
session:{user_id}:{session_id}
```

## Agent Framework

### Base Agent Interface

```python
class BaseAgent(ABC):
    @abstractmethod
    async def plan(self, query: str, context: Context) -> Plan:
        """Generate execution plan for query."""
        pass

    @abstractmethod
    async def execute(self, plan: Plan) -> Response:
        """Execute plan and generate response."""
        pass

    @abstractmethod
    async def reflect(self, response: Response) -> Response:
        """Self-critique and refine response."""
        pass
```

### Agent Communication

Agents communicate through a message bus:

```python
# Inter-agent message
{
    "from": "tutor_agent",
    "to": "research_agent",
    "type": "delegate",
    "payload": {
        "task": "find_related_papers",
        "query": "neural network optimization",
        "max_results": 5
    }
}
```

## Tool Service

External capabilities available to agents.

### Available Tools

| Tool | Description | Rate Limit |
|------|-------------|------------|
| Web Search | Bing/Google search | 100/min |
| Paper Search | Semantic Scholar API | 100/min |
| Calculator | Wolfram Alpha | 50/min |
| Code Executor | Sandboxed Python | 10/min |

### Tool Registration

```python
@tool(name="web_search", description="Search the web")
async def web_search(query: str, num_results: int = 5) -> list[dict]:
    """Execute web search and return results."""
    pass
```
