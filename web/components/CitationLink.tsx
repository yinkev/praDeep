'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * CitationLink Component
 * Inline citation with superscript styling and hover tooltip
 * Part of the Agent Response Cards system
 */

export interface Citation {
  id: string | number
  title?: string
  url?: string
  source?: string
  snippet?: string
}

export interface CitationLinkProps {
  citation: Citation
  index: number
  className?: string
  onClick?: (citation: Citation) => void
}

const tooltipVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.15,
      ease: [0.2, 0.8, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: [0.2, 0.8, 0.2, 1] as const,
    },
  },
}

export const CitationLink = React.forwardRef<HTMLSpanElement, CitationLinkProps>(
  ({ citation, index, className, onClick }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const [tooltipPosition, setTooltipPosition] = React.useState<'top' | 'bottom'>('top')
    const linkRef = React.useRef<HTMLButtonElement>(null)

    React.useEffect(() => {
      if (!linkRef.current || !isHovered) return

      const rect = linkRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom

      // Position tooltip below if not enough space above
      setTooltipPosition(spaceAbove < 200 && spaceBelow > 100 ? 'bottom' : 'top')
    }, [isHovered])

    const handleClick = () => {
      if (onClick) {
        onClick(citation)
      } else if (citation.url) {
        window.open(citation.url, '_blank', 'noopener,noreferrer')
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    return (
      <span ref={ref} className={cn('relative inline-block', className)}>
        <button
          ref={linkRef}
          type="button"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          className={cn(
            'relative inline-flex items-center align-super text-[0.7em] leading-none',
            'px-1 py-0.5 rounded',
            'text-accent-primary font-medium',
            'hover:text-accent-secondary',
            'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:ring-offset-1',
            'transition-colors duration-150',
            'cursor-pointer select-none',
            'dark:text-blue-400 dark:hover:text-blue-300'
          )}
          aria-label={`Citation ${index}: ${citation.title || citation.source || 'Source'}`}
        >
          [{index}]
        </button>

        <AnimatePresence>
          {isHovered && (citation.title || citation.snippet || citation.source) && (
            <motion.div
              variants={tooltipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'absolute z-50 w-64 pointer-events-none',
                tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
                'left-1/2 -translate-x-1/2'
              )}
            >
              <div
                className={cn(
                  'rounded-xl border border-border',
                  'bg-white/95 dark:bg-zinc-900/95',
                  'backdrop-blur-xl',
                  'shadow-lg',
                  'p-3',
                  'text-left'
                )}
              >
                {citation.title && (
                  <div className="flex items-start gap-2 mb-1.5">
                    {citation.url && (
                      <ExternalLink className="h-3 w-3 text-text-tertiary mt-0.5 shrink-0 dark:text-zinc-400" />
                    )}
                    <p className="text-xs font-semibold text-text-primary leading-snug dark:text-zinc-100">
                      {citation.title}
                    </p>
                  </div>
                )}

                {citation.snippet && (
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 dark:text-zinc-300">
                    {citation.snippet}
                  </p>
                )}

                {citation.source && !citation.title && (
                  <p className="text-xs text-text-tertiary dark:text-zinc-400">{citation.source}</p>
                )}

                {/* Tooltip arrow */}
                <div
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 w-2 h-2',
                    'bg-white/95 dark:bg-zinc-900/95 border-border',
                    tooltipPosition === 'top'
                      ? 'bottom-[-4px] border-b border-r'
                      : 'top-[-4px] border-t border-l',
                    'rotate-45'
                  )}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    )
  }
)

CitationLink.displayName = 'CitationLink'

export default CitationLink
