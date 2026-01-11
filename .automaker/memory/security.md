---
tags: [security]
summary: security implementation decisions and patterns
relevantTo: [security]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 0
  successfulFeatures: 0
---
# security

#### [Gotcha] Base64-encoded images in WebSocket messages means full image data in memory and network buffers - no streaming or chunking (2026-01-11)
- **Situation:** Images sent as base64 in complete WebSocket messages, frontend limits to 5 files × 10MB max
- **Root cause:** WebSocket is message-based, not streaming. Base64 is text-safe serialization. Prevents memory DOS but creates practical limits
- **How to avoid:** Simple implementation and message atomicity vs. cannot handle large image datasets or videos effectively