'use client'

import * as React from 'react'
import { Input } from './Input'
import { CommandMenu } from './CommandMenu'
import { cn } from '@/lib/utils'

export interface CommandInputProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'onChange' | 'onSelect' | 'size'> {
  value: string
  onChange: (value: string) => void
  onCommandSelect?: (commandId: string, context: CommandContext) => void
  placeholder?: string
  className?: string
}

export interface CommandContext {
  text: string
  selection?: string
}

/**
 * CommandInput - Text input with slash command detection
 * Triggers CommandMenu when user types '/' at start or after space
 */
export function CommandInput({
  value,
  onChange,
  onCommandSelect,
  placeholder = 'Type / for commands...',
  className,
  ...props
}: CommandInputProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const [commandQuery, setCommandQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Detect slash command
  const detectSlashCommand = (text: string): { isCommand: boolean; query: string } => {
    // Check if text starts with '/' or has '/' after a space
    const match = text.match(/(?:^|\s)(\/[\w]*)$/)
    if (match) {
      return {
        isCommand: true,
        query: match[1].slice(1), // Remove leading '/'
      }
    }
    return { isCommand: false, query: '' }
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    const { isCommand, query } = detectSlashCommand(newValue)

    if (isCommand) {
      setCommandQuery(query)
      setShowMenu(true)
      setSelectedIndex(0)
      updateMenuPosition()
    } else {
      setShowMenu(false)
      setCommandQuery('')
    }
  }

  // Update menu position relative to input
  const updateMenuPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
  }

  // Handle command selection
  const handleCommandSelect = (commandId: string) => {
    // Remove the slash command from input
    const withoutCommand = value.replace(/(?:^|\s)(\/[\w]*)$/, ' ').trimStart()
    onChange(withoutCommand)
    setShowMenu(false)

    // Call the onCommandSelect callback with context
    if (onCommandSelect) {
      const context: CommandContext = {
        text: withoutCommand,
        selection: undefined, // Can be enhanced to detect text selection
      }
      onCommandSelect(commandId, context)
    }

    // Focus back on input
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMenu) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => {
        // Count filtered commands
        const commandCount = 5 // COMMANDS.length, but we'll import this properly
        return Math.min(prev + 1, commandCount - 1)
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && showMenu) {
      e.preventDefault()
      // Get the command at selectedIndex - for now we'll use a simple approach
      const commands = ['ask', 'summarize', 'explain', 'research', 'improve']
      const commandId = commands[selectedIndex]
      if (commandId) {
        handleCommandSelect(commandId)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowMenu(false)
      setCommandQuery('')
    }
  }

  // Update menu position on window resize
  React.useEffect(() => {
    if (showMenu) {
      const handleResize = () => updateMenuPosition()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [showMenu])

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('pr-10', className)}
        {...(props as React.ComponentPropsWithoutRef<typeof Input>)}
      />

      {/* Slash icon hint when empty */}
      {!value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-xs text-text-tertiary dark:text-zinc-500 font-mono">/</span>
        </div>
      )}

      {/* Command Menu */}
      <CommandMenu
        isOpen={showMenu}
        query={commandQuery}
        selectedIndex={selectedIndex}
        onSelect={handleCommandSelect}
        onClose={() => setShowMenu(false)}
        position={menuPosition}
      />
    </div>
  )
}

export default CommandInput
