'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'shimmer' | 'none'
  style?: React.CSSProperties
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'shimmer',
  style,
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  }

  const animationClasses = {
    pulse: 'animate-pulse bg-surface-elevated/60 dark:bg-slate-700',
    shimmer:
      'bg-gradient-to-r from-surface-elevated via-border-subtle to-surface-elevated bg-[length:200%_100%] animate-shimmer',
    none: 'bg-surface-elevated/60 dark:bg-slate-700',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
    />
  )
}

export function EditorSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'space-y-3 p-6 bg-surface-elevated/40 rounded-lg border border-border',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center min-h-[200px] space-y-3', className)}
    >
      <Skeleton variant="circular" className="h-12 w-12" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'space-y-3 p-5 bg-surface-elevated/40 rounded-lg border border-border',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  )
}

export default Skeleton
