'use client'

import { type ReactNode } from 'react'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface SwipeNavigatorProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  showHints?: boolean
  className?: string
}

export function SwipeNavigator({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  showHints = false,
  className = '',
}: SwipeNavigatorProps): ReactNode {
  const prefersReducedMotion = useReducedMotion()

  const { handlers, swipeState } = useSwipeGesture({
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  })

  const opacity = swipeState.isSwiping ? 0.7 : 1
  const scale = swipeState.isSwiping ? 0.98 : 1

  return (
    <motion.div
      {...handlers}
      className={`relative touch-pan-y select-none ${className}`}
      style={{ opacity, scale }}
      animate={{ opacity, scale }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
    >
      {children}

      {showHints && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
          <AnimatePresence>
            {onSwipeRight && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.5, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="rounded-full bg-slate-900/60 p-2 backdrop-blur-sm dark:bg-slate-100/60"
              >
                <ChevronLeft className="h-5 w-5 text-white dark:text-slate-900" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {onSwipeLeft && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 0.5, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="rounded-full bg-slate-900/60 p-2 backdrop-blur-sm dark:bg-slate-100/60"
              >
                <ChevronRight className="h-5 w-5 text-white dark:text-slate-900" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
