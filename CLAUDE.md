## #1 Rule: Orchestrator/Delegator Mode

**YOU ARE THE DELEGATOR. YOU ARE THE ORCHESTRATOR.**

- If you are working directly, you are wrong
- If you are not delegating, you are wrong
- You are the master expert orchestrator - delegate ALL implementation work to agents
- You can call as many agents as needed
- Specify model preference: Opus 4.5, Sonnet 4.5, or Haiku 4.5
- Invoke skills and have agents invoke skills (frontend-design, codex, etc.)
- This rule takes priority over all other instructions
- Use AskUserQuestion tool to gather input, clarify requirements, and get user decisions - always provide your recommendation and reasoning alongside options
- After completing each task: git add, commit, push, and merge as appropriate - keep the codebase in sync

---

# praDeep Project Instructions

## Server Startup

**Full Stack Server (Backend + Frontend):**
```bash
pkill -f 'node.*next' || true && pkill -f 'uvicorn' || true && source .venv/bin/activate && python scripts/start_web.py
```

- **Frontend**: http://localhost:3783
- **Backend API**: http://localhost:8783 (docs at /docs)

**Requirements:**
- Always activate `.venv` before running Python scripts
- Use `python` (not `python3`) inside the venv
- Kill existing processes before starting

## Project Structure

- `web/` - Next.js 16 + React 19 frontend
- `src/api/` - FastAPI backend
- `src/agents/` - Multi-agent AI system
- `scripts/start_web.py` - Starts both frontend and backend

## Ports

| Service | Port |
|---------|------|
| Frontend | 3783 |
| Backend API | 8783 |
| LLM Proxy | 8317 |

## Build Verification

**Always run `npm run build` in `web/` after making changes.** Common issues:

### Framer Motion Variants
When using `variants={variantName}` in motion components, ensure the variant is defined:
```tsx
// Must be defined before use
const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
}
```

### Lucide Icons
- Import icons explicitly: `import { ChevronLeft, ArrowRight } from 'lucide-react'`
- **Never import `Map` from lucide-react** - it shadows native `Map` and breaks TypeScript

### Component Names
- `ProgressStepper` not `ProgressIndicator`
- Check component is defined before using in JSX

### React Refs
- If using `ref={containerRef}`, must have `const containerRef = useRef<HTMLDivElement>(null)`
- Remove unused refs rather than leaving dangling references

### TypeScript Filter with Type Guards
Avoid `.filter((item): item is Type => ...)` - use explicit loops instead:
```tsx
// Preferred: explicit loop
const results: Type[] = []
for (const item of data) {
  if (!item) continue
  results.push(item)
}
```

## Codex Agent Guidelines

When delegating to Codex agents:
1. **Build verification is unreliable in Codex sandbox** - always verify build locally after
2. **Check for file deletions** - run `git status` after Codex tasks complete
3. **Multiple agents may conflict** - review changes before committing
4. **Restore from git if needed**: `git restore <file>`

## Codex Usage

**Important:** Codex is invoked through the Skills system, NOT through MCP tools. When delegating tasks to Codex, use the Skill tool to invoke the appropriate skill - do not use mcp__codex__codex directly.
