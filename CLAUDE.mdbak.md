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

- `web/` - Next.js 16 + React 19 frontend (PWA-enabled)
- `src/api/` - FastAPI backend
- `src/agents/` - Multi-agent AI system
- `src/services/council/` - Multi-agent deliberation system
- `src/agents/personalization/` - User behavior tracking and adaptive learning
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

### Mobile Touch Components
Mobile components (PullToRefresh, SwipeNavigator, ContextMenu) require careful TypeScript handling:
- Exclude Framer Motion drag handlers from component props using `Omit`
- Use proper touch event types (`TouchEvent<HTMLDivElement>`)
- Example: `type SwipeNavigatorProps = Omit<ComponentProps<typeof motion.div>, 'drag' | 'dragConstraints'>`

### PWA Components
PWA-related components must be client-only:
- Use `'use client'` directive for components accessing browser APIs
- Example: `PWAInit` component handles service worker registration
- Keep PWA logic separate from server components

### Testing
Run end-to-end tests with Playwright:
```bash
npm run test:e2e
```
Includes regression tests for personalization, PWA functionality, and mobile interactions.

## Codex Agent Guidelines

When delegating to Codex agents:
1. **Build verification is unreliable in Codex sandbox** - always verify build locally after
2. **Check for file deletions** - run `git status` after Codex tasks complete
3. **Multiple agents may conflict** - review changes before committing
4. **Restore from git if needed**: `git restore <file>`

## Codex Usage

**Important:** Codex is invoked through the Skills system, NOT through MCP tools. When delegating tasks to Codex, use the Skill tool to invoke the appropriate skill - do not use mcp__codex__codex directly.

## New Features

### Council System
Multi-agent deliberation system for complex decisions requiring consensus:
- Location: `src/services/council/`
- Enables multiple AI agents to deliberate and reach consensus
- Used for high-stakes decisions in agent workflows
- Tracks voting, reasoning, and final decisions

### Personalization Engine
Adaptive learning system that tracks user behavior and preferences:
- Location: `src/agents/personalization/`
- `BehaviorTrackerAgent` - Monitors interaction patterns
- Persistent storage in `data/user/memory/`
- Adapts UI and recommendations based on user history
- Privacy-focused: all data stored locally

### PWA Support
Progressive Web App capabilities for offline-first experience:
- Service worker registration in `web/app/pwa-init.tsx`
- Offline caching strategy
- App installation support (Add to Home Screen)
- Background sync for pending operations
- Health check endpoint: `/api/health`

### Mobile Touch Interactions
Touch-optimized components for mobile devices:
- `PullToRefresh` - Pull-down refresh gesture
- `SwipeNavigator` - Swipe-based navigation
- `ContextMenu` - Long-press context menus
- Location: `web/components/mobile/`
- Haptic feedback support
- Gesture conflict resolution

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

## New UI Components (2026 Research)

Components implementing soft minimalism and speed-focused design:

### ProgressiveDisclosure
**Purpose**: 2-layer expandable settings/details component with fluid animations.

**Import**: `import { ProgressiveDisclosure } from '@/components/ui/ProgressiveDisclosure'`

**Props**:
- `title: string` - Header text displayed in uppercase monospace
- `children: ReactNode` - Content revealed on expand
- `defaultExpanded?: boolean` - Initial state (default: false)
- `level?: 1 | 2` - Visual hierarchy (1=larger shadow, 2=subtle)

**Usage Example**:
```tsx
<ProgressiveDisclosure title="Advanced Settings" level={1}>
  <p>Settings content with glass morphism backdrop</p>
</ProgressiveDisclosure>
```

**Design Notes**:
- Glass morphism container with backdrop blur
- Smooth height/opacity animations (150ms)
- Chevron rotation on expand
- Hover shimmer effect with inset white glow

---

### DiffViewer
**Purpose**: Visual diff display for AI outputs with inline or split modes.

**Import**: `import { DiffViewer, Addition, Deletion, CodeDiff } from '@/components/ui/DiffViewer'`

**Components**:
1. **DiffViewer** - Container component
   - Props: `mode?: 'inline' | 'split'`, `showLineNumbers?: boolean`, `className?: string`

2. **Addition** - Highlights added content
   - Props: `children: ReactNode`, `lineNumber?: number`
   - Styling: Blue highlight with liquid glass backdrop

3. **Deletion** - Highlights removed content
   - Props: `children: ReactNode`, `lineNumber?: number`
   - Styling: Red strikethrough with subtle glow

4. **CodeDiff** - Specialized for code diffs
   - Props: `before: string[]`, `after: string[]`, `showLineNumbers?: boolean`, `language?: string`

**Usage Example**:
```tsx
// Inline mode
<DiffViewer mode="inline">
  <Deletion>old text</Deletion>
  <Addition>new text</Addition>
</DiffViewer>

// Code diff with split view
<CodeDiff
  before={['const x = 5', 'console.log(x)']}
  after={['let x = 10', 'console.info(x)']}
  showLineNumbers={true}
/>
```

**Design Notes**:
- Liquid glass aesthetic with blur effects
- Color-coded additions (blue) and deletions (red)
- Optional line numbers with monospace font
- Smooth entrance animations with staggered timing

---

### CommandMenu
**Purpose**: Notion-style slash command interface for keyboard-driven navigation.

**Import**: `import { CommandMenu, COMMANDS, type Command } from '@/components/ui/CommandMenu'`

**Props**:
- `isOpen: boolean` - Menu visibility
- `query: string` - Search filter text
- `selectedIndex: number` - Currently highlighted command
- `onSelect: (commandId: string) => void` - Selection callback
- `onClose: () => void` - Close callback
- `position?: { top: number; left: number }` - Absolute position

**Default Commands**:
- `ask` - Ask AI
- `summarize` - Summarize selected text
- `explain` - Explain concept in detail
- `research` - Research a topic with sources
- `improve` - Improve writing and clarity

**Usage Example**:
```tsx
const [menuOpen, setMenuOpen] = useState(false)
const [selectedCmd, setSelectedCmd] = useState(0)

<CommandMenu
  isOpen={menuOpen}
  query={searchText}
  selectedIndex={selectedCmd}
  onSelect={(id) => handleCommand(id)}
  onClose={() => setMenuOpen(false)}
/>
```

**Design Notes**:
- Floating glass container with backdrop blur
- Keyboard navigation (↑↓ arrows, Enter to select, Esc to close)
- Icon + description for each command
- Active item highlighted in blue with white text
- Smooth scale animations on hover/tap
- Scrolls selected item into view automatically

---

### CommandInput
**Purpose**: Text input that detects slash commands and opens CommandMenu.

**Import**: `import { CommandInput, type CommandContext } from '@/components/ui/CommandInput'`

**Props**:
- `value: string` - Input text value
- `onChange: (value: string) => void` - Change handler
- `onCommandSelect?: (commandId: string, context: CommandContext) => void` - Command selection callback
- `placeholder?: string` - Input placeholder
- `className?: string` - Additional CSS classes
- Extends standard HTML input props

**CommandContext**:
```tsx
interface CommandContext {
  text: string        // Input without command
  selection?: string  // Selected text context
}
```

**Usage Example**:
```tsx
const [inputValue, setInputValue] = useState('')

<CommandInput
  value={inputValue}
  onChange={setInputValue}
  onCommandSelect={(cmdId, ctx) => {
    console.log(`Executed ${cmdId} on: "${ctx.text}"`)
  }}
  placeholder="Type / for commands..."
/>
```

**Design Notes**:
- Detects `/` at start or after space
- Shows slash icon hint when empty
- Closes menu on selection and removes command text
- Repositions menu on window resize
- Full keyboard navigation support
- Arrow keys navigate commands, Enter selects, Escape closes

---

### AIContentHighlight
**Purpose**: Highlight AI-generated or AI-modified content with visual indicators.

**Import**: `import { AIContentHighlight, AIInlineHighlight, AIModification } from '@/components/ui/AIContentHighlight'`

**Components**:
1. **AIContentHighlight** - Block-level highlight
   - Props: `variant?: 'default' | 'subtle' | 'prominent'`, `showBadge?: boolean`, `animated?: boolean`, `className?: string`, `onHoverChange?: (isHovering: boolean) => void`

2. **AIInlineHighlight** - Inline text highlight
   - Props: `children: ReactNode`, `className?: string`

3. **AIModification** - Block with timestamp and model metadata
   - Props: `children: ReactNode`, `timestamp?: Date | string`, `modelName?: string`, `className?: string`

**Usage Example**:
```tsx
// Block highlight
<AIContentHighlight variant="default" showBadge={true}>
  <p>This content was generated by AI</p>
</AIContentHighlight>

// Inline highlight
<p>
  This text contains <AIInlineHighlight>AI-generated</AIInlineHighlight> content.
</p>

// With metadata
<AIModification timestamp={new Date()} modelName="Claude 3.5">
  <p>Modified content with timestamp</p>
</AIModification>
```

**Design Notes**:
- Three variants: default (balanced), subtle (minimal), prominent (attention-grabbing)
- Liquid glass glow effect that intensifies on hover
- AI badge with sparkle icon (removable)
- Smooth entrance animations
- Variants have different gradient directions and opacity levels

---

### Additional UI Components

**CommonPatterns**:
- All use `'use client'` directive for client-side interactivity
- Framer Motion animations with fluid easing: `[0.2, 0.8, 0.2, 1]`
- Glass morphism with `backdrop-blur-xl` or `backdrop-blur-sm`
- Lucide icons for consistency
- Responsive and touch-friendly design
- Dark mode support via `dark:` Tailwind classes

**Organization**:
- Location: `web/components/ui/`
- TypeScript interfaces for all props
- Accessible with ARIA attributes where relevant
- No external dependencies beyond React, Framer Motion, Lucide
