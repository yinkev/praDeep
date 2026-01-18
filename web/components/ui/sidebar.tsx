'use client'

import * as React from 'react'
import { PanelLeft } from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import { IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type SidebarTriggerProps = Omit<
  React.ComponentProps<typeof IconButton>,
  'aria-label' | 'icon'
>

export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof IconButton>,
  SidebarTriggerProps
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useGlobal()

  return (
    <IconButton
      ref={ref}
      variant="ghost"
      size="sm"
      className={cn('h-7 w-7', className)}
      aria-label="Toggle sidebar"
      icon={<PanelLeft className="h-4 w-4" />}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    />
  )
})
SidebarTrigger.displayName = 'SidebarTrigger'

