import { 
  MessageSquare, 
  FileText, 
  Lightbulb, 
  Search, 
  Sparkles, 
  History, 
  BarChart2, 
  Workflow, 
  Brain, 
  Database, 
  Book, 
  HelpCircle, 
  Settings, 
  FileSearch, 
  type LucideIcon 
} from 'lucide-react'
import { apiUrl } from './api'
import { type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export interface CommandContext {
  text?: string
  selection?: string
  router?: AppRouterInstance
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
 * Handle navigation to specific routes
 */
function handleNavigate(path: string, context: CommandContext): void {
  if (context.router) {
    const query = context.text || context.selection || ''
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    context.router.push(`${path}${query ? `?${params.toString()}` : ''}`)
  } else if (typeof window !== 'undefined') {
    const query = context.text || context.selection || ''
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    window.location.href = `${path}${query ? `?${params.toString()}` : ''}`
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
    handler: (ctx) => handleNavigate('/question', ctx),
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Research a topic with sources',
    icon: Search,
    shortcut: '⌘R',
    handler: (ctx) => handleNavigate('/research', ctx),
  },
  {
    id: 'history',
    label: 'History',
    description: 'View your activity history',
    icon: History,
    handler: (ctx) => handleNavigate('/history', ctx),
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'View insights and performance',
    icon: BarChart2,
    handler: (ctx) => handleNavigate('/analytics', ctx),
  },
  {
    id: 'workflow',
    label: 'Workflow',
    description: 'Manage automation workflows',
    icon: Workflow,
    handler: (ctx) => handleNavigate('/workflow', ctx),
  },
  {
    id: 'memory',
    label: 'Memory',
    description: 'Manage persistent memory',
    icon: Brain,
    handler: (ctx) => handleNavigate('/memory', ctx),
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    description: 'Browse knowledge bases',
    icon: Database,
    handler: (ctx) => handleNavigate('/knowledge', ctx),
  },
  {
    id: 'notebooks',
    label: 'Notebooks',
    description: 'Access your notebooks',
    icon: Book,
    handler: (ctx) => handleNavigate('/notebooks', ctx),
  },
  {
    id: 'paper',
    label: 'Papers',
    description: 'Find recommended papers',
    icon: FileSearch,
    handler: (ctx) => handleNavigate('/paper', ctx),
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Summarize selected text',
    icon: FileText,
    shortcut: '⌘S',
    handler: async (context) => {
      const text = context.selection || context.text
      if (!text) return
      try {
        const response = await fetch(apiUrl('/api/v1/summarize'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (response.ok) {
          const data = await response.json()
          console.log('Summary:', data)
        }
      } catch (error) {
        console.error('Failed to summarize:', error)
      }
    },
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Manage application settings',
    icon: Settings,
    handler: (ctx) => handleNavigate('/settings', ctx),
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
