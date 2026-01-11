---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 27
  referenced: 11
  successfulFeatures: 11
---
# api

#### [Pattern] Router-based API structure (src/api/routers/) organizing endpoints by domain rather than HTTP verb (2026-01-11)
- **Problem solved:** FastAPI backend with multiple complex features and agent types
- **Why this works:** Groups related functionality together, makes scaling specific feature endpoints easier, clearer API organization for multiple agent types
- **Trade-offs:** Slightly more indirection in routing vs much clearer logical organization

#### [Pattern] Two API endpoints: /documents (view current state) vs /documents/changes (preview before update) (2026-01-11)
- **Problem solved:** Users need visibility into what incremental indexing will do before triggering it
- **Why this works:** Preview endpoint (get_document_changes) is non-mutating and safe to call. Separates inspection from mutation. Allows dry-run validation.
- **Trade-offs:** Two endpoints to maintain vs single source of truth. Preview can drift from actual update if files change between preview and update call.

### Cache management API endpoints (health/stats/invalidate) separate from query endpoints, at /api/v1/cache/ rather than inline (2026-01-11)
- **Context:** Cache is an operational concern separate from query logic. Operators need to inspect and manage cache without triggering queries.
- **Why:** Separation of concerns: query endpoints focus on results, cache endpoints on infrastructure. Dedicated endpoints can be monitored/rate-limited separately. Stats endpoint avoids contaminating query latency with stats tracking. Invalidate is explicit and auditable.
- **Rejected:** Inline cache stats in query responses (pollutes API, increases response size). Cache management in separate legacy endpoint (inconsistent versioning). Optional cache-control headers (implicit, hard to discover).
- **Trade-offs:** Adds three new endpoints but eliminates need for cache headers everywhere. Makes cache a first-class observable system. Slightly increases API surface area.
- **Breaking if changed:** If cache endpoints are removed, operators lose ability to inspect cache health or manually invalidate (forced to restart). If stats become response attributes instead of separate endpoint, query performance monitoring becomes conflated with cache metrics.

#### [Gotcha] WebSocket page.waitForLoadState('networkidle') timeout caused by incomplete API requests, solved by using 'domcontentloaded' + explicit selector wait (2026-01-11)
- **Situation:** Playwright tests hung indefinitely waiting for network to be idle during page load
- **Root cause:** The application makes API calls that may remain pending or loop. 'networkidle' waits for ALL requests to complete, but some backend requests never fully resolve. 'domcontentloaded' fires once DOM is ready, selector wait ensures UI is interactive
- **How to avoid:** Faster test execution and explicit waiters (more reliable) vs. missing true 'idle' state verification

### MainSolver.process() orchestrates SolveAgent lifecycle: instantiation → solve_agent.process() → hint extraction and streaming (2026-01-11)
- **Context:** Need clear separation between solver infrastructure (MainSolver) and hint generation logic (SolveAgent) while ensuring hints flow to frontend
- **Why:** MainSolver handles configuration, logging, state prep; SolveAgent handles reasoning and hint generation. Separation allows testing each independently and reusing SolveAgent in different contexts
- **Rejected:** Single monolithic solver (harder to test), hints inside SolveAgent.process() without extraction (tight coupling to streaming), no separation (hard to reuse)
- **Trade-offs:** Two-layer design adds indirection but enables composition; solve_agent must expose its state/hints for MainSolver to extract
- **Breaking if changed:** If SolveAgent.process() signature changes or hint structure changes, MainSolver extraction logic breaks; removing MainSolver layer breaks configuration cascade

#### [Gotcha] Backend needs explicit heartbeat/status endpoint separate from the main processing endpoint to provide real-time progress updates to frontend (2026-01-11)
- **Situation:** Single long-running POST endpoint (upload document) cannot send progress updates mid-request in HTTP 1.1 without streaming. Frontend is polling for status but server wasn't explicitly broadcasting stage transitions.
- **Root cause:** HTTP request/response model doesn't naturally support server-initiated updates. Client must poll a status endpoint while background processing continues. Heartbeat mechanism ensures progress_percent, stage, and message fields are consistently updated.
- **How to avoid:** Polling adds latency (updates arrive at poll interval) and network overhead. Alternative streaming solutions would have connection/infrastructure complexity. Polling is simple and works with standard HTTP.