---
tags: [performance]
summary: performance implementation decisions and patterns
relevantTo: [performance]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 11
  referenced: 5
  successfulFeatures: 5
---
# performance

#### [Pattern] Lazy hash computation: only recompute hashes for files whose mtime changed, check cached hash for unchanged mtime (2026-01-11)
- **Problem solved:** Hash calculation is expensive (SHA256 on potentially large files); incremental updates need to detect all changes
- **Why this works:** Avoids redundant I/O and CPU. mtime is fast to check. Only computes hash when file likely changed. Still catches content changes (hash changed even if mtime appears same).
- **Trade-offs:** Assumes filesystem mtime is reasonably reliable. Clock skew, network filesystems, or certain backup tools can break this assumption.

### Differentiated TTLs: Query (24h), Embedding (30d), Rerank (7d) rather than single unified TTL (2026-01-11)
- **Context:** RAG queries have multiple cached components with different stability characteristics. Embeddings are stable across sessions. Reranking changes with model updates. Full query results may become stale.
- **Why:** Embedding models rarely change (30d TTL prevents redundant computation). Query results can become stale (24h TTL maintains freshness). Reranking is model-sensitive (7d default prevents stale rankings after updates). This multiplies cache effectiveness without creating stale-data debt.
- **Rejected:** Single TTL for all (would either over-cache embeddings or under-cache queries). User-configurable per-request TTLs (adds complexity without ROI). No TTL expiration (creates unbounded memory/storage).
- **Trade-offs:** Requires three distinct TTL configs but justifies via different invalidation frequencies. More sophisticated invalidation strategy needed if embedding models updated. 30d embedding TTL assumes models don't change mid-month.
- **Breaking if changed:** If embedding models are updated frequently (< 30d), embedding cache becomes liability causing silent staleness. Removing embedding-specific TTL would 50% reduce embedding cache hits. Switching to uniform TTL breaks the cardinality advantage.

#### [Pattern] Batch embedding cache hit/miss with transparent merge: Cache checks all texts first, fetches only uncached ones from API, merges results in original order (2026-01-11)
- **Problem solved:** Embedding API calls are expensive. In production, embedding requests often have many overlapping texts across batches.
- **Why this works:** Naive approach (cache check per text) has O(n) overhead. Naive caching (fetch all from API then replace cached) wastes quota. Batch strategy: (1) check cache for all, (2) fetch only cache-misses, (3) merge. This achieves hit rate benefits without quota waste and minimal latency overhead.
- **Trade-offs:** Requires index tracking to merge results correctly (adds code complexity). But reduces embedding API calls by ~60-80% in typical usage. Transparent merge means callers see no difference.