'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Card Component - Liquid Cloud Design System
 * Clean, elevated surfaces with Notion/Linear aesthetics
 */

export type CardVariant = 'default' | 'elevated' | 'glass' | 'outlined'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

type DivProps = React.ComponentPropsWithoutRef<'div'>

export interface CardProps extends Omit<DivProps, 'title'> {
  variant?: CardVariant
  interactive?: boolean
  padding?: CardPadding
  border?: boolean
  title?: React.ReactNode
  description?: React.ReactNode
}

export interface CardSectionProps extends DivProps {
  padding?: CardPadding
}

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

const headerPaddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'px-4 py-3',
  md: 'px-6 py-4',
  lg: 'px-8 py-5',
}

const footerPaddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'px-4 py-3',
  md: 'px-6 py-4',
  lg: 'px-8 py-5',
}

const variantStyles: Record<CardVariant, string> = {
  default: cn(
    'bg-surface-elevated',
    'text-text-primary',
    'shadow-sm',
    // Dark mode elevation
    'dark:shadow-zinc-950/50'
  ),
  elevated: cn(
    'bg-surface-elevated',
    'text-text-primary',
    'shadow-md',
    // Enhanced dark mode shadow
    'dark:shadow-zinc-950/60'
  ),
  glass: cn(
    'bg-white/70 dark:bg-zinc-950/70',
    'backdrop-blur-md',
    'text-text-primary',
    'shadow-sm',
    'dark:shadow-zinc-950/40'
  ),
  outlined: cn('bg-transparent', 'text-text-primary', 'shadow-none'),
}

const borderStyles: Record<CardVariant, string> = {
  default: 'border-border',
  elevated: 'border-border',
  glass: 'border-border/50 dark:border-border/30',
  outlined: 'border-border',
}

// Interactive hover styles per variant
const interactiveHoverStyles: Record<CardVariant, string> = {
  default: cn(
    'hover:shadow-lg',
    'hover:border-zinc-300/80 dark:hover:border-zinc-600/60',
    // Subtle border glow
    'hover:ring-1 hover:ring-zinc-200/50 dark:hover:ring-zinc-700/50'
  ),
  elevated: cn(
    'hover:shadow-xl',
    'hover:border-zinc-300/80 dark:hover:border-zinc-600/60',
    'hover:ring-1 hover:ring-zinc-200/50 dark:hover:ring-zinc-700/50'
  ),
  glass: cn(
    'hover:shadow-lg',
    'hover:bg-white/90 dark:hover:bg-zinc-950/90',
    'hover:border-border/70 dark:hover:border-border/40',
    'hover:ring-1 hover:ring-zinc-200/30 dark:hover:ring-zinc-700/30'
  ),
  outlined: cn(
    'hover:bg-surface-muted/50',
    'hover:border-zinc-400 dark:hover:border-zinc-500',
    'hover:shadow-sm'
  ),
}

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      interactive = false,
      padding = 'md',
      border = true,
      title,
      description,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const hasHeader = title || description

    return (
      <div
        ref={ref}
        className={cn(
          // Base - rounded-lg (12px) for card aesthetic
          'relative overflow-hidden rounded-2xl',
          // Variant styles
          variantStyles[variant],
          // Border
          border && 'border',
          border && borderStyles[variant],
          // Padding - only apply if no header (header has its own padding)
          !hasHeader && paddingStyles[padding],
          // Interactive states with premium micro-interactions
          interactive && [
            // Smooth transitions (120–200ms)
            'transition-all duration-200',
            '[transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)]',
            // Hover: -2px lift, shadow increase, border glow
            'hover:-translate-y-[2px]',
            interactiveHoverStyles[variant],
            // Active/pressed state: slight scale down
            'active:scale-[0.99] active:translate-y-0',
            // Focus-within for keyboard navigation
            'focus-within:outline-none',
            'focus-within:ring-2 focus-within:ring-zinc-400/50 dark:focus-within:ring-zinc-500/50',
            'focus-within:ring-offset-2 focus-within:ring-offset-surface',
            // Focus-visible for better accessibility
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-400/50',
            'has-[:focus-visible]:ring-offset-2',
            // Cursor pointer for interactive cards
            'cursor-pointer',
            // Prevent text selection on interactive cards
            'select-none',
          ],
          className
        )}
        {...props}
      >
        {hasHeader && (
          <CardHeader padding={padding}>
            {title && (
              <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
            )}
            {description && <p className="text-sm text-text-secondary">{description}</p>}
          </CardHeader>
        )}
        {hasHeader ? <CardContent padding={padding}>{children}</CardContent> : children}
      </div>
    )
  }
)
CardRoot.displayName = 'Card'

/**
 * CardHeader - Top section with bottom border
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ padding = 'md', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-1',
          'border-b border-border',
          // Dark mode border
          'dark:border-zinc-800',
          headerPaddingStyles[padding],
          className
        )}
        {...props}
      />
    )
  }
)
CardHeader.displayName = 'CardHeader'

/**
 * CardContent - Main content area
 */
export const CardContent = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ padding = 'md', className, ...props }, ref) => {
    return <div ref={ref} className={cn(paddingStyles[padding], className)} {...props} />
  }
)
CardContent.displayName = 'CardContent'

/**
 * CardFooter - Bottom section with top border
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ padding = 'md', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          'border-t border-border',
          // Dark mode border
          'dark:border-zinc-800',
          'bg-surface-muted',
          // Enhanced dark mode background
          'dark:bg-zinc-900/50',
          footerPaddingStyles[padding],
          className
        )}
        {...props}
      />
    )
  }
)
CardFooter.displayName = 'CardFooter'

// Backwards compatibility
export const CardBody = CardContent

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Body: CardContent,
  Footer: CardFooter,
  Title: CardTitle,
  Description: CardDescription,
})

export default Card
