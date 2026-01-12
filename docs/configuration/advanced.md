---
title: Advanced Configuration
description: Performance tuning and advanced options
---

# Advanced Configuration

This guide covers advanced configuration options for performance tuning and specialized deployments.

## Performance Tuning

### Memory Management

```bash
# Limit memory usage for embeddings
EMBEDDING_MAX_MEMORY=8GB

# Enable memory-mapped model loading
USE_MMAP=true

# Garbage collection tuning
PYTHON_GC_THRESHOLD=10000
```

### Concurrency Settings

```bash
# Worker processes
WORKERS=4

# Threads per worker
THREADS_PER_WORKER=2

# Request timeout
REQUEST_TIMEOUT=300
```

### Batch Processing

```bash
# Document processing batch size
DOC_BATCH_SIZE=10

# Embedding batch size
EMBEDDING_BATCH_SIZE=32

# Enable parallel processing
ENABLE_PARALLEL=true
MAX_PARALLEL_JOBS=4
```

## Apple Silicon Optimization

For M1/M2/M3 Macs, use these optimized settings:

```bash
# Use Metal Performance Shaders
DEVICE=mps

# Optimized batch size for unified memory
BATCH_SIZE=4

# Enable memory-efficient attention
USE_FLASH_ATTENTION=true

# Quantization for larger models
QUANTIZATION=4bit
```

See [Research: Apple Silicon Benchmarks](../research/apple-silicon-benchmarks.md) for performance data.

## Chunking Strategy

### Default Settings

```yaml
chunking:
  strategy: semantic
  chunk_size: 512
  chunk_overlap: 50
  min_chunk_size: 100
```

### Document-Type Specific

```yaml
chunking:
  pdf:
    strategy: page_aware
    chunk_size: 1000
    preserve_tables: true
  code:
    strategy: ast_aware
    chunk_size: 500
  markdown:
    strategy: header_aware
    chunk_size: 512
```

## Retrieval Configuration

```yaml
retrieval:
  # Number of chunks to retrieve
  top_k: 10

  # Similarity threshold
  similarity_threshold: 0.7

  # Reranking
  enable_reranking: true
  reranker_model: cross-encoder/ms-marco-MiniLM-L-6-v2

  # Hybrid search
  enable_hybrid: true
  keyword_weight: 0.3
  semantic_weight: 0.7
```

## Logging and Monitoring

```bash
# Structured logging
LOG_FORMAT=json

# Log destination
LOG_FILE=/var/log/pradeep/app.log

# Metrics endpoint
ENABLE_METRICS=true
METRICS_PORT=9090

# Tracing
ENABLE_TRACING=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

## Security Hardening

```bash
# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60

# Input validation
MAX_INPUT_LENGTH=50000
SANITIZE_HTML=true

# Session security
SESSION_LIFETIME=3600
SECURE_COOKIES=true
```
