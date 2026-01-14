import { expect, test } from "@playwright/test";

test.describe("Mobile touch interactions", () => {
  test.use({
    viewport: { width: 360, height: 640 },
    hasTouch: true,
  });

  test("useSwipeGesture triggers dominant-axis swipe callback", async ({ page }) => {
    await page.goto("/touch-test");

    await expect(page.getByTestId("swipe-last")).toHaveText("none");
    await page.waitForFunction(() => Boolean((window as any).__touchTest));

    await page.evaluate(() => {
      const api = (window as unknown as { __touchTest?: any }).__touchTest;
      api.swipeHandlers.onTouchStart({
        timeStamp: 0,
        touches: [
          { identifier: 1, clientX: 100, clientY: 100 },
          { identifier: 2, clientX: 120, clientY: 120 },
        ],
        changedTouches: [{ identifier: 1, clientX: 100, clientY: 100 }],
      });

      api.swipeHandlers.onTouchMove({
        timeStamp: 50,
        touches: [
          { identifier: 1, clientX: 160, clientY: 110 },
          { identifier: 2, clientX: 120, clientY: 120 },
        ],
        changedTouches: [{ identifier: 1, clientX: 160, clientY: 110 }],
      });

      api.swipeHandlers.onTouchMove({
        timeStamp: 80,
        touches: [
          { identifier: 1, clientX: 170, clientY: 200 },
          { identifier: 2, clientX: 120, clientY: 120 },
        ],
        changedTouches: [{ identifier: 1, clientX: 170, clientY: 200 }],
      });

      api.swipeHandlers.onTouchEnd({
        timeStamp: 100,
        touches: [{ identifier: 2, clientX: 120, clientY: 120 }],
        changedTouches: [{ identifier: 1, clientX: 170, clientY: 200 }],
      });
    });

    await expect(page.getByTestId("swipe-last")).toHaveText("right");
  });

  test("useLongPress opens ContextMenu and backdrop dismiss works", async ({ page }) => {
    await page.goto("/touch-test");

    await expect(page.getByTestId("menu-open")).toHaveText("false");
    await page.waitForFunction(() => Boolean((window as any).__touchTest));

    await page.evaluate(() => {
      const api = (window as unknown as { __touchTest?: any }).__touchTest;
      api.longPressHandlers.onTouchStart({
        timeStamp: 0,
        touches: [{ identifier: 1, clientX: 356, clientY: 636 }],
        changedTouches: [{ identifier: 1, clientX: 356, clientY: 636 }],
      });
    });

    await expect(page.getByTestId("menu-open")).toHaveText("true");

    const menuRect = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="context-menu"]');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    });

    expect(menuRect).not.toBeNull();
    expect(menuRect!.left).toBeGreaterThanOrEqual(0);
    expect(menuRect!.top).toBeGreaterThanOrEqual(0);
    expect(menuRect!.right).toBeLessThanOrEqual(360);
    expect(menuRect!.bottom).toBeLessThanOrEqual(640);

    await page.getByTestId("context-menu-backdrop").click();
    await expect(page.getByTestId("menu-open")).toHaveText("false");
  });
});
