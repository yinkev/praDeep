---
title: System Overview
description: High-level architecture and design of praDeep
---

# System Overview

praDeep implements a sophisticated multi-agent RAG (Retrieval-Augmented Generation) architecture designed for educational applications.

## Architecture Diagram

```
+------------------+     +-------------------+     +------------------+
|                  |     |                   |     |                  |
|   Web Frontend   +---->+   API Gateway     +---->+  Agent Router    |
|   (Next.js)      |     |   (FastAPI)       |     |                  |
|                  |     |                   |     +--------+---------+
+------------------+     +-------------------+              |
                                                            |
                    +---------------------------------------+
                    |
    +---------------+---------------+---------------+
    |               |               |               |
    v               v               v               v
+-------+     +----------+    +---------+    +----------+
| Tutor |     | Research |    | Writer  |    | Practice |
| Agent |     | Agent    |    | Agent   |    | Agent    |
+---+---+     +----+-----+    +----+----+    +----+-----+
    |              |               |              |
    +-------+------+-------+-------+------+-------+
            |              |              |
            v              v              v
    +---------------+ +------------+ +-----------+
    | Retrieval     | | Generation | | Tools     |
    | Service       | | Service    | | Service   |
    +-------+-------+ +-----+------+ +-----+-----+
            |               |              |
            v               v              v
    +---------------+ +------------+ +-----------+
    | Vector Store  | | LLM APIs   | | External  |
    | (ChromaDB)    | | (OpenAI)   | | Services  |
    +---------------+ +------------+ +-----------+
```

## Core Components

### Frontend Layer

- **Web Application**: Next.js 14 with React Server Components
- **Real-time Updates**: WebSocket connections for streaming responses
- **Rich Text Editor**: Markdown support with LaTeX rendering

### API Layer

- **FastAPI Backend**: Async Python web framework
- **Authentication**: JWT-based auth with OAuth support
- **Rate Limiting**: Token bucket algorithm per user/API key

### Agent Layer

| Agent | Purpose | Capabilities |
|-------|---------|--------------|
| Tutor Agent | Interactive learning | Q&A, explanations, step-by-step solutions |
| Research Agent | Literature exploration | Web search, paper retrieval, synthesis |
| Writer Agent | Content creation | Co-writing, annotation, editing |
| Practice Agent | Assessment | Quiz generation, exam simulation |

### Data Layer

- **Vector Store**: ChromaDB for embedding storage and similarity search
- **Document Store**: PostgreSQL for metadata and user data
- **Cache Layer**: Redis for session state and response caching
- **Object Storage**: S3-compatible storage for uploaded documents

## Request Flow

1. **User Input**: Query submitted via web interface
2. **Routing**: Agent router determines appropriate agent(s)
3. **Retrieval**: Relevant document chunks retrieved from vector store
4. **Generation**: LLM generates response with retrieved context
5. **Post-processing**: Citations added, formatting applied
6. **Response**: Streamed back to client

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers behind load balancer
- Distributed vector store with sharding
- Redis Cluster for session management

### Performance Optimization

- Embedding batch processing
- Response caching with semantic similarity
- Async document ingestion pipeline

## Security Architecture

### Data Protection

- AES-256 encryption at rest
- TLS 1.3 for data in transit
- User data isolation in vector store

### Access Control

- Role-based access control (RBAC)
- API key scoping with fine-grained permissions
- Audit logging for all operations
