'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
  text?: string
}

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  lines?: number
  animate?: boolean
}

interface CardSkeletonProps {
  showImage?: boolean
  showTitle?: boolean
  showDescription?: boolean
  showFooter?: boolean
  className?: string
}

interface TextSkeletonProps {
  lines?: number
  lastLineWidth?: string
  className?: string
}

interface InlineLoadingProps {
  text?: string
  size?: SpinnerSize
  className?: string
}

interface FullPageLoadingProps {
  isVisible?: boolean
  message?: string
  showSpinner?: boolean
  variant?: 'spinner' | 'skeleton'
  size?: SpinnerSize
  blur?: boolean
  className?: string
}

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  blur?: boolean
  fullPage?: boolean
  variant?: 'spinner' | 'skeleton'
  size?: SpinnerSize
  className?: string
}

interface DotsLoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// ============================================================================
// Styles - 2026 Modern Minimal Loading
// ============================================================================

const spinnerSizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-[3px]',
  xl: 'h-8 w-8 border-[3px]',
}

const labelSizeStyles: Record<SpinnerSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
  xl: 'text-base',
}

const dotSizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
}

const fadeTransition = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1] as const,
}

// ============================================================================
// Spinner Component - Clean ring with subtle motion
// ============================================================================

export function Spinner({ size = 'md', className = '', label, text }: SpinnerProps) {
  const resolvedText = text ?? label

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={resolvedText || 'Loading'}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <span
        className={cn(
          'inline-block rounded-full border border-border/50 border-t-accent',
          'motion-safe:animate-spin motion-safe:[animation-duration:900ms]',
          spinnerSizeStyles[size]
        )}
      />
      {resolvedText && (
        <span className={cn('font-medium text-text-muted', labelSizeStyles[size])}>
          {resolvedText}
        </span>
      )}
    </span>
  )
}

// ============================================================================
// Skeleton Component - Pulse placeholders
// ============================================================================

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  lines = 1,
  animate = true,
}: SkeletonProps) {
  const baseClassName = cn(
    'bg-border-muted/80 dark:bg-white/10',
    animate && 'animate-pulse',
    variant === 'text' && 'rounded-md',
    variant === 'rectangular' && 'rounded-lg',
    variant === 'circular' && 'rounded-full',
    variant === 'card' && 'rounded-xl shadow-xs',
    className
  )

  const baseStyle: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  }

  if (variant === 'circular' && !baseStyle.height && width) {
    baseStyle.height = typeof width === 'number' ? `${width}px` : width
  }

  const resolvedHeight =
    baseStyle.height ??
    (variant === 'text' ? '1rem' : variant === 'card' ? '8rem' : undefined)

  if (!baseStyle.height && resolvedHeight) baseStyle.height = resolvedHeight

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'bg-border-muted/80 dark:bg-white/10',
              animate && 'animate-pulse',
              'rounded-md'
            )}
            style={{
              ...baseStyle,
              width: index === lines - 1 ? '72%' : baseStyle.width ?? '100%',
              height: baseStyle.height ?? '1rem',
            }}
          />
        ))}
      </div>
    )
  }

  return <div className={baseClassName} style={baseStyle} />
}

// ============================================================================
// Card Skeleton Component
// ============================================================================

export function CardSkeleton({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showFooter = false,
  className = '',
}: CardSkeletonProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border/60 bg-surface-tertiary', className)}>
      {showImage && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={160}
          className="rounded-none bg-border-muted/70 dark:bg-white/10"
        />
      )}
      <div className="p-4 space-y-3">
        {showTitle && <Skeleton variant="text" width="70%" height={20} />}
        {showDescription && <Skeleton variant="text" lines={2} />}
        {showFooter && (
          <div className="flex items-center gap-2 pt-2">
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="text" width={100} />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Text Skeleton Component
// ============================================================================

export function TextSkeleton({
  lines = 3,
  lastLineWidth = '60%',
  className = '',
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} variant="text" width={index === lines - 1 ? lastLineWidth : '100%'} />
      ))}
    </div>
  )
}

// ============================================================================
// Inline Loading Component
// ============================================================================

export function InlineLoading({
  text = 'Loading...',
  size = 'sm',
  className = '',
}: InlineLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Spinner size={size} />
      {text && <span className="font-medium text-current">{text}</span>}
    </span>
  )
}

// ============================================================================
// Full Page Loading Component
// ============================================================================

export function FullPageLoading({
  isVisible = true,
  message = 'Loading...',
  showSpinner = true,
  variant = 'spinner',
  size = 'lg',
  blur = true,
  className = '',
}: FullPageLoadingProps) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-surface-primary/70 dark:bg-black/40',
            blur && 'backdrop-blur-lg',
            className
          )}
        >
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={fadeTransition}
            className={cn(
              'flex flex-col items-center justify-center gap-3',
              'rounded-2xl border border-border/60 bg-glass-strong px-6 py-5 shadow-glass-sm',
              'dark:border-white/10 dark:bg-white/5'
            )}
          >
            {showSpinner && variant === 'spinner' && <Spinner size={size} />}
            {variant === 'skeleton' && (
              <div className="w-56 space-y-3">
                <Skeleton variant="text" width="78%" />
                <Skeleton variant="text" width="92%" />
                <Skeleton variant="text" width="62%" />
              </div>
            )}
            {message && <p className="text-sm font-medium text-text-muted">{message}</p>}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

// ============================================================================
// Loading Overlay Component
// ============================================================================

export function LoadingOverlay({
  isVisible,
  message,
  blur = true,
  fullPage = false,
  variant = 'spinner',
  size = 'lg',
  className = '',
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
          className={cn(
            'z-40 flex flex-col items-center justify-center',
            fullPage ? 'fixed inset-0' : 'absolute inset-0 rounded-xl',
            'bg-surface-primary/60 dark:bg-black/30',
            blur && 'backdrop-blur-md',
            'cursor-wait',
            className
          )}
        >
          {variant === 'spinner' ? <Spinner size={size} /> : <Skeleton variant="rectangular" width={44} height={44} />}
          {message && <p className="mt-3 text-sm font-medium text-text-muted">{message}</p>}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

// ============================================================================
// Dots Loading Component - subtle bounce
// ============================================================================

export function DotsLoading({ className = '', size = 'md' }: DotsLoadingProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-hidden="true">
      {[0, 1, 2].map(index => (
        <motion.span
          key={index}
          className={cn(
            'inline-block rounded-full bg-text-subtle dark:bg-white/40',
            dotSizeStyles[size]
          )}
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: index * 0.12,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Pulse Dots Loading Component (alias for backwards compatibility)
// ============================================================================

export function PulseDots({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-hidden="true">
      {[0, 1, 2].map(index => (
        <motion.span
          key={index}
          className={cn('inline-block h-2 w-2 rounded-full bg-text-subtle dark:bg-white/40')}
          animate={{ scale: [1, 1.22, 1], opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.9,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Default Export
// ============================================================================

const LoadingState = {
  Spinner,
  Skeleton,
  CardSkeleton,
  TextSkeleton,
  InlineLoading,
  FullPageLoading,
  LoadingOverlay,
  DotsLoading,
  PulseDots,
}

export default LoadingState
