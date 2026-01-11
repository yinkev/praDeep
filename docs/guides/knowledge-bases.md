---
title: Knowledge Bases Guide
description: Complete guide to creating and managing knowledge bases in DeepTutor
---

# Knowledge Bases Guide

Learn how to create, populate, and optimize knowledge bases for effective document-based learning.

## Prerequisites

- DeepTutor installed and running
- API key configured (for cloud embeddings) or local model set up
- Documents ready for upload (PDF, DOCX, MD, or TXT)

## Creating a Knowledge Base

### Via Web Interface

1. Navigate to **Knowledge Bases** in the sidebar
2. Click **Create New**
3. Enter a name and optional description
4. Select embedding model (default: `text-embedding-3-large`)
5. Click **Create**

### Via API

```bash
curl -X POST http://localhost:8783/api/v1/knowledge-bases \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Machine Learning Course",
    "description": "CS229 lecture notes and textbook",
    "embedding_model": "text-embedding-3-large"
  }'
```

### Via Python SDK

```python
from deeptutor import DeepTutor

client = DeepTutor()
kb = client.knowledge_bases.create(
    name="Machine Learning Course",
    description="CS229 lecture notes and textbook"
)
print(f"Created: {kb.id}")
```

## Uploading Documents

### Supported Formats

| Format | Extension | Max Size | Notes |
|--------|-----------|----------|-------|
| PDF | `.pdf` | 100 MB | Text and scanned (OCR) |
| Word | `.docx` | 50 MB | Preserves structure |
| Markdown | `.md` | 10 MB | Headers become sections |
| Plain Text | `.txt` | 10 MB | UTF-8 encoded |
| HTML | `.html` | 10 MB | Stripped of scripts/styles |

### Single Document Upload

```bash
curl -X POST http://localhost:8783/api/v1/knowledge-bases/kb_123/documents \
  -H "Authorization: Bearer $API_KEY" \
  -F "file=@lecture_notes.pdf"
```

### Batch Upload

```python
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

def upload_file(path: Path):
    with open(path, "rb") as f:
        return client.documents.create(kb.id, file=f)

files = list(Path("./lectures").glob("*.pdf"))

with ThreadPoolExecutor(max_workers=5) as executor:
    documents = list(executor.map(upload_file, files))

print(f"Uploaded {len(documents)} documents")
```

### Monitoring Upload Progress

```python
doc = client.documents.create(kb.id, file=open("large_textbook.pdf", "rb"))

# Poll for status
while True:
    doc = client.documents.retrieve(kb.id, doc.id)
    print(f"Status: {doc.status}, Progress: {doc.progress}%")

    if doc.status in ("ready", "failed"):
        break

    time.sleep(2)
```

## Querying Your Knowledge Base

### Basic Query

```python
response = client.chat.completions.create(
    knowledge_base_id=kb.id,
    messages=[
        {"role": "user", "content": "Explain gradient descent"}
    ]
)
print(response.choices[0].message.content)
```

### With Conversation History

```python
messages = []

def ask(question: str) -> str:
    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        knowledge_base_id=kb.id,
        messages=messages
    )

    answer = response.choices[0].message.content
    messages.append({"role": "assistant", "content": answer})

    return answer

ask("What is backpropagation?")
ask("Can you give me an example?")  # Maintains context
```

### With Citations

```python
response = client.chat.completions.create(
    knowledge_base_id=kb.id,
    messages=[{"role": "user", "content": "What are the types of neural networks?"}],
    include_citations=True
)

# Access citations
for citation in response.choices[0].citations:
    print(f"[{citation.index}] {citation.document_name}, p.{citation.page}")
    print(f"    \"{citation.text[:100]}...\"")
```

## Tuning Retrieval

### Adjust Retrieval Parameters

```python
response = client.chat.completions.create(
    knowledge_base_id=kb.id,
    messages=[{"role": "user", "content": "Explain attention mechanisms"}],
    retrieval={
        "top_k": 15,          # Retrieve more chunks
        "threshold": 0.6,     # Lower threshold for broader results
        "rerank": True        # Enable cross-encoder reranking
    }
)
```

### Chunking Strategy

When creating a knowledge base, configure chunking for your content type:

```python
kb = client.knowledge_bases.create(
    name="Research Papers",
    settings={
        "chunk_size": 512,       # Tokens per chunk
        "chunk_overlap": 64,     # Overlap between chunks
        "chunking_strategy": "semantic"  # or "fixed", "recursive"
    }
)
```

| Strategy | Best For | Chunk Size |
|----------|----------|------------|
| `fixed` | General documents | 512 tokens |
| `semantic` | Academic papers | 512-1024 tokens |
| `recursive` | Mixed content (code + text) | 256-512 tokens |

### Metadata Filtering

Add metadata during upload for filtered searches:

```python
doc = client.documents.create(
    kb.id,
    file=open("chapter1.pdf", "rb"),
    metadata={
        "chapter": 1,
        "topic": "introduction",
        "difficulty": "beginner"
    }
)

# Query with filters
response = client.chat.completions.create(
    knowledge_base_id=kb.id,
    messages=[{"role": "user", "content": "What are the basics?"}],
    retrieval={
        "filters": {"difficulty": "beginner"}
    }
)
```

## Managing Knowledge Bases

### List All Knowledge Bases

```python
knowledge_bases = client.knowledge_bases.list()
for kb in knowledge_bases:
    print(f"{kb.name}: {kb.document_count} documents")
```

### Update Knowledge Base

```python
kb = client.knowledge_bases.update(
    kb.id,
    name="Updated Name",
    description="New description"
)
```

### Delete Knowledge Base

```python
# This deletes all documents and embeddings
client.knowledge_bases.delete(kb.id)
```

### Export Knowledge Base

```python
# Export for backup or migration
export = client.knowledge_bases.export(kb.id)

with open("kb_backup.json", "w") as f:
    json.dump(export, f)
```

## Best Practices

### 1. Organize by Topic

Create separate knowledge bases for distinct topics:

```
- cs229-lectures (ML course)
- research-papers (Your research)
- project-docs (Team documentation)
```

### 2. Clean Documents Before Upload

- Remove headers/footers from PDFs
- Ensure good OCR quality for scanned documents
- Split very large documents (>50 pages)

### 3. Test Retrieval Quality

```python
# Test that relevant content is retrieved
results = client.search(
    knowledge_base_ids=[kb.id],
    query="transformer attention mechanism",
    top_k=5
)

for r in results:
    print(f"Score: {r.score:.3f} - {r.text[:100]}...")
```

### 4. Monitor Costs

```python
# Check embedding usage
usage = client.usage.get(start_date="2024-01-01")
print(f"Embeddings: {usage.embedding_tokens:,} tokens")
print(f"Estimated cost: ${usage.embedding_cost:.2f}")
```

## Troubleshooting

### Document Processing Fails

1. Check file format is supported
2. Ensure file is not password-protected
3. For PDFs, verify text is extractable (not image-only)
4. Check file size limits

### Poor Retrieval Quality

1. Increase `top_k` to retrieve more candidates
2. Lower similarity `threshold`
3. Enable reranking (`rerank: true`)
4. Consider different chunking strategy

### Slow Query Performance

1. Reduce `top_k` value
2. Disable reranking for faster results
3. Check vector store indexing status
4. Consider using a faster embedding model
