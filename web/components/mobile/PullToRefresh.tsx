'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type TouchEventHandler,
} from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from 'framer-motion'
import { ArrowDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTouchPoint } from '@/lib/touch-utils'

type PullToRefreshStatus = 'idle' | 'pulling' | 'ready' | 'refreshing'

export interface PullToRefreshProps
  extends Omit<
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
    | 'onDragEnter'
    | 'onDragLeave'
    | 'onDragOver'
    | 'onDrop'
  > {
  children: ReactNode
  onRefresh: () => Promise<void>
  disabled?: boolean
  threshold?: number
  maxPullDistance?: number
  resistance?: number
  indicatorHeight?: number
  onTouchStart?: TouchEventHandler<HTMLDivElement>
  onTouchMove?: TouchEventHandler<HTMLDivElement>
  onTouchEnd?: TouchEventHandler<HTMLDivElement>
  onTouchCancel?: TouchEventHandler<HTMLDivElement>
}

const DEFAULT_THRESHOLD = 72
const DEFAULT_MAX_PULL_DISTANCE = 160
const DEFAULT_RESISTANCE = 0.55
const DEFAULT_INDICATOR_HEIGHT = 56

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function PullToRefresh({
  children,
  className,
  disabled = false,
  indicatorHeight: indicatorHeightProp,
  maxPullDistance: maxPullDistanceProp,
  onRefresh,
  onTouchCancel,
  onTouchEnd,
  onTouchMove,
  onTouchStart,
  resistance: resistanceProp,
  threshold: thresholdProp,
  ...rest
}: PullToRefreshProps): ReactNode {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startPointRef = useRef<{ x: number; y: number } | null>(null)
  const isMountedRef = useRef(true)
  const isRefreshingRef = useRef(false)
  const statusRef = useRef<PullToRefreshStatus>('idle')
  const isArmedRef = useRef(false)
  const animationRef = useRef<AnimationPlaybackControls | null>(null)

  const threshold =
    typeof thresholdProp === 'number' && Number.isFinite(thresholdProp)
      ? Math.max(1, thresholdProp)
      : DEFAULT_THRESHOLD
  const indicatorHeight =
    typeof indicatorHeightProp === 'number' && Number.isFinite(indicatorHeightProp)
      ? Math.max(1, indicatorHeightProp)
      : DEFAULT_INDICATOR_HEIGHT
  const resistance =
    typeof resistanceProp === 'number' && Number.isFinite(resistanceProp)
      ? clamp(resistanceProp, 0.1, 1)
      : DEFAULT_RESISTANCE
  const maxPullDistance =
    typeof maxPullDistanceProp === 'number' && Number.isFinite(maxPullDistanceProp)
      ? Math.max(threshold, maxPullDistanceProp)
      : Math.max(DEFAULT_MAX_PULL_DISTANCE, threshold * 2)
  const holdDistance = Math.min(indicatorHeight, threshold)

  const pullY = useMotionValue(0)
  const progress = useTransform(pullY, [0, threshold], [0, 1])
  const indicatorY = useTransform(pullY, value => value - indicatorHeight)
  const indicatorOpacity = useTransform(pullY, [0, indicatorHeight * 0.35, indicatorHeight], [0, 0.75, 1])
  const arrowRotate = useTransform(progress, [0, 1], [0, 180])

  const [status, setStatus] = useState<PullToRefreshStatus>('idle')
  const [isArmed, setIsArmed] = useState(false)

  const stopAnimation = useCallback(() => {
    animationRef.current?.stop()
    animationRef.current = null
  }, [])

  const animatePullTo = useCallback(
    (value: number) => {
      stopAnimation()
      animationRef.current = animate(
        pullY,
        value,
        reduceMotion
          ? { duration: 0.001 }
          : { type: 'spring', damping: 28, stiffness: 360, mass: 0.8 },
      )
    },
    [pullY, reduceMotion, stopAnimation],
  )

  const setStatusIfChanged = useCallback((next: PullToRefreshStatus) => {
    if (statusRef.current === next) return
    statusRef.current = next
    setStatus(next)
  }, [])

  const setArmedIfChanged = useCallback((next: boolean) => {
    if (isArmedRef.current === next) return
    isArmedRef.current = next
    setIsArmed(next)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      stopAnimation()
    }
  }, [stopAnimation])

  const atTop = useCallback(() => {
    const container = containerRef.current
    if (!container) return false
    return container.scrollTop <= 0
  }, [])

  const resetPull = useCallback(() => {
    startPointRef.current = null
    setArmedIfChanged(false)
    setStatusIfChanged('idle')
    animatePullTo(0)
  }, [animatePullTo, setArmedIfChanged, setStatusIfChanged])

  const handleTouchStart = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchStart?.(event)
      if (disabled || event.defaultPrevented) return
      if (isRefreshingRef.current) return
      if (!atTop()) return

      startPointRef.current = getTouchPoint(event)
      stopAnimation()
      pullY.set(0)
      setArmedIfChanged(false)
      setStatusIfChanged('idle')
    },
    [atTop, disabled, onTouchStart, pullY, setArmedIfChanged, setStatusIfChanged, stopAnimation],
  )

  const handleTouchMove = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchMove?.(event)
      if (disabled || event.defaultPrevented) return
      if (isRefreshingRef.current) return

      const start = startPointRef.current
      if (!start) return

      if (!atTop()) {
        resetPull()
        return
      }

      const point = getTouchPoint(event)
      const dx = point.x - start.x
      const dy = point.y - start.y

      if (Math.abs(dx) > Math.abs(dy) && pullY.get() === 0) return
      if (dy <= 0) {
        resetPull()
        return
      }

      if (event.cancelable) event.preventDefault()

      const nextPull = clamp(dy * resistance, 0, maxPullDistance)
      pullY.set(nextPull)

      const nextArmed = nextPull >= threshold
      setArmedIfChanged(nextArmed)
      setStatusIfChanged(nextArmed ? 'ready' : 'pulling')
    },
    [
      atTop,
      disabled,
      maxPullDistance,
      onTouchMove,
      pullY,
      resetPull,
      resistance,
      setArmedIfChanged,
      setStatusIfChanged,
      threshold,
    ],
  )

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    setArmedIfChanged(false)
    setStatusIfChanged('refreshing')
    animatePullTo(holdDistance)

    try {
      await onRefresh()
    } catch {
      // Swallow to ensure we always reset the pull animation.
    }

    if (!isMountedRef.current) return

    isRefreshingRef.current = false
    setStatusIfChanged('idle')
    animatePullTo(0)
  }, [animatePullTo, holdDistance, onRefresh, setArmedIfChanged, setStatusIfChanged])

  const handleTouchEnd = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchEnd?.(event)
      if (disabled || event.defaultPrevented) return

      const shouldRefresh = pullY.get() >= threshold
      startPointRef.current = null

      if (!shouldRefresh || isRefreshingRef.current) {
        resetPull()
        return
      }

      void refresh()
    },
    [disabled, onTouchEnd, pullY, refresh, resetPull, threshold],
  )

  const handleTouchCancel = useCallback<TouchEventHandler<HTMLDivElement>>(
    event => {
      onTouchCancel?.(event)
      if (disabled || event.defaultPrevented) return
      startPointRef.current = null
      resetPull()
    },
    [disabled, onTouchCancel, resetPull],
  )

  const label = useMemo(() => {
    if (status === 'refreshing') return 'Refreshing…'
    if (status === 'ready') return 'Release to refresh'
    return 'Pull to refresh'
  }, [status])

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative overflow-y-auto overscroll-contain', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      {...rest}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-end justify-center"
        style={{
          height: indicatorHeight,
          y: indicatorY,
          opacity: indicatorOpacity,
        }}
      >
        <div
          className={cn(
            'mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5',
            'border border-border/70 bg-surface-elevated/90 text-text-secondary shadow-sm backdrop-blur',
            isArmed && 'text-text-primary',
          )}
        >
          {status === 'refreshing' ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <motion.span style={{ rotate: arrowRotate }} className="inline-flex">
              <ArrowDown className="h-4 w-4" />
            </motion.span>
          )}
          <span className="text-xs font-semibold">{label}</span>
        </div>
      </motion.div>

      <motion.div style={{ y: pullY }}>{children}</motion.div>
    </motion.div>
  )
}
