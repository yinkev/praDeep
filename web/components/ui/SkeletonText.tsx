'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from './Skeleton'

interface SkeletonTextProps {
  className?: string
  lines?: number
  variant?: 'paragraph' | 'heading' | 'caption' | 'mixed'
  lastLineWidth?: string
  staggerAnimation?: boolean
}

export function SkeletonText({
  className,
  lines = 3,
  variant = 'paragraph',
  lastLineWidth = '75%',
  staggerAnimation = true,
}: SkeletonTextProps) {
  if (variant === 'heading') {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-8 w-3/4 animate-fade-in" />
        <Skeleton
          className="h-4 w-1/2"
          animation="shimmer"
          style={{
            animationDelay: staggerAnimation ? '100ms' : undefined,
          }}
        />
      </div>
    )
  }

  if (variant === 'caption') {
    return (
      <div className={cn('space-y-1.5', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-3"
            style={{
              width: i === lines - 1 ? lastLineWidth : '100%',
              animationDelay: staggerAnimation ? `${i * 40}ms` : undefined,
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'mixed') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Title */}
        <Skeleton className="h-6 w-2/3 animate-fade-in" />

        {/* Subtitle */}
        <Skeleton
          className="h-4 w-1/2"
          style={{
            animationDelay: staggerAnimation ? '80ms' : undefined,
          }}
        />

        {/* Body lines */}
        <div className="space-y-2 pt-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-3.5"
              style={{
                width: i === lines - 1 ? lastLineWidth : '100%',
                animationDelay: staggerAnimation ? `${(i + 2) * 60}ms` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // Paragraph variant (default)
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 ? lastLineWidth : '100%',
            animationDelay: staggerAnimation ? `${i * 50}ms` : undefined,
          }}
        />
      ))}
    </div>
  )
}

export default SkeletonText
