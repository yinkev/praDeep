---
tags: [testing]
summary: testing implementation decisions and patterns
relevantTo: [testing]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 26
  referenced: 24
  successfulFeatures: 24
---
# testing

#### [Gotcha] Document tracking test creates files, writes bytes, tracks them, then creates NEW tracker instance to verify persistence. If metadata isn't flushed before creating new instance, test fails silently. (2026-01-11)
- **Situation:** Implementation detail: DocumentTracker doesn't auto-flush metadata.json on every change; changes stay in-memory until explicit call
- **Root cause:** Batching mutations reduces I/O. But test pattern reveals gap: no guarantee new instance sees changes.
- **How to avoid:** Implicit flush behavior (easier for normal use) vs explicit is safer for testing. Test must ensure flush() called or new instance opened.

#### [Pattern] Playwright test verified UI state changes (placeholder text, button enabling) as proxy for backend integration working (2026-01-11)
- **Problem solved:** Tests needed to verify multimodal feature end-to-end without comprehensive API mocking
- **Why this works:** E2E UI tests are faster to write than mocking all LLM calls and backend state. Placeholder text change confirms image upload triggered state update, button enable confirms message validation recognizes images
- **Trade-offs:** Quick confidence that feature works end-to-end vs. slower test execution and brittleness to UI changes

#### [Pattern] Agents loaded via codex superpowers skills for test isolation; skills like test-driven-development, testing-anti-patterns drive test methodology (2026-01-11)
- **Problem solved:** Implementation exploration involved bootstrapping and discovering available agent skills rather than directly reading code
- **Why this works:** Skills-based approach enforces explicit agent capabilities and prevents implicit dependencies; allows tests to compose different skill combinations
- **Trade-offs:** Skill discovery adds startup overhead but makes agent composition explicit and testable; requires test setup per skill combo