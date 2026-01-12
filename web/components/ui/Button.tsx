'use client'

import React, { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size preset */
  size?: ButtonSize
  /** Show loading spinner and disable interactions */
  loading?: boolean
  /** Icon to display on the left side */
  iconLeft?: React.ReactNode
  /** Icon to display on the right side */
  iconRight?: React.ReactNode
  /** @deprecated Use iconLeft instead */
  icon?: React.ReactNode
  /** Button content (optional for icon-only buttons) */
  children?: React.ReactNode
}

// ============================================================================
// Styles Configuration
// ============================================================================

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    // Teal gradient background
    'bg-gradient-to-r from-teal-500 to-teal-600',
    'text-white font-medium',
    // Glow effect
    'shadow-lg shadow-teal-500/25',
    // Hover state
    'hover:from-teal-400 hover:to-teal-500',
    'hover:shadow-xl hover:shadow-teal-500/30',
    // Focus ring
    'focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2',
  ].join(' '),

  secondary: [
    // Glassmorphism effect
    'bg-white/70 dark:bg-slate-800/70',
    'backdrop-blur-xl backdrop-saturate-150',
    'text-slate-700 dark:text-slate-200',
    // Subtle border for glass effect
    'border border-white/50 dark:border-slate-700/50',
    // Soft shadow
    'shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50',
    // Hover state
    'hover:bg-white/90 dark:hover:bg-slate-800/90',
    'hover:border-white/70 dark:hover:border-slate-600/70',
    'hover:shadow-xl',
    // Focus ring
    'focus-visible:ring-2 focus-visible:ring-teal-400/50 focus-visible:ring-offset-2',
  ].join(' '),

  ghost: [
    // Transparent background
    'bg-transparent',
    'text-slate-600 dark:text-slate-300',
    // Hover state
    'hover:bg-slate-100/80 dark:hover:bg-slate-800/80',
    'hover:text-slate-900 dark:hover:text-slate-100',
    // Focus ring
    'focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2',
  ].join(' '),

  destructive: [
    // Red gradient background
    'bg-gradient-to-r from-red-500 to-red-600',
    'text-white font-medium',
    // Glow effect
    'shadow-lg shadow-red-500/25',
    // Hover state
    'hover:from-red-400 hover:to-red-500',
    'hover:shadow-xl hover:shadow-red-500/30',
    // Focus ring
    'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

// ============================================================================
// Animation Variants
// ============================================================================

const buttonMotionVariants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 17,
    },
  },
}

const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear' as const,
    },
  },
}

// ============================================================================
// Component
// ============================================================================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      icon, // deprecated
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const leftIcon = iconLeft || icon // Support deprecated icon prop

    return (
      <motion.button
        ref={ref}
        className={[
          // Base styles
          'relative inline-flex items-center justify-center',
          'font-medium transition-colors duration-200',
          'outline-none focus-visible:ring-offset-background',
          // Disabled state
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
        disabled={isDisabled}
        variants={buttonMotionVariants}
        initial="initial"
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <motion.span
            className={iconSizeStyles[size]}
            variants={spinnerVariants}
            animate="animate"
          >
            <Loader2 className="w-full h-full" />
          </motion.span>
        )}

        {/* Left Icon */}
        {!loading && leftIcon && (
          <span className={`flex-shrink-0 ${iconSizeStyles[size]}`}>{leftIcon}</span>
        )}

        {/* Content */}
        <span className="truncate">{children}</span>

        {/* Right Icon */}
        {!loading && iconRight && (
          <span className={`flex-shrink-0 ${iconSizeStyles[size]}`}>{iconRight}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button

// ============================================================================
// Compound Components for Common Patterns
// ============================================================================

export interface IconButtonProps
  extends Omit<ButtonProps, 'children' | 'iconLeft' | 'iconRight' | 'icon'> {
  /** Icon to display */
  icon: React.ReactNode
  /** Accessible label for screen readers */
  'aria-label': string
}

/**
 * Icon-only button variant with proper accessibility
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className = '', ...props }, ref) => {
    const squareSizes: Record<ButtonSize, string> = {
      sm: '!w-8 !px-0',
      md: '!w-10 !px-0',
      lg: '!w-12 !px-0',
    }

    return (
      <Button ref={ref} size={size} className={`${squareSizes[size]} ${className}`} {...props}>
        <span className={iconSizeStyles[size]}>{icon}</span>
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'
