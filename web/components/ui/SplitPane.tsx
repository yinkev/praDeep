'use client'

import React, { ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SplitPaneProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  defaultRightWidth?: number
  collapsible?: boolean
  onToggle?: (isOpen: boolean) => void
  className?: string
}

const fastEasing = [0.2, 0.8, 0.2, 1] as const

export function SplitPane({
  leftPanel,
  rightPanel,
  defaultRightWidth = 360,
  collapsible = true,
  onToggle,
  className = '',
}: SplitPaneProps) {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)

  const handleToggle = () => {
    const newState = !isRightPanelOpen
    setIsRightPanelOpen(newState)
    onToggle?.(newState)
  }

  return (
    <div className={`relative flex h-full min-h-0 w-full gap-3 ${className}`}>
      {/* Left Panel - Main Content */}
      <div className="flex flex-1 min-w-0 flex-col">{leftPanel}</div>

      {/* Right Panel - Sources/Citations - Desktop Only */}
      <div className="hidden lg:block relative">
        <AnimatePresence initial={false}>
          {isRightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: defaultRightWidth,
                opacity: 1,
                transition: {
                  duration: 0.16,
                  ease: fastEasing,
                },
              }}
              exit={{
                width: 0,
                opacity: 0,
                transition: {
                  duration: 0.14,
                  ease: fastEasing,
                },
              }}
              className="h-full overflow-hidden"
            >
              <div className="h-full w-full">{rightPanel}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button - Desktop */}
        {collapsible && (
          <motion.button
            type="button"
            onClick={handleToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/55 bg-surface-elevated shadow-lg backdrop-blur-md transition-all hover:bg-surface-elevated/90 dark:border-white/10 ${
              isRightPanelOpen ? '-left-10' : '-right-10'
            }`}
            aria-label={isRightPanelOpen ? 'Hide sources panel' : 'Show sources panel'}
          >
            {isRightPanelOpen ? (
              <ChevronRight className="h-4 w-4 text-text-primary" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-text-primary" />
            )}
          </motion.button>
        )}
      </div>

      {/* Mobile Version - Right Panel Stacked Below */}
      <div className="lg:hidden w-full">
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: 'auto',
                opacity: 1,
                transition: {
                  duration: 0.16,
                  ease: fastEasing,
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: {
                  duration: 0.14,
                  ease: fastEasing,
                },
              }}
              className="mt-4 overflow-hidden"
            >
              {rightPanel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button - Mobile */}
        {collapsible && (
          <motion.button
            type="button"
            onClick={handleToggle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-3 w-full rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-text-primary shadow-sm backdrop-blur-md transition-all hover:bg-surface-elevated/90"
            aria-label={isRightPanelOpen ? 'Hide sources' : 'Show sources'}
          >
            {isRightPanelOpen ? 'Hide Sources' : 'Show Sources & Related Questions'}
          </motion.button>
        )}
      </div>
    </div>
  )
}
