import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isSwipeGesture } from "@/lib/touch-utils";

export type SwipeDirection = "left" | "right" | "up" | "down" | null;

export interface SwipeGestureConfig {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeState {
  isSwiping: boolean;
  direction: SwipeDirection;
  distance: number;
}

type LockedAxis = "x" | "y" | null;

type TouchLike = {
  timeStamp?: number;
  touches?: ArrayLike<{
    identifier?: number;
    clientX: number;
    clientY: number;
  }>;
  changedTouches?: ArrayLike<{
    identifier?: number;
    clientX: number;
    clientY: number;
  }>;
};

const DEFAULT_THRESHOLD = 50;
const AXIS_LOCK_THRESHOLD_PX = 8;

function getEventTime(event: TouchLike): number {
  if (typeof event.timeStamp === "number" && Number.isFinite(event.timeStamp)) {
    return event.timeStamp;
  }
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function findTouchByIdentifier(
  touches: ArrayLike<{ identifier?: number; clientX: number; clientY: number }> | undefined,
  identifier: number | null,
) {
  if (!touches?.length) return null;
  if (identifier == null) return touches[0] ?? null;

  for (let i = 0; i < touches.length; i += 1) {
    const touch = touches[i];
    if (touch?.identifier === identifier) return touch;
  }

  return null;
}

function getDominantDirection(dx: number, dy: number): { direction: SwipeDirection; distance: number } {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX === 0 && absY === 0) return { direction: null, distance: 0 };
  if (absX === absY) return { direction: null, distance: absX };

  if (absX > absY) {
    return { direction: dx > 0 ? "right" : "left", distance: absX };
  }

  return { direction: dy > 0 ? "down" : "up", distance: absY };
}

function getDirectionForLockedAxis(
  axis: LockedAxis,
  dx: number,
  dy: number,
): { direction: SwipeDirection; distance: number } {
  if (axis === "x") {
    const distance = Math.abs(dx);
    if (distance === 0) return { direction: null, distance: 0 };
    return { direction: dx > 0 ? "right" : "left", distance };
  }

  if (axis === "y") {
    const distance = Math.abs(dy);
    if (distance === 0) return { direction: null, distance: 0 };
    return { direction: dy > 0 ? "down" : "up", distance };
  }

  return getDominantDirection(dx, dy);
}

export function useSwipeGesture(config: SwipeGestureConfig = {}) {
  const { threshold = DEFAULT_THRESHOLD, onSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp } =
    config;

  const configRef = useRef({
    threshold,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
  });

  useEffect(() => {
    configRef.current = {
      threshold,
      onSwipeDown,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
    };
  }, [onSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp, threshold]);

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    distance: 0,
  });

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const lockedAxisRef = useRef<LockedAxis>(null);
  const globalListenersAttachedRef = useRef(false);
  const touchMoveListenerRef = useRef<EventListener | null>(null);
  const touchEndListenerRef = useRef<EventListener | null>(null);

  const detachGlobalListeners = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!globalListenersAttachedRef.current) return;

    if (touchMoveListenerRef.current) {
      window.removeEventListener("touchmove", touchMoveListenerRef.current);
    }
    if (touchEndListenerRef.current) {
      window.removeEventListener("touchend", touchEndListenerRef.current);
      window.removeEventListener("touchcancel", touchEndListenerRef.current);
    }
    globalListenersAttachedRef.current = false;
  }, []);

  const onTouchMove = useCallback((event: TouchLike) => {
    const start = startRef.current;
    if (!start) return;

    const touch =
      findTouchByIdentifier(event.touches, activeTouchIdRef.current) ??
      findTouchByIdentifier(event.changedTouches, activeTouchIdRef.current);

    if (!touch) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (lockedAxisRef.current == null) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX >= AXIS_LOCK_THRESHOLD_PX || absY >= AXIS_LOCK_THRESHOLD_PX) {
        if (absX > absY) lockedAxisRef.current = "x";
        if (absY > absX) lockedAxisRef.current = "y";
      }
    }

    const { direction, distance } = getDirectionForLockedAxis(lockedAxisRef.current, dx, dy);

    setSwipeState({ isSwiping: true, direction, distance });
  }, []);

  const onTouchEnd = useCallback((event: TouchLike) => {
    const start = startRef.current;
    const startTime = startTimeRef.current;
    if (!start || startTime == null) {
      setSwipeState({ isSwiping: false, direction: null, distance: 0 });
      lockedAxisRef.current = null;
      detachGlobalListeners();
      return;
    }

    const touch =
      findTouchByIdentifier(event.changedTouches, activeTouchIdRef.current) ??
      findTouchByIdentifier(event.touches, activeTouchIdRef.current);

    if (!touch) {
      setSwipeState({ isSwiping: false, direction: null, distance: 0 });
      startRef.current = null;
      startTimeRef.current = null;
      activeTouchIdRef.current = null;
      lockedAxisRef.current = null;
      detachGlobalListeners();
      return;
    }

    const endTime = getEventTime(event);
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    const { direction, distance } = getDirectionForLockedAxis(lockedAxisRef.current, dx, dy);
    const duration = endTime - startTime;
    const velocity = duration > 0 ? distance / duration : 0;

    const { onSwipeDown, onSwipeLeft, onSwipeRight, onSwipeUp, threshold } = configRef.current;

    if (direction && isSwipeGesture(distance, velocity, threshold)) {
      if (direction === "left") onSwipeLeft?.();
      if (direction === "right") onSwipeRight?.();
      if (direction === "up") onSwipeUp?.();
      if (direction === "down") onSwipeDown?.();
    }

    setSwipeState({ isSwiping: false, direction, distance });
    startRef.current = null;
    startTimeRef.current = null;
    activeTouchIdRef.current = null;
    lockedAxisRef.current = null;
    detachGlobalListeners();
  }, [detachGlobalListeners]);

  if (!touchMoveListenerRef.current) {
    touchMoveListenerRef.current = ((event: Event) => {
      onTouchMove(event as unknown as TouchLike);
    }) as EventListener;
  }

  if (!touchEndListenerRef.current) {
    touchEndListenerRef.current = ((event: Event) => {
      onTouchEnd(event as unknown as TouchLike);
    }) as EventListener;
  }

  const onTouchStart = useCallback((event: TouchLike) => {
    const touch =
      findTouchByIdentifier(event.changedTouches, null) ??
      findTouchByIdentifier(event.touches, null);

    if (!touch) return;

    activeTouchIdRef.current = touch.identifier ?? null;
    startRef.current = { x: touch.clientX, y: touch.clientY };
    startTimeRef.current = getEventTime(event);
    lockedAxisRef.current = null;

    setSwipeState({ isSwiping: true, direction: null, distance: 0 });

    if (typeof window !== "undefined" && !globalListenersAttachedRef.current) {
      if (touchMoveListenerRef.current) {
        window.addEventListener("touchmove", touchMoveListenerRef.current, { passive: true });
      }
      if (touchEndListenerRef.current) {
        window.addEventListener("touchend", touchEndListenerRef.current, { passive: true });
        window.addEventListener("touchcancel", touchEndListenerRef.current, { passive: true });
      }
      globalListenersAttachedRef.current = true;
    }
  }, []);

  useEffect(() => detachGlobalListeners, [detachGlobalListeners]);

  const handlers = useMemo(
    () => ({
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    }),
    [onTouchEnd, onTouchMove, onTouchStart],
  );

  return { handlers, swipeState };
}
