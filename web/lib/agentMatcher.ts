/**
 * Agent Matcher Utility
 * Provides client-side agent matching and suggestion logic
 */

import { apiUrl } from './api'

export interface AgentSuggestion {
  agent_type: string
  label: string
  description: string
  confidence: number
  icon: string
  color: string
}

export interface AgentSuggestionsResponse {
  suggestions: AgentSuggestion[]
  query: string
}

export interface AgentCapability {
  agent_type: string
  icon: string
  color: string
  label_key: string
  description: string
  use_cases: string[]
  keywords: string[]
  examples: string[]
}

/**
 * Fetch agent suggestions based on user input
 * @param input User input text
 * @returns Promise<AgentSuggestionsResponse>
 */
export async function fetchAgentSuggestions(input: string): Promise<AgentSuggestionsResponse> {
  if (!input || input.trim().length === 0) {
    return { suggestions: [], query: input }
  }

  try {
    const response = await fetch(apiUrl('/api/agents/suggest'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: input.trim() }),
    })

    if (!response.ok) {
      console.error('Agent suggestion API error:', response.statusText)
      return { suggestions: [], query: input }
    }

    const data: AgentSuggestionsResponse = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch agent suggestions:', error)
    return { suggestions: [], query: input }
  }
}

/**
 * Fetch all agent capabilities
 * @returns Promise<AgentCapability[]>
 */
export async function fetchAgentCapabilities(): Promise<AgentCapability[]> {
  try {
    const response = await fetch(apiUrl('/api/agents/capabilities'))

    if (!response.ok) {
      console.error('Agent capabilities API error:', response.statusText)
      return []
    }

    const data: AgentCapability[] = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch agent capabilities:', error)
    return []
  }
}

/**
 * Get Tailwind color classes for agent colors
 */
export function getAgentColorClasses(color: string): {
  bg: string
  text: string
  border: string
  hover: string
} {
  const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    blue: {
      bg: 'bg-blue-50/80',
      text: 'text-blue-600',
      border: 'border-blue-200/60',
      hover: 'hover:bg-blue-100/80',
    },
    purple: {
      bg: 'bg-purple-50/80',
      text: 'text-purple-600',
      border: 'border-purple-200/60',
      hover: 'hover:bg-purple-100/80',
    },
    emerald: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-600',
      border: 'border-emerald-200/60',
      hover: 'hover:bg-emerald-100/80',
    },
    amber: {
      bg: 'bg-amber-50/80',
      text: 'text-amber-600',
      border: 'border-amber-200/60',
      hover: 'hover:bg-amber-100/80',
    },
    indigo: {
      bg: 'bg-indigo-50/80',
      text: 'text-indigo-600',
      border: 'border-indigo-200/60',
      hover: 'hover:bg-indigo-100/80',
    },
    yellow: {
      bg: 'bg-yellow-50/80',
      text: 'text-yellow-600',
      border: 'border-yellow-200/60',
      hover: 'hover:bg-yellow-100/80',
    },
    gray: {
      bg: 'bg-gray-50/80',
      text: 'text-gray-600',
      border: 'border-gray-200/60',
      hover: 'hover:bg-gray-100/80',
    },
    pink: {
      bg: 'bg-pink-50/80',
      text: 'text-pink-600',
      border: 'border-pink-200/60',
      hover: 'hover:bg-pink-100/80',
    },
  }

  return (
    colorMap[color] || {
      bg: 'bg-gray-50/80',
      text: 'text-gray-600',
      border: 'border-gray-200/60',
      hover: 'hover:bg-gray-100/80',
    }
  )
}

/**
 * Get Lucide icon component by name
 * Maps icon names from backend to Lucide icon imports
 */
export function getIconName(iconName: string): string {
  // Return the icon name as-is since we'll import dynamically in components
  return iconName
}
