'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

// Cloud Dancer palette - soft off-white tones
const cloudDancer = {
  base: '#F0EAD6',
  light: '#F7F4EC',
  lighter: '#FDFCFA',
  border: '#E8E2D0',
  borderLight: '#F0EAD680',
}

type CardVariant = 'glass' | 'solid' | 'outlined'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant
  children?: React.ReactNode
  className?: string
  hoverEffect?: boolean
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<CardVariant, string> = {
  glass: `
    bg-white/40 dark:bg-slate-900/40
    backdrop-blur-xl
    border border-white/30 dark:border-slate-700/30
    shadow-lg shadow-black/5
  `,
  solid: `
    bg-[#F7F4EC] dark:bg-slate-800
    border border-[#E8E2D0] dark:border-slate-700
    shadow-md
  `,
  outlined: `
    bg-transparent
    border-2 border-[#E8E2D0] dark:border-slate-600
  `,
}

const hoverVariants = {
  initial: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  },
  hover: {
    y: -4,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
}

export function Card({
  variant = 'glass',
  children,
  className = '',
  hoverEffect = true,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`
        rounded-2xl overflow-hidden
        ${variantStyles[variant]}
        ${className}
      `}
      initial="initial"
      whileHover={hoverEffect ? 'hover' : undefined}
      variants={hoverEffect ? hoverVariants : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div
      className={`
        px-6 py-4
        border-b border-[#E8E2D080] dark:border-slate-700/50
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={`
        px-6 py-4
        border-t border-[#E8E2D080] dark:border-slate-700/50
        bg-[#F0EAD620] dark:bg-slate-800/30
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Compound component pattern - attach subcomponents
Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
