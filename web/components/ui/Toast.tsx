'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

// Types
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
  title?: string
}

export interface ToastOptions {
  message: string
  variant?: ToastVariant
  duration?: number
  title?: string
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

// Variant styles with glassmorphism
const variantStyles: Record<
  ToastVariant,
  {
    bg: string
    border: string
    icon: React.ReactNode
    progress: string
  }
> = {
  success: {
    bg: 'bg-emerald-500/10 backdrop-blur-xl',
    border: 'border-emerald-500/30',
    icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-500/10 backdrop-blur-xl',
    border: 'border-red-500/30',
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-orange-500/10 backdrop-blur-xl',
    border: 'border-orange-500/30',
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    progress: 'bg-orange-500',
  },
  info: {
    bg: 'bg-teal-500/10 backdrop-blur-xl',
    border: 'border-teal-500/30',
    icon: <Info className="w-5 h-5 text-teal-500" />,
    progress: 'bg-teal-500',
  },
}

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Individual Toast Component
interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { id, message, variant, duration = 5000, title } = toast
  const styles = variantStyles[variant]
  const progressRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [remainingTime, setRemainingTime] = useState(duration)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (isPaused) return

    const timer = setTimeout(() => {
      onRemove(id)
    }, remainingTime)

    startTimeRef.current = Date.now()

    return () => clearTimeout(timer)
  }, [id, remainingTime, isPaused, onRemove])

  const handleMouseEnter = () => {
    setIsPaused(true)
    const elapsed = Date.now() - startTimeRef.current
    setRemainingTime(prev => Math.max(prev - elapsed, 0))
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative w-80 rounded-xl border shadow-lg overflow-hidden
        ${styles.bg} ${styles.border}
      `}
    >
      {/* Content */}
      <div className="p-4 pr-10">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
          <div className="flex-1 min-w-0">
            {title && <p className="font-semibold text-slate-900 text-sm mb-1">{title}</p>}
            <p className="text-sm text-slate-700 break-words">{message}</p>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={() => onRemove(id)}
        className="absolute top-3 right-3 p-1 hover:bg-slate-900/10 rounded-lg transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50">
        <motion.div
          ref={progressRef}
          className={`h-full ${styles.progress}`}
          initial={{ width: '100%' }}
          animate={{ width: isPaused ? undefined : '0%' }}
          transition={{
            duration: isPaused ? 0 : remainingTime / 1000,
            ease: 'linear' as const,
          }}
          style={isPaused ? { width: `${(remainingTime / duration) * 100}%` } : undefined}
        />
      </div>
    </motion.div>
  )
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((options: ToastOptions): string => {
    const id = generateId()
    const newToast: Toast = {
      id,
      message: options.message,
      variant: options.variant || 'info',
      duration: options.duration || 5000,
      title: options.title,
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
