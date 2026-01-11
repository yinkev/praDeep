---
tags: [database]
summary: database implementation decisions and patterns
relevantTo: [database]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 5
  referenced: 1
  successfulFeatures: 1
---
# database

#### [Pattern] Storing document tracking state as embedded metadata.json entries under 'document_tracking' key rather than separate database (2026-01-11)
- **Problem solved:** Knowledge base is file-system based with metadata.json as single source of truth; need persistent document state across tracker instances
- **Why this works:** Keeps all KB metadata in one place. Avoids external DB dependency. DocumentTracker loads metadata once at init, mutations stay in-memory until explicit flush. Metadata.json as append-only metadata prevents version conflicts.
- **Trade-offs:** Entire document tracking state loaded into memory (scales poorly with millions of documents) vs simplicity of single JSON file. File locking not handled (concurrent writers would corrupt).