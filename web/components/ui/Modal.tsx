'use client'

import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

type ModalSize = 'sm' | 'md' | 'lg' | 'full'

interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title displayed in header */
  title?: string
  /** Modal content */
  children: React.ReactNode
  /** Modal width preset */
  size?: ModalSize
  /** Show/hide the close button */
  showCloseButton?: boolean
  /** Additional className for the modal panel */
  className?: string
}

interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

// ============================================================================
// Design System - Cloud Dancer Palette with Teal Accents
// ============================================================================

const colors = {
  // Cloud Dancer - soft whites and creams
  cloudDancer: {
    50: '#FAFBFC',
    100: '#F5F7F9',
    200: '#E8ECF0',
    300: '#D1D9E0',
  },
  // Teal accents
  teal: {
    400: '#2DD4BF',
    500: '#14B8A6',
    600: '#0D9488',
  },
  // Dark mode variants
  dark: {
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
}

// ============================================================================
// Size Configurations
// ============================================================================

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  full: 'max-w-[90vw] max-h-[90vh]',
}

// ============================================================================
// Animation Variants
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
}

const closeButtonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.1,
    backgroundColor: 'rgba(20, 184, 166, 0.15)', // teal-500 with opacity
  },
  tap: { scale: 0.95 },
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Modal Header - displays title and optional actions
 */
export function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div
      className={`
        px-6 py-4 border-b
        border-slate-200/50 dark:border-slate-700/50
        ${className}
      `}
    >
      {children}
    </div>
  )
}

/**
 * Modal Body - main content area with scroll support
 */
export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div
      className={`
        px-6 py-4 overflow-y-auto max-h-[60vh]
        ${className}
      `}
    >
      {children}
    </div>
  )
}

/**
 * Modal Footer - action buttons area
 */
export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={`
        px-6 py-4 border-t
        border-slate-200/50 dark:border-slate-700/50
        flex items-center justify-end gap-3
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Main Modal Component
// ============================================================================

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}: ModalProps) {
  // Handle escape key press
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Handle click outside modal
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  // Set up keyboard listener and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          />

          {/* Modal Panel - Glassmorphism */}
          <motion.div
            className={`
              relative w-full mx-4
              ${sizeStyles[size]}

              /* Glassmorphism effect */
              bg-white/80 dark:bg-slate-800/80
              backdrop-blur-xl backdrop-saturate-150

              /* Border with subtle glow */
              border border-white/40 dark:border-slate-700/40

              /* Shadow with teal accent glow */
              shadow-2xl shadow-slate-900/10 dark:shadow-teal-500/5

              /* Rounded corners */
              rounded-2xl

              /* Overflow handling */
              overflow-hidden

              ${className}
            `}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {/* Gradient overlay for extra depth */}
            <div
              className="
                absolute inset-0 pointer-events-none
                bg-gradient-to-br from-white/20 via-transparent to-teal-500/5
                dark:from-slate-700/20 dark:via-transparent dark:to-teal-500/10
              "
            />

            {/* Header with title and close button */}
            {(title || showCloseButton) && (
              <div
                className="
                  relative flex items-center justify-between
                  px-6 py-4 border-b
                  border-slate-200/50 dark:border-slate-700/50
                "
              >
                {title && (
                  <h3
                    id="modal-title"
                    className="
                      font-semibold text-lg
                      text-slate-800 dark:text-slate-100
                    "
                  >
                    {title}
                  </h3>
                )}

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="
                      ml-auto p-2 rounded-lg
                      text-slate-500 dark:text-slate-400
                      hover:text-teal-600 dark:hover:text-teal-400
                      focus:outline-none focus:ring-2 focus:ring-teal-500/50
                      transition-colors
                    "
                    variants={closeButtonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            )}

            {/* Content area */}
            <div className="relative">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Compound Component Exports
// ============================================================================

Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter
