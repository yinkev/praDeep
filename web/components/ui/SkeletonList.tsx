'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

interface SkeletonListProps {
  className?: string
  rows?: number
  variant?: 'simple' | 'detailed' | 'compact'
  showDivider?: boolean
  staggerAnimation?: boolean
}

export function SkeletonList({
  className,
  rows = 5,
  variant = 'simple',
  showDivider = false,
  staggerAnimation = true,
}: SkeletonListProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 rounded-lg p-3',
              'bg-surface-elevated/20 border border-border-subtle',
              staggerAnimation && 'animate-fade-in'
            )}
            style={{
              animationDelay: staggerAnimation ? `${i * 50}ms` : undefined,
            }}
          >
            <Skeleton variant="circular" className="h-6 w-6 flex-shrink-0" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i}>
            <div
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg',
                'bg-surface-elevated/30 border border-border-subtle',
                staggerAnimation && 'animate-fade-in'
              )}
              style={{
                animationDelay: staggerAnimation ? `${i * 75}ms` : undefined,
              }}
            >
              <Skeleton variant="circular" className="h-12 w-12 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
            {showDivider && i < rows - 1 && <div className="h-px bg-border-subtle my-4" />}
          </div>
        ))}
      </div>
    )
  }

  // Simple variant (default)
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <div
            className={cn('flex items-center gap-3 p-3', staggerAnimation && 'animate-fade-in')}
            style={{
              animationDelay: staggerAnimation ? `${i * 60}ms` : undefined,
            }}
          >
            <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          {showDivider && i < rows - 1 && <div className="h-px bg-border-subtle" />}
        </div>
      ))}
    </div>
  )
}

export default SkeletonList
