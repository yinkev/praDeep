'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

// ============================================================================
// Types
// ============================================================================

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageWrapperProps {
  children: React.ReactNode
  maxWidth?: 'narrow' | 'default' | 'wide' | '2xl' | 'full'
  className?: string
  showPattern?: boolean
  breadcrumbs?: BreadcrumbItem[]
}

// ============================================================================
// Max Width Classes
// ============================================================================

const maxWidthClasses = {
  narrow: 'max-w-xl',
  default: 'max-w-4xl',
  wide: 'max-w-6xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
}

// ============================================================================
// PageWrapper Component - Luminous Grid
// ============================================================================

export default function PageWrapper({
  children,
  maxWidth = 'default',
  className,
  showPattern = true,
  breadcrumbs,
}: PageWrapperProps) {
  return (
    <div className="relative min-h-full w-full">
      {/* Subtle background wash (no patterns / no gradients) */}
      {showPattern && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-surface-secondary/35 dark:bg-white/[0.03]"
        />
      )}

      <div
        className={cn('relative w-full mx-auto px-6 py-8', maxWidthClasses[maxWidth], className)}
      >
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-sm text-text-secondary"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              const content = crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-text-primary transition-colors duration-150"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'text-text-primary' : ''}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              )

              return (
                <span key={`${crumb.label}-${idx}`} className="flex items-center gap-2">
                  {content}
                  {!isLast && <span className="text-text-secondary/50">/</span>}
                </span>
              )
            })}
          </nav>
        )}

        {children}
      </div>
    </div>
  )
}

// ============================================================================
// PageHeader Component - Clean & Modern
// ============================================================================

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 mb-8 pb-6',
        'border-b border-border-subtle',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-raised">
            {icon}
          </div>
        )}
        <div>
          <h1
            className={cn(
              'text-2xl font-semibold tracking-tight text-text-primary',
              titleClassName
            )}
          >
            {title}
          </h1>
          {description && (
            <p className={cn('mt-1 text-text-secondary', descriptionClassName)}>{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
