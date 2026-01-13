'use client'

import * as React from 'react'
import { motion, Variants } from 'framer-motion'
import { Copy, RefreshCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ResponseActions Component
 * Copy and regenerate buttons for agent responses
 * Part of the Agent Response Cards system
 */

export interface ResponseActionsProps {
  responseText: string
  onRegenerate?: () => void
  onCopy?: () => void
  isRegenerating?: boolean
  className?: string
  layout?: 'horizontal' | 'vertical'
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
}

const checkVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
}

export const ResponseActions = React.forwardRef<HTMLDivElement, ResponseActionsProps>(
  (
    {
      responseText,
      onRegenerate,
      onCopy,
      isRegenerating = false,
      className,
      layout = 'horizontal',
    },
    ref
  ) => {
    const [isCopied, setIsCopied] = React.useState(false)
    const [copyError, setCopyError] = React.useState<string | null>(null)
    const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    const handleCopy = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(responseText)
          setIsCopied(true)
          setCopyError(null)

          if (onCopy) {
            onCopy()
          }

          // Reset after 2 seconds
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          timeoutRef.current = setTimeout(() => {
            setIsCopied(false)
          }, 2000)
        } else {
          throw new Error('Clipboard API not available')
        }
      } catch (error) {
        console.error('Failed to copy:', error)
        setCopyError('Failed to copy')

        // Fallback: Try to select and copy
        try {
          const textArea = document.createElement('textarea')
          textArea.value = responseText
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)

          setIsCopied(true)
          setCopyError(null)

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          timeoutRef.current = setTimeout(() => {
            setIsCopied(false)
          }, 2000)
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError)
        }
      }
    }

    const handleRegenerate = () => {
      if (onRegenerate && !isRegenerating) {
        onRegenerate()
      }
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', layout === 'vertical' && 'flex-col', className)}
        role="toolbar"
        aria-label="Response actions"
      >
        {/* Copy Button */}
        <motion.button
          type="button"
          onClick={handleCopy}
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          disabled={isCopied}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3 py-2',
            'border border-border',
            'bg-surface-elevated/60 backdrop-blur-md',
            'text-sm font-medium text-text-secondary',
            'transition-colors duration-150',
            'hover:bg-surface-elevated/80 hover:text-text-primary hover:border-border-strong',
            'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'dark:bg-white/5 dark:border-white/10 dark:text-zinc-300',
            'dark:hover:bg-white/10 dark:hover:text-zinc-100 dark:hover:border-white/20',
            layout === 'vertical' && 'w-full justify-center'
          )}
          aria-label={isCopied ? 'Copied to clipboard' : 'Copy response'}
        >
          {isCopied ? (
            <>
              <motion.span variants={checkVariants} initial="hidden" animate="visible">
                <Check className="h-4 w-4 text-semantic-success dark:text-green-400" />
              </motion.span>
              <span className="text-semantic-success dark:text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </motion.button>

        {/* Regenerate Button */}
        {onRegenerate && (
          <motion.button
            type="button"
            onClick={handleRegenerate}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            disabled={isRegenerating}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3 py-2',
              'border border-border',
              'bg-surface-elevated/60 backdrop-blur-md',
              'text-sm font-medium text-text-secondary',
              'transition-colors duration-150',
              'hover:bg-surface-elevated/80 hover:text-text-primary hover:border-border-strong',
              'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:bg-white/5 dark:border-white/10 dark:text-zinc-300',
              'dark:hover:bg-white/10 dark:hover:text-zinc-100 dark:hover:border-white/20',
              layout === 'vertical' && 'w-full justify-center'
            )}
            aria-label={isRegenerating ? 'Regenerating...' : 'Regenerate response'}
          >
            <RefreshCw
              className={cn('h-4 w-4', isRegenerating && 'animate-spin')}
              aria-hidden="true"
            />
            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </motion.button>
        )}

        {/* Copy Error Message */}
        {copyError && (
          <span className="text-xs text-semantic-error dark:text-red-400" role="alert">
            {copyError}
          </span>
        )}
      </div>
    )
  }
)

ResponseActions.displayName = 'ResponseActions'

export default ResponseActions
