'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export function EliteBackground({ className }: { className?: string }) {
  return (
    <>
      {/* Ambient gradient blobs */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-500/12 blur-3xl',
          'dark:bg-sky-500/10',
          className
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 left-8 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10"
      />

      {/* Subtle matrix pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.28] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_75%)] bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.6)_1px,transparent_0)] [background-size:40px_40px]"
      />
    </>
  )
}