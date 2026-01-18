'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button, IconButton } from '@/components/ui/Button'
import { Separator } from '@/components/ui/separator'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Search, Bell, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

// Map paths to readable names
const PATH_MAP: Record<string, string> = {
  analytics: 'Analytics',
  research: 'Deep Research',
  solver: 'Smart Solver',
  notebook: 'Notebooks',
  settings: 'Settings',
  history: 'History',
  guide: 'Guided Learning',
  knowledge: 'Knowledge Base',
  workflow: 'Workflow Insights',
  metrics: 'System Metrics',
  personalization: 'Personalization',
  recommendation: 'Paper Recommendations',
  co_writer: 'Co-Writer',
  ideagen: 'Idea Generator',
  question: 'Question Generator',
  memory: 'Memory Bank',
  chat: 'Dashboard',
}

export function AppHeader() {
  const pathname = usePathname()
  const { setTheme, isDark } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Parse breadcrumbs
  const segments = pathname.split('/').filter(Boolean)
  const isDashboardRoot = segments.length === 0

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const handleCommandPalette = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('opentutor:command-palette', { detail: { action: 'toggle' } }))
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-border bg-surface-base/80 backdrop-blur-md px-4 shadow-sm transition-all">
      <div className="flex items-center gap-x-3">
        {/* Sidebar Trigger (Mobile/Collapse) */}
        <SidebarTrigger className="-ml-2 h-8 w-8 text-text-secondary hover:text-text-primary" />

        <Separator orientation="vertical" className="h-4 bg-border-strong" />

        {/* Dynamic Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-text-tertiary hover:text-text-primary transition-colors">
                praDeep
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {!isDashboardRoot && <BreadcrumbSeparator className="text-text-quaternary" />}

            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1
              const name = PATH_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
              const href = `/${segments.slice(0, index + 1).join('/')}`

              return (
                <React.Fragment key={href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium text-text-primary">{name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href} className="text-text-tertiary hover:text-text-primary transition-colors">
                        {name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="text-text-quaternary" />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-x-2">
        {/* Command Palette Trigger */}
        <button
            type="button"
            onClick={handleCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-secondary border border-border text-xs text-text-tertiary cursor-pointer hover:bg-surface-elevated hover:text-text-primary transition-colors group"
            aria-label="Search"
        >
            <Search size={14} className="text-text-quaternary group-hover:text-text-primary" />
            <span>Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-subtle bg-surface-base px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
            </kbd>
        </button>

        {/* Theme Toggle */}
        <IconButton
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-text-tertiary hover:text-text-primary"
          onClick={handleThemeToggle}
          aria-label="Toggle theme"
          icon={
            mounted ? (
              isDark ? <Moon size={16} /> : <Sun size={16} />
            ) : (
               <div className="w-4 h-4" /> // placeholder to avoid hydration mismatch
            )
          }
        />

        <IconButton
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-text-tertiary hover:text-text-primary"
          aria-label="Notifications"
          icon={<Bell size={16} />}
        />
      </div>
    </header>
  )
}

