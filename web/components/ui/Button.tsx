'use client'

import { forwardRef, type ReactNode } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps, type Variants } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** Visual style variant */
  variant?: ButtonVariant
  /** Size preset */
  size?: ButtonSize
  /** Show loading spinner and disable interactions */
  loading?: boolean
  /** Icon to display on the left side */
  iconLeft?: ReactNode
  /** Icon to display on the right side */
  iconRight?: ReactNode
  /** @deprecated Use iconLeft instead */
  icon?: ReactNode
  /** Button content (optional for icon-only buttons) */
  children?: ReactNode
}

// ============================================================================
// Styles Configuration - Liquid Cloud Design System
// Clean, subtle depth on hover, Linear/Vercel aesthetics
// ============================================================================

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn('bg-accent-primary text-white', 'hover:bg-blue-600', 'active:bg-blue-700'),

  secondary: cn(
    'bg-surface-secondary text-foreground',
    'border border-border',
    'hover:bg-surface-tertiary',
    'active:bg-surface-tertiary/80'
  ),

  outline: cn(
    'bg-transparent text-foreground',
    'border border-border',
    'hover:bg-surface-secondary',
    'active:bg-surface-tertiary'
  ),

  ghost: cn(
    'bg-transparent text-foreground',
    'hover:bg-surface-secondary',
    'active:bg-surface-tertiary'
  ),

  destructive: cn('bg-semantic-error text-white', 'hover:bg-red-600', 'active:bg-red-700'),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const contentGapStyles: Record<ButtonSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2.5',
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

// ============================================================================
// Animation Variants - Subtle hover lift with shadow depth
// ============================================================================

const buttonMotionVariants = {
  initial: {
    y: 0,
  },
  hover: {
    y: -1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  },
} satisfies Variants

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
      className,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion()
    const isDisabled = disabled || loading
    const leftIcon = iconLeft ?? icon // Support deprecated icon prop

    return (
      <motion.button
        ref={ref}
        type={type ?? 'button'}
        aria-busy={loading || undefined}
        className={cn(
          // Base styles
          'relative isolate inline-flex items-center justify-center whitespace-nowrap overflow-hidden',
          'rounded-md font-medium tracking-tight select-none',
          // Focus ring with design system accent
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // Smooth transitions (colors + shadow)
          'transition-[background-color,border-color,color,box-shadow,transform,filter] duration-200 ease-out-expo',
          // Disabled state
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        variants={buttonMotionVariants}
        initial="initial"
        whileHover={!isDisabled && !reduceMotion ? 'hover' : undefined}
        whileTap={!isDisabled && !reduceMotion ? 'tap' : undefined}
        {...props}
      >
        {/* Loading Shimmer */}
        {loading && (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 z-0 opacity-60',
              'bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.35)_50%,transparent_100%)]',
              'dark:bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.16)_50%,transparent_100%)]',
              '[background-size:200%_100%]',
              'motion-safe:animate-shimmer'
            )}
          />
        )}

        <span
          className={cn(
            'relative z-10 inline-flex items-center justify-center',
            contentGapStyles[size]
          )}
        >
          {/* Left Icon / Loading Spinner Container (fixed width) */}
          {(leftIcon || loading) && (
            <span
              className={cn(
                'flex-shrink-0 inline-flex items-center justify-center',
                iconSizeStyles[size]
              )}
            >
              {loading ? (
                <Loader2 className={cn(iconSizeStyles[size], 'motion-safe:animate-spin')} />
              ) : (
                leftIcon
              )}
            </span>
          )}

          {/* Content */}
          {children && <span className="truncate">{children}</span>}

          {/* Right Icon */}
          {!loading && iconRight && (
            <span className={cn('flex-shrink-0', iconSizeStyles[size])}>{iconRight}</span>
          )}
        </span>
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
  icon: ReactNode
  /** Accessible label for screen readers */
  'aria-label': string
}

const iconButtonSquareSizes = {
  sm: '!w-8 !px-0',
  md: '!w-10 !px-0',
  lg: '!w-12 !px-0',
} satisfies Record<ButtonSize, string>

/**
 * Icon-only button variant with proper accessibility
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        className={cn(iconButtonSquareSizes[size], className)}
        {...props}
      >
        <span className={iconSizeStyles[size]}>{icon}</span>
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'
