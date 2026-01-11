---
title: Environment Variables
description: Complete environment variable reference
---

# Environment Variables

This document provides a complete reference for all environment variables.

## Core Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEBUG` | No | `false` | Enable debug mode |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `PORT` | No | `8783` | Server port |

## LLM Provider Settings

### OpenAI

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4` | Model to use |
| `OPENAI_BASE_URL` | No | - | Custom API endpoint |

### Anthropic

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes* | - | Anthropic API key |
| `ANTHROPIC_MODEL` | No | `claude-3-sonnet` | Model to use |

### Local Models

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USE_LOCAL_MODELS` | No | `false` | Enable local model inference |
| `LOCAL_MODEL_PATH` | No | `~/.cache/models` | Path to cached models |
| `DEVICE` | No | `auto` | Device (cpu, cuda, mps) |

## Embedding Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMBEDDING_MODEL` | No | `text-embedding-3-small` | Embedding model |
| `EMBEDDING_DIMENSION` | No | `1536` | Vector dimension |
| `EMBEDDING_BATCH_SIZE` | No | `32` | Batch size for embedding |

## Database Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `sqlite:///./data/app.db` | Database connection URL |
| `VECTOR_DB_URL` | No | - | Vector database URL |
| `REDIS_URL` | No | - | Redis connection URL |

## Security Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | - | Application secret key |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins |
| `USE_SSL` | No | `false` | Enable SSL/TLS |

## Example Configuration

```bash
# Minimal configuration
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=your-secret-key-here

# Full production configuration
DEBUG=false
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8783

OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo

EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIMENSION=3072

DATABASE_URL=postgresql://user:pass@localhost/deeptutor
REDIS_URL=redis://localhost:6379

SECRET_KEY=your-production-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
USE_SSL=true
```
