# Memory Systems & Persistence

praDeep uses multiple “memory” systems that persist state to disk in JSON. They serve different purposes and live in different directories.

## 1) Persistent User Memory (cross-session)

**Purpose:** Personalization and long-term learning signals (preferences, topics, patterns, recurring questions).

**Implementation:** `src/api/utils/user_memory.py` (`UserMemoryManager`)

**Storage directory:** `data/user/memory/`

**Files:**
- `data/user/memory/user_preferences.json`
- `data/user/memory/topic_memory.json`
- `data/user/memory/learning_patterns.json`
- `data/user/memory/recurring_questions.json`

**How it’s used:**
- Backend API: `src/api/routers/memory.py` (`/api/v1/memory/*`)
- Frontend UI: `web/app/memory/page.tsx` (Memory page)

**Important:** Clearing “Memory” from the UI/API clears **user memory** only; it does not delete per-run agent outputs under `data/user/solve/`.

## 2) Solve Agent Run Memory (per-run, resumable/debuggable)

**Purpose:** Persist the full “Solve” pipeline state for a single run so it can be inspected, resumed, and debugged.

**Orchestrator:** `src/agents/solve/main_solver.py` (`MainSolver`)

**Storage directory:** `paths.solve_output_dir` from `config/main.yaml` (default: `data/user/solve/`)

Each solve run creates a timestamped folder:
- `data/user/solve/solve_YYYYMMDD_HHMMSS/`

### InvestigateMemory (Analysis Loop)

**File:** `investigate_memory.json`  
**Implementation:** `src/agents/solve/memory/investigate_memory.py`

Tracks “knowledge items” gathered during the Analysis Loop (queries + raw tool output + NoteAgent summaries). Includes basic `version`/migration logic for older formats.

### SolveMemory (Solve Loop)

**File:** `solve_chain.json`  
**Implementation:** `src/agents/solve/memory/solve_memory.py`

Stores the solve-chain steps (`solve_chains`) and tool-call records (`tool_calls`) with status transitions. `SolveMemory.load_or_create()` also migrates a legacy `solve_memory.json` file into `solve_chain.json` when present.

### CitationMemory (shared citations)

**File:** `citation_memory.json`  
**Implementation:** `src/agents/solve/memory/citation_memory.py`

Central citation store keyed by `cite_id` (e.g. `[rag-1]`, `[web-2]`). Both `InvestigateMemory.KnowledgeItem.cite_id` and `SolveMemory.ToolCallRecord.cite_id` reference this store.

## 3) Convention: “load_or_create + JSON on disk”

Across these systems you’ll commonly see:
- `load_or_create(...)`: start new state or resume from existing JSON
- a `version` field and backward-compatibility/migration code
- explicit `save()` calls that write pretty-printed JSON (`indent=2`)

