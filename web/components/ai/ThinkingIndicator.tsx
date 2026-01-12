'use client'

import { motion, type Variants } from 'framer-motion'
import { Brain, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ThinkingVariant = 'default' | 'compact' | 'minimal'

export interface ThinkingIndicatorProps {
  /** Display variant */
  variant?: ThinkingVariant
  /** Custom message to display */
  message?: string
  /** Show animated icon */
  showIcon?: boolean
  /** Custom class name */
  className?: string
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
}

const iconVariants: Variants = {
  initial: {
    rotate: 0,
    scale: 1,
  },
  animate: {
    rotate: [0, 10, -10, 10, 0],
    scale: [1, 1.1, 1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

const sparkleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
  },
  animate: (i: number) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      delay: i * 0.3,
      ease: 'easeInOut',
    },
  }),
}

const dotVariants: Variants = {
  initial: {
    opacity: 0.3,
  },
  animate: (i: number) => ({
    opacity: [0.3, 1, 0.3],
    y: [0, -4, 0],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      delay: i * 0.15,
      ease: 'easeInOut',
    },
  }),
}

const pulseVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 0.8,
  },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
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

export default function ThinkingIndicator({
  variant = 'default',
  message = 'Thinking',
  showIcon = true,
  className,
}: ThinkingIndicatorProps) {
  if (variant === 'minimal') {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn('inline-flex items-center gap-1', className)}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            custom={i}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400"
          />
        ))}
      </motion.div>
    )
  }

  if (variant === 'compact') {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-indigo-50 dark:bg-indigo-900/20',
          'border border-indigo-200 dark:border-indigo-800',
          'text-indigo-700 dark:text-indigo-300',
          'text-sm font-medium',
          className
        )}
      >
        {showIcon && (
          <motion.div variants={iconVariants} initial="initial" animate="animate">
            <Brain className="w-3.5 h-3.5" />
          </motion.div>
        )}
        <span>{message}</span>
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              custom={i}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              className="w-1 h-1 rounded-full bg-indigo-500 dark:bg-indigo-400"
            />
          ))}
        </div>
      </motion.div>
    )
  }

  // Default variant - full featured with premium animations
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'relative inline-flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-gradient-to-r from-indigo-50 to-purple-50',
        'dark:from-indigo-900/20 dark:to-purple-900/20',
        'border border-indigo-200 dark:border-indigo-800',
        'shadow-sm',
        className
      )}
    >
      {/* Animated Background Pulse */}
      <motion.div
        variants={pulseVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0 rounded-xl bg-indigo-100/50 dark:bg-indigo-900/10"
      />

      {/* Icon with Sparkles */}
      <div className="relative z-10">
        <motion.div
          variants={iconVariants}
          initial="initial"
          animate="animate"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            'bg-indigo-100 dark:bg-indigo-900/40',
            'text-indigo-600 dark:text-indigo-400'
          )}
        >
          <Brain className="w-4 h-4" />
        </motion.div>

        {/* Sparkles around icon */}
        {showIcon && (
          <>
            <motion.div
              custom={0}
              variants={sparkleVariants}
              initial="initial"
              animate="animate"
              className="absolute -top-1 -right-1 text-amber-500"
            >
              <Sparkles className="w-3 h-3" />
            </motion.div>
            <motion.div
              custom={1}
              variants={sparkleVariants}
              initial="initial"
              animate="animate"
              className="absolute -bottom-1 -left-1 text-purple-500"
            >
              <Zap className="w-3 h-3" />
            </motion.div>
          </>
        )}
      </div>

      {/* Text Content */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
          {message}
        </span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              custom={i}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Compound Component - Inline Thinking Dots
// ============================================================================

export function ThinkingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          custom={i}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          className="inline-block w-1 h-1 rounded-full bg-current"
        />
      ))}
    </span>
  )
}
