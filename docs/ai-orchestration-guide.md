# AI Coding Agent Orchestration Tools Guide

A comprehensive guide to orchestrating AI coding agents for maximum productivity. This document covers the major tools available for managing, routing, and parallelizing AI coding workflows.

## Table of Contents

1. [Vibe-Kanban](#1-vibe-kanban)
2. [Automaker](#2-automaker)
3. [Claude Code Router (CCR)](#3-claude-code-router-ccr)
4. [Claude Code Built-in Orchestration](#4-claude-code-built-in-orchestration)
5. [Comparison Table](#5-comparison-table)
6. [Recommendations by Use Case](#6-recommendations-by-use-case)

---

## 1. Vibe-Kanban

### What It Is

Vibe-Kanban is an open-source task orchestration platform that enables developers to manage multiple AI coding agents through a visual Kanban interface. Created by BloopAI, it embodies the "vibe coding" paradigm where AI agents execute tasks in parallel while humans focus on planning, reviewing, and strategic oversight.

**GitHub:** https://github.com/BloopAI/vibe-kanban
**License:** Apache-2.0
**Stars:** 14.7k+

### Key Features

- **Multi-Agent Support:** Works with Claude Code, Gemini CLI, Codex, Amp, Qwen Code, Opencode, and GitHub Copilot
- **Parallel Execution:** Run multiple coding tasks simultaneously across different agents
- **Git Worktree Isolation:** Each task runs in its own branch and worktree, preventing conflicts
- **GitHub Integration:** Automatic PR creation, one-click rebases and merges
- **Task Templates:** Create reusable templates for common workflows (bug fixes, features, refactoring)
- **Remote SSH Support:** Deploy to cloud or manage via systemctl with VSCode Remote-SSH integration
- **Centralized MCP Configuration:** Manage Model Context Protocol settings in one place

### Installation

```bash
# Authenticate with your preferred coding agent first, then:
npx vibe-kanban
```

### System Requirements

- Rust (latest stable)
- Node.js >= 18
- pnpm >= 8
- cargo-watch, sqlx-cli

### Configuration Options

| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server/frontend port | Auto-assign |
| `BACKEND_PORT` | Backend port (dev) | Auto-assign |
| `FRONTEND_PORT` | Frontend dev port | 3000 |
| `HOST` | Backend server address | 127.0.0.1 |
| `DISABLE_WORKTREE_ORPHAN_CLEANUP` | Debug mode toggle | Not set |

### How It Works

1. **Create Tasks:** Add tasks to the Kanban board (Planning, In Progress, In Review, Done)
2. **Assign Agents:** Select which AI agent handles each task
3. **Isolated Execution:** Tasks run in separate git worktrees
4. **Review & Merge:** Review agent-generated code, approve PRs, merge to main

### Best For

- Teams running multiple AI agents in parallel
- Projects requiring strict git isolation
- Workflows needing visual task management
- Organizations standardizing AI development processes

---

## 2. Automaker

### What It Is

Automaker is an autonomous AI development studio that transforms feature requests into working code through Claude-powered agents. Rather than writing code manually, developers describe features on a Kanban board and watch AI agents implement them autonomously.

**GitHub:** https://github.com/AutoMaker-Org/automaker
**License:** MIT

### Key Features

- **Kanban Board Workflow:** Visual drag-and-drop through Backlog, In Progress, Waiting Approval, and Verified stages
- **Claude Agent SDK Integration:** Full file system and command access for agents
- **Git Worktree Isolation:** Each feature executes in isolated worktrees
- **Multiple Planning Modes:**
  - **Skip:** Direct implementation without planning
  - **Lite:** Quick planning approach
  - **Spec:** Detailed task breakdown with multi-agent execution
  - **Full:** Phased implementation strategy
- **Multi-Model Support:** Configure Opus, Sonnet, or Haiku per feature
- **Extended Thinking Modes:** For complex problem-solving
- **GitHub Issue Import:** Validate and import issues directly

### Installation

```bash
# Clone the repository
git clone https://github.com/AutoMaker-Org/automaker.git
cd automaker

# Install dependencies
npm install

# Launch (choose one)
npm run dev          # Web browser mode
npm run dev:electron # Desktop application
```

### Authentication Options

1. **Claude Code CLI (Recommended):** Credentials detected automatically after CLI installation
2. **API Key:** Via environment variables, .env file, or in-app settings

### Deployment Options

| Mode | Command | Use Case |
|------|---------|----------|
| Local Web | `npm run dev` | Development with hot reload |
| Desktop | `npm run dev:electron` | Native application |
| Docker | `docker-compose up` | Isolated/secure deployment |
| Production | `npm run build` | Static web builds |

### Security Considerations

**Important:** The Automaker team recommends Docker containerization due to AI agents having file system access.

```bash
# Docker deployment (recommended for security)
docker run -v /your/project:/workspace automaker
```

Configuration options:
- `ALLOWED_ROOT_DIRECTORY`: Path sandboxing
- `DATA_DIR`: Global configuration location
- Per-project data stored in `.automaker/` directory

### Best For

- Teams wanting autonomous feature implementation
- Projects using Claude Agent SDK
- Workflows requiring multiple planning strategies
- Organizations needing secure, isolated AI execution

---

## 3. Claude Code Router (CCR)

### What It Is

Claude Code Router is a middleware layer that routes Claude Code requests to different models based on task type. It acts as a transparent proxy, allowing developers to use cost-effective models for simple tasks while reserving powerful models for complex reasoning.

**GitHub:** https://github.com/musistudio/claude-code-router

### Key Features

- **Multi-Model Routing:** Direct requests to different models by task type
- **Provider Support:** OpenRouter, DeepSeek, Ollama, Google Gemini, Volcengine, SiliconFlow, and more
- **Transparent Proxy:** All Claude Code features (checkpoints, /rewind, subagents) work normally
- **Subagent Model Routing:** Direct specific subagents to designated models
- **Custom Transformers:** JavaScript plugins for request/response transformation
- **Presets:** Save and share configurations with automatic sensitive-data sanitization

### Installation

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Install Claude Code Router
npm install -g @musistudio/claude-code-router
```

### Configuration

Configuration file location: `~/.claude-code-router/config.json`

```json
{
  "providers": [
    {
      "name": "openrouter",
      "apiEndpoint": "https://openrouter.ai/api/v1",
      "apiKey": "your-api-key"
    },
    {
      "name": "deepseek",
      "apiEndpoint": "https://api.deepseek.com/v1",
      "apiKey": "your-api-key"
    }
  ],
  "router": {
    "default": "claude-sonnet",
    "background": "deepseek-chat",
    "think": "claude-opus",
    "longContext": "gemini-pro",
    "webSearch": "perplexity",
    "image": "claude-sonnet"
  }
}
```

### Router Categories

| Category | Purpose | Recommended Model |
|----------|---------|-------------------|
| `default` | General tasks | Claude Sonnet |
| `background` | Cost-effective local work | DeepSeek, Local models |
| `think` | Reasoning-intensive tasks | Claude Opus |
| `longContext` | Documents > 60K tokens | Gemini Pro |
| `webSearch` | Search-enabled tasks | Perplexity |
| `image` | Image processing (beta) | Claude Sonnet |

### Subagent Model Routing

Direct subagents to specific models by adding a directive at the prompt beginning:

```
<CCR-SUBAGENT-MODEL>deepseek,deepseek-chat</CCR-SUBAGENT-MODEL>
Analyze this codebase for security vulnerabilities...
```

### When to Use CCR

**Use CCR when:**
- Running multi-model workflows (balancing cost vs. capability)
- Using hybrid setups (cloud + local models)
- Needing provider migration without code changes
- Optimizing GitHub Actions costs
- Requiring complex routing logic

**Skip CCR when:**
- Single-model workflows suffice
- Direct provider API preferred
- Minimal request transformation needed
- Simple projects without cost concerns

### CLI Commands

```bash
# Activate shell integration
eval "$(ccr activate)"

# Interactive model manager
ccr model

# Use claude command (auto-routes through CCR)
claude "your prompt"
```

---

## 4. Claude Code Built-in Orchestration

### What It Is

Claude Code includes native orchestration capabilities through the Task tool and specialized subagents. These built-in features enable parallel processing and specialized task delegation without external tools.

### Built-in Subagents

#### Explore Subagent (v2.0.17+)

A Haiku-powered codebase search specialist that:
- Automatically activates for codebase navigation
- Minimizes token usage through efficient exploration
- Handles file searching and context gathering
- Ideal for research and discovery tasks

#### Plan Subagent (v2.0.28+)

A dedicated planning agent that:
- Structures development approach automatically
- Supports subagent resumption capabilities
- Organizes strategic workflow without manual invocation
- Handles complex multi-step planning

### Task Tool

The Task tool spawns ephemeral Claude workers for parallel operations:

```
# Example: Parallel file analysis
Use the Task tool to analyze these 50 files in parallel,
searching for deprecated API usage patterns.
```

**Capabilities:**
- Spawn up to 10 parallel tasks
- Each task gets isolated 200k context window
- Ideal for distributed file operations
- No persistence across sessions

### Custom Subagents

Create specialized agents in `.claude/agents/` as Markdown files:

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools:
  - Read
  - Grep
  - Glob
model: claude-sonnet
---

# Security Reviewer

You are a security specialist. Review code for:
- SQL injection vulnerabilities
- XSS attack vectors
- Authentication bypasses
- Sensitive data exposure

Never modify files. Report findings only.
```

### Task Tool vs Subagents Comparison

| Aspect | Task Tool | Custom Subagents |
|--------|-----------|------------------|
| Persistence | Ephemeral (one-off) | Persistent (reusable) |
| Configuration | None required | Markdown files in .claude/agents/ |
| Tool Access | Inherited from parent | Customizable per agent |
| Use Case | Parallel operations | Specialized expertise |
| Token Cost | ~20k overhead per task | ~20k overhead per invocation |
| Nesting | Cannot nest | Cannot nest (one-level only) |

### When to Use Each

**Use Task Tool for:**
- Parallel file searching across many locations
- Context isolation (analyzing code separately)
- One-off operations you won't repeat
- Speed-priority situations
- Operations requiring 10+ file reads

**Use Custom Subagents for:**
- Repeated workflows (code review, security checks)
- Restricted tool access (read-only reviewers)
- Team standardization
- Persistent conversation history needs
- Specialized expertise requiring configuration

**Stay in Main Thread for:**
- Working with 2-3 specific files
- Simple sequential operations
- Tasks requiring inter-operation communication

### Performance Considerations

- Both Task tool and subagents carry ~20,000 token context loading overhead
- Multi-agent sessions consume 3-4x more tokens than single-threaded operations
- For small tasks, staying in primary context is approximately 10x cheaper

### Limitations

**Task Tool:**
- No visibility into running tasks during execution
- Results can be truncated (stack traces may be lost)
- No error recovery within failed tasks
- Max 10 concurrent operations

**Subagents:**
- Cannot spawn other subagents (one-level hierarchy only)
- Cannot see each other's work directly
- Configuration drift with model updates

---

## 5. Comparison Table

| Feature | Vibe-Kanban | Automaker | CCR | Claude Code Built-in |
|---------|-------------|-----------|-----|---------------------|
| **Primary Purpose** | Visual task orchestration | Autonomous feature dev | Model routing | Native parallelization |
| **Interface** | Web Kanban board | Web/Desktop Kanban | CLI | Terminal |
| **Multi-Agent** | Yes (multiple providers) | Yes (Claude only) | Yes (routing) | Yes (Task tool) |
| **Git Isolation** | Worktrees | Worktrees | No | No |
| **Cost Optimization** | No | No | Yes (routing) | No |
| **Setup Complexity** | Medium | Medium | Low | None |
| **External Dependencies** | Rust, Node, pnpm | Node | Node | None |
| **Open Source** | Yes (Apache-2.0) | Yes (MIT) | Yes | N/A (built-in) |
| **Team Collaboration** | Excellent | Good | Limited | Limited |
| **Learning Curve** | Medium | Medium | Low | Low |
| **Token Overhead** | Low (isolation) | Low (isolation) | Variable | ~20k per task |

### Pricing

| Tool | Cost |
|------|------|
| Vibe-Kanban | Free (pay for underlying AI services) |
| Automaker | Free (pay for Claude API) |
| CCR | Free (pay for routed models) |
| Claude Code Built-in | Included with Claude Code subscription |

---

## 6. Recommendations by Use Case

### Solo Developer, Simple Projects

**Recommendation: Claude Code Built-in**

Start with native Task tool and subagents. No additional setup required, and you can parallelize when needed without external dependencies.

```bash
# Just use Claude Code normally
claude "analyze these files for bugs"
```

### Solo Developer, Cost-Conscious

**Recommendation: Claude Code Router (CCR)**

Route expensive reasoning tasks to Opus while using cheaper models for exploration and simple tasks.

```bash
npm install -g @musistudio/claude-code-router
# Configure routing in ~/.claude-code-router/config.json
```

### Small Team, Multiple Features

**Recommendation: Vibe-Kanban**

Visual Kanban board helps coordinate work, git worktrees prevent conflicts, and task templates standardize workflows.

```bash
npx vibe-kanban
```

### Enterprise Team, Autonomous Development

**Recommendation: Automaker**

Full autonomous feature implementation with security isolation (Docker), multiple planning modes, and GitHub integration.

```bash
git clone https://github.com/AutoMaker-Org/automaker.git
cd automaker && npm install
docker-compose up  # Recommended for security
```

### Hybrid Setup (Recommended for Power Users)

Combine tools for maximum effectiveness:

1. **CCR** for cost optimization (route background tasks to cheaper models)
2. **Vibe-Kanban or Automaker** for task orchestration and git isolation
3. **Custom Subagents** for specialized expertise (security, testing, docs)

```bash
# Install all components
npm install -g @musistudio/claude-code-router
npx vibe-kanban

# Create custom subagents
mkdir -p .claude/agents
# Add security-reviewer.md, test-writer.md, etc.
```

### Quick Decision Matrix

| If you need... | Use... |
|----------------|--------|
| Quick parallel file operations | Task tool |
| Repeated specialized reviews | Custom subagents |
| Visual task management | Vibe-Kanban |
| Autonomous feature dev | Automaker |
| Cost optimization | CCR |
| Team coordination | Vibe-Kanban |
| Secure isolated execution | Automaker (Docker) |
| Multiple AI providers | Vibe-Kanban |

---

## Additional Resources

### Official Documentation

- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
- [Vibe-Kanban Docs](https://www.vibekanban.com/docs)
- [Automaker README](https://github.com/AutoMaker-Org/automaker)
- [CCR GitHub](https://github.com/musistudio/claude-code-router)

### Community Resources

- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code)
- [Claude Code Subagent Collection](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [ClaudeLog Guides](https://claudelog.com/mechanics/sub-agents/)

### Further Reading

- [Vibe Kanban: Reimagining the SDLC with AI](https://thamizhelango.medium.com/vibe-kanban-reimagining-the-software-development-lifecycle-with-ai-agent-orchestration-eebe9744edf4)
- [The Orchestrator: Automating Claude Code Workflows](https://albertsikkema.com/ai/llm/development/productivity/2025/11/21/orchestrator-automating-claude-code-workflows.html)
- [Claude Sub-Agents: The Secret Delegation Technique](https://www.theaistack.dev/p/orchestrating-claude-sub-agents)

---

*Last updated: January 2026*
