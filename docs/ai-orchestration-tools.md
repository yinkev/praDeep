# AI Coding Agent Orchestration Tools

## Summary

This document captures learnings about AI coding agent orchestration tools explored on 2026-01-11.

---

## Tools Compared

### 1. Vibe-Kanban

**What it is:** Orchestration layer for AI coding agents (Claude Code, Codex, Gemini, etc.)

**Start command:**
```bash
npx vibe-kanban
```

**Key features:**
- Kanban board for task management
- Git worktree isolation for parallel agents
- Supports multiple coding agents
- 9.4k GitHub stars

**Routing options:**
- `CLAUDE_CODE` - Direct Claude Code usage
- `ROUTER` - Routes between different coding agents
- `CCR` (Claude Code Router) - Third-party tool for multi-provider routing

**Settings URL:** `http://127.0.0.1:<port>/settings/agents`

---

### 2. CCR (Claude Code Router)

**What it is:** Third-party tool that routes prompts to different LLM providers

**NOT required** for vibe-kanban - it's optional

**Use cases:**
- Route to cheaper models for simple tasks
- Use specialized models (vision, long context, web search)
- Mix providers (Anthropic + OpenRouter + DeepSeek)

**If you just want Claude Code:** Skip CCR entirely

---

### 3. Automaker

**What it is:** Full autonomous IDE with built-in agent orchestration

**Repository:** https://github.com/AutoMaker-Org/automaker

**Installation:**
```bash
git clone https://github.com/AutoMaker-Org/automaker.git
cd automaker
npm install
npm run dev
# Select option 1 for Web mode
```

**URLs:**
- Frontend: http://localhost:3007
- Backend API: http://localhost:3008
- Health check: http://localhost:3008/api/health

**Key features:**
- Native model switching (Claude/GPT) without CCR
- Auto Mode - agents auto-pick tasks
- Built-in "Ultrathink" for complex decisions
- Git worktree isolation
- Real-time agent streaming

**Advantages over Vibe-Kanban:**
- True autonomous orchestration built-in
- No third-party routing tools needed
- Agents automatically choose appropriate sub-agents

---

## Claude Code Built-in Orchestration

Claude Code ALREADY has automatic subagent routing via the Task tool:

| Subagent | Use Case |
|----------|----------|
| `Explore` | Codebase exploration, finding files |
| `Plan` | Architecture design, implementation planning |
| `code-reviewer` | Code review |
| `Bash` | Terminal commands |
| `general-purpose` | Multi-step research tasks |

**No extra configuration needed** - Claude Code handles this internally based on task context.

---

## Recommendation

| Goal | Use |
|------|-----|
| Simple orchestration with Claude Code | Just use Claude Code directly (built-in routing) |
| Visual kanban + manual agent control | Vibe-Kanban |
| Full autonomous agent orchestration | Automaker |
| Multi-provider routing (cost optimization) | CCR with Vibe-Kanban |

---

## Quick Reference

### Start Vibe-Kanban
```bash
npx vibe-kanban
```

### Start Automaker
```bash
cd ~/Projects/automaker && npm run dev
# Select 1 for Web mode
# Open http://localhost:3007
```

### Kill running servers
```bash
pkill -f 'vibe-kanban' || true
pkill -f 'node dev.mjs' || true
```
