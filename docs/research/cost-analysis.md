---
title: Cost Analysis
description: Cost comparison of embedding solutions (January 2026)
---

# Cost Analysis

**Date:** January 10, 2026
**Goal:** Find the most cost-effective embedding solution

## TL;DR

**Cheapest:** Self-hosted Qwen3-VL-Embedding = **$0** (free)

## API Pricing (per 1M tokens)

| Provider | Model | Price |
|----------|-------|-------|
| Together AI | Various | $0.008 |
| Voyage AI | voyage-3.5 | $0.02 |
| OpenAI | text-embedding-3-small | $0.02 |
| OpenAI | text-embedding-3-large | $0.13 |
| Cohere | Embed v4 | $0.12 |
| Jina | v4 | Contact sales |

## Free Options

| Option | Limit |
|--------|-------|
| Voyage AI | 200M tokens free |
| Jina | 10M tokens free |
| Google Gemini | Free tier |
| **Self-hosted** | **Unlimited** |

## Self-Hosted Costs

### Local Mac (Your Setup)

| Item | Cost |
|------|------|
| Hardware | Already owned |
| Electricity | ~$5/month |
| **Total** | **~$5/month** |

### Cloud GPU (If Needed)

| Provider | GPU | $/hour | $/month (24/7) |
|----------|-----|--------|----------------|
| Vast.ai | RTX 4090 | $0.24 | $175 |
| Salad | RTX 4090 | $0.16 | $115 |
| Vast.ai | A100 80GB | $0.40 | $290 |
| RunPod | H100 | $1.99 | $1,450 |

## Cost Comparison: 1B Tokens/Month

| Solution | Monthly Cost |
|----------|--------------|
| Together AI API | ~$8 |
| OpenAI small | ~$20 |
| Cohere v4 | ~$120 |
| Self-hosted (local) | **~$5** |
| Self-hosted (Vast.ai) | ~$175 |

## Our Decision

**Self-hosted Qwen3-VL-Embedding-8B on M2 Max**

| Factor | Value |
|--------|-------|
| Monthly cost | ~$5 (electricity) |
| Per-token cost | $0 |
| Limitations | None for our usage |
| Multimodal | ✅ Yes |
| Privacy | ✅ All local |

## When to Consider APIs

| Scenario | Recommendation |
|----------|----------------|
| Low volume (<10M tokens/month) | Free tiers work |
| No GPU available | Together AI ($0.008/1M) |
| Need guaranteed uptime | Cohere/OpenAI |
| Enterprise compliance | Cloud APIs |

## Conclusion

For praDeep, **self-hosted is optimal**:

1. **$0 per token** - no variable costs
2. **Multimodal** - Qwen3-VL handles images
3. **Privacy** - all data stays local
4. **No rate limits** - unlimited throughput
5. **We have the hardware** - M2 Max 96GB is overkill
