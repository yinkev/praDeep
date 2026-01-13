'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { COMMANDS, type Command } from '@/lib/commands'

export interface UseSlashCommandOptions {
  onCommandSelect?: (commandId: string, context: CommandContext) => void
}

export interface CommandContext {
  text: string
  selection?: string
}

export interface UseSlashCommandReturn {
  showMenu: boolean
  query: string
  selectedIndex: number
  filteredCommands: Command[]
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  selectCommand: (commandId: string) => void
  closeMenu: () => void
  inputValue: string
  setInputValue: (value: string) => void
}

/**
 * useSlashCommand - Custom hook for slash command detection and management
 *
 * Detects when user types '/' and shows command menu with keyboard navigation
 */
export function useSlashCommand({
  onCommandSelect,
}: UseSlashCommandOptions = {}): UseSlashCommandReturn {
  const [inputValue, setInputValue] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  /**
   * Detect if text contains a slash command
   */
  const detectSlashCommand = useCallback((text: string): { isCommand: boolean; query: string } => {
    // Match '/' at start or after whitespace
    const match = text.match(/(?:^|\s)(\/[\w]*)$/)
    if (match) {
      return {
        isCommand: true,
        query: match[1].slice(1), // Remove leading '/'
      }
    }
    return { isCommand: false, query: '' }
  }, [])

  /**
   * Filter commands based on query
   */
  const filteredCommands = useCallback(() => {
    if (!query) return COMMANDS
    const lowerQuery = query.toLowerCase()
    return COMMANDS.filter(
      cmd =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description.toLowerCase().includes(lowerQuery) ||
        cmd.id.toLowerCase().includes(lowerQuery)
    )
  }, [query])()

  /**
   * Handle input change
   */
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)

      const { isCommand, query: commandQuery } = detectSlashCommand(newValue)

      if (isCommand) {
        setQuery(commandQuery)
        setShowMenu(true)
        setSelectedIndex(0)
      } else {
        setShowMenu(false)
        setQuery('')
      }
    },
    [detectSlashCommand]
  )

  /**
   * Close menu
   */
  const closeMenu = useCallback(() => {
    setShowMenu(false)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  /**
   * Select a command
   */
  const selectCommand = useCallback(
    (commandId: string) => {
      // Remove the slash command from input
      const withoutCommand = inputValue.replace(/(?:^|\s)(\/[\w]*)$/, ' ').trimStart()
      setInputValue(withoutCommand)
      setShowMenu(false)
      setQuery('')
      setSelectedIndex(0)

      // Create context
      const context: CommandContext = {
        text: withoutCommand,
        selection: undefined, // Can be enhanced later
      }

      // Execute command handler
      const command = COMMANDS.find(cmd => cmd.id === commandId)
      if (command?.handler) {
        command.handler(context)
      }

      // Call external handler if provided
      if (onCommandSelect) {
        onCommandSelect(commandId, context)
      }
    },
    [inputValue, onCommandSelect]
  )

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showMenu) return

      const commandCount = filteredCommands.length

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, commandCount - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selectedCommand = filteredCommands[selectedIndex]
        if (selectedCommand) {
          selectCommand(selectedCommand.id)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
      }
    },
    [closeMenu, filteredCommands, selectedIndex, selectCommand, showMenu]
  )

  return {
    showMenu,
    query,
    selectedIndex,
    filteredCommands,
    handleInput,
    handleKeyDown,
    selectCommand,
    closeMenu,
    inputValue,
    setInputValue,
  }
}

export default useSlashCommand
