import { expect, test } from "@playwright/test";

import {
  addPassiveEventListener,
  calculateVelocity,
  getTouchPoint,
  hapticFeedback,
  isSwipeGesture,
  preventPullToRefresh,
} from "../lib/touch-utils";

test.describe("Touch utilities", () => {
  test("getTouchPoint extracts coordinates from touch events", async () => {
    const point = getTouchPoint({
      touches: [{ clientX: 12, clientY: 34 }],
      changedTouches: [{ clientX: 12, clientY: 34 }],
    } as unknown as TouchEvent);

    expect(point).toEqual({ x: 12, y: 34 });
  });

  test("getTouchPoint falls back to mouse coordinates", async () => {
    const point = getTouchPoint({
      clientX: 9,
      clientY: 7,
    } as unknown as MouseEvent);

    expect(point).toEqual({ x: 9, y: 7 });
  });

  test("calculateVelocity returns pixels per ms", async () => {
    const velocity = calculateVelocity(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      0,
      200,
    );
    expect(velocity).toBeCloseTo(0.5, 3);
  });

  test("calculateVelocity returns 0 for invalid duration", async () => {
    const velocity = calculateVelocity(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      1000,
      1000,
    );
    expect(velocity).toBe(0);
  });

  test("isSwipeGesture validates distance/velocity", async () => {
    expect(isSwipeGesture(80, 0.05, 60)).toBe(true);
    expect(isSwipeGesture(10, 0.05, 60)).toBe(false);
    expect(isSwipeGesture(40, 0.6, 80)).toBe(true);
  });

  test("addPassiveEventListener registers passive listeners and cleans up", async () => {
    const calls: Array<{ type: "add" | "remove"; args: unknown[] }> = [];

    const target = {
      addEventListener: (...args: unknown[]) =>
        calls.push({ type: "add", args }),
      removeEventListener: (...args: unknown[]) =>
        calls.push({ type: "remove", args }),
    } as unknown as EventTarget;

    const listener = () => {};
    const cleanup = addPassiveEventListener(target, "touchstart", listener);
    cleanup();

    expect(calls).toHaveLength(2);
    expect(calls[0].type).toBe("add");
    expect(calls[0].args[0]).toBe("touchstart");
    expect(calls[0].args[1]).toBe(listener);
    expect((calls[0].args[2] as { passive?: boolean }).passive).toBe(true);

    expect(calls[1].type).toBe("remove");
    expect(calls[1].args[0]).toBe("touchstart");
    expect(calls[1].args[1]).toBe(listener);
  });

  test("preventPullToRefresh is safe outside the browser", async () => {
    expect(() => preventPullToRefresh()).not.toThrow();
  });

  test("hapticFeedback is safe outside the browser", async () => {
    expect(() => hapticFeedback()).not.toThrow();
  });
});
