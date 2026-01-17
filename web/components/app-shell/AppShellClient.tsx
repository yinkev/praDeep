'use client'

import * as React from 'react'
import { AppTopbar } from './AppTopbar'
import { CommandPalette } from '@/components/CommandPalette'

interface AppShellClientProps {
  children: React.ReactNode
}

export function AppShellClient({ children }: AppShellClientProps) {
  // We no longer need the window toggle pattern as CommandPalette handles its own state and hotkeys
  return (
    <>
      <CommandPalette />
      <AppTopbar />
      <main
        id="app-scroll"
        className="flex-1 overflow-y-auto scroll-smooth bg-[radial-gradient(circle_at_1px_1px,rgb(var(--color-border-subtle))_1px,transparent_0)] [background-size:24px_24px] bg-surface-base"
        style={{ backgroundPosition: 'center center' }}
      >
        {children}
      </main>
    </>
  )
}
