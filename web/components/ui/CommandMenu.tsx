'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, FileText, Lightbulb, Search, Sparkles, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Command {
  id: string
  label: string
  description: string
  icon: LucideIcon
  shortcut?: string
}

export const COMMANDS: Command[] = [
  {
    id: 'ask',
    label: 'Ask AI',
    description: 'Ask a question to the AI',
    icon: MessageSquare,
    shortcut: '⌘A',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Summarize selected text',
    icon: FileText,
    shortcut: '⌘S',
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Explain concept in detail',
    icon: Lightbulb,
    shortcut: '⌘E',
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Research a topic with sources',
    icon: Search,
    shortcut: '⌘R',
  },
  {
    id: 'improve',
    label: 'Improve',
    description: 'Improve writing and clarity',
    icon: Sparkles,
    shortcut: '⌘I',
  },
]

export interface CommandMenuProps {
  isOpen: boolean
  query: string
  selectedIndex: number
  onSelect: (commandId: string) => void
  onClose: () => void
  position?: { top: number; left: number }
}

/**
 * CommandMenu - Notion-style slash command menu
 * Floating glass menu with keyboard navigation
 */
export function CommandMenu({
  isOpen,
  query,
  selectedIndex,
  onSelect,
  onClose,
  position = { top: 0, left: 0 },
}: CommandMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query) return COMMANDS
    const lowerQuery = query.toLowerCase()
    return COMMANDS.filter(
      cmd =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery) ||
        cmd.id.toLowerCase().includes(lowerQuery)
    )
  }, [query])

  // Handle clicks outside
  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Scroll selected item into view
  React.useEffect(() => {
    if (isOpen && menuRef.current) {
      const selectedElement = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, isOpen])

  if (filteredCommands.length === 0) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{
            duration: 0.15,
            ease: [0.16, 1, 0.3, 1], // out-expo
          }}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            zIndex: 'var(--z-popover)',
          }}
          className={cn(
            'min-w-[280px] max-w-[320px]',
            'rounded-xl border border-border',
            'bg-white/80 dark:bg-zinc-900/80',
            'backdrop-blur-xl',
            'shadow-lg dark:shadow-zinc-950/60',
            'overflow-hidden',
            // Subtle border glow
            'ring-1 ring-zinc-200/50 dark:ring-zinc-700/50'
          )}
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredCommands.map((command, index) => {
              const Icon = command.icon
              const isSelected = index === selectedIndex

              return (
                <motion.button
                  key={command.id}
                  data-index={index}
                  onClick={() => onSelect(command.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'text-left transition-all duration-150',
                    'group relative',
                    isSelected
                      ? ['bg-blue-500 text-white', 'shadow-sm shadow-blue-500/20']
                      : [
                          'text-text-primary hover:bg-surface-muted/80',
                          'dark:text-zinc-100 dark:hover:bg-zinc-800/60',
                        ]
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      'transition-colors duration-150',
                      isSelected ? 'bg-white/20' : 'bg-surface-muted dark:bg-zinc-800'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors duration-150',
                        isSelected ? 'text-white' : 'text-text-secondary dark:text-zinc-400'
                      )}
                    />
                  </div>

                  {/* Label & Description */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-white' : 'text-text-primary dark:text-zinc-100'
                      )}
                    >
                      {command.label}
                    </div>
                    <div
                      className={cn(
                        'text-xs truncate',
                        isSelected ? 'text-white/80' : 'text-text-secondary dark:text-zinc-400'
                      )}
                    >
                      {command.description}
                    </div>
                  </div>

                  {/* Shortcut (optional) */}
                  {command.shortcut && (
                    <div
                      className={cn(
                        'text-xs font-mono px-1.5 py-0.5 rounded',
                        'transition-colors duration-150',
                        isSelected
                          ? 'bg-white/20 text-white/90'
                          : 'bg-surface-muted/60 text-text-tertiary dark:bg-zinc-800 dark:text-zinc-500'
                      )}
                    >
                      {command.shortcut}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Footer hint */}
          <div className="border-t border-border dark:border-zinc-800 bg-surface-muted/50 dark:bg-zinc-900/50 px-3 py-2">
            <div className="flex items-center justify-between text-xs text-text-tertiary dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated dark:bg-zinc-800 font-mono">
                  ↑↓
                </kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated dark:bg-zinc-800 font-mono">
                  ↵
                </kbd>
                <span>select</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-elevated dark:bg-zinc-800 font-mono">
                  esc
                </kbd>
                <span>close</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CommandMenu
