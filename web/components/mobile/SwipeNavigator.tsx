'use client'

import { useCallback, type HTMLAttributes, type ReactNode, type TouchEventHandler } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSwipeGesture, type SwipeGestureConfig } from '@/hooks/useSwipeGesture'
import { cn } from '@/lib/utils'

export interface SwipeNavigatorProps
  extends SwipeGestureConfig,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      | 'children'
      | 'onTouchStart'
      | 'onTouchMove'
      | 'onTouchEnd'
      | 'onTouchCancel'
      | 'onAnimationStart'
      | 'onAnimationEnd'
      | 'onAnimationIteration'
      | 'onDrag'
      | 'onDragStart'
      | 'onDragEnd'
    > {
  children: ReactNode
  disabled?: boolean
  onTouchStart?: TouchEventHandler<HTMLDivElement>
  onTouchMove?: TouchEventHandler<HTMLDivElement>
  onTouchEnd?: TouchEventHandler<HTMLDivElement>
  onTouchCancel?: TouchEventHandler<HTMLDivElement>
}

export function SwipeNavigator({
  children,
  className,
  disabled = false,
  threshold,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTouchCancel,
  onTouchEnd,
  onTouchMove,
  onTouchStart,
  ...rest
}: SwipeNavigatorProps): ReactNode {
  const reduceMotion = useReducedMotion()
  const { handlers } = useSwipeGesture({
    threshold,
    onSwipeDown: disabled ? undefined : onSwipeDown,
    onSwipeLeft: disabled ? undefined : onSwipeLeft,
    onSwipeRight: disabled ? undefined : onSwipeRight,
    onSwipeUp: disabled ? undefined : onSwipeUp,
  })

  const handleTouchStart = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchStart?.(event)
      if (disabled || event.defaultPrevented) return
      handlers.onTouchStart(event)
    },
    [disabled, handlers, onTouchStart],
  )

  const handleTouchMove = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchMove?.(event)
      if (disabled || event.defaultPrevented) return
      handlers.onTouchMove(event)
    },
    [disabled, handlers, onTouchMove],
  )

  const handleTouchEnd = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchEnd?.(event)
      if (disabled || event.defaultPrevented) return
      handlers.onTouchEnd(event)
    },
    [disabled, handlers, onTouchEnd],
  )

  const handleTouchCancel = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchCancel?.(event)
      if (disabled || event.defaultPrevented) return
      handlers.onTouchEnd(event)
    },
    [disabled, handlers, onTouchCancel],
  )

  return (
    <motion.div
      className={cn('touch-manipulation', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

