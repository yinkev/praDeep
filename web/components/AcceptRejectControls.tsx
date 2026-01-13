'use client'

import { motion, Variants } from 'framer-motion'
import { Check, X, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const fluidEasing = [0.2, 0.8, 0.2, 1] as const

const buttonVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.9,
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: fluidEasing,
      delay,
    },
  }),
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.12,
      ease: fluidEasing,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.08,
      ease: fluidEasing,
    },
  },
}

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: fluidEasing,
      staggerChildren: 0.04,
    },
  },
}

const glowVariants: Variants = {
  idle: {
    opacity: 0.4,
    scale: 1,
  },
  active: {
    opacity: 0.8,
    scale: 1.1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

interface AcceptRejectControlsProps {
  onAccept?: () => void
  onReject?: () => void
  onRevert?: () => void
  showPreview?: boolean
  isPreviewEnabled?: boolean
  onTogglePreview?: () => void
  disabled?: boolean
  layout?: 'horizontal' | 'vertical' | 'compact'
  className?: string
}

export function AcceptRejectControls({
  onAccept,
  onReject,
  onRevert,
  showPreview = false,
  isPreviewEnabled = false,
  onTogglePreview,
  disabled = false,
  layout = 'horizontal',
  className = '',
}: AcceptRejectControlsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)

  const layoutClasses = {
    horizontal: 'flex-row items-center gap-2',
    vertical: 'flex-col items-stretch gap-2',
    compact: 'flex-row items-center gap-1',
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`flex ${layoutClasses[layout]} ${className}`}
    >
      {/* Accept Button */}
      {onAccept && (
        <motion.button
          custom={0}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          disabled={disabled}
          onHoverStart={() => setHoveredButton('accept')}
          onHoverEnd={() => setHoveredButton(null)}
          onClick={onAccept}
          className="
            relative
            px-4 py-2.5
            rounded-lg
            bg-gradient-to-br from-emerald-500 to-green-600
            dark:from-emerald-600 dark:to-green-700
            text-white
            font-semibold text-sm
            shadow-lg shadow-emerald-500/30
            disabled:opacity-50 disabled:cursor-not-allowed
            overflow-hidden
            transition-shadow duration-200
            hover:shadow-xl hover:shadow-emerald-500/40
          "
        >
          {/* Glow effect */}
          <motion.div
            variants={glowVariants}
            initial="idle"
            animate={hoveredButton === 'accept' ? 'active' : 'idle'}
            className="absolute inset-0 bg-white/20 blur-xl -z-10"
            aria-hidden="true"
          />

          <span className="relative z-10 flex items-center gap-2">
            <Check className="w-4 h-4" strokeWidth={2.5} />
            {layout !== 'compact' && 'Accept'}
          </span>
        </motion.button>
      )}

      {/* Reject Button */}
      {onReject && (
        <motion.button
          custom={0.04}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          disabled={disabled}
          onHoverStart={() => setHoveredButton('reject')}
          onHoverEnd={() => setHoveredButton(null)}
          onClick={onReject}
          className="
            relative
            px-4 py-2.5
            rounded-lg
            bg-gradient-to-br from-red-500 to-rose-600
            dark:from-red-600 dark:to-rose-700
            text-white
            font-semibold text-sm
            shadow-lg shadow-red-500/30
            disabled:opacity-50 disabled:cursor-not-allowed
            overflow-hidden
            transition-shadow duration-200
            hover:shadow-xl hover:shadow-red-500/40
          "
        >
          {/* Glow effect */}
          <motion.div
            variants={glowVariants}
            initial="idle"
            animate={hoveredButton === 'reject' ? 'active' : 'idle'}
            className="absolute inset-0 bg-white/20 blur-xl -z-10"
            aria-hidden="true"
          />

          <span className="relative z-10 flex items-center gap-2">
            <X className="w-4 h-4" strokeWidth={2.5} />
            {layout !== 'compact' && 'Reject'}
          </span>
        </motion.button>
      )}

      {/* Revert Button (optional) */}
      {onRevert && (
        <motion.button
          custom={0.08}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          disabled={disabled}
          onHoverStart={() => setHoveredButton('revert')}
          onHoverEnd={() => setHoveredButton(null)}
          onClick={onRevert}
          className="
            relative
            px-3 py-2.5
            rounded-lg
            bg-gradient-to-br from-slate-200 to-slate-300
            dark:from-slate-700 dark:to-slate-800
            text-slate-700 dark:text-slate-200
            font-medium text-sm
            shadow-md shadow-slate-300/30 dark:shadow-slate-900/30
            disabled:opacity-50 disabled:cursor-not-allowed
            overflow-hidden
            transition-shadow duration-200
            hover:shadow-lg hover:shadow-slate-300/40 dark:hover:shadow-slate-900/40
          "
        >
          {/* Glow effect */}
          <motion.div
            variants={glowVariants}
            initial="idle"
            animate={hoveredButton === 'revert' ? 'active' : 'idle'}
            className="absolute inset-0 bg-white/10 dark:bg-white/5 blur-xl -z-10"
            aria-hidden="true"
          />

          <span className="relative z-10 flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
            {layout !== 'compact' && 'Revert'}
          </span>
        </motion.button>
      )}

      {/* Preview Toggle (optional) */}
      {showPreview && onTogglePreview && (
        <motion.button
          custom={0.12}
          variants={buttonVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
          disabled={disabled}
          onHoverStart={() => setHoveredButton('preview')}
          onHoverEnd={() => setHoveredButton(null)}
          onClick={onTogglePreview}
          className={`
            relative
            px-3 py-2.5
            rounded-lg
            ${
              isPreviewEnabled
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-200 shadow-md shadow-slate-300/30 dark:shadow-slate-900/30'
            }
            font-medium text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            overflow-hidden
            transition-all duration-200
          `}
        >
          {/* Glow effect */}
          <motion.div
            variants={glowVariants}
            initial="idle"
            animate={hoveredButton === 'preview' ? 'active' : 'idle'}
            className={`absolute inset-0 ${
              isPreviewEnabled ? 'bg-white/20' : 'bg-white/10 dark:bg-white/5'
            } blur-xl -z-10`}
            aria-hidden="true"
          />

          <span className="relative z-10 flex items-center gap-2">
            {isPreviewEnabled ? (
              <Eye className="w-3.5 h-3.5" strokeWidth={2} />
            ) : (
              <EyeOff className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            {layout !== 'compact' && 'Preview'}
          </span>
        </motion.button>
      )}
    </motion.div>
  )
}

// Compact variant for inline use
interface InlineAcceptRejectProps {
  onAccept?: () => void
  onReject?: () => void
  disabled?: boolean
  className?: string
}

export function InlineAcceptReject({
  onAccept,
  onReject,
  disabled = false,
  className = '',
}: InlineAcceptRejectProps) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {onAccept && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={disabled}
          onClick={onAccept}
          className="
            w-7 h-7
            rounded-full
            bg-gradient-to-br from-emerald-500 to-green-600
            text-white
            shadow-md shadow-emerald-500/30
            disabled:opacity-50
            flex items-center justify-center
            transition-shadow duration-150
            hover:shadow-lg hover:shadow-emerald-500/40
          "
          aria-label="Accept"
        >
          <Check className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      )}

      {onReject && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={disabled}
          onClick={onReject}
          className="
            w-7 h-7
            rounded-full
            bg-gradient-to-br from-red-500 to-rose-600
            text-white
            shadow-md shadow-red-500/30
            disabled:opacity-50
            flex items-center justify-center
            transition-shadow duration-150
            hover:shadow-lg hover:shadow-red-500/40
          "
          aria-label="Reject"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      )}
    </div>
  )
}
