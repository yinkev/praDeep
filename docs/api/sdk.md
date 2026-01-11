---
title: SDK Reference
description: Python and JavaScript SDK documentation for DeepTutor
---

# SDK Reference

Official SDKs for integrating DeepTutor into your applications.

## Python SDK

### Installation

```bash
pip install deeptutor
```

### Quick Start

```python
from deeptutor import DeepTutor

# Initialize client
client = DeepTutor(api_key="dt_sk_xxxxx")

# Create a knowledge base
kb = client.knowledge_bases.create(
    name="Research Papers",
    description="My research collection"
)

# Upload a document
doc = client.documents.create(
    knowledge_base_id=kb.id,
    file=open("paper.pdf", "rb")
)

# Wait for processing
doc = client.documents.wait_until_ready(kb.id, doc.id)

# Ask a question
response = client.chat.completions.create(
    knowledge_base_id=kb.id,
    messages=[{"role": "user", "content": "Summarize the key findings"}]
)

print(response.choices[0].message.content)
```

### Streaming Responses

```python
stream = client.chat.completions.create(
    knowledge_base_id=kb.id,
    messages=[{"role": "user", "content": "Explain in detail"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### Async Support

```python
import asyncio
from deeptutor import AsyncDeepTutor

async def main():
    client = AsyncDeepTutor(api_key="dt_sk_xxxxx")

    response = await client.chat.completions.create(
        knowledge_base_id="kb_123",
        messages=[{"role": "user", "content": "Explain transformers"}]
    )

    print(response.choices[0].message.content)

asyncio.run(main())
```

### Error Handling

```python
from deeptutor import DeepTutor, DeepTutorError, RateLimitError, AuthenticationError

client = DeepTutor(api_key="dt_sk_xxxxx")

try:
    response = client.chat.completions.create(
        knowledge_base_id="kb_123",
        messages=[{"role": "user", "content": "Hello"}]
    )
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except AuthenticationError:
    print("Invalid API key")
except DeepTutorError as e:
    print(f"API error: {e.message}")
```

### Configuration

```python
from deeptutor import DeepTutor

client = DeepTutor(
    api_key="dt_sk_xxxxx",
    base_url="https://api.deeptutor.io/v1",  # Custom base URL
    timeout=60.0,  # Request timeout in seconds
    max_retries=3,  # Number of retry attempts
)
```

---

## JavaScript/TypeScript SDK

### Installation

```bash
npm install deeptutor
# or
yarn add deeptutor
```

### Quick Start

```typescript
import DeepTutor from 'deeptutor';

const client = new DeepTutor({ apiKey: 'dt_sk_xxxxx' });

// Create a knowledge base
const kb = await client.knowledgeBases.create({
  name: 'Research Papers',
  description: 'My research collection'
});

// Upload a document
const doc = await client.documents.create(kb.id, {
  file: fs.createReadStream('paper.pdf')
});

// Wait for processing
await client.documents.waitUntilReady(kb.id, doc.id);

// Ask a question
const response = await client.chat.completions.create({
  knowledgeBaseId: kb.id,
  messages: [{ role: 'user', content: 'Summarize the key findings' }]
});

console.log(response.choices[0].message.content);
```

### Streaming Responses

```typescript
const stream = await client.chat.completions.create({
  knowledgeBaseId: kb.id,
  messages: [{ role: 'user', content: 'Explain in detail' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Browser Usage

```typescript
import DeepTutor from 'deeptutor/browser';

const client = new DeepTutor({ apiKey: 'dt_sk_xxxxx' });

const response = await client.chat.completions.create({
  knowledgeBaseId: 'kb_123',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### Error Handling

```typescript
import DeepTutor, {
  DeepTutorError,
  RateLimitError,
  AuthenticationError
} from 'deeptutor';

const client = new DeepTutor({ apiKey: 'dt_sk_xxxxx' });

try {
  const response = await client.chat.completions.create({
    knowledgeBaseId: 'kb_123',
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof DeepTutorError) {
    console.log(`API error: ${error.message}`);
  }
}
```

### TypeScript Types

```typescript
import type {
  KnowledgeBase,
  Document,
  ChatCompletion,
  Message,
  Citation
} from 'deeptutor';

const handleResponse = (response: ChatCompletion) => {
  const message = response.choices[0].message;
  const citations: Citation[] = response.choices[0].citations || [];

  console.log(message.content);
  citations.forEach(c => console.log(`[${c.index}] ${c.text}`));
};
```

---

## SDK Comparison

| Feature | Python | JavaScript |
|---------|--------|------------|
| Sync API | Yes | No |
| Async API | Yes | Yes |
| Streaming | Yes | Yes |
| Browser support | No | Yes |
| Type hints | Yes | Yes (TypeScript) |
| Retry logic | Built-in | Built-in |
| Timeout config | Yes | Yes |

## Common Patterns

### Batch Document Upload

```python
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

def upload_document(client, kb_id, file_path):
    with open(file_path, "rb") as f:
        return client.documents.create(knowledge_base_id=kb_id, file=f)

files = list(Path("./papers").glob("*.pdf"))

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [
        executor.submit(upload_document, client, kb.id, f)
        for f in files
    ]
    documents = [f.result() for f in futures]
```

### Conversation Context

```python
messages = []

def chat(user_message: str) -> str:
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        knowledge_base_id=kb.id,
        messages=messages
    )

    assistant_message = response.choices[0].message.content
    messages.append({"role": "assistant", "content": assistant_message})

    return assistant_message
```

### Progress Tracking

```python
import time

def upload_with_progress(file_path: str) -> Document:
    doc = client.documents.create(
        knowledge_base_id=kb.id,
        file=open(file_path, "rb")
    )

    while True:
        doc = client.documents.retrieve(kb.id, doc.id)

        if doc.status == "ready":
            print(f"Complete! {doc.chunk_count} chunks created.")
            return doc
        elif doc.status == "failed":
            raise Exception(f"Processing failed: {doc.error}")

        print(f"Processing... {doc.progress}%")
        time.sleep(2)
```
