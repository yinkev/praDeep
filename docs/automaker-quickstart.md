---
title: Automaker Quickstart
description: Get started with Automaker - an autonomous AI development studio
---

# Automaker Quickstart

Automaker is an autonomous AI development studio that lets you orchestrate AI agents to build software features. Instead of manually writing code, you describe features on a Kanban board and watch as AI agents implement them.

## Prerequisites

Before installing Automaker, ensure you have the following:

### Required

- **Node.js 22+** (tested with Node.js 22; minimum is Node.js 18)
- **npm** (comes with Node.js)
- **Git** (for worktree isolation)

### Authentication (choose one)

- **Claude Code CLI** (recommended) - Install and authenticate via [official quickstart](https://code.claude.com/docs/en/quickstart)
- **Codex CLI** (optional) - For OpenAI GPT models, install via `npm install -g @openai/codex`
- **Anthropic API Key** - Direct API key for Claude Agent SDK ([get one here](https://console.anthropic.com/))

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/AutoMaker-Org/automaker.git
cd automaker

# 2. Install dependencies
npm install

# 3. Build shared packages (optional - npm run dev does this automatically)
npm run build:packages
```

## Starting the Server

Start Automaker in development mode:

```bash
npm run dev
```

You will be prompted to select a mode:

```
? Select run mode:
❯ 1. Web Application (browser at localhost:3007)
  2. Desktop Application (Electron - recommended)
```

**Select option 1 for Web mode** to run in your browser.

Alternatively, start web mode directly:

```bash
npm run dev:web
```

### URLs

Once running, access Automaker at:

- **Frontend**: http://localhost:3007
- **Backend API**: http://localhost:3008
- **Health check**: http://localhost:3008/api/health

## Authentication

### Option 1: Claude Code CLI (Recommended)

If you have Claude Code CLI installed and authenticated, Automaker will automatically detect and use your credentials. No additional configuration needed.

```bash
# Verify Claude CLI is installed and authenticated
claude --version
```

### Option 2: Codex CLI (For GPT Models)

For OpenAI GPT model support:

```bash
# Install Codex CLI globally
npm install -g @openai/codex

# Authenticate
codex auth
```

### Option 3: API Key Authentication

On first run, Automaker shows a setup wizard where you can enter your API key directly. You can also configure it manually:

```bash
# Via environment variable
export ANTHROPIC_API_KEY="sk-ant-..."

# Or create a .env file in the automaker root
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
```

### Auth Key (Server Protection)

For additional security, you can protect the Automaker server with an API key:

```bash
export AUTOMAKER_API_KEY="your-secret-key"
```

This requires all API requests to include the `X-API-Key` header.

## Creating a Project

1. Open Automaker at http://localhost:3007
2. Click **Open Project** or press `O`
3. Select a directory containing a Git repository
4. Automaker will analyze the project structure

### Project Analysis

After opening a project, Automaker automatically:
- Scans the codebase structure
- Generates AI-powered feature suggestions
- Creates a project specification in `.automaker/spec.md`

## Creating Tasks

### Adding Features to the Board

1. Navigate to the **Board** view (press `K`)
2. Click **Add Feature** or press `N`
3. Enter a feature description:
   - Describe what you want built
   - Optionally attach images or screenshots
   - Set the model (Opus, Sonnet, or Haiku)
   - Configure planning mode (skip, lite, spec, or full)

### Feature Configuration Options

| Option | Description |
|--------|-------------|
| **Model** | Claude Opus (most capable), Sonnet (balanced), or Haiku (fastest) |
| **Planning** | Skip (direct), Lite (quick plan), Spec (task breakdown), Full (phased execution) |
| **Thinking** | None, Medium, Deep, or Ultra for complex problem-solving |

## Auto Mode vs Manual Mode

### Manual Mode

In manual mode, you control when features start executing:

1. Drag a feature from **Backlog** to **In Progress**
2. An AI agent is assigned and begins implementation
3. Watch real-time progress in the agent output panel
4. Review changes when the feature moves to **Waiting Approval**
5. Approve and verify to complete the workflow

### Auto Mode

Auto Mode enables fully autonomous feature execution:

1. Enable Auto Mode in the Board view
2. Automaker automatically:
   - Picks features from the backlog based on dependencies
   - Assigns AI agents to implement them
   - Manages concurrent execution (default: 3 features at once)
3. Features flow through the Kanban stages automatically

To enable Auto Mode:
- Click the Auto Mode toggle in the Board view
- Or press `G` to start the next available features

## Common Troubleshooting

### Port Conflicts

If ports 3007 or 3008 are already in use:

```bash
# Find and kill processes using the ports
lsof -ti:3007 | xargs kill -9
lsof -ti:3008 | xargs kill -9

# Or use a different port
PORT=3009 npm run dev:web
```

### CLI Detection Issues

If Automaker cannot detect your Claude or Codex CLI:

**Claude CLI not detected:**
```bash
# Verify Claude CLI installation
which claude
claude --version

# Re-authenticate if needed
claude login
```

**Codex CLI not detected:**
```bash
# Verify Codex CLI installation
which codex
codex --version

# Re-authenticate if needed
codex auth
```

**Refresh CLI detection:**
- Go to **Settings** > **Providers**
- Click the refresh button next to the CLI status

### Server Not Starting

If the server fails to start:

```bash
# Kill any existing processes
pkill -f 'node.*automaker' || true

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild packages
npm run build:packages

# Try starting again
npm run dev:web
```

### Git Worktree Issues

If features fail to start due to worktree errors:

```bash
# Navigate to your project directory
cd /path/to/your/project

# List existing worktrees
git worktree list

# Remove stale worktrees
git worktree prune
```

### Authentication Errors

If you see authentication errors:

1. Check your API key is correctly set
2. Verify CLI credentials are valid
3. Check the server logs for specific error messages:
   ```bash
   # View server output in the terminal where npm run dev is running
   ```

## Next Steps

- Explore the **Agent** view (`A`) for interactive chat sessions
- Set up **Context** files (`C`) to provide AI agents with project-specific information
- Create **AI Profiles** (`M`) for custom agent configurations
- Check the [Automaker README](https://github.com/AutoMaker-Org/automaker) for advanced features

## Quick Reference

| Action | Shortcut |
|--------|----------|
| Board view | `K` |
| Agent chat | `A` |
| Context files | `C` |
| Settings | `S` |
| Terminal | `T` |
| New item | `N` |
| Open project | `O` |
| Start next features | `G` |
| Toggle sidebar | `` ` `` |
