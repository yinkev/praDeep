'use client'

import React, { forwardRef, useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type InputSize = 'sm' | 'md' | 'lg'

const hasNonEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  return String(value).length > 0
}

const useErrorShake = (error?: string, durationMs: number = 360): boolean => {
  const [shouldShake, setShouldShake] = useState(false)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!error) return

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)

    rafRef.current = requestAnimationFrame(() => setShouldShake(true))
    timeoutRef.current = window.setTimeout(() => setShouldShake(false), durationMs)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
      rafRef.current = null
      timeoutRef.current = null
    }
  }, [durationMs, error])

  return shouldShake
}

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
    BaseInputProps {
  /** Show success state with checkmark */
  success?: boolean
}

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    BaseInputProps {
  /** Minimum number of rows */
  minRows?: number
  /** Maximum number of rows (for auto-resize) */
  maxRows?: number
  /** Show success state with checkmark */
  success?: boolean
}

// ============================================================================
// Styles - MICRO-INDUSTRIALISM
// ============================================================================

const sizeStyles: Record<InputSize, { input: string; label: string; icon: string }> = {
  sm: {
    input: 'h-8 px-2.5 text-sm',
    label: 'text-xs',
    icon: 'w-4 h-4',
  },
  md: {
    input: 'h-10 px-3 text-sm',
    label: 'text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    input: 'h-12 px-4 text-base',
    label: 'text-sm',
    icon: 'w-5 h-5',
  },
}

const baseInputStyles = cn(
  'w-full',
  'bg-surface-elevated',
  'border border-border',
  'rounded-md',
  'text-text-primary',
  'placeholder:text-text-quaternary placeholder:transition-colors placeholder:duration-200',
  'shadow-none',
  'outline-none',
  'transition-[border-color,box-shadow,background-color] duration-200 ease-out-expo'
)

// Clean focus with accent color and subtle ring
const focusStyles = cn(
  'focus:border-accent-primary',
  'focus:ring-2 focus:ring-accent-primary/10',
  'focus:placeholder:text-text-tertiary'
)

const hoverStyles = cn('hover:border-border-strong enabled:hover:bg-surface-secondary')

const errorStyles = cn(
  'border-semantic-error',
  'focus:border-semantic-error',
  'focus:ring-2 focus:ring-semantic-error/10'
)

const successStyles = cn(
  'border-semantic-success',
  'focus:border-semantic-success',
  'focus:ring-2 focus:ring-semantic-success/10'
)

const disabledStyles = cn(
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'disabled:bg-surface-secondary'
)

// ============================================================================
// Input Component
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      floatingLabel = false,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      wrapperClassName,
      className,
      id,
      disabled,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const describedById = `${inputId}-description`
    const [isFocused, setIsFocused] = useState(false)
    const isControlled = value !== undefined
    const [uncontrolledHasValue, setUncontrolledHasValue] = useState(() =>
      hasNonEmptyValue(defaultValue)
    )
    const valueHasValue = hasNonEmptyValue(value)
    const hasValue = isControlled ? valueHasValue : uncontrolledHasValue
    const shouldShake = useErrorShake(error)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      if (!isControlled) setUncontrolledHasValue(hasNonEmptyValue(e.target.value))
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setUncontrolledHasValue(hasNonEmptyValue(e.target.value))
      onChange?.(e)
    }

    const styles = sizeStyles[size]
    const hasLeftIcon = Boolean(leftIcon)
    const showSuccessIcon = success && !error && !disabled
    const hasRightIcon = Boolean(rightIcon) || showSuccessIcon

    const isFloatingActive = isFocused || hasValue

    return (
      <div className={cn('relative', wrapperClassName)}>
        {/* Standard Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              'mb-1.5 block font-medium text-text-secondary',
              styles.label,
              error && 'text-semantic-error'
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className={cn('relative', shouldShake && 'motion-safe:animate-shake')}>
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 z-10 -translate-y-1/2 text-text-tertiary transition-colors duration-200 ease-out-expo',
                isFocused && !error && !success && 'text-accent-primary',
                error && 'text-semantic-error',
                success && !error && 'text-semantic-success',
                disabled && 'opacity-50',
                styles.icon
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Floating Label */}
          {label && floatingLabel && (
            <label
              htmlFor={inputId}
              className={cn(
                'pointer-events-none absolute z-10 transition-all duration-200 ease-out-expo',
                hasLeftIcon ? 'left-10' : 'left-3',
                isFloatingActive ? 'top-1 text-xs' : 'top-1/2 -translate-y-1/2 text-sm',
                isFocused && !error && !success
                  ? 'text-accent-primary'
                  : error
                    ? 'text-semantic-error'
                    : success && !error
                      ? 'text-semantic-success'
                      : 'text-text-tertiary'
              )}
            >
              {label}
            </label>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error || helperText ? describedById : undefined}
            className={cn(
              baseInputStyles,
              error ? errorStyles : success ? successStyles : cn(focusStyles, hoverStyles),
              disabledStyles,
              styles.input,
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              floatingLabel && 'pt-5 pb-1',
              className
            )}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && !showSuccessIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 z-10 -translate-y-1/2 text-text-tertiary transition-colors duration-200 ease-out-expo',
                isFocused && !error && !success && 'text-accent-primary',
                error && 'text-semantic-error',
                success && !error && 'text-semantic-success',
                disabled && 'opacity-50',
                styles.icon
              )}
            >
              {rightIcon}
            </div>
          )}

          {/* Success Checkmark */}
          {showSuccessIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 z-10 -translate-y-1/2 text-semantic-success motion-safe:animate-scale-in',
                styles.icon
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-full w-full"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={describedById}
            className="mt-1.5 text-xs text-semantic-error motion-safe:animate-fade-in"
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={describedById}
            className="mt-1.5 text-xs text-text-tertiary motion-safe:animate-fade-in"
          >
            {helperText}
          </p>
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
      success,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      wrapperClassName,
      className,
      id,
      disabled,
      value,
      defaultValue,
      minRows = 3,
      maxRows,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const describedById = `${inputId}-description`
    const [isFocused, setIsFocused] = useState(false)
    const isControlled = value !== undefined
    const [uncontrolledHasValue, setUncontrolledHasValue] = useState(() =>
      hasNonEmptyValue(defaultValue)
    )
    const valueHasValue = hasNonEmptyValue(value)
    const hasValue = isControlled ? valueHasValue : uncontrolledHasValue
    const shouldShake = useErrorShake(error)

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      if (!isControlled) setUncontrolledHasValue(hasNonEmptyValue(e.target.value))
      onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setUncontrolledHasValue(hasNonEmptyValue(e.target.value))
      onChange?.(e)
    }

    const styles = sizeStyles[size]

    const isFloatingActive = isFocused || hasValue
    const hasLeftIcon = Boolean(leftIcon)
    const showSuccessIcon = success && !error && !disabled
    const hasRightIcon = Boolean(rightIcon) || showSuccessIcon

    // Calculate min/max height based on rows
    const lineHeight = size === 'sm' ? 20 : size === 'md' ? 22 : 26
    const minHeight = minRows * lineHeight
    const maxHeight = maxRows ? maxRows * lineHeight : undefined

    return (
      <div className={cn('relative', wrapperClassName)}>
        {/* Standard Label */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              'mb-1.5 block font-medium text-text-secondary',
              styles.label,
              error && 'text-semantic-error'
            )}
          >
            {label}
          </label>
        )}

        {/* Textarea Container */}
        <div className={cn('relative', shouldShake && 'motion-safe:animate-shake')}>
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-3 z-10 text-text-tertiary transition-colors duration-200 ease-out-expo',
                isFocused && !error && !success && 'text-accent-primary',
                error && 'text-semantic-error',
                success && !error && 'text-semantic-success',
                disabled && 'opacity-50',
                styles.icon
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Floating Label */}
          {label && floatingLabel && (
            <label
              htmlFor={inputId}
              className={cn(
                'pointer-events-none absolute z-10 transition-all duration-200 ease-out-expo',
                hasLeftIcon ? 'left-10' : 'left-3',
                isFloatingActive ? 'top-2 text-xs' : 'top-3 text-sm',
                isFocused && !error && !success
                  ? 'text-accent-primary'
                  : error
                    ? 'text-semantic-error'
                    : success && !error
                      ? 'text-semantic-success'
                      : 'text-text-tertiary'
              )}
            >
              {label}
            </label>
          )}

          {/* Textarea Field */}
          <textarea
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              minHeight: `${minHeight}px`,
              maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            }}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error || helperText ? describedById : undefined}
            className={cn(
              baseInputStyles,
              error ? errorStyles : success ? successStyles : cn(focusStyles, hoverStyles),
              disabledStyles,
              'px-3 py-2.5 text-sm',
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              floatingLabel && 'pt-6',
              'resize-y',
              className
            )}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && !showSuccessIcon && (
            <div
              className={cn(
                'absolute right-3 top-3 z-10 text-text-tertiary transition-colors duration-200 ease-out-expo',
                isFocused && !error && !success && 'text-accent-primary',
                error && 'text-semantic-error',
                success && !error && 'text-semantic-success',
                disabled && 'opacity-50',
                styles.icon
              )}
            >
              {rightIcon}
            </div>
          )}

          {/* Success Checkmark */}
          {showSuccessIcon && (
            <div
              className={cn(
                'absolute right-3 top-3 z-10 text-semantic-success motion-safe:animate-scale-in',
                styles.icon
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-full w-full"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={describedById}
            className="mt-1.5 text-xs text-semantic-error motion-safe:animate-fade-in"
          >
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={describedById}
            className="mt-1.5 text-xs text-text-tertiary motion-safe:animate-fade-in"
          >
            {helperText}
          </p>
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
