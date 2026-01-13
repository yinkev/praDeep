# Context-Aware Agent Suggestions System

## Overview

The Agent Suggestions system provides intelligent, context-aware recommendations for which AI agent to use based on user input. It uses keyword matching to analyze user queries and suggests the most relevant agents with confidence scores.

## Architecture

```
User Input
    ↓
useAgentContext Hook (debounced)
    ↓
agentMatcher.ts → fetchAgentSuggestions()
    ↓
Backend API: POST /api/agents/suggest
    ↓
Keyword Matching Algorithm
    ↓
Top 3 Ranked Suggestions
    ↓
AgentSuggestions Component
    ↓
User Selection → onSelect(agentType)
```

## Backend API

### Endpoints

#### `POST /api/agents/suggest`
Suggest relevant agents based on user input.

**Request:**
```json
{
  "input": "help me solve this math problem"
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "agent_type": "solve",
      "label": "Problem Solver",
      "description": "Solve math, physics, chemistry problems...",
      "confidence": 0.176,
      "icon": "HelpCircle",
      "color": "blue"
    }
  ],
  "query": "help me solve this math problem"
}
```

#### `GET /api/agents/capabilities`
Get full metadata for all agents including keywords, use cases, and examples.

**Response:**
```json
[
  {
    "agent_type": "solve",
    "icon": "HelpCircle",
    "color": "blue",
    "label_key": "Problem Solver",
    "description": "Solve math, physics, chemistry problems...",
    "use_cases": ["Solve mathematical equations", "Physics problem solving", ...],
    "keywords": ["solve", "calculate", "math", "physics", ...],
    "examples": ["Solve the equation 2x + 5 = 15", ...]
  }
]
```

### Agent Registry

**Available Agents:**
- `solve` - Problem solving, math, physics, chemistry
- `question` - Generate practice questions, quizzes, exams
- `research` - Deep research, literature reviews, citations
- `co_writer` - Essay writing, editing, creative content
- `guide` - Step-by-step tutorials, concept explanations
- `ideagen` - Brainstorming, creative ideas, project planning
- `chat` - Casual conversation, quick questions
- `personalization` - Adaptive learning paths, personalized plans

### Matching Algorithm

The keyword matching algorithm:
1. Converts user input to lowercase
2. Counts keyword matches for each agent
3. Calculates confidence score: `min(matches / total_keywords, 1.0)`
4. Boosts score by 20% if more than 3 keywords match
5. Returns top 3 agents sorted by confidence

**Performance:** < 10ms per request (no ML overhead)

## Frontend Components

### `AgentSuggestions`

Main dropdown component displaying agent suggestions.

**Props:**
```typescript
interface AgentSuggestionsProps {
  input: string              // User input to analyze
  show: boolean              // Show/hide dropdown
  onSelect: (agentType: string) => void  // Selection callback
  onClose: () => void        // Close callback
  className?: string         // Additional CSS classes
  position?: 'top' | 'bottom'  // Dropdown position
  enableKeyboard?: boolean   // Keyboard navigation
}
```

**Usage:**
```tsx
import AgentSuggestions from '@/components/AgentSuggestions'

function MyComponent() {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  return (
    <div className="relative">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
      />
      <AgentSuggestions
        input={input}
        show={showSuggestions}
        onSelect={(agentType) => {
          console.log('Selected agent:', agentType)
          setShowSuggestions(false)
        }}
        onClose={() => setShowSuggestions(false)}
      />
    </div>
  )
}
```

**Features:**
- Real-time suggestions with 300ms debounce
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)
- Confidence score badges
- Liquid Glass aesthetic with backdrop blur
- Framer Motion animations
- Click outside to close

### `useAgentContext`

React hook for managing agent suggestions with debouncing.

**Usage:**
```typescript
import { useAgentContext } from '@/hooks/useAgentContext'

const {
  suggestions,    // Current agent suggestions
  loading,        // Loading state
  error,          // Error state
  fetchSuggestions,  // Manual fetch
  clearSuggestions   // Clear suggestions
} = useAgentContext(input, {
  debounceMs: 300,   // Debounce delay
  minLength: 3,      // Minimum input length
  enabled: true      // Enable/disable
})
```

**Features:**
- Automatic debouncing
- Request cancellation on unmount
- Minimum length threshold
- Error handling
- Loading states

### `agentMatcher`

Utility library for API integration.

**Functions:**
- `fetchAgentSuggestions(input: string)` - Fetch suggestions
- `fetchAgentCapabilities()` - Fetch all capabilities
- `getAgentColorClasses(color: string)` - Get Tailwind classes
- `getIconName(iconName: string)` - Get icon component name

## Design System

### Liquid Glass Aesthetic

The component follows the 2026 Soft Minimalism design with:
- Glassmorphism: `bg-white/95 backdrop-blur-xl`
- Subtle borders: `border-gray-200/60`
- Soft shadows: `shadow-lg ring-1 ring-black/5`
- Smooth animations: Framer Motion with easing curves

### Color Palette

Each agent has a unique color:
- **Blue** (solve) - Problem solving
- **Purple** (question) - Question generation
- **Emerald** (research) - Research
- **Amber** (co_writer) - Writing
- **Indigo** (guide) - Learning
- **Yellow** (ideagen) - Ideas
- **Gray** (chat) - Chat
- **Pink** (personalization) - Personalization

### Animations

- **Dropdown entrance:** Scale + fade in (200ms)
- **List items:** Staggered appearance (40ms stagger)
- **Selection:** Background color transition
- **Loading:** Rotating sparkle icon

## Testing

### Backend Testing

Run the test script:
```bash
cd /Users/kyin/Projects/praDeep
source .venv/bin/activate
python test_agent_suggestions.py
```

**Test Coverage:**
- Keyword matching accuracy
- Confidence score calculation
- Multiple suggestions handling
- Capabilities endpoint
- Edge cases (empty input, no matches)

### Example Test Results

```
Query: 'help me solve this math problem'
  → Problem Solver (17.6% confidence)

Query: 'I need to write an essay about history'
  → Co-Writer (21.4% confidence)

Query: 'research quantum computing'
  → Research Assistant (6.7% confidence)
```

## Integration Guide

### Step 1: Add to Input Component

```tsx
'use client'

import { useState } from 'react'
import AgentSuggestions from '@/components/AgentSuggestions'

export default function ChatInput() {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleAgentSelect = (agentType: string) => {
    // Route to agent or modify input
    console.log('Selected agent:', agentType)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder="Ask anything..."
        className="w-full rounded-lg border p-4"
      />

      <AgentSuggestions
        input={input}
        show={showSuggestions && input.length >= 3}
        onSelect={handleAgentSelect}
        onClose={() => setShowSuggestions(false)}
        position="top"
      />
    </div>
  )
}
```

### Step 2: Configure Thresholds

Adjust in `useAgentContext` options:
```typescript
const { suggestions } = useAgentContext(input, {
  debounceMs: 300,    // Typing pause before fetch
  minLength: 3,       // Minimum characters to trigger
  enabled: showSuggestions  // Enable/disable
})
```

### Step 3: Customize Matching

Edit `AGENT_REGISTRY` in `src/api/routers/agent_config.py`:
- Add keywords for better matching
- Adjust descriptions
- Add new agents

## Performance Considerations

### Backend
- Keyword matching: O(n*m) where n = agents, m = keywords
- Average response time: < 10ms
- No database queries
- No LLM calls

### Frontend
- Debounced API calls (300ms)
- Request cancellation on unmount
- Lazy loading of suggestions
- Minimal re-renders

## Future Enhancements

### Planned Features
1. **Semantic matching** - Use embeddings for better intent detection
2. **User history** - Learn from past agent selections
3. **Context awareness** - Consider conversation history
4. **Multi-agent routing** - Suggest combinations of agents
5. **Keyboard shortcuts** - Cmd+K to open suggestions
6. **Recent agents** - Show recently used agents
7. **Custom agents** - Allow users to define their own

### Backend Improvements
- Add confidence threshold filtering
- Support multi-language keywords
- Add agent availability checking
- Track suggestion accuracy metrics

### Frontend Enhancements
- Mobile touch gestures
- Voice input support
- Agent preview on hover
- Inline agent switching
- Suggestion history

## Troubleshooting

### Suggestions Not Appearing

1. **Check minimum length:** Input must be ≥ 3 characters
2. **Verify API endpoint:** `http://localhost:8783/api/agents/suggest`
3. **Check console for errors:** Network issues or CORS
4. **Verify `show` prop:** Must be `true` to display

### No Matches Found

1. **Add keywords:** Update `AGENT_REGISTRY` with more keywords
2. **Check input formatting:** Algorithm uses lowercase matching
3. **Adjust confidence threshold:** Lower threshold in matching logic

### Performance Issues

1. **Increase debounce:** Change `debounceMs` to 500ms
2. **Check network latency:** Backend should respond < 50ms
3. **Verify request cancellation:** Old requests should be aborted

## API Reference

### Types

```typescript
// Agent Suggestion
interface AgentSuggestion {
  agent_type: string
  label: string
  description: string
  confidence: number  // 0.0 - 1.0
  icon: string
  color: string
}

// Agent Capabilities
interface AgentCapability {
  agent_type: string
  icon: string
  color: string
  label_key: string
  description: string
  use_cases: string[]
  keywords: string[]
  examples: string[]
}
```

## Credits

- **Design:** 2026 Soft Minimalism / Liquid Glass
- **Animations:** Framer Motion
- **Backend:** FastAPI + Pydantic
- **Frontend:** Next.js 16 + React 19
- **Testing:** Python asyncio

---

**Built with:** Claude Sonnet 4.5 + Claude Opus 4.5
**Date:** January 2026
**Version:** 1.0.0
