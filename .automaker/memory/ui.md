---
tags: [ui]
summary: ui implementation decisions and patterns
relevantTo: [ui]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 1
  referenced: 0
  successfulFeatures: 0
---
# ui

#### [Pattern] MediaUpload component encapsulates base64 encoding, file validation, and preview rendering - data flows through parent state to send via WebSocket (2026-01-11)
- **Problem solved:** Frontend needed to support file uploads in real-time collaborative environment (WebSocket-based)
- **Why this works:** Base64 encoding allows binary data to serialize over WebSocket without separate file transfer mechanism. Encapsulation keeps upload logic isolated from page logic. File validation (size, count) prevents invalid state reaching backend
- **Trade-offs:** Unified message format and simpler architecture vs. higher memory usage from base64 encoding (33% overhead) and 5-file limit to prevent memory bloat

#### [Pattern] Frontend GlobalContext wraps Solver type with hint-related state separate from core solve state; QuestionDashboard and SolverPage subscribe to hint updates (2026-01-11)
- **Problem solved:** Multiple UI components need to react to hint delivery with different behaviors (dashboard shows summary, solver page shows real-time hints)
- **Why this works:** Separating hint state from solve state prevents tight coupling and allows components to opt-in to hint updates; GlobalContext ensures single source of truth
- **Trade-offs:** GlobalContext adds one layer of indirection but makes data flow predictable; context updates may trigger unnecessary re-renders in sibling components

### Frontend stage explanations are distinct from backend processing_file/extracting_items/progress_percent states - frontend translates backend states into human-friendly stage messages (2026-01-11)
- **Context:** Backend tracks low-level processing states (parsing documents, extracting items, etc). Frontend needs to display meaningful stage names to users, but exact backend stage names are not user-friendly.
- **Why:** Separates concerns: backend focuses on accurate processing tracking, frontend owns UX/messaging. Allows frontend to adjust messaging without backend changes. Multiple backend stages might map to single user-visible stage.
- **Rejected:** Backend could send pre-formatted messages, but this couples backend to UI concerns and makes i18n harder. Frontend could show raw backend state names, but they're cryptic.
- **Trade-offs:** Adds frontend complexity to maintain stage→message mapping. But enables independent evolution of backend processing logic and frontend UX.
- **Breaking if changed:** If frontend doesn't map backend stages properly, users see confusing technical state names. If mapping is lost, no progress indication at all.