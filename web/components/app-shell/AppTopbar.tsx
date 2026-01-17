'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppTopbar() {
  const handleSearchClick = React.useCallback(() => {
    // Dispatch a custom event or rely on Cmd+K
    // Standard approach for shadcn command palette is to just let Cmd+K handle it,
    // but for the button, we can dispatch the same key event.
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface-base/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent-primary rounded-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-text-primary uppercase font-mono">
                praDeep <span className="text-text-tertiary font-normal">v2.0</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSearchClick}
              className={cn(
                "group flex items-center gap-2 px-3 py-1.5 text-xs font-medium",
                "bg-surface-secondary text-text-tertiary rounded-full border border-border-subtle",
                "hover:border-border hover:text-text-secondary transition-all",
                "focus-visible:ring-2 focus-visible:ring-accent-primary/20 focus-visible:outline-none"
              )}
            >
              <Search className="w-3.5 h-3.5 group-hover:text-accent-primary transition-colors" />
              <span>Search...</span>
              <kbd className="hidden sm:inline-flex h-4 items-center gap-1 rounded border border-border bg-surface-base px-1.5 font-mono text-[10px] font-medium text-text-quaternary">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </button>
            
            <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border overflow-hidden cursor-pointer hover:border-accent-primary transition-colors">
               <div className="w-full h-full bg-gradient-to-br from-accent-primary/20 to-transparent flex items-center justify-center text-[10px] font-bold text-accent-primary">
                 PK
               </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
