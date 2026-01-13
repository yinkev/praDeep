'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'

interface ProgressiveDisclosureProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
  level?: 1 | 2 // visual hierarchy level
}

const contentVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
      opacity: { duration: 0.12, ease: [0.2, 0.8, 0.2, 1] },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
      opacity: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 },
    },
  },
}

const chevronVariants: Variants = {
  collapsed: {
    rotate: 0,
    transition: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
  },
  expanded: {
    rotate: 90,
    transition: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] },
  },
}

export function ProgressiveDisclosure({
  title,
  children,
  defaultExpanded = false,
  level = 1,
}: ProgressiveDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const levelStyles = {
    1: {
      container: 'bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)]',
      header: 'text-[15px] tracking-wide',
      border: 'border-slate-200/60',
    },
    2: {
      container: 'bg-white/25 shadow-[0_4px_16px_rgba(0,0,0,0.04)]',
      header: 'text-[13px] tracking-wider',
      border: 'border-slate-200/40',
    },
  }

  const styles = levelStyles[level]

  return (
    <motion.div
      className={`
        relative rounded-2xl border ${styles.border}
        ${styles.container}
        backdrop-blur-xl
        overflow-hidden
        transition-all duration-200
      `}
      initial={false}
      whileHover={{
        boxShadow:
          level === 1
            ? '0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.5) inset'
            : '0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.3) inset',
        transition: { duration: 0.15 },
      }}
    >
      {/* Prismatic shimmer effect */}
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(147,197,253,0.1) 50%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative w-full px-5 py-4
          flex items-center justify-between
          group cursor-pointer
          transition-colors duration-150
          ${isExpanded ? 'bg-gradient-to-r from-blue-50/50 to-transparent' : ''}
        `}
        aria-expanded={isExpanded}
        aria-controls={`disclosure-${title.replace(/\s+/g, '-')}`}
      >
        <span
          className={`
            ${styles.header}
            font-['IBM_Plex_Mono',monospace]
            font-medium uppercase
            text-slate-700
            group-hover:text-slate-900
            transition-colors duration-150
          `}
        >
          {title}
        </span>

        <motion.div
          variants={chevronVariants}
          animate={isExpanded ? 'expanded' : 'collapsed'}
          className="text-slate-500 group-hover:text-slate-700 transition-colors duration-150"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`disclosure-${title.replace(/\s+/g, '-')}`}
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div
              className={`
                px-5 pb-5 pt-2
                font-['Cormorant_Garamond',serif]
                text-slate-600
              `}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom glass reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
        style={{ pointerEvents: 'none' }}
      />
    </motion.div>
  )
}
