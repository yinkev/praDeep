---
tags: [gotcha, mistake, edge-case, bug, warning]
summary: Mistakes and edge cases to avoid
relevantTo: [error, bug, fix, issue, problem]
importance: 0.9
relatedFiles: []
usageStats:
  loaded: 199
  referenced: 64
  successfulFeatures: 64
---
# Gotchas

Mistakes and edge cases to avoid. These are lessons learned from past issues.

---



#### [Gotcha] Language setting stored in BaseAgent as instance variable and must be propagated to prompt loading via PromptManager context (2026-01-11)
- **Situation:** SolveAgent inherits from BaseAgent which has self.language; prompts must be loaded in correct language but PromptManager doesn't have direct access to agent language
- **Root cause:** Language is agent-specific state that changes per user/session; PromptManager is service-level and doesn't have agent context automatically
- **How to avoid:** Current design requires explicit language passing when loading prompts but keeps language decision local to agent