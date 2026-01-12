---
title: API Reference
description: Complete API documentation for praDeep
---

# API Reference

praDeep provides a RESTful API and WebSocket endpoints for integrating with external applications.

## Overview

| Base URL | Description |
|----------|-------------|
| `http://localhost:8783/api/v1` | Local development |
| `https://api.pradeep.ai/v1` | Production |

## Authentication

All API requests require authentication via API key or JWT token.

```bash
# Using API key
curl -H "Authorization: Bearer pd_sk_xxxxx" https://api.pradeep.ai/v1/chat

# Using JWT token
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." https://api.pradeep.ai/v1/chat
```

## Documentation

| Document | Description |
|----------|-------------|
| [Endpoints](./endpoints.md) | Complete REST API reference |
| [SDK](./sdk.md) | Python and JavaScript SDKs |
| [Webhooks](./webhooks.md) | Webhook event documentation |

## Quick Start

### Create a Knowledge Base

```bash
curl -X POST https://api.pradeep.ai/v1/knowledge-bases \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Documents", "description": "Research papers"}'
```

### Upload a Document

```bash
curl -X POST https://api.pradeep.ai/v1/knowledge-bases/kb_123/documents \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@paper.pdf"
```

### Ask a Question

```bash
curl -X POST https://api.pradeep.ai/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Explain the main findings"}],
    "knowledge_base_id": "kb_123",
    "stream": true
  }'
```

## Rate Limits

| Plan | Requests/min | Documents/day | Storage |
|------|--------------|---------------|---------|
| Free | 10 | 10 | 100 MB |
| Pro | 100 | 100 | 10 GB |
| Enterprise | Unlimited | Unlimited | Unlimited |

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Please retry after 60 seconds.",
    "type": "rate_limit_error",
    "param": null
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_api_key` | 401 | Invalid or expired API key |
| `rate_limit_exceeded` | 429 | Too many requests |
| `invalid_request` | 400 | Malformed request body |
| `not_found` | 404 | Resource not found |
| `server_error` | 500 | Internal server error |

## SDKs

### Python

```bash
pip install pradeep
```

```python
from pradeep import praDeep

client = praDeep(api_key="pd_sk_xxxxx")
response = client.chat.completions.create(
    knowledge_base_id="kb_123",
    messages=[{"role": "user", "content": "Summarize the paper"}]
)
```

### JavaScript

```bash
npm install pradeep
```

```javascript
import praDeep from 'pradeep';

const client = new praDeep({ apiKey: 'pd_sk_xxxxx' });
const response = await client.chat.completions.create({
  knowledgeBaseId: 'kb_123',
  messages: [{ role: 'user', content: 'Summarize the paper' }]
});
```
