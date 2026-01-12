'use client'

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type ModalSize = 'sm' | 'md' | 'lg' | 'full' | 'xl'

interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title displayed in header */
  title?: string
  /** Modal content */
  children: ReactNode
  /** Modal width preset */
  size?: ModalSize
  /** Show/hide the close button */
  showCloseButton?: boolean
  /** Additional className for the modal panel */
  className?: string
}

interface ModalHeaderProps {
  children: ReactNode
  className?: string
}

interface ModalBodyProps {
  children: ReactNode
  className?: string
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

// ============================================================================
// Size Configurations
// ============================================================================

const sizeStyles = {
  sm: 'w-full max-w-[420px]',
  md: 'w-full max-w-[560px]',
  lg: 'w-full max-w-[760px]',
  xl: 'w-full max-w-[920px]',
  full: 'w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
} satisfies Record<ModalSize, string>

// ============================================================================
// Animation Variants
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} satisfies Variants

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1] as const, // out-expo
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1] as const, // out-expo
    },
  },
} satisfies Variants

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Modal Header - 24px padding, border-bottom
 */
export function ModalHeader({ children, className }: ModalHeaderProps) {
  return <div className={cn('px-6 py-5 border-b border-border/50', className)}>{children}</div>
}

/**
 * Modal Content - scrollable flex area
 */
export function ModalContent({ children, className }: ModalBodyProps) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto px-6 py-5',
        'text-text-secondary dark:text-text-secondary',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Modal Footer - 16px/24px padding, bg-surface-secondary, bottom radius
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-border/50',
        'bg-surface-secondary/50',
        'flex items-center justify-end gap-3',
        className
      )}
    >
      {children}
    </div>
  )
}

export const ModalBody = ModalContent

// ============================================================================
// Main Modal Component
// ============================================================================

export type ModalComponent = ((props: ModalProps) => ReactElement) & {
  Header: typeof ModalHeader
  Content: typeof ModalContent
  Body: typeof ModalContent
  Footer: typeof ModalFooter
}

function ModalBase({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}: ModalProps): ReactElement {
  const titleId = useId()
  const reduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // Handle click outside modal
  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Set up keyboard listener and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const getFocusableElements = () => {
      if (!panelRef.current) return []
      const selector =
        'a[href],area[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),iframe,object,embed,[contenteditable],[tabindex]:not([tabindex="-1"])'
      const elements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(selector))
      return elements.filter(el => el.tabIndex !== -1 && !el.hasAttribute('disabled'))
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null
      const isInside = active ? panel.contains(active) : false

      if (e.shiftKey) {
        if (!isInside || active === first) {
          e.preventDefault()
          last.focus()
        }
        return
      }

      if (!isInside || active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown, true)

    const raf = requestAnimationFrame(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) focusable[0].focus()
      else panelRef.current?.focus()
    })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousBodyOverflow
      const prev = previouslyFocusedRef.current
      if (prev && document.contains(prev)) prev.focus()
    }
  }, [isOpen, onClose])

  const resolvedModalVariants: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.12 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : modalVariants

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          {/* Backdrop */}
          <motion.div
            className={cn('absolute inset-0 backdrop-blur-sm', 'bg-black/40 dark:bg-black/60')}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
            onClick={handleBackdropClick}
          />

          {/* Modal Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={cn('relative outline-none', sizeStyles[size], className)}
            variants={resolvedModalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
          >
            <div
              className={cn(
                'ui-frame relative w-full h-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden',
                'rounded-xl border border-border/60',
                'bg-surface-elevated text-text-primary',
                'shadow-2xl shadow-black/10 dark:shadow-black/30',
                'dark:text-text-primary'
              )}
            >
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'absolute right-4 top-4 z-10',
                    'inline-flex h-9 w-9 items-center justify-center',
                    'rounded-lg',
                    'text-text-secondary hover:text-text-primary',
                    'hover:bg-surface-secondary/80',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-primary/20 focus-visible:ring-offset-2',
                    'focus-visible:ring-offset-surface-elevated',
                    'active:scale-95',
                    'transition-all duration-150 ease-out'
                  )}
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {title && (
                <ModalHeader className="pr-14">
                  <h2
                    id={titleId}
                    className="text-[15px] font-semibold tracking-tight text-text-primary"
                  >
                    {title}
                  </h2>
                </ModalHeader>
              )}

              <div className="relative min-h-0 flex-1 flex flex-col">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Compound Component Exports
// ============================================================================

const Modal = Object.assign(ModalBase, {
  Header: ModalHeader,
  Content: ModalContent,
  Body: ModalContent,
  Footer: ModalFooter,
}) as ModalComponent

export default Modal
