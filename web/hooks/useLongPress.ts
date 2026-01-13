import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  addPassiveEventListener,
  getTouchPoint,
  hapticFeedback,
  type TouchPoint,
} from "@/lib/touch-utils";

export interface LongPressOptions {
  delay?: number;
  haptic?: boolean;
  moveThreshold?: number;
}

type LongPressCallback = () => void;

type PressEvent =
  | TouchEvent
  | MouseEvent
  | ReactTouchEvent<Element>
  | ReactMouseEvent<Element>;

const DEFAULT_DELAY_MS = 500;
const DEFAULT_MOVE_THRESHOLD_PX = 10;

export function useLongPress(callback: LongPressCallback, options: LongPressOptions = {}) {
  const delay = options.delay ?? DEFAULT_DELAY_MS;
  const haptic = options.haptic ?? false;
  const moveThreshold = options.moveThreshold ?? DEFAULT_MOVE_THRESHOLD_PX;

  const callbackRef = useRef(callback);
  const configRef = useRef({ delay, haptic, moveThreshold });

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    configRef.current = { delay, haptic, moveThreshold };
  }, [delay, haptic, moveThreshold]);

  const timeoutIdRef = useRef<number | null>(null);
  const startPointRef = useRef<TouchPoint | null>(null);
  const isPressingRef = useRef(false);
  const cleanupGlobalListenersRef = useRef<(() => void) | null>(null);

  const clearPress = useCallback(() => {
    isPressingRef.current = false;
    startPointRef.current = null;

    if (timeoutIdRef.current != null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    cleanupGlobalListenersRef.current?.();
    cleanupGlobalListenersRef.current = null;
  }, []);

  const maybeCancelForMove = useCallback(
    (event: PressEvent) => {
      if (!isPressingRef.current) return;
      const startPoint = startPointRef.current;
      if (!startPoint) return;

      if (!event) return;
      const point = getTouchPoint(event);
      const distance = Math.hypot(point.x - startPoint.x, point.y - startPoint.y);

      if (distance >= configRef.current.moveThreshold) clearPress();
    },
    [clearPress],
  );

  const startPress = useCallback(
    (event: PressEvent) => {
      if (typeof window === "undefined") return;
      clearPress();

      isPressingRef.current = true;
      startPointRef.current = event ? getTouchPoint(event) : { x: 0, y: 0 };

      timeoutIdRef.current = window.setTimeout(() => {
        if (!isPressingRef.current) return;

        const { haptic } = configRef.current;
        if (haptic) hapticFeedback("light");

        callbackRef.current();
        clearPress();
      }, configRef.current.delay);

      const cleanups = [
        addPassiveEventListener(window, "touchmove", maybeCancelForMove as unknown as (event: TouchEvent) => void),
        addPassiveEventListener(window, "touchend", clearPress as unknown as (event: TouchEvent) => void),
        addPassiveEventListener(window, "touchcancel", clearPress as unknown as (event: TouchEvent) => void),
        addPassiveEventListener(window, "mousemove", maybeCancelForMove as unknown as (event: MouseEvent) => void),
        addPassiveEventListener(window, "mouseup", clearPress as unknown as (event: MouseEvent) => void),
        addPassiveEventListener(window, "blur", clearPress as unknown as (event: FocusEvent) => void),
      ];

      cleanupGlobalListenersRef.current = () => cleanups.forEach(cleanup => cleanup());
    },
    [clearPress, maybeCancelForMove],
  );

  useEffect(() => clearPress, [clearPress]);

  const handlers = useMemo(
    () => ({
      onMouseDown: (event: ReactMouseEvent) => {
        if (event.button !== 0) return;
        startPress(event);
      },
      onMouseUp: () => clearPress(),
      onMouseLeave: () => clearPress(),
      onTouchStart: (event: ReactTouchEvent) => startPress(event),
      onTouchMove: (event: ReactTouchEvent) => maybeCancelForMove(event),
      onTouchEnd: () => clearPress(),
      onTouchCancel: () => clearPress(),
      onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
    }),
    [clearPress, maybeCancelForMove, startPress],
  );

  return handlers;
}
