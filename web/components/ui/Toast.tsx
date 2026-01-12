'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
  title?: string
  icon?: ReactNode
}

export interface ToastOptions {
  message: string
  variant?: ToastVariant
  duration?: number
  title?: string
  icon?: ReactNode
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (options: ToastOptions) => string
  removeToast: (id: string) => void
  success: (message: string, title?: string) => string
  error: (message: string, title?: string) => string
  warning: (message: string, title?: string) => string
  info: (message: string, title?: string) => string
}

const DEFAULT_TOAST_DURATION_MS = 5000

type VariantStyle = {
  accentBorder: string
  iconWrap: string
  progressBar: string
  icon: ReactNode
}

// Premium Variant Styles - Liquid Cloud Design System
const variantStyles = {
  success: {
    accentBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
    iconWrap: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    progressBar:
      'bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-400 dark:to-emerald-300',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  error: {
    accentBorder: 'border-l-red-500 dark:border-l-red-400',
    iconWrap: 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-300',
    progressBar: 'bg-gradient-to-r from-red-500 to-red-400 dark:from-red-400 dark:to-red-300',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  warning: {
    accentBorder: 'border-l-amber-500 dark:border-l-amber-400',
    iconWrap: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    progressBar:
      'bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-400 dark:to-amber-300',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  info: {
    accentBorder: 'border-l-blue-500 dark:border-l-blue-400',
    iconWrap: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
    progressBar: 'bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-400 dark:to-blue-300',
    icon: <Info className="h-5 w-5" />,
  },
} satisfies Record<ToastVariant, VariantStyle>

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Generate unique ID
const generateId = () => {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `toast-${uuid}`
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// Individual Toast Component
interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
  index: number
}

function ToastItem({ toast, onRemove, index }: ToastItemProps) {
  const {
    id,
    message,
    variant,
    duration: durationProp = DEFAULT_TOAST_DURATION_MS,
    title,
    icon,
  } = toast
  const duration = Number.isFinite(durationProp) ? Math.max(0, durationProp) : 0
  const styles = variantStyles[variant]
  const reduceMotion = useReducedMotion()
  const contentAnimationClass = variant === 'error' ? 'motion-safe:animate-shake' : undefined
  const iconAnimationClass = variant === 'success' ? 'motion-safe:animate-pop' : undefined

  const [isPaused, setIsPaused] = useState(false)
  const [remainingMs, setRemainingMs] = useState(duration)

  const progress = useMotionValue(duration > 0 ? 1 : 0)
  const deadlineRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const stopTimers = useCallback(() => {
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    timeoutRef.current = null
    rafRef.current = null
  }, [])

  useEffect(() => {
    if (duration <= 0) return
    if (isPaused) return

    const now = performance.now()
    const deadline = now + remainingMs
    deadlineRef.current = deadline

    timeoutRef.current = window.setTimeout(() => onRemove(id), remainingMs)

    const tick = () => {
      const t = performance.now()
      const remaining = Math.max(deadline - t, 0)
      progress.set(remaining / duration)
      if (remaining <= 0) return
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      stopTimers()
    }
  }, [duration, id, isPaused, onRemove, progress, remainingMs, stopTimers])

  const handleMouseEnter = () => {
    if (duration <= 0) return
    stopTimers()
    if (!deadlineRef.current) deadlineRef.current = performance.now() + remainingMs
    setIsPaused(true)
    const remaining = Math.max(deadlineRef.current - performance.now(), 0)
    setRemainingMs(remaining)
    progress.set(remaining / duration)
  }

  const handleMouseLeave = () => {
    if (duration <= 0) return
    setIsPaused(false)
  }

  const handleDismiss = () => {
    onRemove(id)
  }

  return (
    <motion.div
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 400, scale: 0.95 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 100, scale: 0.92 }}
      transition={
        reduceMotion
          ? { duration: 0.12 }
          : {
              type: 'spring',
              stiffness: 400,
              damping: 30,
              mass: 0.8,
              delay: index * 0.04,
            }
      }
      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.015 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="status"
      aria-atomic="true"
      className={cn(
        'relative w-[360px] max-w-[calc(100vw-2.5rem)] overflow-hidden',
        'ui-frame rounded-lg bg-white dark:bg-zinc-950/80',
        'shadow-lg transition-shadow duration-200 ease-out',
        'border border-border/80 dark:border-white/10 border-l-4',
        styles.accentBorder,
        // Subtle glow on hover
        isPaused && 'shadow-xl ring-1 ring-black/5 dark:ring-white/5'
      )}
    >
      <div className={contentAnimationClass}>
        {/* Content */}
        <div className="flex gap-3 p-4 pr-12">
          <div
            className={cn(
              'mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border/60 dark:border-white/10',
              iconAnimationClass,
              styles.iconWrap,
              'transition-transform duration-200',
              isPaused && 'scale-105'
            )}
          >
            {icon ?? styles.icon}
          </div>

          <div className="min-w-0 flex-1">
            {title && (
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
            )}
            <p
              className={cn(
                'text-sm text-zinc-600 dark:text-zinc-300 break-words',
                title && 'mt-0.5'
              )}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <motion.button
          onClick={handleDismiss}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={cn(
            'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md',
            'border border-border/70 bg-white text-zinc-500',
            'hover:bg-zinc-50 hover:text-zinc-800',
            'dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-300',
            'dark:hover:bg-zinc-950/70 dark:hover:text-zinc-100',
            'transition-colors duration-150 ease-out',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 dark:focus-visible:ring-white/15'
          )}
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </motion.button>

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/5 dark:bg-white/5 overflow-hidden">
            <motion.div
              className={cn('h-full origin-left', styles.progressBar)}
              style={{ scaleX: progress }}
              transition={{ ease: 'linear' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[100] sm:bottom-6 sm:right-6',
        'flex flex-col items-end gap-2.5',
        'pointer-events-none'
      )}
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} index={index} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Provider Component
interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((options: ToastOptions): string => {
    const id = generateId()
    const newToast: Toast = {
      id,
      message: options.message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? DEFAULT_TOAST_DURATION_MS,
      title: options.title,
      icon: options.icon,
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const success = useCallback(
    (message: string, title?: string) => addToast({ message, variant: 'success', title }),
    [addToast]
  )

  const error = useCallback(
    (message: string, title?: string) => addToast({ message, variant: 'error', title }),
    [addToast]
  )

  const warning = useCallback(
    (message: string, title?: string) => addToast({ message, variant: 'warning', title }),
    [addToast]
  )

  const info = useCallback(
    (message: string, title?: string) => addToast({ message, variant: 'info', title }),
    [addToast]
  )

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// useToast Hook
export function useToast(): ToastContextType {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}

// Default export for convenience
export default ToastProvider
