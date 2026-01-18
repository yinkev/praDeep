'use client'

import * as React from 'react'
import { CommandPalette } from '@/components/CommandPalette'

interface AppShellClientProps {
  children: React.ReactNode
}

export function AppShellClient({ children }: AppShellClientProps) {
  return (
    <>
      <CommandPalette />
      <main id="app-scroll" className="flex-1 overflow-y-auto scroll-smooth bg-surface-base">
        {children}
      </main>
    </>
  )
}

