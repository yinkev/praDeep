'use client'

import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ChevronDown, ChevronUp, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ReasoningStep {
  step: string
  timestamp?: number
  confidence?: number
}

export interface ReasoningStepsProps {
  steps: ReasoningStep[]
  /** Default collapsed state */
  defaultExpanded?: boolean
  /** Custom class name */
  className?: string
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.2 },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.25, delay: 0.1 },
    },
  },
}

const stepVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

// ============================================================================
// Component
// ============================================================================

export default function ReasoningSteps({
  steps,
  defaultExpanded = false,
  className,
}: ReasoningStepsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border',
        'bg-surface-elevated dark:bg-slate-800/50',
        'shadow-sm',
        className
      )}
    >
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3',
          'text-left transition-colors duration-200',
          'hover:bg-surface-secondary dark:hover:bg-slate-700/50',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2',
          isExpanded && 'bg-surface-secondary/50 dark:bg-slate-700/30'
        )}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'transition-colors duration-200',
              isExpanded
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            )}
            whileHover={{ rotate: isExpanded ? 0 : 15 }}
          >
            <Brain className="w-4 h-4" />
          </motion.div>
          <div>
            <h4
              className={cn(
                'text-sm font-semibold transition-colors duration-200',
                isExpanded
                  ? 'text-indigo-900 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-300'
              )}
            >
              Show my work
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {steps.length} reasoning {steps.length === 1 ? 'step' : 'steps'}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'transition-colors duration-200',
            isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
          )}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={containerVariants}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2">
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                      'flex gap-3 p-3 rounded-lg',
                      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
                      'hover:border-indigo-300 dark:hover:border-indigo-700',
                      'hover:shadow-sm',
                      'transition-all duration-200'
                    )}
                    whileHover={{ x: 4 }}
                  >
                    {/* Step Indicator */}
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center',
                          'text-xs font-semibold',
                          'bg-indigo-100 dark:bg-indigo-900/40',
                          'text-indigo-700 dark:text-indigo-300'
                        )}
                      >
                        {i + 1}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {step.step}
                      </p>

                      {/* Metadata */}
                      {(step.timestamp || step.confidence !== undefined) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {step.timestamp && (
                            <span>
                              {new Date(step.timestamp).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          )}
                          {step.confidence !== undefined && (
                            <span className="flex items-center gap-1">
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  step.confidence >= 0.8
                                    ? 'bg-emerald-500'
                                    : step.confidence >= 0.6
                                      ? 'bg-amber-500'
                                      : 'bg-slate-400'
                                )}
                              />
                              {Math.round(step.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
