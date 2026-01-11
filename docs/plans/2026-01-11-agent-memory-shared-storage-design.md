---
title: Agent Memory Shared Storage (Copy-on-Write)
description: Shared, memory-mapped cache for solve-run memories with COW semantics and eviction.
---

# Agent Memory Shared Storage (Copy-on-Write)

## Goal

Reduce duplicated in-memory state across concurrent agent processes by caching the per-run memory JSON blobs (`investigate_memory.json`, `solve_chain.json`, `citation_memory.json`) in a shared store, while preserving the existing JSON-on-disk persistence behavior.

## Non-goals

- Replacing JSON persistence as the source of truth.
- Fine-grained shared mutation of Python objects (we store immutable JSON snapshots).

## Architecture

### Interface

A small `AgentMemoryStore` provides:
- `get_json(key, file_path)` → returns a dict snapshot if present and not stale vs the on-disk file.
- `set_json(key, value, file_path)` → writes a new immutable snapshot (Copy-on-Write).
- `evict_if_needed(protect_keys)` → LRU eviction when over budget.

### Backends

1) **`shared_memory` (default)**: Uses `multiprocessing.shared_memory.SharedMemory` to store UTF-8 JSON bytes.
- Copy-on-write: every update allocates a new segment and atomically swaps an index file pointer (readers see old or new snapshot, never partial writes).
- Concurrency: writers serialize updates via a file lock in the store directory; readers are lock-free.
- Eviction: budgeted LRU eviction by key using index metadata; eviction unlinks shared-memory segments.

2) **`redis` (optional)**: Stores JSON strings in Redis with small metadata to support LRU-like eviction externally if desired.

3) **`disabled`**: No-op store.

## Configuration

Configured via `config/main.yaml` (`agent_memory_shared_storage.*`) with environment overrides for deployment.

## Integration

`InvestigateMemory`, `SolveMemory`, and `CitationMemory`:
- On `load_or_create()`: attempt to load from shared store first (when fresh), otherwise load from disk.
- On `save()`: keep writing JSON to disk and also publish the same snapshot to the shared store.

