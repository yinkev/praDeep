'use client'

import * as React from 'react'
import { Cpu, Sparkles, Zap, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ModelBadge Component
 * Display model name with icon in pill-shaped badge
 * Part of the Agent Response Cards system
 */

export type ModelType = 'gpt-4' | 'gpt-3.5' | 'claude' | 'gemini' | 'custom' | string

export interface ModelBadgeProps {
  model: string
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Map model names to display names
const modelDisplayNames: Record<string, string> = {
  'gpt-4': 'GPT-4',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-sonnet': 'Claude 3 Sonnet',
  'claude-3-haiku': 'Claude 3 Haiku',
  'gemini-pro': 'Gemini Pro',
  'gemini-ultra': 'Gemini Ultra',
}

// Get model family for styling
const getModelFamily = (model: string): 'gpt' | 'claude' | 'gemini' | 'other' => {
  const normalized = model.toLowerCase()
  if (normalized.includes('gpt')) return 'gpt'
  if (normalized.includes('claude')) return 'claude'
  if (normalized.includes('gemini')) return 'gemini'
  return 'other'
}

// Model family styles
const modelFamilyStyles = {
  gpt: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/25',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  claude: {
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/25',
    text: 'text-violet-700 dark:text-violet-300',
    icon: 'text-violet-600 dark:text-violet-400',
  },
  gemini: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/25',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  other: {
    bg: 'bg-zinc-50 dark:bg-zinc-800/50',
    border: 'border-zinc-200 dark:border-zinc-700',
    text: 'text-zinc-700 dark:text-zinc-300',
    icon: 'text-zinc-600 dark:text-zinc-400',
  },
}

const sizeStyles = {
  sm: {
    container: 'px-2 py-0.5 gap-1 text-[10px]',
    icon: 'h-2.5 w-2.5',
  },
  md: {
    container: 'px-2.5 py-1 gap-1.5 text-xs',
    icon: 'h-3 w-3',
  },
  lg: {
    container: 'px-3 py-1.5 gap-2 text-sm',
    icon: 'h-3.5 w-3.5',
  },
}

// Get icon for model family
const getModelIcon = (family: string, className: string) => {
  switch (family) {
    case 'gpt':
      return <Sparkles className={className} />
    case 'claude':
      return <Brain className={className} />
    case 'gemini':
      return <Zap className={className} />
    default:
      return <Cpu className={className} />
  }
}

export const ModelBadge = React.forwardRef<HTMLDivElement, ModelBadgeProps>(
  ({ model, className, showIcon = true, size = 'md' }, ref) => {
    const displayName = modelDisplayNames[model] || model
    const family = getModelFamily(model)
    const styles = modelFamilyStyles[family]
    const sizing = sizeStyles[size]

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          'transition-colors duration-150',
          styles.bg,
          styles.border,
          styles.text,
          sizing.container,
          className
        )}
        role="status"
        aria-label={`Model: ${displayName}`}
      >
        {showIcon && (
          <span className={cn('shrink-0', styles.icon)}>{getModelIcon(family, sizing.icon)}</span>
        )}
        <span className="leading-none">{displayName}</span>
      </div>
    )
  }
)

ModelBadge.displayName = 'ModelBadge'

export default ModelBadge
