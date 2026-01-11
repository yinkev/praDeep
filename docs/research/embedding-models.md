---
title: Embedding Model Comparison
description: Research comparing multimodal embedding models for PDF tutoring (January 2026)
---

# Embedding Model Comparison

**Date:** January 10, 2026
**Goal:** Find the best embedding model for praDeep PDF tutoring with diagrams/charts

## TL;DR

**Winner: Qwen3-VL-Embedding-8B** - Best multimodal embedding for our use case.

| Model | Type | Dimensions | Best For |
|-------|------|------------|----------|
| **Qwen3-VL-Embedding-8B** ⭐ | Multimodal | 4096 | Text + images, PDF tutoring |
| ColQwen2 | Late interaction | 768 vectors/page | Visual document retrieval |
| Qwen3-Embedding-8B | Text-only | 4096 | Pure text, #1 MTEB |
| Jina v4 | Multimodal | 2048 | Universal, 90.17 ViDoRe |

## Models Evaluated

### 1. Qwen3-VL-Embedding (2B/8B) ⭐ SELECTED

**Source:** [Qwen Blog](https://qwen.ai/blog?id=qwen3-vl-embedding) | [HuggingFace](https://huggingface.co/Qwen/Qwen3-VL-Embedding-8B)

| Spec | 2B | 8B |
|------|-----|-----|
| Dimensions | 64-2048 | 64-4096 |
| Context | 32K | 32K |
| VRAM (FP16) | ~6 GB | ~18 GB |
| Modalities | Text, Image, Video | Text, Image, Video |
| Languages | 30+ | 30+ |

**Pros:**
- True multimodal: embeds text AND images in same vector space
- Released Jan 8, 2026 (newest)
- Flexible dimensions (Matryoshka)
- Apache 2.0 license

**Cons:**
- No MLX optimization yet (uses PyTorch MPS)
- No official OpenAI-compatible server

### 2. ColQwen2

**Source:** [GitHub](https://github.com/illuin-tech/colpali)

| Spec | Value |
|------|-------|
| ViDoRe Score | 86.3 nDCG@5 |
| Approach | Late interaction (multi-vector) |
| Storage | ~100KB per page |

**Pros:**
- Best accuracy for visual documents
- No OCR needed (treats pages as images)
- Excellent for charts/tables

**Cons:**
- Multi-vector storage (10-100x larger)
- Requires Vespa/Qdrant
- Not drop-in compatible

### 3. Qwen3-Embedding-8B (Text-only)

**Source:** [Ollama](https://ollama.com/library/qwen3-embedding)

| Spec | Value |
|------|-------|
| MTEB Score | #1 (70.58 multilingual) |
| Dimensions | 4096 |
| Ollama | ✅ Native support |

**Pros:**
- Best text embedding benchmark
- Ollama native
- Fast (44K tok/s with MLX)

**Cons:**
- Text-only (misses diagrams)
- Not multimodal

### 4. Other Options

| Model | Score | Notes |
|-------|-------|-------|
| Jina v4 | 90.17 ViDoRe | CC BY-NC license, 3.8B params |
| NVIDIA NeMo 1B | #1 ViDoRe v1/v2 | Commercial, NVIDIA-only |
| Cohere Embed v4 | High | API-only, 128K context |
| Nomic Embed Vision | Lower | Lightweight (230M) |

## Decision Matrix

| Requirement | Qwen3-VL-8B | ColQwen2 | Qwen3-Emb-8B |
|-------------|-------------|----------|--------------|
| Multimodal | ✅ | ✅ | ❌ |
| Drop-in compatible | ✅ | ❌ | ✅ |
| Free/Open | ✅ | ✅ | ✅ |
| Apple Silicon | ✅ MPS | ✅ MPS | ✅ Ollama |
| Storage efficient | ✅ | ❌ | ✅ |

## Conclusion

**Qwen3-VL-Embedding-8B** is the best choice for praDeep because:

1. **Multimodal** - Can embed both text and images from PDFs
2. **Most updated** - Released Jan 8, 2026
3. **Free** - Apache 2.0, runs locally
4. **Compatible** - Works with our existing architecture
5. **Sufficient performance** - 13.8 texts/sec on M2 Max

For pure document retrieval with complex visuals, ColQwen2 is better but requires architecture changes.
