import { useCallback, useEffect, useMemo, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { hapticFeedback } from "@/lib/touch-utils";

export interface LongPressOptions {
  delay?: number;
  haptic?: boolean;
}

type LongPressCallback = () => void;

export function useLongPress(callback: LongPressCallback, options: LongPressOptions = {}) {
  const delay = options.delay ?? 500;
  const shouldHaptic = options.haptic ?? false;

  const timeoutIdRef = useRef<number | null>(null);
  const isPressingRef = useRef(false);

  const clearPress = useCallback(() => {
    isPressingRef.current = false;
    if (timeoutIdRef.current == null) return;
    window.clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = null;
  }, []);

  const startPress = useCallback(() => {
    isPressingRef.current = true;
    if (timeoutIdRef.current != null) window.clearTimeout(timeoutIdRef.current);

    timeoutIdRef.current = window.setTimeout(() => {
      if (!isPressingRef.current) return;
      if (shouldHaptic) hapticFeedback("light");
      callback();
    }, delay);
  }, [callback, delay, shouldHaptic]);

  useEffect(() => clearPress, [clearPress]);

  const handlers = useMemo(
    () => ({
      onMouseDown: (event: ReactMouseEvent) => {
        if (event.button !== 0) return;
        startPress();
      },
      onMouseUp: () => clearPress(),
      onTouchStart: () => startPress(),
      onTouchEnd: () => clearPress(),
      onContextMenu: (event: ReactMouseEvent) => event.preventDefault(),
    }),
    [clearPress, startPress],
  );

  return {
    onMouseDown: handlers.onMouseDown,
    onMouseUp: handlers.onMouseUp,
    onTouchStart: handlers.onTouchStart,
    onTouchEnd: handlers.onTouchEnd,
    onContextMenu: handlers.onContextMenu,
  };
}

