'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardBody } from './Card'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  asCard?: boolean
  className?: string
  actions?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  asCard = true,
  className,
  actions,
}: EmptyStateProps) {
  const content = (
    <div className={cn('flex flex-col items-center py-12 px-6 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-text-tertiary shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-text-primary">{title}</p>
      <p className="mt-1 text-xs font-mono uppercase tracking-tight text-text-tertiary">{description}</p>
      {actions && <div className="mt-6">{actions}</div>}
    </div>
  )

  if (!asCard) {
    return (
      <div className={cn('rounded-2xl border border-border bg-surface-base/50 backdrop-blur-md', className)}>
        {content}
      </div>
    )
  }

  return (
    <Card interactive={false} className={cn('border-border bg-surface-base/50', className)}>
      <CardBody padding="none">
        {content}
      </CardBody>
    </Card>
  )
}
