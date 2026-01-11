---
title: Apple Silicon Benchmarks
description: Real-world benchmarks of Qwen3-VL-Embedding on M2 Max (January 2026)
---

# Apple Silicon Benchmarks

**Date:** January 10, 2026
**Hardware:** MacBook Pro M2 Max, 96GB Unified Memory

## System Specs

| Component | Value |
|-----------|-------|
| Chip | Apple M2 Max |
| CPU Cores | 12 (8P + 4E) |
| GPU Cores | 38 |
| Unified Memory | 96 GB |
| Metal | Metal 4 |
| PyTorch | 2.9.1 |
| MPS | ✅ Available |

## Qwen3-VL-Embedding-8B Results

### Load Time

| Metric | Value |
|--------|-------|
| First load (download) | ~14 minutes |
| Subsequent load (cached) | ~30 seconds |

### Inference Performance

| Metric | Value |
|--------|-------|
| **Throughput** | **13.8 texts/sec** |
| **Latency** | **72.7ms per text** |
| Batch size tested | 3 texts |
| Device | MPS (Metal) |

### Memory Usage

| Stage | Memory |
|-------|--------|
| Idle | ~1.2% system |
| Model loaded | ~4 GB process |
| Peak during inference | ~6 GB |
| Available headroom | ~90 GB |

## MPS Performance Tests

### Matrix Operations

| Matrix Size | Time per Op |
|-------------|-------------|
| 1024 × 2048 | 1.12ms |
| 2048 × 2048 | 3.54ms |
| 4096 × 2048 | 12.24ms |

### Memory Allocation

| Test | Result |
|------|--------|
| 5 GB tensor | ✅ OK |
| 10 GB tensor | ✅ OK |
| Verdict | ✅ Plenty of headroom |

## Comparison: 2B vs 8B

| Metric | 2B | 8B |
|--------|-----|-----|
| VRAM | ~6 GB | ~18 GB |
| Speed | ~2x faster | Baseline |
| Accuracy | Good | Better |
| Fits on 96GB | ✅ | ✅ |

**Recommendation:** Use 8B - we have the memory, and accuracy matters for educational content.

## Practical Implications

### What You Can Run Simultaneously

| Model | Memory | Status |
|-------|--------|--------|
| Qwen3-VL-Embedding-8B | ~18 GB | ✅ |
| LLM via CLI Proxy | External | ✅ |
| ChromaDB | ~2 GB | ✅ |
| Next.js Frontend | ~500 MB | ✅ |
| **Total** | ~21 GB | ✅ 75 GB free |

### Expected Performance

| Task | Time |
|------|------|
| Embed 100-page PDF | ~10-15 sec |
| Single query | <100ms |
| Full RAG pipeline | ~2-3 sec |

## Limitations

| Limitation | Impact |
|------------|--------|
| No flash_attention on MPS | ~2-3x slower than CUDA |
| No MLX support yet | Using PyTorch MPS |
| First load is slow | One-time download |

## Verdict

✅ **Qwen3-VL-Embedding-8B is practical on M2 Max 96GB**

- Throughput: 13.8 texts/sec (sufficient for interactive tutoring)
- Memory: Uses only ~20% of available
- Latency: 72.7ms (imperceptible to users)
