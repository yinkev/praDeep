---
title: Data Flow
description: Request lifecycle and data processing patterns in praDeep
---

# Data Flow

This document describes how data flows through praDeep, from user input to final response.

## Request Lifecycle

### 1. Document Upload Flow

```
User Upload
    |
    v
+-------------------+
| API Gateway       |  Validate file type, size limits
+-------------------+
    |
    v
+-------------------+
| Document Parser   |  Extract text, metadata
+-------------------+
    |
    v
+-------------------+
| Text Chunker      |  Split into semantic chunks
+-------------------+
    |
    v
+-------------------+
| Embedding Service |  Generate vector embeddings
+-------------------+
    |
    v
+-------------------+
| Vector Store      |  Index and persist
+-------------------+
    |
    v
+-------------------+
| Metadata Store    |  Store document metadata
+-------------------+
```

### 2. Query Processing Flow

```
User Query
    |
    v
+-------------------+
| Query Analyzer    |  Intent classification, entity extraction
+-------------------+
    |
    v
+-------------------+
| Agent Router      |  Select appropriate agent(s)
+-------------------+
    |
    +--------+--------+--------+
    |        |        |        |
    v        v        v        v
+------+ +------+ +------+ +------+
|Tutor | |Resrch| |Writer| |Pract |
|Agent | |Agent | |Agent | |Agent |
+------+ +------+ +------+ +------+
    |        |        |        |
    +--------+--------+--------+
             |
             v
    +-------------------+
    | Retrieval Service |  Fetch relevant context
    +-------------------+
             |
             v
    +-------------------+
    | Context Builder   |  Construct LLM prompt
    +-------------------+
             |
             v
    +-------------------+
    | LLM Generation    |  Generate response
    +-------------------+
             |
             v
    +-------------------+
    | Post-Processor    |  Add citations, format
    +-------------------+
             |
             v
    +-------------------+
    | Response Stream   |  Deliver to client
    +-------------------+
```

## Detailed Flow Descriptions

### Document Ingestion

**Step 1: Upload Validation**
```json
{
  "file_name": "textbook.pdf",
  "file_size": 15728640,
  "content_type": "application/pdf",
  "user_id": "user_123",
  "knowledge_base_id": "kb_456"
}
```

**Step 2: Text Extraction**
- PDF: PyMuPDF for text, Tesseract for OCR
- DOCX: python-docx library
- Markdown: CommonMark parser

**Step 3: Chunking**
```python
chunks = [
    {
        "id": "chunk_001",
        "text": "Neural networks are...",
        "metadata": {
            "source": "textbook.pdf",
            "page": 1,
            "section": "Introduction"
        }
    },
    # ... more chunks
]
```

**Step 4: Embedding**
```python
embeddings = [
    {
        "chunk_id": "chunk_001",
        "vector": [0.023, -0.156, ...],  # 3072 dimensions
        "model": "text-embedding-3-large"
    },
    # ... more embeddings
]
```

### Query Processing

**Step 1: Query Analysis**
```json
{
  "query": "Explain backpropagation step by step",
  "intent": "explain",
  "entities": ["backpropagation"],
  "complexity": "detailed",
  "knowledge_bases": ["kb_456"]
}
```

**Step 2: Retrieval**
```sql
-- Semantic search (vector similarity)
SELECT chunk_id, text, similarity
FROM chunks
WHERE knowledge_base_id = 'kb_456'
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

**Step 3: Context Assembly**
```
[System Prompt]
You are a helpful tutor...

[Retrieved Context]
Source 1 (textbook.pdf, p.45):
"Backpropagation is an algorithm..."

Source 2 (textbook.pdf, p.46):
"The chain rule is applied..."

[User Query]
Explain backpropagation step by step
```

**Step 4: Response Generation**
- Streaming tokens via SSE
- Citation markers inserted: [1], [2]
- LaTeX rendering for math

## Data Models

### Document

```python
class Document(BaseModel):
    id: str
    user_id: str
    knowledge_base_id: str
    file_name: str
    file_type: str
    file_size: int
    upload_time: datetime
    status: Literal["processing", "ready", "failed"]
    chunk_count: int
    metadata: dict
```

### Chunk

```python
class Chunk(BaseModel):
    id: str
    document_id: str
    text: str
    token_count: int
    position: int
    metadata: ChunkMetadata

class ChunkMetadata(BaseModel):
    page: Optional[int]
    section: Optional[str]
    heading: Optional[str]
```

### Conversation

```python
class Conversation(BaseModel):
    id: str
    user_id: str
    knowledge_base_id: str
    messages: list[Message]
    created_at: datetime
    updated_at: datetime

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    citations: list[Citation]
    timestamp: datetime
```

## Event Streams

### WebSocket Events

```typescript
// Client -> Server
{
  "type": "query",
  "payload": {
    "text": "What is gradient descent?",
    "knowledge_base_id": "kb_456"
  }
}

// Server -> Client (streaming)
{
  "type": "token",
  "payload": {
    "content": "Gradient descent is",
    "message_id": "msg_789"
  }
}

// Server -> Client (completion)
{
  "type": "complete",
  "payload": {
    "message_id": "msg_789",
    "citations": [
      {"index": 1, "source": "textbook.pdf", "page": 23}
    ]
  }
}
```

## Error Handling

### Retry Policies

| Component | Strategy | Max Retries |
|-----------|----------|-------------|
| Embedding API | Exponential backoff | 3 |
| LLM API | Exponential with jitter | 3 |
| Vector Store | Linear backoff | 5 |
| External Tools | Circuit breaker | 3 |

### Fallback Behavior

```python
# If primary embedding model fails
async def embed_with_fallback(text: str) -> list[float]:
    try:
        return await primary_model.embed(text)
    except RateLimitError:
        return await fallback_model.embed(text)
    except Exception:
        raise EmbeddingError("All embedding models failed")
```

## Performance Metrics

### Latency Targets

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Document upload (1MB) | 2s | 5s | 10s |
| Query (simple) | 500ms | 1s | 2s |
| Query (with search) | 2s | 5s | 10s |
| Embedding (single) | 50ms | 100ms | 200ms |

### Throughput Targets

| Component | Target QPS |
|-----------|------------|
| API Gateway | 1000 |
| Embedding Service | 100 |
| Vector Search | 500 |
| LLM Generation | 50 |
