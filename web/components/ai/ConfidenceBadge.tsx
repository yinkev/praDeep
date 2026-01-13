'use client'

import { motion, type Variants } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'uncertain'

export interface ConfidenceBadgeProps {
  /** Confidence score (0-1) or level string */
  confidence: number | ConfidenceLevel
  /** Show numeric percentage */
  showPercentage?: boolean
  /** Show icon indicator */
  showIcon?: boolean
  /** Compact size variant */
  compact?: boolean
  /** Custom class name */
  className?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

function getConfidenceLevel(confidence: number | ConfidenceLevel): ConfidenceLevel {
  if (typeof confidence === 'string') {
    return confidence
  }
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  if (confidence >= 0.4) return 'low'
  return 'uncertain'
}

function getConfidenceValue(confidence: number | ConfidenceLevel): number {
  if (typeof confidence === 'number') {
    return confidence
  }
  // Convert level to approximate numeric value
  switch (confidence) {
    case 'high':
      return 0.9
    case 'medium':
      return 0.7
    case 'low':
      return 0.5
    default:
      return 0.3
  }
}

// ============================================================================
// Styles Configuration
// ============================================================================

const levelStyles: Record<
  ConfidenceLevel,
  {
    bg: string
    text: string
    border: string
    icon: typeof TrendingUp
    label: string
  }
> = {
  high: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: TrendingUp,
    label: 'High confidence',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Minus,
    label: 'Medium confidence',
  },
  low: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    icon: TrendingDown,
    label: 'Low confidence',
  },
  uncertain: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
    icon: AlertCircle,
    label: 'Uncertain',
  },
}

// ============================================================================
// Animation Variants
// ============================================================================

const badgeVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
}

const pulseVariants: Variants = {
  initial: {
    opacity: 0.6,
  },
  pulse: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================================================
// Component
// ============================================================================

export default function ConfidenceBadge({
  confidence,
  showPercentage = true,
  showIcon = true,
  compact = false,
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence)
  const value = getConfidenceValue(confidence)
  const styles = levelStyles[level]
  const Icon = styles.icon

  const percentage = Math.round(value * 100)

  return (
    <motion.div
      variants={badgeVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        'transition-all duration-200',
        styles.bg,
        styles.text,
        styles.border,
        compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        'font-medium',
        'shadow-sm hover:shadow-md',
        className
      )}
      title={`${styles.label}${showPercentage ? ` (${percentage}%)` : ''}`}
    >
      {showIcon && (
        <motion.span
          variants={pulseVariants}
          initial="initial"
          animate="pulse"
          className="flex-shrink-0"
        >
          <Icon className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        </motion.span>
      )}

      <span className="font-semibold">
        {showPercentage ? `${percentage}%` : styles.label.split(' ')[0]}
      </span>

      {/* Confidence Bar (optional visual indicator) */}
      {!compact && (
        <div className="flex-shrink-0 w-12 h-1.5 bg-white/30 dark:bg-black/20 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              styles.text.replace(/\bdark:text-/g, 'dark:bg-').replace(/\btext-/g, 'bg-')
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// Compound Component - Confidence Meter
// ============================================================================

export interface ConfidenceMeterProps {
  confidence: number
  label?: string
  className?: string
}

export function ConfidenceMeter({ confidence, label, className }: ConfidenceMeterProps) {
  const level = getConfidenceLevel(confidence)
  const styles = levelStyles[level]
  const percentage = Math.round(confidence * 100)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{label}</span>
          <span className={cn('font-semibold', styles.text)}>{percentage}%</span>
        </div>
      )}
      <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            styles.text.replace(/\bdark:text-/g, 'dark:bg-').replace(/\btext-/g, 'bg-')
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}
