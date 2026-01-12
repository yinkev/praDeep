'use client'

import React, { forwardRef, useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// Types
// ============================================================================

type InputSize = 'sm' | 'md' | 'lg'

interface BaseInputProps {
  /** Label text for the input */
  label?: string
  /** Use floating label style */
  floatingLabel?: boolean
  /** Error message to display */
  error?: string
  /** Helper text below input */
  helperText?: string
  /** Icon to show on the left side */
  leftIcon?: React.ReactNode
  /** Icon to show on the right side */
  rightIcon?: React.ReactNode
  /** Input size variant */
  size?: InputSize
  /** Additional class names for wrapper */
  wrapperClassName?: string
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    BaseInputProps {}

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    BaseInputProps {
  /** Minimum number of rows */
  minRows?: number
  /** Maximum number of rows (for auto-resize) */
  maxRows?: number
}

// ============================================================================
// Styles
// ============================================================================

const sizeStyles: Record<InputSize, { input: string; label: string; icon: string }> = {
  sm: {
    input: 'px-3 py-1.5 text-sm',
    label: 'text-xs',
    icon: 'w-4 h-4',
  },
  md: {
    input: 'px-4 py-2.5 text-sm',
    label: 'text-sm',
    icon: 'w-5 h-5',
  },
  lg: {
    input: 'px-5 py-3.5 text-base',
    label: 'text-base',
    icon: 'w-6 h-6',
  },
}

const baseInputStyles = `
  w-full rounded-xl
  bg-slate-50/80 dark:bg-slate-800/50
  border border-slate-200/60 dark:border-slate-700/60
  text-slate-900 dark:text-slate-100
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  transition-all duration-300 ease-out
  outline-none
  backdrop-blur-sm
`

const focusStyles = `
  focus:border-teal-400/60 dark:focus:border-teal-500/60
  focus:ring-2 focus:ring-teal-400/20 dark:focus:ring-teal-500/20
  focus:bg-white dark:focus:bg-slate-800/80
  focus:shadow-lg focus:shadow-teal-500/10
`

const errorStyles = `
  border-red-400/60 dark:border-red-500/60
  focus:border-red-400 dark:focus:border-red-500
  focus:ring-red-400/20 dark:focus:ring-red-500/20
`

const disabledStyles = `
  disabled:opacity-50 disabled:cursor-not-allowed
  disabled:bg-slate-100 dark:disabled:bg-slate-800
`

// ============================================================================
// Animations
// ============================================================================

const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
  transition: {
    duration: 0.5,
    ease: 'easeInOut' as const,
  },
}

const floatingLabelVariants = {
  default: {
    y: 0,
    scale: 1,
    color: 'var(--label-color-default)',
  },
  focused: {
    y: -24,
    scale: 0.85,
    color: 'var(--label-color-focused)',
  },
  filled: {
    y: -24,
    scale: 0.85,
    color: 'var(--label-color-default)',
  },
}

const errorMessageVariants = {
  initial: { opacity: 0, y: -8, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -8, height: 0 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.95 },
  focused: { opacity: 1, scale: 1 },
}

// ============================================================================
// Input Component
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      floatingLabel = false,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      wrapperClassName = '',
      className = '',
      id,
      disabled,
      value,
      defaultValue,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(Boolean(value || defaultValue))

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(Boolean(e.target.value))
      onBlur?.(e)
    }

    const styles = sizeStyles[size]
    const hasLeftIcon = Boolean(leftIcon)
    const hasRightIcon = Boolean(rightIcon)

    const getLabelState = () => {
      if (isFocused) return 'focused'
      if (hasValue || value) return 'filled'
      return 'default'
    }

    return (
      <div className={`relative ${wrapperClassName}`}>
        {/* Standard Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className={`
              block mb-1.5 font-medium text-slate-700 dark:text-slate-300
              ${styles.label}
              ${error ? 'text-red-500 dark:text-red-400' : ''}
            `}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <motion.div className="relative" animate={error ? shakeAnimation : {}}>
          {/* Glass Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/20 to-cyan-400/20 blur-xl"
            variants={glowVariants}
            initial="initial"
            animate={isFocused ? 'focused' : 'initial'}
            transition={{ duration: 0.3 }}
          />

          {/* Left Icon */}
          {leftIcon && (
            <div
              className={`
                absolute left-3 top-1/2 -translate-y-1/2 z-10
                text-slate-400 dark:text-slate-500
                ${isFocused ? 'text-teal-500 dark:text-teal-400' : ''}
                ${error ? 'text-red-400 dark:text-red-500' : ''}
                transition-colors duration-200
                ${styles.icon}
              `}
            >
              {leftIcon}
            </div>
          )}

          {/* Floating Label */}
          {label && floatingLabel && (
            <motion.label
              htmlFor={inputId}
              className={`
                absolute left-4 top-1/2 -translate-y-1/2 z-10
                pointer-events-none origin-left
                ${styles.label}
                ${hasLeftIcon ? 'left-10' : ''}
              `}
              style={
                {
                  '--label-color-default': 'rgb(100 116 139)',
                  '--label-color-focused': error ? 'rgb(239 68 68)' : 'rgb(20 184 166)',
                } as React.CSSProperties
              }
              variants={floatingLabelVariants}
              initial="default"
              animate={getLabelState()}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              ${baseInputStyles}
              ${focusStyles}
              ${error ? errorStyles : ''}
              ${disabledStyles}
              ${styles.input}
              ${hasLeftIcon ? 'pl-10' : ''}
              ${hasRightIcon ? 'pr-10' : ''}
              ${floatingLabel ? 'pt-4' : ''}
              relative z-[1]
              ${className}
            `}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div
              className={`
                absolute right-3 top-1/2 -translate-y-1/2 z-10
                text-slate-400 dark:text-slate-500
                ${isFocused ? 'text-teal-500 dark:text-teal-400' : ''}
                ${error ? 'text-red-400 dark:text-red-500' : ''}
                transition-colors duration-200
                ${styles.icon}
              `}
            >
              {rightIcon}
            </div>
          )}
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="mt-1.5 text-xs text-red-500 dark:text-red-400"
              variants={errorMessageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ============================================================================
// Textarea Component
// ============================================================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      floatingLabel = false,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      wrapperClassName = '',
      className = '',
      id,
      disabled,
      value,
      defaultValue,
      minRows = 3,
      maxRows,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(Boolean(value || defaultValue))

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      setHasValue(Boolean(e.target.value))
      onBlur?.(e)
    }

    const styles = sizeStyles[size]

    const getLabelState = () => {
      if (isFocused) return 'focused'
      if (hasValue || value) return 'filled'
      return 'default'
    }

    // Calculate min/max height based on rows
    const lineHeight = size === 'sm' ? 20 : size === 'md' ? 22 : 26
    const minHeight = minRows * lineHeight
    const maxHeight = maxRows ? maxRows * lineHeight : undefined

    return (
      <div className={`relative ${wrapperClassName}`}>
        {/* Standard Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className={`
              block mb-1.5 font-medium text-slate-700 dark:text-slate-300
              ${styles.label}
              ${error ? 'text-red-500 dark:text-red-400' : ''}
            `}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <motion.div className="relative" animate={error ? shakeAnimation : {}}>
          {/* Glass Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/20 to-cyan-400/20 blur-xl"
            variants={glowVariants}
            initial="initial"
            animate={isFocused ? 'focused' : 'initial'}
            transition={{ duration: 0.3 }}
          />

          {/* Floating Label */}
          {label && floatingLabel && (
            <motion.label
              htmlFor={inputId}
              className={`
                absolute left-4 top-4 z-10
                pointer-events-none origin-left
                ${styles.label}
              `}
              style={
                {
                  '--label-color-default': 'rgb(100 116 139)',
                  '--label-color-focused': error ? 'rgb(239 68 68)' : 'rgb(20 184 166)',
                } as React.CSSProperties
              }
              variants={{
                default: { y: 0, scale: 1, color: 'var(--label-color-default)' },
                focused: { y: -12, scale: 0.85, color: 'var(--label-color-focused)' },
                filled: { y: -12, scale: 0.85, color: 'var(--label-color-default)' },
              }}
              initial="default"
              animate={getLabelState()}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {label}
            </motion.label>
          )}

          {/* Textarea Field */}
          <textarea
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              minHeight: `${minHeight}px`,
              maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            }}
            className={`
              ${baseInputStyles}
              ${focusStyles}
              ${error ? errorStyles : ''}
              ${disabledStyles}
              ${styles.input}
              ${floatingLabel ? 'pt-6' : ''}
              relative z-[1]
              resize-y
              ${className}
            `}
            {...props}
          />
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="mt-1.5 text-xs text-red-500 dark:text-red-400"
              variants={errorMessageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// ============================================================================
// Default Export
// ============================================================================

export default Input
