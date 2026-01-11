---
title: Workflow
description: Our development workflow and processes
---

# Workflow

How we develop and maintain praDeep (praDeep).

## System Workflows

- Agent architecture: `/workflow/agents`
- Agent workflow diagrams: `/workflow/agent-workflows/`

## Development Principles

1. **No fallbacks** - Always use the most updated models/tools
2. **Research first** - Search web for latest before implementing
3. **Document everything** - Update docs with findings
4. **Local-first** - Self-hosted when practical
5. **Multimodal** - Support images/diagrams in content

## Daily Workflow

### Starting a Session

1. Check for updates:
   ```bash
   # Check latest models
   ollama list

   # Check for package updates
   pip list --outdated
   ```

2. Start services:
   ```bash
   # Start Ollama
   ollama serve

   # Start CLI Proxy API (port 8317)
   # Start backend (port 8001)
   python src/api/main.py

   # Start frontend (port 3782)
   cd web && npm run dev
   ```

### Research Workflow

When exploring new tech:

1. **Search web** - Use agents to find latest (2026) info
2. **Benchmark locally** - Test on M2 Max
3. **Document findings** - Add to `/docs/research/`
4. **Implement** - No fallbacks, use the best option

### Code Changes

1. Read existing code first
2. Make minimal changes
3. Test locally
4. Document if significant

## Tool Integration

### Claude Code

Our primary development environment:
- Ultrathink mode for complex decisions
- Agents for web research
- Skills for specialized tasks

### Codex CLI Integration

For heavy reasoning tasks, use GPT-5.2-Codex with xhigh:

```bash
codex exec -m gpt-5.2-codex -c model_reasoning_effort=xhigh "task"
```

Available reasoning levels:
- `medium` - Daily driver
- `high` - Complex tasks
- `xhigh` - Hardest problems (non-latency-sensitive)

### CLI Proxy API

Routes LLM requests to multiple providers:

```
http://localhost:8317/v1
```

Supports: Gemini, GPT, Claude, etc.

## Environment

### Key Ports

| Service | Port |
|---------|------|
| Backend API | 8001 |
| Frontend | 3782 |
| CLI Proxy | 8317 |
| Ollama | 11434 |

### .env Configuration

```bash
# LLM
LLM_BINDING=openai
LLM_HOST=http://localhost:8317/v1
LLM_MODEL=gemini-2.5-pro-preview

# Embedding (Qwen3-VL-Embedding-8B)
EMBEDDING_BINDING=qwen3_vl
EMBEDDING_MODEL=Qwen/Qwen3-VL-Embedding-8B
EMBEDDING_DIMENSION=4096
```
