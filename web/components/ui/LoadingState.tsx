'use client'

import React from 'react'
import { motion } from 'framer-motion'

// ============================================================================
// Types
// ============================================================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  label?: string
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
  message?: string
  showSpinner?: boolean
  className?: string
}

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  blur?: boolean
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const spinnerSizes: Record<SpinnerSize, { size: string; border: string }> = {
  xs: { size: 'w-3 h-3', border: 'border' },
  sm: { size: 'w-4 h-4', border: 'border-2' },
  md: { size: 'w-6 h-6', border: 'border-2' },
  lg: { size: 'w-8 h-8', border: 'border-[3px]' },
  xl: { size: 'w-12 h-12', border: 'border-4' },
}

// Cloud Dancer shimmer gradient
const shimmerGradient = `
  linear-gradient(
    90deg,
    #F4F1ED 0%,
    #FAF9F7 20%,
    #FFFFFF 50%,
    #FAF9F7 80%,
    #F4F1ED 100%
  )
`

// ============================================================================
// Spinner Component
// ============================================================================

export function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  const { size: sizeClass, border } = spinnerSizes[size]

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <motion.div
        className={`
          ${sizeClass} ${border}
          rounded-full
          border-teal-500/30
          border-t-teal-500
        `}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear' as const,
        }}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>}
    </div>
  )
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  lines = 1,
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-cloud-dancer dark:bg-slate-700 overflow-hidden'

  const variantClasses: Record<SkeletonVariant, string> = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-2xl',
  }

  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {}
    if (width) style.width = typeof width === 'number' ? `${width}px` : width
    if (height) style.height = typeof height === 'number' ? `${height}px` : height
    if (variant === 'circular' && !height && width) style.height = style.width
    return style
  }

  const shimmerAnimation = animate
    ? {
        backgroundImage: shimmerGradient,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }
    : {}

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variantClasses.text}`}
            style={{
              ...getStyle(),
              width: index === lines - 1 ? '75%' : width || '100%',
              ...shimmerAnimation,
            }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ ...getStyle(), ...shimmerAnimation }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    />
  )
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
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-2xl overflow-hidden
        shadow-soft border border-slate-100 dark:border-slate-700
        ${className}
      `}
    >
      {showImage && (
        <Skeleton variant="rectangular" width="100%" height={160} className="rounded-none" />
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
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} variant="text" width={index === lines - 1 ? lastLineWidth : '100%'} />
      ))}
    </div>
  )
}

// ============================================================================
// Inline Loading Component (for buttons)
// ============================================================================

export function InlineLoading({
  text = 'Loading...',
  size = 'sm',
  className = '',
}: InlineLoadingProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size={size} />
      <span className="text-current">{text}</span>
    </span>
  )
}

// ============================================================================
// Full Page Loading Component
// ============================================================================

export function FullPageLoading({
  message = 'Loading...',
  showSpinner = true,
  className = '',
}: FullPageLoadingProps) {
  return (
    <motion.div
      className={`
        fixed inset-0 z-50
        flex flex-col items-center justify-center
        bg-cloud-soft dark:bg-slate-900
        ${className}
      `}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showSpinner && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Spinner size="xl" />
        </motion.div>
      )}
      {message && (
        <motion.p
          className="mt-4 text-slate-600 dark:text-slate-400 text-lg font-medium"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )
}

// ============================================================================
// Loading Overlay Component
// ============================================================================

export function LoadingOverlay({
  isVisible,
  message,
  blur = true,
  className = '',
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <motion.div
      className={`
        absolute inset-0 z-40
        flex flex-col items-center justify-center
        bg-white/80 dark:bg-slate-900/80
        ${blur ? 'backdrop-blur-sm' : ''}
        rounded-inherit
        ${className}
      `}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Spinner size="lg" />
      {message && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{message}</p>}
    </motion.div>
  )
}

// ============================================================================
// Pulse Dot Loading Component
// ============================================================================

export function PulseDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map(index => (
        <motion.div
          key={index}
          className="w-2 h-2 rounded-full bg-teal-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// CSS Keyframes (add to global styles or use style tag)
// ============================================================================

export const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`

// ============================================================================
// Default Export (for convenience)
// ============================================================================

const LoadingState = {
  Spinner,
  Skeleton,
  CardSkeleton,
  TextSkeleton,
  InlineLoading,
  FullPageLoading,
  LoadingOverlay,
  PulseDots,
}

export default LoadingState
