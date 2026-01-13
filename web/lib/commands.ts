import { MessageSquare, FileText, Lightbulb, Search, Sparkles, type LucideIcon } from 'lucide-react'
import { apiUrl } from './api'

export interface CommandContext {
  text?: string
  selection?: string
}

export interface Command {
  id: string
  label: string
  description: string
  icon: LucideIcon
  shortcut?: string
  handler: (context: CommandContext) => void
}

/**
 * Navigate to question page with query
 */
function handleAsk(context: CommandContext): void {
  const query = context.text || context.selection || ''
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    window.location.href = `/question${query ? `?${params.toString()}` : ''}`
  }
}

/**
 * Summarize text via API
 */
async function handleSummarize(context: CommandContext): Promise<void> {
  const text = context.selection || context.text
  if (!text) {
    console.warn('No text provided for summarization')
    return
  }

  try {
    const response = await fetch(apiUrl('/api/v1/summarize'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`Summarize API failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Summary:', data)
    // TODO: Show summary in UI (modal, toast, or inline)
  } catch (error) {
    console.error('Failed to summarize:', error)
  }
}

/**
 * Explain concept via API
 */
async function handleExplain(context: CommandContext): Promise<void> {
  const text = context.selection || context.text
  if (!text) {
    console.warn('No text provided for explanation')
    return
  }

  try {
    const response = await fetch(apiUrl('/api/v1/explain'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`Explain API failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Explanation:', data)
    // TODO: Show explanation in UI
  } catch (error) {
    console.error('Failed to explain:', error)
  }
}

/**
 * Research topic with sources
 */
function handleResearch(context: CommandContext): void {
  const query = context.text || context.selection || ''
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    window.location.href = `/research${query ? `?${params.toString()}` : ''}`
  }
}

/**
 * Improve writing via API
 */
async function handleImprove(context: CommandContext): Promise<void> {
  const text = context.selection || context.text
  if (!text) {
    console.warn('No text provided for improvement')
    return
  }

  try {
    const response = await fetch(apiUrl('/api/v1/improve'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`Improve API failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Improved text:', data)
    // TODO: Show improved text in UI
  } catch (error) {
    console.error('Failed to improve:', error)
  }
}

/**
 * All available commands
 */
export const COMMANDS: Command[] = [
  {
    id: 'ask',
    label: 'Ask AI',
    description: 'Ask a question to the AI',
    icon: MessageSquare,
    shortcut: '⌘A',
    handler: handleAsk,
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Summarize selected text',
    icon: FileText,
    shortcut: '⌘S',
    handler: handleSummarize,
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Explain concept in detail',
    icon: Lightbulb,
    shortcut: '⌘E',
    handler: handleExplain,
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Research a topic with sources',
    icon: Search,
    shortcut: '⌘R',
    handler: handleResearch,
  },
  {
    id: 'improve',
    label: 'Improve',
    description: 'Improve writing and clarity',
    icon: Sparkles,
    shortcut: '⌘I',
    handler: handleImprove,
  },
]

/**
 * Get command by ID
 */
export function getCommandById(id: string): Command | undefined {
  return COMMANDS.find(cmd => cmd.id === id)
}

/**
 * Execute a command by ID with context
 */
export function executeCommand(commandId: string, context: CommandContext): void {
  const command = getCommandById(commandId)
  if (command) {
    command.handler(context)
  } else {
    console.warn(`Command not found: ${commandId}`)
  }
}
