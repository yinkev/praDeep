/**
 * useAgentContext Hook
 * Manages agent suggestion state and debounced API calls
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  fetchAgentSuggestions,
  type AgentSuggestion,
  type AgentSuggestionsResponse,
} from '@/lib/agentMatcher'

export interface UseAgentContextOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number
  /** Minimum input length to trigger suggestions (default: 3) */
  minLength?: number
  /** Enable/disable suggestions (default: true) */
  enabled?: boolean
}

export interface UseAgentContextReturn {
  /** Current agent suggestions */
  suggestions: AgentSuggestion[]
  /** Loading state */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Trigger suggestion fetch manually */
  fetchSuggestions: (input: string) => Promise<void>
  /** Clear current suggestions */
  clearSuggestions: () => void
}

/**
 * Hook for managing agent context and suggestions
 * Provides debounced agent suggestions based on user input
 */
export function useAgentContext(
  input: string,
  options: UseAgentContextOptions = {}
): UseAgentContextReturn {
  const { debounceMs = 300, minLength = 3, enabled = true } = options

  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSuggestions = useCallback(
    async (searchInput: string) => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Clear previous suggestions if input is too short
      if (!searchInput || searchInput.trim().length < minLength) {
        setSuggestions([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Create new abort controller for this request
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const response: AgentSuggestionsResponse = await fetchAgentSuggestions(searchInput)

        // Only update if this request wasn't aborted
        if (!controller.signal.aborted) {
          setSuggestions(response.suggestions)
          setLoading(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const error = err instanceof Error ? err : new Error('Failed to fetch suggestions')
          setError(error)
          setSuggestions([])
          setLoading(false)
        }
      }
    },
    [minLength]
  )

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setLoading(false)
    setError(null)

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  // Debounced effect for input changes
  useEffect(() => {
    if (!enabled) {
      return
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(input)
    }, debounceMs)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [input, enabled, debounceMs, fetchSuggestions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
    clearSuggestions,
  }
}
