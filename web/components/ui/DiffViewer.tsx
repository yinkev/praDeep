'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

// Fluid easing for 2026 liquid glass aesthetic
const fluidEasing = [0.2, 0.8, 0.2, 1] as const

// Animation variants for diff elements
const diffVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.18,
      ease: fluidEasing,
    },
  },
}

const deletionVariants: Variants = {
  hidden: {
    opacity: 0,
    scaleX: 0.95,
    filter: 'blur(2px)',
  },
  visible: {
    opacity: 0.5,
    scaleX: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.15,
      ease: fluidEasing,
    },
  },
}

const additionVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -6,
    backgroundColor: 'rgba(219, 234, 254, 0)',
  },
  visible: {
    opacity: 1,
    x: 0,
    backgroundColor: 'rgba(219, 234, 254, 0.4)',
    transition: {
      duration: 0.2,
      ease: fluidEasing,
    },
  },
}

interface DeletionProps {
  children: ReactNode
  lineNumber?: number
}

export function Deletion({ children, lineNumber }: DeletionProps) {
  return (
    <motion.span
      variants={deletionVariants}
      initial="hidden"
      animate="visible"
      className="relative inline-block"
    >
      {lineNumber !== undefined && (
        <span className="absolute -left-12 top-0 text-xs text-red-400/60 font-mono tabular-nums select-none">
          {lineNumber}
        </span>
      )}
      <span className="relative inline-block text-red-600/70 dark:text-red-400/70">
        <span className="relative z-10 line-through decoration-red-500/40 decoration-1">
          {children}
        </span>
        {/* Subtle glow effect for liquid glass aesthetic */}
        <span className="absolute inset-0 blur-[8px] bg-red-500/5 -z-10" aria-hidden="true" />
      </span>
    </motion.span>
  )
}

interface AdditionProps {
  children: ReactNode
  lineNumber?: number
}

export function Addition({ children, lineNumber }: AdditionProps) {
  return (
    <motion.span
      variants={additionVariants}
      initial="hidden"
      animate="visible"
      className="relative inline-block"
    >
      {lineNumber !== undefined && (
        <span className="absolute -left-12 top-0 text-xs text-blue-500/60 font-mono tabular-nums select-none">
          {lineNumber}
        </span>
      )}
      <span className="relative inline-block px-1 -mx-1 rounded-sm">
        <span className="relative z-10 text-blue-700 dark:text-blue-300 font-medium">
          {children}
        </span>
        {/* Liquid glass backdrop */}
        <span
          className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-blue-50/40 dark:from-blue-500/20 dark:to-blue-600/10 rounded-sm backdrop-blur-[2px] -z-10"
          aria-hidden="true"
        />
        {/* Subtle glow */}
        <span className="absolute inset-0 blur-[6px] bg-blue-400/10 -z-20" aria-hidden="true" />
      </span>
    </motion.span>
  )
}

interface DiffViewerProps {
  children: ReactNode
  mode?: 'inline' | 'split'
  showLineNumbers?: boolean
  className?: string
}

export function DiffViewer({
  children,
  mode = 'inline',
  showLineNumbers = false,
  className = '',
}: DiffViewerProps) {
  const baseClasses = `
    relative
    rounded-xl
    border border-slate-200/50 dark:border-slate-700/50
    bg-gradient-to-br from-slate-50/80 to-white/60 dark:from-slate-900/80 dark:to-slate-800/60
    backdrop-blur-sm
    shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50
    p-6
    ${showLineNumbers ? 'pl-16' : ''}
    font-mono text-sm leading-relaxed
    transition-all duration-200
    hover:shadow-md hover:shadow-slate-200/70 dark:hover:shadow-slate-900/70
  `
    .trim()
    .replace(/\s+/g, ' ')

  if (mode === 'split') {
    return (
      <motion.div
        variants={diffVariants}
        initial="hidden"
        animate="visible"
        className={`${baseClasses} ${className}`}
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 pr-3 border-r border-slate-200 dark:border-slate-700">
            <div className="text-xs uppercase tracking-wider text-red-500/70 font-sans font-semibold mb-3">
              Before
            </div>
            {children}
          </div>
          <div className="space-y-2 pl-3">
            <div className="text-xs uppercase tracking-wider text-blue-500/70 font-sans font-semibold mb-3">
              After
            </div>
            {children}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={diffVariants}
      initial="hidden"
      animate="visible"
      className={`${baseClasses} ${className}`}
    >
      <div className="space-y-1.5">{children}</div>
    </motion.div>
  )
}

// Specialized component for code diffs
interface CodeDiffProps {
  before: string[]
  after: string[]
  showLineNumbers?: boolean
  language?: string
}

export function CodeDiff({ before, after, showLineNumbers = true, language }: CodeDiffProps) {
  const maxLines = Math.max(before.length, after.length)

  return (
    <DiffViewer mode="split" showLineNumbers={showLineNumbers}>
      <div className="space-y-1">
        {before.map((line, idx) => (
          <div key={`before-${idx}`} className="relative">
            {showLineNumbers && (
              <span className="absolute -left-12 text-xs text-slate-400 font-mono tabular-nums select-none">
                {idx + 1}
              </span>
            )}
            <Deletion>{line}</Deletion>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {after.map((line, idx) => (
          <div key={`after-${idx}`} className="relative">
            {showLineNumbers && (
              <span className="absolute -left-12 text-xs text-slate-400 font-mono tabular-nums select-none">
                {idx + 1}
              </span>
            )}
            <Addition>{line}</Addition>
          </div>
        ))}
      </div>
    </DiffViewer>
  )
}
