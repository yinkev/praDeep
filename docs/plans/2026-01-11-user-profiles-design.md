# User Profiles (Feature: `user-profiles`) — Design

## Goal
Provide a single, consistent user profile surface that aggregates:
- Preferences (response style, difficulty, formatting)
- Learning history (activity history, learning patterns)
- Saved sessions (chat sessions)
- Custom settings (app-specific keys for personalization across workflows)

This enables personalization across all agent workflows by producing a canonical “personalization prompt” derived from stored preferences.

## Current State (Observed)
User-related data is already persisted in separate JSON files under `data/user/`:
- UI settings: `data/user/settings.json`
- Activity history: `data/user/user_history.json`
- Chat sessions: `data/user/chat_sessions.json`
- Memory/preferences + learning patterns: `data/user/memory/*.json`

These are managed by existing helpers:
- `src/api/utils/user_memory.py` (`UserMemoryManager`)
- `src/api/utils/history.py` (`HistoryManager`)
- `src/agents/chat/session_manager.py` (`SessionManager`)

## Approaches Considered
1) **Single monolithic profile file**
   - Pros: One file to read/write.
   - Cons: Data duplication + migration complexity + risk of drift with existing writers.

2) **Aggregator profile service + small custom settings store (recommended)**
   - Pros: Minimal change, no migration; reuses existing storage; enables incremental adoption.
   - Cons: Profile is a “view” over multiple sources (needs clear contracts).

3) **Database-backed profiles**
   - Pros: Strong querying and schema evolution.
   - Cons: Heavyweight for current architecture; introduces migrations and ops burden.

## Selected Design
Implement **Approach 2**:
- Add a `UserProfileService` that composes existing managers and returns an aggregated `UserProfile` object.
- Store `custom_settings` in a dedicated file per user:
  - `data/user/profiles/{user_id}.json`
- Expose profile operations via a new FastAPI router:
  - `GET /api/v1/profile` (aggregate view)
  - `PATCH /api/v1/profile/preferences` (updates memory preferences)
  - `PUT /api/v1/profile/custom` (updates custom settings)
  - `GET /api/v1/profile/prompt` (debug: personalization prompt)

## Personalization Across Workflows
Create a small “personalization prompt” generator from stored preferences and use it to augment system prompts in agent LLM calls, so that all workflows can benefit without changing every individual prompt template.

## Backward Compatibility
- Existing JSON files and writers remain unchanged.
- The profile API is additive; no migrations required.

