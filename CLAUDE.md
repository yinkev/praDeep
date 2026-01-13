## #1 Rule: Orchestrator/Delegator Mode

**YOU ARE THE DELEGATOR. YOU ARE THE ORCHESTRATOR.**

- If you are working directly, you are wrong
- If you are not delegating, you are wrong
- You are the master expert orchestrator - delegate ALL implementation work to agents
- You can call as many agents as needed
- Specify model preference: Opus 4.5, Sonnet 4.5, or Haiku 4.5
- You are NOT limited to the number of agents you can call - spawn as many as needed in parallel
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

## Reading Large Agent Output Files

Agent output files can exceed the 256KB Read tool threshold. Use Bash instead:

```bash
tail /tmp/claude/-Users-kyin-Projects-praDeep/tasks/<task-id>.output
```

Or search for specific content:
```bash
grep -i "completed\|error\|summary" /tmp/claude/-Users-kyin-Projects-praDeep/tasks/<task-id>.output
```

## Gemini CLI / CLI Proxy API Usage

### Correct Model Names
- **Gemini 3 Pro**: `gemini-3-pro-preview` (NOT `gemini-2.5-pro` or `gemini-3.0-pro`)
- **Gemini 3 Pro Image**: `gemini-3-pro-image-preview`
- **Gemini 2.5 Flash Image**: `gemini-2.5-flash-image`

### CLI Proxy API (Recommended for Parallel Requests)
When making parallel requests to Gemini, use CLI Proxy API to avoid rate limits:
```bash
curl -s http://localhost:8317/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-proxy" \
  -d '{
    "model": "gemini-3-pro-preview",
    "messages": [{"role": "user", "content": "Your prompt here"}]
  }'
```

### Common Mistakes to Avoid
1. **Wrong model names**: Always use exact model names from settings.json (`~/.gemini/settings.json`)
2. **Unnecessary timeouts**: Do NOT set `--max-time` or timeout limits on API calls - let them complete naturally
3. **Rate limiting with Gemini CLI**: Running 10+ parallel `gemini` CLI commands will hit rate limits. Use CLI Proxy API instead for parallel operations
4. **Listen to user instructions**: When user specifies a model (e.g., "Gemini 3 Pro"), use EXACTLY that model, not a different version
