---
title: Research & Findings
description: Research findings, benchmarks, and technical decisions for praDeep
---

# Research & Findings

This section documents our research findings, experiments, and the technical decisions that shaped praDeep's architecture.

## Research Documents

| Document | Date | Description |
|----------|------|-------------|
| [Embedding Model Comparison](./embedding-models.md) | Jan 2026 | Analysis of multimodal embedding models for RAG |
| [Apple Silicon Benchmarks](./apple-silicon-benchmarks.md) | Jan 2026 | M2 Max 96GB performance testing |
| [Cost Analysis](./cost-analysis.md) | Jan 2026 | API vs local model cost comparison |
| [Architecture Decisions](./decisions.md) | Ongoing | Key technical decisions and rationale |

## Key Findings Summary

### Embedding Model Selection

After extensive evaluation, we selected **Qwen3-VL-Embedding-8B** as our primary embedding model:

| Criteria | Qwen3-VL-8B | ColQwen2 | text-embedding-3-large |
|----------|-------------|----------|------------------------|
| Multimodal | Yes | Yes | No |
| Dimensions | 4096 | 768 (multi-vector) | 3072 |
| Local Deployment | Yes | Yes | No (API only) |
| Apple Silicon | MPS | MPS | N/A |
| Cost | Free | Free | $0.13/1M tokens |

**Decision:** Qwen3-VL-Embedding-8B provides the best combination of quality, multimodal support, and cost efficiency for educational document processing.

See [Embedding Model Comparison](./embedding-models.md) for full analysis.

### Apple Silicon Performance

M2 Max with 96GB unified memory provides excellent local inference performance:

| Metric | Value |
|--------|-------|
| Embedding Throughput | 13.8 texts/sec |
| Embedding Latency | 72.7 ms/text |
| Memory Usage | ~6 GB peak |
| Available Headroom | ~90 GB |

**Key Insight:** The M2 Max can comfortably run the 8B embedding model alongside the full application stack with memory to spare.

See [Apple Silicon Benchmarks](./apple-silicon-benchmarks.md) for detailed results.

### Cost Optimization

Local deployment eliminates embedding API costs entirely:

| Solution | Monthly Cost (1B tokens) |
|----------|--------------------------|
| Self-hosted (local) | ~$5 (electricity) |
| Together AI API | ~$8 |
| OpenAI small | ~$20 |
| Cohere v4 | ~$120 |

**Decision:** Self-hosted deployment is optimal for our use case given available hardware.

See [Cost Analysis](./cost-analysis.md) for detailed breakdown.

## Architecture Decisions

Key technical decisions documented with rationale:

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Qwen3-VL-Embedding-8B for embeddings | Accepted |
| ADR-002 | ChromaDB for vector storage | Accepted |
| ADR-003 | CLI Proxy API for LLM routing | Accepted |
| ADR-004 | Local-first architecture | Accepted |

See [Architecture Decisions](./decisions.md) for full details.

## Research Methodology

Our research follows these principles:

1. **Reproducibility** - All experiments include configuration and code
2. **Real-world focus** - Testing on actual PDF documents and queries
3. **Practical metrics** - Measuring latency, cost, and quality together
4. **Continuous updates** - Revisiting as new models are released

## Guiding Principles

Based on our research, we follow these principles:

1. **No fallbacks** - Always use the most updated, capable models
2. **Local-first** - Prefer self-hosted when practical for privacy and cost
3. **Multimodal** - Support images/diagrams in educational content
4. **Quality over speed** - Use 8B models when memory permits

## External Resources

- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard) - Embedding model benchmarks
- [ViDoRe Leaderboard](https://huggingface.co/spaces/vidore/vidore-leaderboard) - Visual document retrieval
- [Qwen Blog](https://qwen.ai/blog) - Model announcements and updates

## Contributing

Found interesting research or want to contribute benchmarks?

1. Open an issue describing your findings
2. Submit a PR with reproducible experiments
3. Include clear methodology and results
