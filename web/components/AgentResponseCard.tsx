'use client'

import * as React from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import ModelBadge from '@/components/ModelBadge'
import ResponseActions from '@/components/ResponseActions'
import CitationLink, { Citation } from '@/components/CitationLink'

/**
 * AgentResponseCard Component
 * Beautiful card for displaying agent responses with sources and actions
 * Features Liquid Glass styling, citations, and regeneration controls
 */

export interface AgentResponseCardProps {
  response: string
  model: string
  citations?: Citation[]
  onRegenerate?: () => void
  onCopy?: () => void
  onCitationClick?: (citation: Citation) => void
  isRegenerating?: boolean
  className?: string
  variant?: 'default' | 'glass' | 'elevated'
  showModelBadge?: boolean
  showActions?: boolean
  timestamp?: Date | string
}

// Animation variants
const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.2, 0.8, 0.2, 1] as const,
    },
  },
}

const contentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.1,
      duration: 0.2,
    },
  },
}

const actionsVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2,
      duration: 0.2,
    },
  },
}

/**
 * Parse response text and inject citation links
 */
const parseResponseWithCitations = (
  response: string,
  citations: Citation[] = [],
  onCitationClick?: (citation: Citation) => void
): React.ReactNode => {
  if (!citations || citations.length === 0) {
    return response
  }

  // Pattern to match citation markers like [1], [2], etc.
  const citationPattern = /\[(\d+)\]/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = citationPattern.exec(response)) !== null) {
    const index = parseInt(match[1], 10)
    const citation = citations[index - 1]

    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(response.substring(lastIndex, match.index))
    }

    // Add citation link
    if (citation) {
      parts.push(
        <CitationLink
          key={`citation-${index}-${match.index}`}
          citation={citation}
          index={index}
          onClick={onCitationClick}
        />
      )
    } else {
      // If citation doesn't exist, keep the original text
      parts.push(match[0])
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < response.length) {
    parts.push(response.substring(lastIndex))
  }

  return parts.length > 0 ? parts : response
}

export const AgentResponseCard = React.forwardRef<HTMLDivElement, AgentResponseCardProps>(
  (
    {
      response,
      model,
      citations,
      onRegenerate,
      onCopy,
      onCitationClick,
      isRegenerating = false,
      className,
      variant = 'glass',
      showModelBadge = true,
      showActions = true,
      timestamp,
    },
    ref
  ) => {
    const parsedContent = parseResponseWithCitations(response, citations, onCitationClick)

    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className={cn('w-full', className)}
      >
        <Card
          variant={variant}
          padding="none"
          interactive={false}
          className={cn(
            'overflow-hidden',
            variant === 'glass' &&
              'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-border/50 dark:border-white/10'
          )}
        >
          {/* Header with Model Badge */}
          {showModelBadge && (
            <motion.div
              variants={contentVariants}
              className="flex items-center justify-between px-6 py-4 border-b border-border/50 dark:border-white/10"
            >
              <ModelBadge model={model} size="md" />

              {timestamp && (
                <span className="text-xs text-text-tertiary dark:text-zinc-400">
                  {typeof timestamp === 'string'
                    ? timestamp
                    : timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                </span>
              )}
            </motion.div>
          )}

          {/* Response Content */}
          <motion.div
            variants={contentVariants}
            className={cn('px-6 py-5', 'text-text-primary dark:text-zinc-100', 'leading-relaxed')}
          >
            <div className="prose prose-zinc prose-sm max-w-none dark:prose-invert">
              {parsedContent}
            </div>
          </motion.div>

          {/* Citations Summary */}
          {citations && citations.length > 0 && (
            <motion.div
              variants={contentVariants}
              className="px-6 py-3 border-t border-border/50 dark:border-white/10 bg-surface-elevated/30 dark:bg-zinc-950/30"
            >
              <div className="flex items-center gap-2 text-xs text-text-tertiary dark:text-zinc-400">
                <span className="font-medium">
                  {citations.length} {citations.length === 1 ? 'source' : 'sources'}
                </span>
                <span className="text-border dark:text-zinc-700">•</span>
                <span>Click citation numbers to view details</span>
              </div>
            </motion.div>
          )}

          {/* Actions Footer */}
          {showActions && (
            <motion.div
              variants={actionsVariants}
              className="px-6 py-4 border-t border-border/50 dark:border-white/10 bg-surface-elevated/20 dark:bg-zinc-950/20"
            >
              <ResponseActions
                responseText={response}
                onRegenerate={onRegenerate}
                onCopy={onCopy}
                isRegenerating={isRegenerating}
                layout="horizontal"
              />
            </motion.div>
          )}
        </Card>
      </motion.div>
    )
  }
)

AgentResponseCard.displayName = 'AgentResponseCard'

export default AgentResponseCard
