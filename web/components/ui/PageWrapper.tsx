'use client'

import React from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
}

export interface PageWrapperProps {
  children: React.ReactNode
  /** Maximum width constraint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
  /** Show subtle background pattern */
  showPattern?: boolean
  /** Additional CSS classes for the container */
  className?: string
  /** Disable entry animation */
  disableAnimation?: boolean
}

// ============================================================================
// Animation Variants
// ============================================================================

const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
    },
  },
}

const headerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: 0.1,
      ease: 'easeOut' as const,
    },
  },
}

const breadcrumbVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  },
}

// ============================================================================
// Max Width Mapping
// ============================================================================

const maxWidthClasses: Record<NonNullable<PageWrapperProps['maxWidth']>, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1440px]',
  full: 'max-w-full',
}

// ============================================================================
// PageHeader Sub-component
// ============================================================================

export function PageHeader({ title, description, actions, icon }: PageHeaderProps) {
  return (
    <motion.div
      variants={headerVariants}
      initial="hidden"
      animate="visible"
      className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-sm">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Breadcrumb Sub-component
// ============================================================================

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <motion.nav
      variants={breadcrumbVariants}
      initial="hidden"
      animate="visible"
      aria-label="Breadcrumb"
      className="mb-4"
    >
      <ol className="flex items-center gap-1 text-sm">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            {item.href && index !== items.length - 1 ? (
              <Link
                href={item.href}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-700 dark:text-slate-200 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </motion.nav>
  )
}

// ============================================================================
// Background Pattern Component
// ============================================================================

function BackgroundPattern() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 via-transparent to-slate-100/50 dark:from-teal-950/20 dark:via-transparent dark:to-slate-900/50" />

      {/* Dot pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.015] dark:opacity-[0.03]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="page-pattern"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#page-pattern)" />
      </svg>

      {/* Radial gradient accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-teal-200/20 via-transparent to-transparent dark:from-teal-800/10 blur-3xl" />
    </div>
  )
}

// ============================================================================
// PageWrapper Component
// ============================================================================

export default function PageWrapper({
  children,
  maxWidth = 'xl',
  breadcrumbs,
  showPattern = true,
  className = '',
  disableAnimation = false,
}: PageWrapperProps) {
  const containerClassName = `
    w-full mx-auto px-6 py-8
    ${maxWidthClasses[maxWidth]}
    ${className}
  `.trim()

  const content = (
    <>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      {children}
    </>
  )

  return (
    <div className="relative min-h-full">
      {showPattern && <BackgroundPattern />}

      {disableAnimation ? (
        <div className={containerClassName}>{content}</div>
      ) : (
        <motion.div
          variants={pageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={containerClassName}
        >
          {content}
        </motion.div>
      )}
    </div>
  )
}

// ============================================================================
// Compound Export
// ============================================================================

PageWrapper.Header = PageHeader
