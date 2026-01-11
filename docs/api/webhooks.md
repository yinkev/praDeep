---
title: Webhooks
description: Webhook events and configuration for DeepTutor
---

# Webhooks

DeepTutor can send webhook notifications for various events, enabling real-time integrations with external systems.

## Configuration

### Create Webhook Endpoint

```http
POST /api/v1/webhooks
```

```json
{
  "url": "https://your-server.com/webhooks/deeptutor",
  "events": ["document.processed", "document.failed"],
  "secret": "whsec_xxxxx"
}
```

### Manage Webhooks

```http
GET /api/v1/webhooks          # List all webhooks
GET /api/v1/webhooks/{id}     # Get webhook details
PATCH /api/v1/webhooks/{id}   # Update webhook
DELETE /api/v1/webhooks/{id}  # Delete webhook
```

## Event Types

### Document Events

| Event | Description |
|-------|-------------|
| `document.uploaded` | Document upload initiated |
| `document.processed` | Document successfully processed |
| `document.failed` | Document processing failed |
| `document.deleted` | Document deleted |

### Knowledge Base Events

| Event | Description |
|-------|-------------|
| `knowledge_base.created` | Knowledge base created |
| `knowledge_base.updated` | Knowledge base settings updated |
| `knowledge_base.deleted` | Knowledge base deleted |

### Chat Events

| Event | Description |
|-------|-------------|
| `chat.completed` | Chat completion finished |
| `chat.failed` | Chat completion failed |

### Research Events

| Event | Description |
|-------|-------------|
| `research.started` | Research task initiated |
| `research.completed` | Research task finished |
| `research.failed` | Research task failed |

## Webhook Payload

All webhook payloads follow this structure:

```json
{
  "id": "evt_abc123xyz",
  "type": "document.processed",
  "created": 1705401234,
  "data": {
    "object": {
      "id": "doc_xyz789",
      "knowledge_base_id": "kb_abc123",
      "file_name": "paper.pdf",
      "status": "ready",
      "chunk_count": 127
    }
  }
}
```

### Event Examples

#### document.processed

```json
{
  "id": "evt_doc_proc_001",
  "type": "document.processed",
  "created": 1705401234,
  "data": {
    "object": {
      "id": "doc_xyz789",
      "knowledge_base_id": "kb_abc123",
      "file_name": "attention_paper.pdf",
      "file_type": "application/pdf",
      "file_size": 1548576,
      "status": "ready",
      "chunk_count": 127,
      "processing_time_ms": 4523
    }
  }
}
```

#### document.failed

```json
{
  "id": "evt_doc_fail_001",
  "type": "document.failed",
  "created": 1705401234,
  "data": {
    "object": {
      "id": "doc_xyz789",
      "knowledge_base_id": "kb_abc123",
      "file_name": "corrupted.pdf",
      "status": "failed",
      "error": {
        "code": "parsing_error",
        "message": "Unable to extract text from PDF"
      }
    }
  }
}
```

#### chat.completed

```json
{
  "id": "evt_chat_001",
  "type": "chat.completed",
  "created": 1705401234,
  "data": {
    "object": {
      "id": "chatcmpl_abc123",
      "knowledge_base_id": "kb_abc123",
      "model": "gpt-4-turbo",
      "usage": {
        "prompt_tokens": 1250,
        "completion_tokens": 456,
        "total_tokens": 1706
      },
      "latency_ms": 2340
    }
  }
}
```

## Signature Verification

All webhook requests include a signature for verification.

### Headers

| Header | Description |
|--------|-------------|
| `X-DeepTutor-Signature` | HMAC-SHA256 signature |
| `X-DeepTutor-Timestamp` | Unix timestamp |
| `X-DeepTutor-Event` | Event type |

### Verification (Python)

```python
import hmac
import hashlib

def verify_signature(payload: bytes, signature: str, secret: str, timestamp: str) -> bool:
    # Check timestamp is recent (within 5 minutes)
    import time
    if abs(time.time() - int(timestamp)) > 300:
        return False

    # Compute expected signature
    signed_payload = f"{timestamp}.{payload.decode()}"
    expected = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(f"sha256={expected}", signature)
```

### Verification (JavaScript)

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret, timestamp) {
  // Check timestamp is recent (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)
  );
}
```

## Handling Webhooks

### Express.js Example

```javascript
const express = require('express');
const app = express();

app.post('/webhooks/deeptutor',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-deeptutor-signature'];
    const timestamp = req.headers['x-deeptutor-timestamp'];

    if (!verifySignature(req.body, signature, WEBHOOK_SECRET, timestamp)) {
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(req.body);

    switch (event.type) {
      case 'document.processed':
        handleDocumentProcessed(event.data.object);
        break;
      case 'document.failed':
        handleDocumentFailed(event.data.object);
        break;
    }

    res.status(200).send('OK');
  }
);
```

### Flask Example

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhooks/deeptutor', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-DeepTutor-Signature')
    timestamp = request.headers.get('X-DeepTutor-Timestamp')

    if not verify_signature(request.data, signature, WEBHOOK_SECRET, timestamp):
        return 'Invalid signature', 401

    event = request.get_json()

    if event['type'] == 'document.processed':
        handle_document_processed(event['data']['object'])
    elif event['type'] == 'document.failed':
        handle_document_failed(event['data']['object'])

    return 'OK', 200
```

## Retry Policy

Failed webhook deliveries are retried with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 8 hours |

After 6 failed attempts, the webhook is marked as failed and no further retries are made.

### Webhook Logs

View delivery attempts and responses:

```http
GET /api/v1/webhooks/{id}/logs
```

```json
{
  "data": [
    {
      "id": "log_001",
      "event_id": "evt_abc123",
      "status": "success",
      "response_code": 200,
      "response_time_ms": 145,
      "created_at": "2024-01-16T10:30:00Z"
    },
    {
      "id": "log_002",
      "event_id": "evt_def456",
      "status": "failed",
      "response_code": 500,
      "error": "Connection timeout",
      "retry_at": "2024-01-16T10:35:00Z"
    }
  ]
}
```

## Best Practices

1. **Always verify signatures** - Never process webhooks without verification
2. **Respond quickly** - Return 200 within 30 seconds to avoid retries
3. **Process async** - Queue events for background processing
4. **Handle duplicates** - Use event IDs for idempotency
5. **Monitor failures** - Set up alerts for repeated failures
