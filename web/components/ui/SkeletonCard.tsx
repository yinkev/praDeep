'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

interface SkeletonCardProps {
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
  showAvatar?: boolean
  showActions?: boolean
  lines?: number
}

export function SkeletonCard({
  className,
  variant = 'default',
  showAvatar = true,
  showActions = false,
  lines = 2,
}: SkeletonCardProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated/40 p-4',
          'backdrop-blur-sm',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {showAvatar && <Skeleton variant="circular" className="h-8 w-8 flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated/40 p-6',
          'backdrop-blur-sm shadow-sm',
          className
        )}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {showAvatar && <Skeleton variant="circular" className="h-12 w-12 flex-shrink-0" />}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            {showActions && <Skeleton className="h-8 w-8 rounded-lg" />}
          </div>

          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton key={i} className="h-3" width={i === lines - 1 ? '85%' : '100%'} />
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated/40 p-5',
        'backdrop-blur-sm',
        className
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {showAvatar && <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-3"
                style={{
                  width: i === lines - 1 ? '85%' : '100%',
                }}
              />
            ))}
          </div>
        </div>
        {showActions && (
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
      </div>
    </div>
  )
}

export default SkeletonCard
