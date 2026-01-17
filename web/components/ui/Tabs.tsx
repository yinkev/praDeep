"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"
import { eliteTheme } from "@/lib/elite-theme"
import { cn } from "@/lib/utils"

export type TabsItem = {
  id: string
  label: string
  icon?: React.ReactNode
}

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const density = eliteTheme.density.compact
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated/60 shadow-glass-sm backdrop-blur-md",
        density.tabPad,
        "dark:border-white/10 dark:bg-white/5",
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const density = eliteTheme.density.compact
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative isolate inline-flex items-center gap-2 rounded-full font-semibold",
        density.tabButton,
        "transition-colors duration-200 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "text-text-secondary hover:bg-surface-elevated/70 hover:text-text-primary dark:text-zinc-200 dark:hover:text-zinc-50",
        "data-[state=active]:text-text-primary",
        className
      )}
      {...props}
    >
      <div className="hidden data-[state=active]:block">
        <motion.div
          layoutId="activeTabIndicator"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-full border border-border/60 bg-surface-elevated/90 shadow-sm",
            "dark:border-white/10 dark:bg-zinc-950/60"
          )}
          transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
        />
      </div>
      <span className="relative inline-flex items-center gap-2">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

// Compatibility Wrapper for the original Tabs component
type SimpleTabsProps = {
  tabs: TabsItem[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
  layoutId?: string
}

export function SimpleTabs({ tabs, activeTab, onTabChange, className, layoutId = "activeTab" }: SimpleTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="relative isolate">
            {activeTab === tab.id && (
              <motion.div
                layoutId={layoutId}
                className={cn(
                  "pointer-events-none absolute inset-0 -z-10 rounded-full border border-border/60 bg-surface-elevated/90 shadow-sm",
                  "dark:border-white/10 dark:bg-zinc-950/60"
                )}
                transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              {tab.label}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
