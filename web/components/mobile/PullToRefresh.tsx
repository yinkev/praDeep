'use client'

import { type ReactNode, useRef, useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
}: PullToRefreshProps): ReactNode {
  const prefersReducedMotion = useReducedMotion()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startY = useRef<number>(0)
  const isDragging = useRef<boolean>(false)

  const maxPullDistance = threshold * 1.5
  const refreshProgress = Math.min(pullDistance / threshold, 1)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY
        isDragging.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || isRefreshing) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY.current

      if (deltaY > 0 && container.scrollTop === 0) {
        e.preventDefault()
        const damping = 0.5
        const distance = Math.min(deltaY * damping, maxPullDistance)
        setPullDistance(distance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isDragging.current || isRefreshing) return

      isDragging.current = false

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        setPullDistance(threshold)

        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh failed:', error)
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, threshold, maxPullDistance, isRefreshing, onRefresh])

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      <motion.div
        className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-center justify-center"
        style={{ height: threshold }}
        animate={{
          y: isRefreshing ? 0 : pullDistance - threshold,
          opacity: refreshProgress,
        }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      >
        <div className="rounded-full bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:bg-slate-900/95">
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-900 dark:text-slate-100" />
          ) : (
            <motion.div animate={{ rotate: refreshProgress * 360 }} transition={{ duration: 0.2 }}>
              <svg
                className="h-5 w-5 text-slate-900 dark:text-slate-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: isRefreshing ? threshold : pullDistance }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
