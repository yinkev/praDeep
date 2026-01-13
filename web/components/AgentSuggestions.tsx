'use client'

/**
 * AgentSuggestions Component
 * Context-aware agent suggestions dropdown with Liquid Glass aesthetic
 * Features:
 * - Real-time agent suggestions based on user input
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Framer Motion animations
 * - Confidence score indicators
 * - Liquid Glass visual design
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  HelpCircle,
  FileText,
  Search,
  PenTool,
  BookOpen,
  Lightbulb,
  MessageCircle,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAgentContext } from '@/hooks/useAgentContext'
import { getAgentColorClasses, type AgentSuggestion } from '@/lib/agentMatcher'

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  HelpCircle,
  FileText,
  Search,
  PenTool,
  BookOpen,
  Lightbulb,
  MessageCircle,
  User,
}

// ============================================================================
// Animation Variants
// ============================================================================

const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.2, 0.8, 0.2, 1],
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
}

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: [0.2, 0.8, 0.2, 1],
    },
  },
}

// ============================================================================
// Component Props
// ============================================================================

export interface AgentSuggestionsProps {
  /** User input text to analyze */
  input: string
  /** Show/hide suggestions dropdown */
  show: boolean
  /** Callback when an agent is selected */
  onSelect: (agentType: string) => void
  /** Callback when suggestions should be hidden */
  onClose: () => void
  /** Additional CSS classes */
  className?: string
  /** Position relative to input (default: 'bottom') */
  position?: 'top' | 'bottom'
  /** Enable keyboard navigation (default: true) */
  enableKeyboard?: boolean
}

// ============================================================================
// Main Component
// ============================================================================

export default function AgentSuggestions({
  input,
  show,
  onSelect,
  onClose,
  className,
  position = 'bottom',
  enableKeyboard = true,
}: AgentSuggestionsProps) {
  const { suggestions, loading } = useAgentContext(input, {
    debounceMs: 300,
    minLength: 3,
    enabled: show,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!show || !enableKeyboard || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % suggestions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case 'Enter':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex].agent_type)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [show, enableKeyboard, suggestions, selectedIndex, onSelect, onClose]
  )

  useEffect(() => {
    if (enableKeyboard) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enableKeyboard, handleKeyDown])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (show) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [show, onClose])

  const shouldShow = show && (loading || suggestions.length > 0)

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          ref={containerRef}
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'absolute left-0 right-0 z-50 overflow-hidden',
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            className
          )}
        >
          {/* Liquid Glass Container */}
          <div
            className={cn(
              'rounded-xl border border-gray-200/60 bg-white/95 shadow-lg',
              'backdrop-blur-xl backdrop-saturate-150',
              'ring-1 ring-black/5'
            )}
          >
            {/* Loading State */}
            {loading && suggestions.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-4 py-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-5 w-5 text-gray-400" />
                </motion.div>
                <span className="text-sm text-gray-500">Finding relevant agents...</span>
              </div>
            )}

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <motion.div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <SuggestionItem
                    key={suggestion.agent_type}
                    suggestion={suggestion}
                    isSelected={index === selectedIndex}
                    onClick={() => onSelect(suggestion.agent_type)}
                    onHover={() => setSelectedIndex(index)}
                  />
                ))}
              </motion.div>
            )}

            {/* Footer hint */}
            {suggestions.length > 0 && enableKeyboard && (
              <div className="border-t border-gray-200/60 bg-gray-50/50 px-4 py-2">
                <p className="text-xs text-gray-500">
                  <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-600 shadow-sm">
                    ↑↓
                  </kbd>{' '}
                  navigate{' '}
                  <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-600 shadow-sm">
                    Enter
                  </kbd>{' '}
                  select{' '}
                  <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-600 shadow-sm">
                    Esc
                  </kbd>{' '}
                  close
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Suggestion Item Component
// ============================================================================

interface SuggestionItemProps {
  suggestion: AgentSuggestion
  isSelected: boolean
  onClick: () => void
  onHover: () => void
}

function SuggestionItem({ suggestion, isSelected, onClick, onHover }: SuggestionItemProps) {
  const IconComponent = ICON_MAP[suggestion.icon] || HelpCircle
  const colors = getAgentColorClasses(suggestion.color)
  const confidencePercent = Math.round(suggestion.confidence * 100)

  return (
    <motion.button
      variants={itemVariants}
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        'group relative mx-2 flex w-[calc(100%-1rem)] items-start gap-3 rounded-lg px-3 py-2.5',
        'text-left transition-colors duration-150',
        isSelected ? 'bg-gray-100/80 ring-1 ring-gray-200/60' : 'hover:bg-gray-50/60',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/40'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          'border transition-colors',
          colors.bg,
          colors.border,
          isSelected && colors.hover
        )}
      >
        <IconComponent className={cn('h-4 w-4', colors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900">{suggestion.label}</h4>
          {/* Confidence Badge */}
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              confidencePercent >= 70
                ? 'bg-green-100/80 text-green-700'
                : confidencePercent >= 40
                  ? 'bg-amber-100/80 text-amber-700'
                  : 'bg-gray-100/80 text-gray-600'
            )}
          >
            {confidencePercent}%
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{suggestion.description}</p>
      </div>

      {/* Arrow Icon */}
      <div className={cn('mt-2 opacity-0 transition-opacity', isSelected && 'opacity-100')}>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </motion.button>
  )
}
