---
title: Configuration
description: Complete configuration reference for DeepTutor
---

# Configuration

DeepTutor offers extensive configuration options to customize behavior, performance, and integrations.

## Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables and secrets |
| `config/settings.yaml` | Application settings |
| `config/models.yaml` | Model configurations |
| `config/prompts/` | Custom prompt templates |

## Quick Links

- [Environment Variables](./environment.md) - API keys and core settings
- [Model Configuration](./models.md) - LLM and embedding model options
- [Storage Settings](./storage.md) - Database and file storage
- [Advanced Options](./advanced.md) - Performance tuning and edge cases

## Common Configuration Scenarios

### Local Development

```bash
# .env for local development
DEBUG=true
LOG_LEVEL=DEBUG
USE_LOCAL_MODELS=false
OPENAI_API_KEY=sk-...
```

### Production Deployment

```bash
# .env for production
DEBUG=false
LOG_LEVEL=INFO
USE_SSL=true
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Apple Silicon Optimized

```bash
# .env for M1/M2/M3 Macs
USE_LOCAL_MODELS=true
EMBEDDING_MODEL=Qwen3-VL-Embedding-8B
DEVICE=mps
BATCH_SIZE=4
```

## Environment Variable Reference

See [Environment Variables](./environment.md) for the complete reference.
