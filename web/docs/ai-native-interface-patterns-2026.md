# AI-Native Interface Patterns for Research/Learning Platforms (2026)

> Comprehensive guide to modern AI interface patterns with production-ready React 19 + Next.js 16 components for praDeep's Liquid Cloud design system.

## Table of Contents

1. [Chat Interfaces & Artifact Rendering](#1-chat-interfaces--artifact-rendering)
2. [AI Suggestions & Autocomplete](#2-ai-suggestions--autocomplete)
3. [Progress & Status Visualization](#3-progress--status-visualization)
4. [RAG Visualization & Source Citations](#4-rag-visualization--source-citations)
5. [Regenerate & Iteration Controls](#5-regenerate--iteration-controls)
6. [Voice & Multimodal Interfaces](#6-voice--multimodal-interfaces)
7. [Accessibility & Performance](#7-accessibility--performance)

---

## 1. Chat Interfaces & Artifact Rendering

### Research Insights

**Claude Artifacts** pioneered the pattern of live-rendering substantial code in a side panel with instant preview ([LogRocket Guide](https://blog.logrocket.com/implementing-claudes-artifacts-feature-ui-visualization/), [Reid Barber's Analysis](https://www.reidbarber.com/blog/reverse-engineering-claude-artifacts)). The key innovation: **content as executable artifacts** rather than static text.

**Key Patterns:**
- Split view: conversation + live preview
- Instant execution of React components, SVG, Mermaid diagrams
- Toggle between code view and rendered output
- Full React 19 environment with hooks, Tailwind, shadcn/ui preloaded ([Claude Artifact Runner](https://github.com/claudio-silva/claude-artifact-runner))

### Production Component: ArtifactRenderer

```tsx
// /web/components/ai/ArtifactRenderer.tsx
'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, Eye, Download, Share2, Copy, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Artifact {
  id: string
  type: 'react' | 'markdown' | 'svg' | 'mermaid' | 'html'
  title: string
  code: string
  createdAt: Date
  language?: string
}

interface ArtifactRendererProps {
  artifact: Artifact
  onUpdate?: (code: string) => void
  className?: string
}

export function ArtifactRenderer({ artifact, onUpdate, className }: ArtifactRendererProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Render artifact in sandboxed iframe
  useEffect(() => {
    if (viewMode === 'preview' && iframeRef.current && artifact.type === 'react') {
      const iframeDoc = iframeRef.current.contentDocument
      if (!iframeDoc) return

      // Inject Tailwind + artifact code
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>
            body { margin: 0; padding: 16px; font-family: var(--font-sans); }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            ${artifact.code}
          </script>
        </body>
        </html>
      `
      iframeDoc.open()
      iframeDoc.write(html)
      iframeDoc.close()
    }
  }, [artifact.code, viewMode, artifact.type])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([artifact.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title.replace(/\s+/g, '-').toLowerCase()}.${artifact.type}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
          <h3 className="text-sm font-medium text-text-primary">{artifact.title}</h3>
          <span className="px-2 py-0.5 text-xs rounded-md bg-surface-secondary text-text-tertiary">
            {artifact.type}
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-secondary">
            <Button
              variant={viewMode === 'preview' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              className="gap-1.5 px-3"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button
              variant={viewMode === 'code' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('code')}
              className="gap-1.5 px-3"
            >
              <Code2 className="w-4 h-4" />
              Code
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
              title="Copy code"
            >
              {copied ? (
                <CheckCheck className="w-4 h-4 text-semantic-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" title="Share">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'preview' ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title={artifact.title}
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full overflow-auto"
            >
              <pre className="p-4 text-sm font-mono text-text-primary bg-surface-secondary">
                <code>{artifact.code}</code>
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Metadata */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-secondary">
        <span className="text-xs text-text-tertiary">
          Created {artifact.createdAt.toLocaleTimeString()}
        </span>
        <span className="text-xs text-text-tertiary">
          {artifact.code.split('\n').length} lines
        </span>
      </div>
    </Card>
  )
}
```

### Usage

```tsx
// In your chat interface
import { ArtifactRenderer } from '@/components/ai/ArtifactRenderer'

const artifact: Artifact = {
  id: 'art_123',
  type: 'react',
  title: 'Interactive Data Visualization',
  code: `function Chart() { ... }`,
  createdAt: new Date(),
}

<ArtifactRenderer artifact={artifact} />
```

---

## 2. AI Suggestions & Autocomplete

### Research Insights

**GitHub Copilot** defines the gold standard for inline suggestions ([VS Code Docs](https://code.visualstudio.com/docs/copilot/ai-powered-suggestions), [GitHub Docs](https://docs.github.com/en/copilot/concepts/completions/code-suggestions)):

1. **Ghost text suggestions**: Dimmed text at cursor position, accepted with Tab
2. **Next edit suggestions (NES)**: Predict location AND content of next edit
3. **Gutter indicators**: Arrow icons showing available suggestions

**Key Patterns:**
- Dimmed ghost text (opacity: 0.4-0.5)
- Tab to accept, Escape to dismiss
- Multiple suggestions via cycling (Alt+])
- Partial acceptance (Ctrl+Right Arrow)

### Production Component: InlineSuggestion

```tsx
// /web/components/ai/InlineSuggestion.tsx
'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, X } from 'lucide-react'

interface Suggestion {
  id: string
  text: string
  confidence: number // 0-1
  source: 'ai-autocomplete' | 'ai-next-edit' | 'template'
}

interface InlineSuggestionProps {
  suggestions: Suggestion[]
  onAccept: (suggestion: Suggestion) => void
  onReject: () => void
  cursorPosition: { line: number; column: number }
  className?: string
}

export function InlineSuggestion({
  suggestions,
  onAccept,
  onReject,
  cursorPosition,
  className,
}: InlineSuggestionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCycleHint, setShowCycleHint] = useState(false)
  const currentSuggestion = suggestions[currentIndex]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentSuggestion) return

      // Tab to accept
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        onAccept(currentSuggestion)
      }

      // Escape to dismiss
      if (e.key === 'Escape') {
        e.preventDefault()
        onReject()
      }

      // Alt+] to cycle suggestions
      if (e.altKey && e.key === ']' && suggestions.length > 1) {
        e.preventDefault()
        setCurrentIndex((prev) => (prev + 1) % suggestions.length)
        setShowCycleHint(true)
        setTimeout(() => setShowCycleHint(false), 2000)
      }

      // Alt+[ to cycle backwards
      if (e.altKey && e.key === '[' && suggestions.length > 1) {
        e.preventDefault()
        setCurrentIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        setShowCycleHint(true)
        setTimeout(() => setShowCycleHint(false), 2000)
      }
    }

    window.addEventListener('keydown', handleKeyDown as any)
    return () => window.removeEventListener('keydown', handleKeyDown as any)
  }, [currentSuggestion, suggestions, onAccept, onReject])

  if (!currentSuggestion) return null

  // Confidence-based styling
  const confidenceColor =
    currentSuggestion.confidence > 0.8
      ? 'text-accent-primary'
      : currentSuggestion.confidence > 0.5
        ? 'text-text-tertiary'
        : 'text-text-quaternary'

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Ghost text suggestion */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`font-mono ${confidenceColor} select-none pointer-events-none`}
      >
        {currentSuggestion.text}
      </motion.span>

      {/* Suggestion metadata tooltip */}
      <AnimatePresence>
        {showCycleHint && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 mt-1 z-50"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated shadow-lg border border-border">
              <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-xs text-text-secondary">
                Suggestion {currentIndex + 1} of {suggestions.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts hint (first appearance) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-full left-0 mt-2 z-50 pointer-events-none"
      >
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-elevated shadow-lg border border-border text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary font-mono">Tab</kbd>
            <span>Accept</span>
          </div>
          {suggestions.length > 1 && (
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary font-mono">Alt+]</kbd>
              <span>Next</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary font-mono">Esc</kbd>
            <span>Dismiss</span>
          </div>
        </div>
      </motion.div>

      {/* Confidence indicator */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2">
        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-surface-secondary border border-border">
          <div
            className="w-2 h-2 rounded-full bg-accent-primary transition-opacity"
            style={{ opacity: currentSuggestion.confidence }}
          />
        </div>
      </div>
    </div>
  )
}
```

### Command Palette for AI Actions

```tsx
// /web/components/ai/AICommandPalette.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  FileText,
  Code2,
  Lightbulb,
  BookOpen,
  Zap,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface AICommand {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  category: 'generate' | 'analyze' | 'refactor' | 'explain'
  action: () => void
}

const commands: AICommand[] = [
  {
    id: 'generate-summary',
    title: 'Generate Summary',
    description: 'Create concise summary of selected text',
    icon: <FileText className="w-4 h-4" />,
    shortcut: 'Cmd+Shift+S',
    category: 'generate',
    action: () => {},
  },
  {
    id: 'explain-concept',
    title: 'Explain Concept',
    description: 'Get detailed explanation with examples',
    icon: <Lightbulb className="w-4 h-4" />,
    shortcut: 'Cmd+Shift+E',
    category: 'explain',
    action: () => {},
  },
  {
    id: 'generate-code',
    title: 'Generate Code',
    description: 'Create code from natural language',
    icon: <Code2 className="w-4 h-4" />,
    shortcut: 'Cmd+Shift+G',
    category: 'generate',
    action: () => {},
  },
  {
    id: 'find-references',
    title: 'Find References',
    description: 'Search knowledge base for related content',
    icon: <BookOpen className="w-4 h-4" />,
    shortcut: 'Cmd+Shift+R',
    category: 'analyze',
    action: () => {},
  },
]

interface AICommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function AICommandPalette({ isOpen, onClose }: AICommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        filteredCommands[selectedIndex]?.action()
        onClose()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl"
          >
            <div className="mx-4 rounded-2xl bg-surface-elevated shadow-2xl border border-border overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-text-tertiary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search AI commands..."
                  className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-quaternary"
                />
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
                  <span className="text-xs text-text-tertiary">AI</span>
                </div>
              </div>

              {/* Command List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length > 0 ? (
                  <div className="py-2">
                    {filteredCommands.map((command, index) => (
                      <motion.button
                        key={command.id}
                        onClick={() => {
                          command.action()
                          onClose()
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                          index === selectedIndex
                            ? 'bg-accent-primary-soft'
                            : 'hover:bg-surface-secondary'
                        }`}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                            index === selectedIndex
                              ? 'bg-accent-primary text-white'
                              : 'bg-surface-secondary text-text-secondary'
                          }`}
                        >
                          {command.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-text-primary">
                            {command.title}
                          </div>
                          <div className="text-xs text-text-tertiary">{command.description}</div>
                        </div>
                        {command.shortcut && (
                          <kbd className="px-2 py-1 text-xs rounded bg-surface-secondary text-text-tertiary font-mono">
                            {command.shortcut}
                          </kbd>
                        )}
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-text-tertiary">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No commands found</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-secondary text-xs text-text-tertiary">
                <div className="flex items-center gap-4">
                  <span>
                    <kbd className="px-1 rounded bg-surface-primary">↑↓</kbd> Navigate
                  </span>
                  <span>
                    <kbd className="px-1 rounded bg-surface-primary">↵</kbd> Select
                  </span>
                  <span>
                    <kbd className="px-1 rounded bg-surface-primary">Esc</kbd> Close
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent-primary" />
                  <span>{filteredCommands.length} commands</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## 3. Progress & Status Visualization

### Research Insights

Modern AI interfaces emphasize **transparency through visual feedback**:
- Streaming tokens with "thinking" indicators
- Multi-stage processing (retrieve → reason → respond)
- Confidence visualization
- Real-time status updates

### Production Component: AIThinkingIndicator

```tsx
// /web/components/ai/AIThinkingIndicator.tsx
'use client'

import { motion } from 'framer-motion'
import { Brain, Search, Sparkles, Zap } from 'lucide-react'

type ThinkingStage =
  | 'analyzing'
  | 'searching'
  | 'reasoning'
  | 'generating'
  | 'complete'

interface AIThinkingIndicatorProps {
  stage: ThinkingStage
  message?: string
  progress?: number // 0-100
  className?: string
}

const stageConfig = {
  analyzing: {
    icon: Brain,
    label: 'Analyzing your question',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  searching: {
    icon: Search,
    label: 'Searching knowledge base',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  reasoning: {
    icon: Sparkles,
    label: 'Reasoning through concepts',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  generating: {
    icon: Zap,
    label: 'Generating response',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  complete: {
    icon: Sparkles,
    label: 'Complete',
    color: 'text-accent-primary',
    bgColor: 'bg-accent-primary/10',
  },
}

export function AIThinkingIndicator({
  stage,
  message,
  progress,
  className,
}: AIThinkingIndicatorProps) {
  const config = stageConfig[stage]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {/* Animated Icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: stage === 'searching' ? [0, 360] : 0,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`flex items-center justify-center w-10 h-10 rounded-full ${config.bgColor}`}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
      </motion.div>

      {/* Text + Progress */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text-primary">
            {message || config.label}
          </span>
          {progress !== undefined && (
            <span className="text-xs text-text-tertiary">{Math.round(progress)}%</span>
          )}
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="h-1 rounded-full bg-surface-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`h-full ${config.color.replace('text', 'bg')}`}
            />
          </div>
        )}

        {/* Pulse dots (indeterminate) */}
        {progress === undefined && (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text', 'bg')}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

### Streaming Response Component

```tsx
// /web/components/ai/StreamingResponse.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface StreamingResponseProps {
  text: string
  isComplete: boolean
  typingSpeed?: number // ms per character
  className?: string
}

export function StreamingResponse({
  text,
  isComplete,
  typingSpeed = 15,
  className,
}: StreamingResponseProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Simulate streaming effect
  useEffect(() => {
    if (isComplete) {
      setDisplayedText(text)
      setShowCursor(false)
      return
    }

    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++

        // Auto-scroll to bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      } else {
        clearInterval(interval)
      }
    }, typingSpeed)

    return () => clearInterval(interval)
  }, [text, isComplete, typingSpeed])

  // Cursor blink animation
  useEffect(() => {
    if (isComplete) return

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(interval)
  }, [isComplete])

  return (
    <div
      ref={containerRef}
      className={`prose prose-sm max-w-none text-text-primary ${className}`}
    >
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: showCursor ? 1 : 0 }}
          className="inline-block w-0.5 h-4 ml-0.5 bg-accent-primary"
        />
      )}
    </div>
  )
}
```

---

## 4. RAG Visualization & Source Citations

### Research Insights

**Perplexity AI** pioneered transparent RAG interfaces ([Perplexity Guide](https://notiongraffiti.com/perplexity-ai-guide-2026/), [AI Platform Citation Patterns](https://www.tryprofound.com/blog/ai-platform-citation-patterns)):

- Numbered inline citations `[1]` with hover previews
- Source cards with thumbnails, titles, domains
- Highlighting exact quoted passages
- Confidence scores per source

**ChatGPT streaming citations** ([Funnelstory Guide](https://funnelstory.ai/blog/engineering/ever-wondered-how-chatgpt-shows-you-its-sources-lets-dive-into-streaming)) use placeholder markers like `#ref_1` that get replaced with clickable citations in real-time.

### Production Component: SourceCitation

```tsx
// /web/components/ai/SourceCitation.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, FileText, Globe, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface Source {
  id: string
  title: string
  url: string
  domain: string
  excerpt: string
  favicon?: string
  confidence: number // 0-1
  citedAt: number[] // Character positions in text
}

interface SourceCitationProps {
  source: Source
  citationNumber: number
  className?: string
}

export function SourceCitation({ source, citationNumber, className }: SourceCitationProps) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <span className={`relative inline-block ${className}`}>
      {/* Inline Citation Number */}
      <motion.button
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center justify-center w-5 h-5 -top-0.5 text-xs font-semibold rounded bg-accent-primary text-white hover:bg-accent-primary-hover transition-colors cursor-pointer"
      >
        {citationNumber}
      </motion.button>

      {/* Hover Preview Card */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-80 pointer-events-none"
          >
            <Card className="p-4 shadow-2xl border-border">
              {/* Header */}
              <div className="flex items-start gap-3 mb-2">
                {source.favicon ? (
                  <img
                    src={source.favicon}
                    alt=""
                    className="w-5 h-5 rounded mt-0.5"
                  />
                ) : (
                  <Globe className="w-5 h-5 text-text-tertiary mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-text-primary truncate">
                    {source.title}
                  </h4>
                  <p className="text-xs text-text-tertiary truncate">{source.domain}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-text-quaternary flex-shrink-0" />
              </div>

              {/* Excerpt */}
              <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-3">
                {source.excerpt}
              </p>

              {/* Confidence Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-3 rounded-full ${
                          i < Math.round(source.confidence * 5)
                            ? 'bg-semantic-success'
                            : 'bg-surface-secondary'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-tertiary">
                    {Math.round(source.confidence * 100)}% relevance
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
```

### Source List Component

```tsx
// /web/components/ai/SourceList.tsx
'use client'

import { motion } from 'framer-motion'
import { ExternalLink, FileText, Globe, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Source {
  id: string
  title: string
  url: string
  domain: string
  excerpt: string
  favicon?: string
  confidence: number
  citedAt: number[]
}

interface SourceListProps {
  sources: Source[]
  onSourceClick?: (source: Source) => void
  className?: string
}

export function SourceList({ sources, onSourceClick, className }: SourceListProps) {
  // Sort by confidence
  const sortedSources = [...sources].sort((a, b) => b.confidence - a.confidence)

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Sources ({sources.length})
        </h3>
        <span className="text-xs text-text-tertiary">Sorted by relevance</span>
      </div>

      {sortedSources.map((source, index) => (
        <motion.div
          key={source.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onSourceClick?.(source)}
          >
            <div className="flex items-start gap-3">
              {/* Citation Number */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-primary-soft text-accent-primary font-semibold text-sm flex-shrink-0">
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-text-primary group-hover:text-accent-primary transition-colors line-clamp-2">
                    {source.title}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-text-quaternary group-hover:text-accent-primary transition-colors flex-shrink-0" />
                </div>

                <p className="text-xs text-text-tertiary mb-2 line-clamp-2">
                  {source.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {source.favicon ? (
                      <img
                        src={source.favicon}
                        alt=""
                        className="w-4 h-4 rounded"
                      />
                    ) : (
                      <Globe className="w-4 h-4 text-text-quaternary" />
                    )}
                    <span className="text-xs text-text-tertiary truncate">
                      {source.domain}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-semantic-success" />
                    <span className="text-xs text-text-tertiary">
                      {Math.round(source.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
```

### Highlighted Text with Source Mapping

```tsx
// /web/components/ai/HighlightedText.tsx
'use client'

import { useState } from 'react'
import { SourceCitation } from './SourceCitation'

interface TextSegment {
  text: string
  sourceId?: string
  sourceNumber?: number
}

interface HighlightedTextProps {
  segments: TextSegment[]
  sources: Map<string, Source>
  className?: string
}

export function HighlightedText({ segments, sources, className }: HighlightedTextProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {segments.map((segment, index) => (
        <span key={index}>
          {segment.text}
          {segment.sourceId && segment.sourceNumber && (
            <SourceCitation
              source={sources.get(segment.sourceId)!}
              citationNumber={segment.sourceNumber}
              className="ml-0.5"
            />
          )}
        </span>
      ))}
    </div>
  )
}
```

---

## 5. Regenerate & Iteration Controls

### Research Insights

Users need to:
- Regenerate responses with different parameters
- Branch conversations to explore alternatives
- Compare multiple AI outputs side-by-side
- Roll back to previous versions

### Production Component: RegenerateControls

```tsx
// /web/components/ai/RegenerateControls.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, GitBranch, ThumbsUp, ThumbsDown, Copy, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface RegenerateControlsProps {
  onRegenerate: (options?: RegenerateOptions) => void
  onBranch: () => void
  onFeedback: (type: 'positive' | 'negative') => void
  isLoading?: boolean
  className?: string
}

interface RegenerateOptions {
  temperature?: number
  model?: string
  includeMoreSources?: boolean
}

export function RegenerateControls({
  onRegenerate,
  onBranch,
  onFeedback,
  isLoading,
  className,
}: RegenerateControlsProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type)
    onFeedback(type)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 ${className}`}
    >
      {/* Regenerate */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRegenerate()}
        disabled={isLoading}
        className="gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        Regenerate
      </Button>

      {/* Branch */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBranch}
        className="gap-2"
        title="Branch conversation"
      >
        <GitBranch className="w-4 h-4" />
        Branch
      </Button>

      {/* Divider */}
      <div className="w-px h-4 bg-border" />

      {/* Feedback */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('positive')}
        className={feedback === 'positive' ? 'text-semantic-success' : ''}
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('negative')}
        className={feedback === 'negative' ? 'text-semantic-error' : ''}
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>

      {/* Copy */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Copy to clipboard logic
        }}
        title="Copy response"
      >
        <Copy className="w-4 h-4" />
      </Button>

      {/* More Options */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        title="More options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </motion.div>
  )
}
```

### Version History Component

```tsx
// /web/components/ai/VersionHistory.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Clock, GitBranch, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Version {
  id: string
  content: string
  createdAt: Date
  model: string
  isBranch: boolean
}

interface VersionHistoryProps {
  versions: Version[]
  currentVersionId: string
  onVersionSelect: (versionId: string) => void
  className?: string
}

export function VersionHistory({
  versions,
  currentVersionId,
  onVersionSelect,
  className,
}: VersionHistoryProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-text-tertiary" />
        <h4 className="text-sm font-semibold text-text-primary">Version History</h4>
        <span className="text-xs text-text-quaternary">({versions.length})</span>
      </div>

      <div className="space-y-2">
        {versions.map((version, index) => {
          const isSelected = version.id === currentVersionId
          return (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-accent-primary-soft border-accent-primary'
                    : 'hover:bg-surface-secondary'
                }`}
                onClick={() => onVersionSelect(version.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {version.isBranch && (
                        <GitBranch className="w-3 h-3 text-accent-secondary" />
                      )}
                      <span className="text-xs font-medium text-text-primary">
                        Version {versions.length - index}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-accent-primary" />
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary line-clamp-2 mb-1">
                      {version.content.slice(0, 100)}...
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-quaternary">
                      <span>{version.model}</span>
                      <span>•</span>
                      <span>{version.createdAt.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 6. Voice & Multimodal Interfaces

### Research Insights

**2026 Expectations** ([Cursor AI 2026](https://blog.promptlayer.com/cursor-changelog-whats-coming-next-in-2026/), [Wispr Flow](https://wisprflow.ai/vibe-coding/cursor)):

- Built-in speech-to-text with custom trigger words
- Voice mode for hands-free operation
- Multimodal understanding (diagrams, mockups, video)
- "Vibe coding" - speaking code at 200+ WPM

Key patterns:
- Push-to-talk with visual feedback
- Real-time transcription display
- Voice command shortcuts
- Multimodal file upload (drag-drop images/PDFs)

### Production Component: VoiceInput

```tsx
// /web/components/ai/VoiceInput.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Waveform } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onFinalize: (text: string) => void
  triggerKeyword?: string // e.g., "send", "submit"
  className?: string
}

export function VoiceInput({
  onTranscript,
  onFinalize,
  triggerKeyword = 'send',
  className,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onresult = (event: any) => {
      let interim = ''
      let final = transcript

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcriptPart + ' '
        } else {
          interim += transcriptPart
        }
      }

      setTranscript(final)
      setInterimTranscript(interim)
      onTranscript(final + interim)

      // Check for trigger keyword
      if (final.toLowerCase().trim().endsWith(triggerKeyword)) {
        const finalText = final.replace(new RegExp(triggerKeyword + '$', 'i'), '').trim()
        onFinalize(finalText)
        setTranscript('')
        setInterimTranscript('')
        stopListening()
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      stopListening()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [transcript, onTranscript, onFinalize, triggerKeyword])

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true)
      setTranscript('')
      setInterimTranscript('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false)
      recognitionRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Microphone Button */}
      <Button
        variant={isListening ? 'primary' : 'ghost'}
        size="lg"
        onClick={toggleListening}
        className={`relative gap-2 ${isListening ? 'animate-pulse' : ''}`}
      >
        {isListening ? (
          <>
            <Waveform className="w-5 h-5" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            Voice Input
          </>
        )}

        {/* Recording indicator */}
        {isListening && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-semantic-error"
          />
        )}
      </Button>

      {/* Transcript Display */}
      <AnimatePresence>
        {isListening && (transcript || interimTranscript) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-2 p-4 rounded-xl bg-surface-elevated shadow-2xl border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary-soft">
                <Waveform className="w-4 h-4 text-accent-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-primary mb-1">
                  {transcript}
                  <span className="text-text-tertiary italic">{interimTranscript}</span>
                </p>
                <p className="text-xs text-text-quaternary">
                  Say "{triggerKeyword}" to submit
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waveform Visualization */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scaleY: [1, 2, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              className="w-1 h-4 rounded-full bg-accent-primary"
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
```

### Multimodal File Upload

```tsx
// /web/components/ai/MultimodalUpload.tsx
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, Image, FileText, X, CheckCircle2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface UploadedFile {
  id: string
  file: File
  preview?: string
  type: 'image' | 'pdf' | 'document'
  status: 'uploading' | 'complete' | 'error'
}

interface MultimodalUploadProps {
  onFilesUpload: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  className?: string
}

export function MultimodalUpload({
  onFilesUpload,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  className,
}: MultimodalUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36),
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        type: file.type.startsWith('image/')
          ? 'image'
          : file.type === 'application/pdf'
            ? 'pdf'
            : 'document',
        status: 'uploading',
      }))

      setUploadedFiles((prev) => [...prev, ...newFiles])

      // Simulate upload
      setTimeout(() => {
        setUploadedFiles((prev) =>
          prev.map((f) => (newFiles.find((nf) => nf.id === f.id) ? { ...f, status: 'complete' } : f))
        )
        onFilesUpload(acceptedFiles)
      }, 1000)
    },
    [onFilesUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - uploadedFiles.length,
  })

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'pdf':
        return <FileText className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  return (
    <div className={className}>
      {/* Drop Zone */}
      {uploadedFiles.length < maxFiles && (
        <motion.div
          {...getRootProps()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragActive
              ? 'border-accent-primary bg-accent-primary-soft'
              : 'border-border bg-surface-secondary hover:border-accent-primary hover:bg-accent-primary-soft/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <motion.div
              animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
              className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isDragActive ? 'bg-accent-primary text-white' : 'bg-surface-elevated text-text-tertiary'
              }`}
            >
              <Upload className="w-8 h-8" />
            </motion.div>
            <p className="text-sm font-medium text-text-primary mb-1">
              {isDragActive ? 'Drop files here' : 'Drag files or click to upload'}
            </p>
            <p className="text-xs text-text-tertiary">
              Images, PDFs, or documents • Max {maxFiles} files
            </p>
          </div>

          {/* Animated border gradient */}
          {isDragActive && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent, var(--accent-primary), transparent)',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                padding: '2px',
              }}
            />
          )}
        </motion.div>
      )}

      {/* Uploaded Files List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {uploadedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
              >
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Preview/Icon */}
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 rounded bg-surface-secondary text-text-tertiary">
                        {getFileIcon(file.type)}
                      </div>
                    )}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {(file.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    {/* Status */}
                    {file.status === 'uploading' && (
                      <div className="w-5 h-5 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {file.status === 'complete' && (
                      <CheckCircle2 className="w-5 h-5 text-semantic-success" />
                    )}

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## 7. Accessibility & Performance

### Accessibility Guidelines

```tsx
// /web/lib/ai/a11y.ts

/**
 * Accessibility utilities for AI interfaces
 * Following WCAG 2.1 Level AA standards
 */

export const A11Y_GUIDELINES = {
  // Screen reader announcements for AI status
  announceAIStatus: (status: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = status
    document.body.appendChild(announcement)
    setTimeout(() => announcement.remove(), 1000)
  },

  // Keyboard navigation for AI suggestions
  KEYBOARD_SHORTCUTS: {
    ACCEPT_SUGGESTION: 'Tab',
    REJECT_SUGGESTION: 'Escape',
    CYCLE_NEXT: 'Alt+]',
    CYCLE_PREV: 'Alt+[',
    OPEN_COMMAND_PALETTE: 'Cmd+K',
    TOGGLE_VOICE: 'Cmd+Shift+V',
  },

  // Focus management
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => {
    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    containerRef.current?.addEventListener('keydown', handleTab)
    return () => containerRef.current?.removeEventListener('keydown', handleTab)
  },

  // Color contrast requirements
  CONTRAST_RATIOS: {
    NORMAL_TEXT: 4.5, // WCAG AA
    LARGE_TEXT: 3, // WCAG AA (18pt+)
    UI_COMPONENTS: 3, // WCAG AA
  },

  // Motion preferences
  respectsReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Aria labels for AI components
  ARIA_LABELS: {
    ARTIFACT_PREVIEW: 'AI-generated artifact preview',
    SOURCE_CITATION: 'Source citation',
    THINKING_INDICATOR: 'AI is processing your request',
    VOICE_INPUT: 'Voice input control',
    COMMAND_PALETTE: 'AI command palette',
  },
}

/**
 * Hook for reduced motion preferences
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
```

### Performance Optimizations

```tsx
// /web/lib/ai/performance.ts

/**
 * Performance utilities for AI interfaces
 * Streaming, virtualization, and lazy loading
 */

import { useEffect, useRef, useState } from 'react'

/**
 * Streaming text hook with token-by-token rendering
 */
export function useStreamingText(
  stream: AsyncIterable<string> | null,
  options: {
    onComplete?: () => void
    chunkDelay?: number // ms between chunks
  } = {}
) {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (!stream) return

    let isCancelled = false
    setIsStreaming(true)

    ;(async () => {
      try {
        for await (const chunk of stream) {
          if (isCancelled) break
          setText((prev) => prev + chunk)
          // Optional: add delay for visual effect
          if (options.chunkDelay) {
            await new Promise((resolve) => setTimeout(resolve, options.chunkDelay))
          }
        }
        setIsStreaming(false)
        options.onComplete?.()
      } catch (error) {
        console.error('Streaming error:', error)
        setIsStreaming(false)
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [stream, options])

  return { text, isStreaming }
}

/**
 * Virtual scrolling for large lists (e.g., source citations)
 */
export function useVirtualScroll<T>(
  items: T[],
  options: {
    itemHeight: number
    containerHeight: number
    overscan?: number
  }
) {
  const [scrollTop, setScrollTop] = useState(0)
  const { itemHeight, containerHeight, overscan = 3 } = options

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight)

  const start = Math.max(0, visibleStart - overscan)
  const end = Math.min(items.length, visibleEnd + overscan)

  const visibleItems = items.slice(start, end)

  const totalHeight = items.length * itemHeight
  const offsetY = start * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
  }
}

/**
 * Debounced AI suggestions
 */
export function useDebouncedAISuggestions(
  input: string,
  fetchSuggestions: (input: string) => Promise<any[]>,
  delay: number = 300
) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(input)
        setSuggestions(results)
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [input, delay, fetchSuggestions])

  return { suggestions, isLoading }
}

/**
 * Intersection Observer for lazy loading artifacts
 */
export function useLazyLoad(
  ref: React.RefObject<HTMLElement>,
  onVisible: () => void
) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible()
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [ref, onVisible])
}

/**
 * Web Worker for heavy AI processing (e.g., syntax highlighting, parsing)
 */
export class AIWorkerPool {
  private workers: Worker[] = []
  private queue: Array<{ task: any; resolve: any; reject: any }> = []
  private activeWorkers = 0

  constructor(workerScript: string, poolSize: number = 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript)
      this.workers.push(worker)
    }
  }

  async execute<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject })
      this.processQueue()
    })
  }

  private processQueue() {
    if (this.queue.length === 0 || this.activeWorkers >= this.workers.length) {
      return
    }

    const worker = this.workers[this.activeWorkers]
    const { task, resolve, reject } = this.queue.shift()!

    this.activeWorkers++

    worker.onmessage = (e) => {
      resolve(e.data)
      this.activeWorkers--
      this.processQueue()
    }

    worker.onerror = (error) => {
      reject(error)
      this.activeWorkers--
      this.processQueue()
    }

    worker.postMessage(task)
  }

  terminate() {
    this.workers.forEach((worker) => worker.terminate())
  }
}
```

---

## Integration Example

Here's how to combine these components in a research chat interface:

```tsx
// /web/app/research-chat/page.tsx
'use client'

import { useState } from 'react'
import { ArtifactRenderer } from '@/components/ai/ArtifactRenderer'
import { AIThinkingIndicator } from '@/components/ai/AIThinkingIndicator'
import { StreamingResponse } from '@/components/ai/StreamingResponse'
import { SourceList } from '@/components/ai/SourceList'
import { RegenerateControls } from '@/components/ai/RegenerateControls'
import { VoiceInput } from '@/components/ai/VoiceInput'
import { MultimodalUpload } from '@/components/ai/MultimodalUpload'
import { AICommandPalette } from '@/components/ai/AICommandPalette'
import { PageWrapper } from '@/components/ui/PageWrapper'

export default function ResearchChatPage() {
  const [stage, setStage] = useState<'analyzing' | 'searching' | 'reasoning' | 'generating'>('analyzing')
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  return (
    <PageWrapper title="AI Research Assistant">
      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Main Chat Area */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* AI Status */}
          <AIThinkingIndicator stage={stage} progress={65} />

          {/* Streaming Response */}
          <StreamingResponse
            text="Based on the research papers I found..."
            isComplete={false}
            className="p-6 rounded-xl bg-surface-elevated"
          />

          {/* Input Controls */}
          <div className="flex items-center gap-3">
            <VoiceInput
              onTranscript={(text) => console.log('Transcript:', text)}
              onFinalize={(text) => console.log('Finalized:', text)}
            />
            <MultimodalUpload
              onFilesUpload={(files) => console.log('Files:', files)}
              maxFiles={3}
            />
          </div>

          {/* Regenerate Controls */}
          <RegenerateControls
            onRegenerate={() => console.log('Regenerate')}
            onBranch={() => console.log('Branch')}
            onFeedback={(type) => console.log('Feedback:', type)}
          />
        </div>

        {/* Sidebar: Sources + Artifacts */}
        <div className="flex flex-col gap-6">
          <SourceList
            sources={[
              {
                id: '1',
                title: 'Research Paper on AI Learning',
                url: 'https://example.com',
                domain: 'example.com',
                excerpt: 'This paper explores...',
                confidence: 0.92,
                citedAt: [10, 45, 120],
              },
            ]}
            onSourceClick={(source) => console.log('Source clicked:', source)}
          />

          <ArtifactRenderer
            artifact={{
              id: '1',
              type: 'react',
              title: 'Data Visualization',
              code: 'function Chart() { return <div>Chart</div> }',
              createdAt: new Date(),
            }}
          />
        </div>
      </div>

      {/* Command Palette */}
      <AICommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </PageWrapper>
  )
}
```

---

## Sources & References

### Claude Artifacts
- [Implementing Claude's Artifacts Feature](https://blog.logrocket.com/implementing-claudes-artifacts-feature-ui-visualization/)
- [Claude Artifact Runner](https://github.com/claudio-silva/claude-artifact-runner)
- [Reverse Engineering Claude Artifacts](https://www.reidbarber.com/blog/reverse-engineering-claude-artifacts)

### ChatGPT Streaming & Citations
- [How ChatGPT Shows Sources: Streaming Citations](https://funnelstory.ai/blog/engineering/ever-wondered-how-chatgpt-shows-you-its-sources-lets-dive-into-streaming)
- [AI Platform Citation Patterns](https://www.tryprofound.com/blog/ai-platform-citation-patterns)
- [Build AI Agent UI with Streaming, Memory, and Citations](https://www.kommunicate.io/blog/build-ai-agent-ui/)

### Perplexity RAG Visualization
- [Perplexity AI 2026 Complete Guide](https://notiongraffiti.com/perplexity-ai-guide-2026/)
- [How to Use Perplexity AI for Research](https://www.datastudios.org/post/how-to-use-perplexity-ai-for-effective-research-with-real-time-sources-file-uploads-and-citation-t)

### GitHub Copilot Suggestions
- [Inline Suggestions from GitHub Copilot](https://code.visualstudio.com/docs/copilot/ai-powered-suggestions)
- [GitHub Copilot Code Suggestions](https://docs.github.com/en/copilot/concepts/completions/code-suggestions)

### Cursor AI & Multimodal
- [Cursor Changelog: What's Coming in 2026](https://blog.promptlayer.com/cursor-changelog-whats-coming-next-in-2026/)
- [Vibe Coding: Cursor + Voice](https://wisprflow.ai/vibe-coding/cursor)
- [Cursor AI Review 2026](https://www.nxcode.io/resources/news/cursor-review-2026)

---

## Summary

This guide provides production-ready React 19 + Next.js 16 components for building AI-native research/learning interfaces in 2026. All components:

✅ Use praDeep's Liquid Cloud design system tokens
✅ Include accessibility features (ARIA labels, keyboard navigation, reduced motion)
✅ Optimize performance (streaming, virtualization, debouncing)
✅ Follow real-world patterns from Claude, ChatGPT, Perplexity, Copilot, Cursor
✅ Support multimodal input (voice, file upload, text)
✅ Provide transparent AI feedback (thinking stages, citations, confidence)

Use these components as building blocks for praDeep's research and learning features.
