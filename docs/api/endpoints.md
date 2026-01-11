---
title: API Endpoints
description: Complete REST API endpoint reference for praDeep
---

# API Endpoints

Complete reference for all praDeep REST API endpoints.

## Knowledge Bases

### List Knowledge Bases

```http
GET /api/v1/knowledge-bases
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Max results (default: 20, max: 100) |
| `offset` | integer | Pagination offset |
| `order` | string | Sort order: `created_at`, `updated_at`, `name` |

**Response:**

```json
{
  "data": [
    {
      "id": "kb_abc123",
      "name": "Research Papers",
      "description": "ML and AI research collection",
      "document_count": 42,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ],
  "has_more": true,
  "total": 156
}
```

### Create Knowledge Base

```http
POST /api/v1/knowledge-bases
```

**Request Body:**

```json
{
  "name": "Research Papers",
  "description": "ML and AI research collection",
  "embedding_model": "text-embedding-3-large",
  "settings": {
    "chunk_size": 512,
    "chunk_overlap": 64
  }
}
```

**Response:**

```json
{
  "id": "kb_abc123",
  "name": "Research Papers",
  "description": "ML and AI research collection",
  "document_count": 0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Get Knowledge Base

```http
GET /api/v1/knowledge-bases/{kb_id}
```

### Update Knowledge Base

```http
PATCH /api/v1/knowledge-bases/{kb_id}
```

### Delete Knowledge Base

```http
DELETE /api/v1/knowledge-bases/{kb_id}
```

### Refresh Knowledge Base

`POST /api/v1/knowledge/{kb_name}/refresh`

Refresh/re-index a knowledge base by reprocessing all documents.

**Request Body (optional):**
```json
{
  "full": false,         // Clean content_list and images too
  "no_backup": false,    // Skip RAG storage backup
  "skip_extract": false, // Skip numbered items extraction
  "batch_size": 20       // Batch size for extraction
}
```

**Response:**
```json
{
  "message": "Refresh started for knowledge base 'my_kb'",
  "status": "processing",
  "options": {
    "full": false,
    "backup": true,
    "extract": true
  }
}
```

**Progress:** Track via WebSocket at `/api/v1/knowledge/{kb_name}/progress/ws`

---

## Documents

### List Documents

```http
GET /api/v1/knowledge-bases/{kb_id}/documents
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Max results (default: 20) |
| `offset` | integer | Pagination offset |
| `status` | string | Filter by status: `processing`, `ready`, `failed` |

**Response:**

```json
{
  "data": [
    {
      "id": "doc_xyz789",
      "file_name": "attention_paper.pdf",
      "file_type": "application/pdf",
      "file_size": 1548576,
      "status": "ready",
      "chunk_count": 127,
      "created_at": "2024-01-16T09:15:00Z"
    }
  ],
  "has_more": false,
  "total": 42
}
```

### Upload Document

```http
POST /api/v1/knowledge-bases/{kb_id}/documents
```

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | Yes | Document file (PDF, DOCX, MD, TXT) |
| `metadata` | JSON | No | Custom metadata object |

**Response:**

```json
{
  "id": "doc_xyz789",
  "file_name": "attention_paper.pdf",
  "status": "processing",
  "created_at": "2024-01-16T09:15:00Z"
}
```

### Get Document

```http
GET /api/v1/knowledge-bases/{kb_id}/documents/{doc_id}
```

### Delete Document

```http
DELETE /api/v1/knowledge-bases/{kb_id}/documents/{doc_id}
```

### Get Document Chunks

```http
GET /api/v1/knowledge-bases/{kb_id}/documents/{doc_id}/chunks
```

---

## Chat

### Create Chat Completion

```http
POST /api/v1/chat/completions
```

**Request Body:**

```json
{
  "knowledge_base_id": "kb_abc123",
  "messages": [
    {"role": "system", "content": "You are a helpful tutor."},
    {"role": "user", "content": "Explain attention mechanism in transformers"}
  ],
  "model": "gpt-4-turbo",
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000,
  "retrieval": {
    "top_k": 10,
    "threshold": 0.7,
    "rerank": true
  }
}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `knowledge_base_id` | string | required | Knowledge base to query |
| `messages` | array | required | Conversation messages |
| `model` | string | `gpt-4-turbo` | LLM model to use |
| `stream` | boolean | `false` | Enable streaming |
| `temperature` | float | `0.7` | Sampling temperature (0-2) |
| `max_tokens` | integer | `2000` | Maximum response tokens |
| `retrieval.top_k` | integer | `10` | Number of chunks to retrieve |
| `retrieval.threshold` | float | `0.7` | Similarity threshold |
| `retrieval.rerank` | boolean | `false` | Enable reranking |

**Response (non-streaming):**

```json
{
  "id": "chatcmpl_abc123",
  "object": "chat.completion",
  "created": 1705401234,
  "model": "gpt-4-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The attention mechanism in transformers..."
      },
      "citations": [
        {
          "index": 1,
          "document_id": "doc_xyz789",
          "chunk_id": "chunk_001",
          "text": "Self-attention allows the model...",
          "page": 3
        }
      ],
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1250,
    "completion_tokens": 456,
    "total_tokens": 1706
  }
}
```

**Response (streaming):**

```
data: {"id":"chatcmpl_abc123","object":"chat.completion.chunk","choices":[{"delta":{"content":"The"}}]}

data: {"id":"chatcmpl_abc123","object":"chat.completion.chunk","choices":[{"delta":{"content":" attention"}}]}

data: {"id":"chatcmpl_abc123","object":"chat.completion.chunk","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

---

## Conversations

### List Conversations

```http
GET /api/v1/conversations
```

### Get Conversation

```http
GET /api/v1/conversations/{conversation_id}
```

### Delete Conversation

```http
DELETE /api/v1/conversations/{conversation_id}
```

---

## Search

### Semantic Search

```http
POST /api/v1/search
```

**Request Body:**

```json
{
  "query": "attention mechanism explanation",
  "knowledge_base_ids": ["kb_abc123", "kb_def456"],
  "top_k": 20,
  "threshold": 0.6,
  "filters": {
    "file_type": "application/pdf",
    "created_after": "2024-01-01T00:00:00Z"
  }
}
```

**Response:**

```json
{
  "results": [
    {
      "chunk_id": "chunk_001",
      "document_id": "doc_xyz789",
      "knowledge_base_id": "kb_abc123",
      "text": "Self-attention, sometimes called...",
      "score": 0.92,
      "metadata": {
        "file_name": "attention_paper.pdf",
        "page": 3,
        "section": "2.1 Attention"
      }
    }
  ],
  "query_embedding_time_ms": 45,
  "search_time_ms": 23
}
```

---

## Practice

### Generate Questions

```http
POST /api/v1/practice/generate
```

**Request Body:**

```json
{
  "knowledge_base_id": "kb_abc123",
  "document_ids": ["doc_xyz789"],
  "question_types": ["multiple_choice", "short_answer"],
  "difficulty": "medium",
  "count": 10,
  "topics": ["attention", "transformers"]
}
```

### Submit Answer

```http
POST /api/v1/practice/sessions/{session_id}/submit
```

---

## Research

### Start Research Task

```http
POST /api/v1/research/tasks
```

**Request Body:**

```json
{
  "query": "Recent advances in multimodal learning",
  "sources": ["semantic_scholar", "arxiv", "web"],
  "max_papers": 20,
  "date_range": {
    "start": "2023-01-01",
    "end": "2024-01-01"
  }
}
```

### Get Research Results

```http
GET /api/v1/research/tasks/{task_id}
```
