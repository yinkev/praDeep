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
  default: cn('bg-surface-elevated', 'text-text-primary', 'shadow-sm'),
  elevated: cn('bg-surface-elevated', 'text-text-primary', 'shadow-md'),
  glass: cn(
    'bg-white/80 dark:bg-zinc-950/80',
    'backdrop-blur-sm',
    'text-text-primary',
    'shadow-sm'
  ),
  outlined: cn('bg-transparent', 'text-text-primary'),
}

const borderStyles: Record<CardVariant, string> = {
  default: 'border-border',
  elevated: 'border-border',
  glass: 'border-border/50',
  outlined: 'border-border',
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
          'relative overflow-hidden rounded-lg',
          // Variant styles
          variantStyles[variant],
          // Border
          border && 'border',
          border && borderStyles[variant],
          // Padding - only apply if no header (header has its own padding)
          !hasHeader && paddingStyles[padding],
          // Interactive hover effects - subtle lift and shadow enhancement
          interactive && [
            'transition-all duration-200 ease-out',
            'hover:shadow-md hover:-translate-y-0.5',
            'hover:border-zinc-300 dark:hover:border-zinc-700',
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
          'bg-surface-muted',
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

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Body: CardContent,
  Footer: CardFooter,
})

export default Card
