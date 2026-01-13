'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode, useState } from 'react'
import { Sparkles } from 'lucide-react'

const fluidEasing = [0.2, 0.8, 0.2, 1] as const

const highlightVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(3px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: fluidEasing,
    },
  },
}

const glowVariants: Variants = {
  idle: {
    opacity: 0.3,
    scale: 1,
  },
  active: {
    opacity: 0.6,
    scale: 1.05,
    transition: {
      duration: 1.2,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  },
}

const badgeVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -4,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: fluidEasing,
      delay: 0.1,
    },
  },
}

interface AIContentHighlightProps {
  children: ReactNode
  variant?: 'default' | 'subtle' | 'prominent'
  showBadge?: boolean
  animated?: boolean
  className?: string
  onHoverChange?: (isHovering: boolean) => void
}

export function AIContentHighlight({
  children,
  variant = 'default',
  showBadge = true,
  animated = true,
  className = '',
  onHoverChange,
}: AIContentHighlightProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHoverChange?.(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHoverChange?.(false)
  }

  const variantStyles = {
    default: {
      bg: 'bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20',
      border: 'border border-blue-200/40 dark:border-blue-800/30',
      text: 'text-slate-900 dark:text-slate-100',
      glow: 'bg-blue-400/20',
    },
    subtle: {
      bg: 'bg-blue-50/30 dark:bg-blue-950/10',
      border: 'border-l-2 border-blue-400/50 dark:border-blue-600/40',
      text: 'text-slate-800 dark:text-slate-200',
      glow: 'bg-blue-400/10',
    },
    prominent: {
      bg: 'bg-gradient-to-br from-blue-100/80 to-indigo-100/60 dark:from-blue-900/40 dark:to-indigo-900/30',
      border: 'border-2 border-blue-300/60 dark:border-blue-700/50',
      text: 'text-slate-900 dark:text-slate-50',
      glow: 'bg-blue-400/30',
    },
  }

  const styles = variantStyles[variant]

  return (
    <motion.div
      variants={animated ? highlightVariants : undefined}
      initial={animated ? 'hidden' : undefined}
      animate={animated ? 'visible' : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative
        ${styles.bg}
        ${styles.border}
        ${styles.text}
        rounded-lg
        px-4 py-3
        ${variant === 'subtle' ? 'pl-4' : ''}
        backdrop-blur-[2px]
        transition-all duration-200
        hover:shadow-lg hover:shadow-blue-200/30 dark:hover:shadow-blue-900/20
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {/* Liquid glass glow effect */}
      <motion.div
        variants={glowVariants}
        initial="idle"
        animate={isHovered ? 'active' : 'idle'}
        className={`
          absolute inset-0
          ${styles.glow}
          blur-xl
          rounded-lg
          -z-10
          pointer-events-none
        `
          .trim()
          .replace(/\s+/g, ' ')}
        aria-hidden="true"
      />

      {/* AI Badge */}
      {showBadge && (
        <motion.div
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          className="absolute -top-2.5 -right-2.5 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full shadow-lg shadow-blue-500/30"
        >
          <Sparkles className="w-3 h-3 text-white" strokeWidth={2.5} />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI</span>
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

// Inline variant for highlighting within text
interface AIInlineHighlightProps {
  children: ReactNode
  className?: string
}

export function AIInlineHighlight({ children, className = '' }: AIInlineHighlightProps) {
  return (
    <motion.span
      initial={{ opacity: 0, backgroundColor: 'rgba(219, 234, 254, 0)' }}
      animate={{
        opacity: 1,
        backgroundColor: 'rgba(219, 234, 254, 0.5)',
        transition: { duration: 0.2, ease: fluidEasing },
      }}
      className={`
        relative
        inline-block
        px-1.5 py-0.5
        -mx-0.5
        rounded
        text-blue-900 dark:text-blue-100
        font-medium
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      <span className="relative z-10">{children}</span>
      {/* Subtle glow */}
      <span
        className="absolute inset-0 blur-[4px] bg-blue-400/15 -z-10 rounded"
        aria-hidden="true"
      />
    </motion.span>
  )
}

// Component for highlighting AI-modified sections with timestamp
interface AIModificationProps {
  children: ReactNode
  timestamp?: Date | string
  modelName?: string
  className?: string
}

export function AIModification({
  children,
  timestamp,
  modelName = 'AI',
  className = '',
}: AIModificationProps) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={`relative ${className}`}>
      <AIContentHighlight variant="default" showBadge={false}>
        {children}
      </AIContentHighlight>

      {/* Metadata footer */}
      {(formattedTime || modelName) && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.2, ease: fluidEasing }}
          className="mt-2 flex items-center gap-2 text-xs text-blue-600/70 dark:text-blue-400/70"
        >
          <Sparkles className="w-3 h-3" strokeWidth={2} />
          <span className="font-medium">{modelName}</span>
          {formattedTime && (
            <>
              <span className="text-slate-400">•</span>
              <span>{formattedTime}</span>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
