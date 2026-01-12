---
title: Storage Configuration
description: Database and file storage settings
---

# Storage Configuration

Configure databases, vector stores, and file storage for praDeep.

## Database Options

### SQLite (Default)

Best for development and single-user deployments.

```bash
DATABASE_URL=sqlite:///./data/app.db
```

### PostgreSQL (Recommended for Production)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/pradeep
```

### MySQL

```bash
DATABASE_URL=mysql://user:password@localhost:3306/pradeep
```

## Vector Database Options

### Chroma (Default)

Embedded vector database, no separate service required.

```bash
VECTOR_DB_TYPE=chroma
VECTOR_DB_PATH=./data/chroma
```

### Qdrant

High-performance vector database for production.

```bash
VECTOR_DB_TYPE=qdrant
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_API_KEY=your-api-key
```

### Pinecone

Fully managed cloud vector database.

```bash
VECTOR_DB_TYPE=pinecone
PINECONE_API_KEY=your-api-key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX=pradeep
```

## File Storage

### Local Storage (Default)

```bash
STORAGE_TYPE=local
STORAGE_PATH=./data/files
MAX_FILE_SIZE=100MB
```

### S3-Compatible Storage

```bash
STORAGE_TYPE=s3
S3_BUCKET=pradeep-files
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Cache Configuration

### Redis (Recommended)

```bash
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=3600
```

### In-Memory (Development)

```bash
CACHE_TYPE=memory
CACHE_SIZE=1000
```

## Storage Architecture

```
data/
├── app.db              # SQLite database
├── chroma/             # Vector embeddings
├── files/              # Uploaded documents
│   ├── raw/            # Original files
│   └── processed/      # Extracted content
├── cache/              # Temporary cache
└── logs/               # Application logs
```

## Backup and Recovery

### Database Backup

```bash
# PostgreSQL
pg_dump pradeep > backup.sql

# SQLite
sqlite3 data/app.db ".backup 'backup.db'"
```

### Vector Store Backup

```bash
# Chroma
cp -r data/chroma data/chroma-backup

# Qdrant
qdrant-backup create --collection pradeep
```
