'use client'

import { forwardRef, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'gradient-blue'
  | 'gradient-purple'
  | 'gradient-emerald'
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
// Styles Configuration - Premium 2026 Design System
// Includes gradient variants with glow effects and animated backgrounds
// ============================================================================

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-accent-primary text-white',
    'hover:bg-blue-600 hover:brightness-105',
    'active:bg-blue-700 active:brightness-95'
  ),

  secondary: cn(
    'bg-surface-secondary text-foreground',
    'border border-border',
    'hover:bg-surface-tertiary hover:border-border/80',
    'active:bg-surface-tertiary/80'
  ),

  outline: cn(
    'bg-transparent text-foreground',
    'border border-border',
    'hover:bg-surface-secondary hover:border-border/60',
    'active:bg-surface-tertiary'
  ),

  ghost: cn(
    'bg-transparent text-foreground',
    'hover:bg-surface-secondary hover:brightness-98',
    'active:bg-surface-tertiary'
  ),

  destructive: cn(
    'bg-semantic-error text-white',
    'hover:bg-red-600 hover:brightness-105',
    'active:bg-red-700 active:brightness-95'
  ),

  // Premium Gradient Variants - 2026
  'gradient-blue': cn(
    'text-white font-semibold',
    'bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500',
    'hover:from-blue-400 hover:via-blue-500 hover:to-cyan-400',
    '[background-size:200%_200%] [background-position:0%_50%]',
    'hover:[background-position:100%_50%]',
    'transition-[background-position,box-shadow] duration-500 ease-out-expo',
    'shadow-lg shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40'
  ),

  'gradient-purple': cn(
    'text-white font-semibold',
    'bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500',
    'hover:from-violet-400 hover:via-purple-500 hover:to-fuchsia-400',
    '[background-size:200%_200%] [background-position:0%_50%]',
    'hover:[background-position:100%_50%]',
    'transition-[background-position,box-shadow] duration-500 ease-out-expo',
    'shadow-lg shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40'
  ),

  'gradient-emerald': cn(
    'text-white font-semibold',
    'bg-gradient-to-br from-emerald-500 via-teal-600 to-green-500',
    'hover:from-emerald-400 hover:via-teal-500 hover:to-green-400',
    '[background-size:200%_200%] [background-position:0%_50%]',
    'hover:[background-position:100%_50%]',
    'transition-[background-position,box-shadow] duration-500 ease-out-expo',
    'shadow-lg shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40'
  ),
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
// Animation Variants - World-class micro-interactions
// Premium feel: scale on hover, tactile press feedback, smooth shadow lift
// Enhanced with spring physics for gradient variants
// ============================================================================

const buttonMotionVariants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    boxShadow:
      '0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)',
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1], // out-expo
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1], // out-expo
    },
  },
} satisfies Variants

// Premium gradient button variants with enhanced spring physics
const gradientButtonMotionVariants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.03,
    y: -2,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.97,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20,
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

    // Check if this is a gradient variant for special effects
    const isGradientVariant = variant.startsWith('gradient-')

    // Magnetic hover effect - button follows cursor slightly
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Spring physics for smooth magnetic following
    const magneticX = useSpring(mouseX, { stiffness: 150, damping: 15, mass: 0.1 })
    const magneticY = useSpring(mouseY, { stiffness: 150, damping: 15, mass: 0.1 })

    // Transform mouse position to rotation for subtle 3D tilt effect
    const rotateX = useTransform(magneticY, [-20, 20], [2, -2])
    const rotateY = useTransform(magneticX, [-20, 20], [-2, 2])

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isGradientVariant || isDisabled || reduceMotion) return

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate distance from center, limited to ±20px
      const deltaX = Math.max(-20, Math.min(20, (e.clientX - centerX) * 0.15))
      const deltaY = Math.max(-20, Math.min(20, (e.clientY - centerY) * 0.15))

      mouseX.set(deltaX)
      mouseY.set(deltaY)
    }

    const handleMouseLeave = () => {
      setIsHovered(false)
      mouseX.set(0)
      mouseY.set(0)
    }

    const handleMouseEnter = () => {
      setIsHovered(true)
    }

    // Select appropriate motion variants
    const motionVariants = isGradientVariant ? gradientButtonMotionVariants : buttonMotionVariants

    return (
      <motion.button
        ref={node => {
          buttonRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        type={type ?? 'button'}
        aria-busy={loading || undefined}
        className={cn(
          // Base styles
          'relative isolate inline-flex items-center justify-center whitespace-nowrap overflow-hidden',
          'rounded-md font-medium tracking-tight select-none',
          // Focus ring - WCAG 2.1 AA compliant (visible, high contrast)
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // Smooth transitions - 200ms out-expo for all properties
          'transition-[background-color,border-color,color,box-shadow,transform,filter,opacity] duration-200',
          '[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
          // Disabled state - clear visual feedback
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        style={
          isGradientVariant && !isDisabled && !reduceMotion && isHovered
            ? {
                x: magneticX,
                y: magneticY,
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }
            : undefined
        }
        variants={motionVariants}
        initial="initial"
        whileHover={!isDisabled && !reduceMotion ? 'hover' : undefined}
        whileTap={!isDisabled && !reduceMotion ? 'tap' : undefined}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Premium Rainbow Shimmer - Enhanced for gradient variants */}
        {loading && (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 z-0',
              isGradientVariant
                ? cn(
                    'opacity-75',
                    'bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.6)_20%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.6)_80%,transparent_100%)]',
                    '[background-size:400%_100%]',
                    'motion-safe:animate-shimmer'
                  )
                : cn(
                    'opacity-60',
                    'bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.35)_50%,transparent_100%)]',
                    'dark:bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.16)_50%,transparent_100%)]',
                    '[background-size:200%_100%]',
                    'motion-safe:animate-shimmer'
                  )
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
