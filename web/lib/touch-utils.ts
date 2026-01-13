import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'

export type TouchPoint = { x: number; y: number }

type TouchPointEvent =
  | TouchEvent
  | MouseEvent
  | ReactTouchEvent<Element>
  | ReactMouseEvent<Element>

export function addPassiveEventListener<TEvent extends Event = Event>(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  type: string,
  listener: (event: TEvent) => void,
  options: AddEventListenerOptions = {},
): () => void {
  const passiveOptions: AddEventListenerOptions = { ...options, passive: true }
  target.addEventListener(type, listener as unknown as EventListener, passiveOptions)

  return () => {
    target.removeEventListener(type, listener as unknown as EventListener, passiveOptions)
  }
}

const MIN_SWIPE_VELOCITY_PX_PER_MS = 0.3

export function getTouchPoint(event: TouchPointEvent): TouchPoint {
  const maybeTouchEvent = event as Partial<TouchEvent>
  const touches = maybeTouchEvent.touches?.length
    ? maybeTouchEvent.touches
    : maybeTouchEvent.changedTouches

  const touch = touches?.length ? touches[0] : null
  if (touch && typeof touch.clientX === 'number' && typeof touch.clientY === 'number') {
    return { x: touch.clientX, y: touch.clientY }
  }

  const maybeMouseEvent = event as Partial<MouseEvent>
  if (
    typeof maybeMouseEvent.clientX === 'number' &&
    typeof maybeMouseEvent.clientY === 'number'
  ) {
    return { x: maybeMouseEvent.clientX, y: maybeMouseEvent.clientY }
  }

  return { x: 0, y: 0 }
}

export function calculateVelocity(
  startPos: TouchPoint,
  endPos: TouchPoint,
  startTime: number,
  endTime: number,
): number {
  const duration = endTime - startTime
  if (!Number.isFinite(duration) || duration <= 0) return 0

  const distance = Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y)
  return distance / duration
}

export function isSwipeGesture(distance: number, velocity: number, threshold: number): boolean {
  const safeThreshold = Number.isFinite(threshold) && threshold > 0 ? threshold : 0
  const absDistance = Math.abs(distance)
  const absVelocity = Math.abs(velocity)

  if (absDistance >= safeThreshold) return true
  return absDistance >= safeThreshold * 0.5 && absVelocity >= MIN_SWIPE_VELOCITY_PX_PER_MS
}

let pullToRefreshDisabled = false

export function preventPullToRefresh(): void {
  if (typeof window === 'undefined') return
  if (pullToRefreshDisabled) return
  pullToRefreshDisabled = true

  const { documentElement, body } = document
  documentElement.style.overscrollBehaviorY = 'none'
  body.style.overscrollBehaviorY = 'none'
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate !== 'function') return

  const pattern = type === 'heavy' ? 30 : type === 'medium' ? 20 : 10
  navigator.vibrate(pattern)
}
