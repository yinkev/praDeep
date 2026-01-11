---
tags: [architecture]
summary: architecture implementation decisions and patterns
relevantTo: [architecture]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 11
  referenced: 3
  successfulFeatures: 3
---
# architecture

#### [Pattern] Multi-agent system with specialized agents (Solver, QuestionGen, Research, GuidedLearning, CoWriterIdeaGen) rather than monolithic approach (2026-01-11)
- **Problem solved:** praDeep handles diverse educational tasks requiring different reasoning patterns
- **Why this works:** Allows each agent to be optimized for its domain, easier to test/maintain specific capabilities, can parallelize independent agents
- **Trade-offs:** Increased complexity in orchestration and inter-agent communication vs clearer separation of concerns and modularity

### Dual-port deployment: Frontend on 3783, Backend on 8783 as separate services (2026-01-11)
- **Context:** Full-stack application with independent frontend and backend requirements
- **Why:** Allows independent scaling, deployment, and technology choices (Next.js vs FastAPI); better separation of concerns; enables frontend iteration without backend changes
- **Rejected:** Monolithic deployment would simplify ops but reduce flexibility and scalability
- **Trade-offs:** Added complexity in cross-origin communication and deployment orchestration vs independent service scaling
- **Breaking if changed:** Coupling them together would require changing build/deploy pipeline and would prevent independent scaling of compute-heavy backend

#### [Pattern] Knowledge management layer (src/knowledge/) separate from agents and API logic (2026-01-11)
- **Problem solved:** Educational assistant needs persistent, queryable knowledge base distinct from inference/reasoning
- **Why this works:** Enables rich knowledge retrieval patterns (RAG), separates data concerns from logic, allows knowledge reuse across multiple agents
- **Trade-offs:** Extra layer adds abstraction overhead but enables sophisticated retrieval patterns and knowledge versioning

#### [Gotcha] Requirement exploration discovered incomplete/malformed feature request describing 'missing context' rather than actual feature (2026-01-11)
- **Situation:** User provided feature description that was meta-commentary about missing context instead of actionable spec
- **Root cause:** Highlights importance of clarification loop - vague requirements waste time exploring when actual feature needs clear definition
- **How to avoid:** Extra AskUserQuestion step adds latency but prevents building wrong feature

#### [Pattern] Codebase-first exploration approach using agents before asking user to clarify incomplete requirements (2026-01-11)
- **Problem solved:** Faced with ambiguous feature request, system chose to explore actual codebase capabilities first
- **Why this works:** Provides informed context for follow-up questions, enables suggesting relevant features based on existing architecture, shows capability without guessing
- **Trade-offs:** Initial exploration takes time but enables better user interactions and more relevant feature suggestions

### Content-hash based change detection (SHA256) instead of timestamp or file modification time (2026-01-11)
- **Context:** Need to detect which documents were modified in knowledge base incremental indexing
- **Why:** Timestamps are unreliable across file systems and operations. Hashes provide deterministic identity. Enables detection of content changes even when timestamps are reset or files are restored from backups.
- **Rejected:** Filesystem mtime/ctime comparison - fails across different filesystems, after restores, or when files are copied; filename-based tracking - fails when documents are renamed or content changes without name change
- **Trade-offs:** Higher CPU cost (hash computation on every sync) vs reliability. Mitigated by caching hashes in metadata.json, only recomputing for files with mtime changes.
- **Breaking if changed:** If hash format changes (e.g., sha256 → blake3), must migrate metadata.json entries or accept false positives (treating all documents as modified)

#### [Gotcha] DocumentTracker must be instantiated with correct kb_dir to load existing metadata; creating new tracker instance doesn't re-run detection (2026-01-11)
- **Situation:** Test discovered that metadata persists across tracker instances, but only if they point to same kb_dir and metadata.json exists
- **Root cause:** DocumentTracker constructor reads metadata.json if exists. If kb_dir changes or metadata.json missing, tracker starts fresh. This is correct but not obvious from API.
- **How to avoid:** Explicit parameter (clear, safe) vs implicit (convenient but error-prone). Current approach is safer.

### DocumentStatus enum tracks both change type (NEW/MODIFIED/DELETED) AND processing state (INDEXED/PROCESSING/ERROR), collapsing into single field (2026-01-11)
- **Context:** Need to distinguish 'what changed' from 'how is it being handled', but avoid complex nested state structures
- **Why:** Single status field is simpler for serialization to metadata.json. Final status (INDEXED) implies 'processed'. Error states preserve failure reason for debugging.
- **Rejected:** Separate 'change_type' and 'processing_state' fields - doubles complexity and metadata bloat; boolean flags (is_new, is_modified, is_indexed) - harder to reason about valid state combinations
- **Trade-offs:** Some state combinations are invalid (e.g., INDEXED + PROCESSING) but not prevented by type system. Easier to reason about than flag explosion.
- **Breaking if changed:** If adding new statuses, must update all comparison logic in get_documents_to_process(). Invalid status values silently become UNCHANGED (falsy in comparisons).

### RAG cleanup is selective per-document: when document modified, old RAG embeddings are removed before re-processing (cleanup_document_from_rag) (2026-01-11)
- **Context:** Modified documents need fresh RAG chunks; old chunks with stale vectors would pollute semantic search results
- **Why:** Full RAG cleanup on every change is expensive and loses unrelated embeddings. Per-document cleanup is surgical - only affects changed documents.
- **Rejected:** Global RAG cleanup - loses all embeddings, requires re-vectorization of unchanged docs; no cleanup - stale chunks cause false positives in semantic search
- **Trade-offs:** Must track which RAG chunks belong to which document (adds metadata overhead) vs simpler but expensive global cleanup.
- **Breaking if changed:** If cleanup_document_from_rag() is skipped, modified documents will have duplicate/conflicting embeddings in RAG store. Semantic search will return stale results alongside new ones.

### Dual cache backend strategy: Abstract CacheBackend base class with MemoryCacheBackend and RedisCacheBackend implementations (2026-01-11)
- **Context:** RAG queries can be expensive, requiring intelligent caching. Different deployment scenarios (single-instance dev vs distributed production) have conflicting requirements.
- **Why:** Abstracts backend decision at configuration time rather than code time. Allows zero-dependency local development (memory backend) while supporting production scalability (Redis). The strategy pattern with composition provides flexibility without runtime overhead.
- **Rejected:** Single hardcoded backend (would require Redis setup for dev). Conditional imports (would scatter deployment config throughout codebase). Lazy initialization (would add startup overhead).
- **Trade-offs:** Extra abstraction layer adds minor complexity but pays off immediately in dev/prod parity. Memory backend limits to single instance but eliminates external dependencies. Backend switching is configuration-only, not code change.
- **Breaking if changed:** Changing backend interface signature breaks all implementations. Removing backend abstraction couples deployment to code decisions. If backend becomes instance-specific (not global singleton), cache logic must change.

#### [Gotcha] Auto-invalidation on KB deletion requires coupling cache service to KB deletion events, not just explicit cache clears (2026-01-11)
- **Situation:** RAG queries are cached. When a KB is deleted, all cached queries for that KB become invalid. This is a source of silent stale data if not handled.
- **Root cause:** Explicit cache invalidation API is good for monitoring but insufficient. Developers might forget to call it when deleting KBs. Auto-invalidation in the deletion codepath prevents this footgun entirely. The coupling is justified because KB lifecycle directly affects query validity.
- **How to avoid:** Adds mandatory dependency between KB service and cache service. Makes KB deletion slightly slower. But eliminates entire class of silent stale-data bugs.

### Cache statistics (hits/misses/hit_rate) at cache backend level, not application level, with continuous tracking (2026-01-11)
- **Context:** Operators need visibility into cache effectiveness. Query result caching is only valuable if hit rate is > 30%. Statistics need to inform backend decisions.
- **Why:** Backend-level tracking is transparent to application code (no instrumentation needed). Continuous aggregation catches distribution skew (some KBs may have 90% hit rate, others 10%). Exposing via API endpoint creates operational visibility without logging overhead.
- **Rejected:** Application-level instrumentation (scatters metrics throughout code). Periodic sampling (misses spiky access patterns). Log-based post-hoc analysis (too slow for operational decisions).
- **Trade-offs:** Adds per-operation latency (~1-2μs for increment). But provides immediate operational signal. Hit rate trending can inform TTL tuning.
- **Breaking if changed:** If stats tracking is disabled/removed, operators lose visibility into cache effectiveness and can't diagnose misconfigurations. If reset on stats query, time-series analysis becomes impossible.

#### [Gotcha] Query caching must include query parameters (filters, K value, etc.) in cache key, not just query text (2026-01-11)
- **Situation:** Two different queries with same text but different K values will have completely different results.
- **Root cause:** Cache key must be content-addressed and parameter-addressed. Query('cats', k=5) has fundamentally different results than Query('cats', k=100). Naive text-only key causes silent correctness bugs (wrong K values returned).
- **How to avoid:** Cache key generation is slightly more complex (must serialize all parameters deterministically). But prevents entire category of silent data correctness bugs.

### Vision LLM calls limited to first iteration of investigation loop only, not every iteration (2026-01-11)
- **Context:** Multimodal support added to agent pipeline - needed to decide when to invoke expensive vision models
- **Why:** Vision model calls are expensive (token cost, latency). Processing images only on first iteration reduces costs while allowing agents to reference image analysis in subsequent iterations through conversation context
- **Rejected:** Alternative: Pass images to every iteration - would be more flexible but multiply vision API costs proportionally with loop depth
- **Trade-offs:** Simpler cost model and faster iteration vs. agents cannot re-analyze images with updated context in later iterations
- **Breaking if changed:** If agents need to perform conditional analysis based on findings (e.g., 'zoom in on section X'), this architecture prevents that - would need architectural change to pass images throughout

### Vision completion as factory-level export, not agent-level abstraction - agents call completion directly with vision flag (2026-01-11)
- **Context:** BaseAgent needed vision capability - decided whether to add as high-level method or expose low-level completion
- **Why:** Agents work with LLM completions as primary interface. Adding `call_llm_with_vision` method on BaseAgent provides type-safe wrapper around factory function, allowing agents to opt-in to vision without changing their core completion patterns
- **Rejected:** Alternative: Auto-detect images and use vision transparently - would hide performance impact and make token accounting unclear
- **Trade-offs:** Explicit opt-in (agents must decide when to use vision) adds lines but clarifies intent and performance characteristics vs. implicit magic that's easier to use
- **Breaking if changed:** If vision becomes default for all LLM calls with images, would need different factory interface - current approach assumes selective vision use

### Progressive hints delivered through WebSocket streaming from SolveAgent to frontend, with hint state managed in GlobalContext (2026-01-11)
- **Context:** Solve Agent needs to provide incremental guidance during problem-solving without blocking or overwhelming the user
- **Why:** WebSocket streaming allows real-time delivery of hints as the solver thinks through the problem. Central state management in GlobalContext ensures all components see consistent hint state and can react to updates
- **Rejected:** Polling-based hint delivery (adds latency and server load), or returning all hints at the end (defeats progressive purpose), or decentralized state (causes sync issues between components)
- **Trade-offs:** WebSocket complexity and connection management vs guaranteed real-time delivery; centralized state easier to debug but harder to scale to multiple solver instances
- **Breaking if changed:** Removing WebSocket transport requires complete refactor of hint delivery; removing GlobalContext state breaks component synchronization

#### [Pattern] Prompt template system with YAML-based localization hierarchy: language/domain/agent-specific prompts loaded dynamically via PromptManager (2026-01-11)
- **Problem solved:** SolveAgent needs different prompt variations for different languages and hint strategies; prompts control agent behavior fundamentally
- **Why this works:** YAML templates provide runtime flexibility without code changes; localization structure allows progressive refinement (generic fallback to specific overrides); dynamic loading enables A/B testing different hint strategies
- **Trade-offs:** File-based system requires careful cache invalidation; loading on agent init adds startup cost but amortized per problem; changing prompts is easy but needs validation

### Configuration layered: main.yaml → solve_config.yaml → environment-specific overrides, loaded via ConfigLoader service (2026-01-11)
- **Context:** Solve agent has many tuneable parameters (max steps, hint frequency, model selection) that vary per environment and problem domain
- **Why:** Layered config allows base defaults, domain-specific tweaks, and runtime overrides without code changes; ConfigLoader centralizes schema validation
- **Rejected:** Single config file (inflexible), hardcoded defaults (unmaintainable), environment variables only (hard to structure)
- **Trade-offs:** Layering adds complexity but enables safe experiments and A/B testing; need to document override precedence clearly
- **Breaking if changed:** If config schema changes, all three layers must update; if ConfigLoader loading order changes, override behavior changes unexpectedly

#### [Pattern] Progress tracking implemented via centralized ProgressTracker class with per-knowledge-base state mapping (progressMap[kb.name]) (2026-01-11)
- **Problem solved:** Knowledge base upload can take long time with multiple processing stages (parsing documents, extracting items, indexing). Frontend needs real-time visibility into which stage is active.
- **Why this works:** Centralized tracker allows backend to atomically update progress state without race conditions. Per-KB mapping enables concurrent uploads of multiple knowledge bases while tracking each independently.
- **Trade-offs:** In-memory storage means progress lost on backend restart (acceptable for volatile processing state). Requires explicit heartbeat mechanism to push updates to frontend since HTTP is pull-based.

#### [Pattern] Temporary Playwright test verification used during development as acceptance criteria before cleanup (2026-01-11)
- **Problem solved:** Complex async progress tracking system across frontend/backend with timing dependencies. Need to verify end-to-end behavior works before considering feature complete.
- **Why this works:** Playwright tests can verify actual browser behavior, timing of updates, state transitions in realistic conditions. More realistic than unit tests for async flows. Serves as executable specification.
- **Trade-offs:** Playwright tests are slower and more fragile than unit tests. Requires headless browser setup. Test artifacts must be cleaned up post-verification or become maintenance burden.

#### [Gotcha] Progress state must be cleared/reset between upload cycles to avoid stale progress data from previous uploads affecting new ones (2026-01-11)
- **Situation:** ProgressTracker maintains in-memory state. User uploads KB, sees 100% completion, then uploads same KB again. If progress state isn't reset, second upload might show old progress or skip stages.
- **Root cause:** In-memory storage persists across requests. Without explicit reset, state from previous operation contaminates next operation. User uploads are sequential but state is persistent.
- **How to avoid:** Explicit reset is simple but requires discipline - easy to forget. Alternative of per-request isolation adds complexity to tracking mechanism.