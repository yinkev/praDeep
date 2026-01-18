"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Tab = {
  id: string
  label: string
}

interface SimpleTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (id: string) => void
  layoutId?: string
}

export function SimpleTabs({ tabs, activeTab, onTabChange, layoutId = "tabs" }: SimpleTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated/50 p-1 dark:border-white/10 dark:bg-white/5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative rounded-full px-3 py-1 text-sm font-medium transition-colors hover:text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50",
              isActive ? "text-text-primary" : "text-text-tertiary"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-surface-elevated shadow-sm dark:bg-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
