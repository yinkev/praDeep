'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { eliteTheme } from '@/lib/elite-theme'
import { cn } from '@/lib/utils'

export type TabsItem = {
  id: string
  label: string
  icon?: React.ReactNode
}

type TabsProps = {
  tabs: TabsItem[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
  layoutId?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className, layoutId = 'activeTab' }: TabsProps) {
  const density = eliteTheme.density.compact

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated/60 shadow-glass-sm backdrop-blur-md',
        density.tabPad,
        'dark:border-white/10 dark:bg-white/5',
        className
      )}
      role="group"
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative isolate inline-flex items-center gap-2 rounded-full font-semibold',
              density.tabButton,
              'transition-colors duration-200 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
              isActive
                ? 'text-text-primary'
                : 'text-text-secondary hover:bg-surface-elevated/70 hover:text-text-primary dark:text-zinc-200 dark:hover:text-zinc-50'
            )}
          >
            {isActive ? (
              <motion.div
                layoutId={layoutId}
                className={cn(
                  'pointer-events-none absolute inset-0 -z-10 rounded-full border border-border/60 bg-surface-elevated/90 shadow-sm',
                  'dark:border-white/10 dark:bg-zinc-950/60'
                )}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
              />
            ) : null}

            <span className="relative inline-flex items-center gap-2">
              {tab.icon ? <span className={cn('shrink-0', density.tabIcon)}>{tab.icon}</span> : null}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
