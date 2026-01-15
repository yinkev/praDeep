import { test, expect } from "@playwright/test";

test.describe("Theme engine", () => {
  test("applies high-contrast dark theme from localStorage", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("deeptutor-theme", "high-contrast-dark");
    });

    await page.goto("/");

    await expect
      .poll(() =>
        page.evaluate(() => ({
          theme: document.documentElement.getAttribute("data-theme"),
          hasDarkClass: document.documentElement.classList.contains("dark"),
          hasHighContrastClass:
            document.documentElement.classList.contains("high-contrast"),
          stored: localStorage.getItem("deeptutor-theme"),
        })),
      )
      .toEqual({
        theme: "high-contrast-dark",
        hasDarkClass: true,
        hasHighContrastClass: true,
        stored: "high-contrast-dark",
      });
  });

  test("applies custom primary color overrides", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("deeptutor-theme", "custom-light");
      localStorage.setItem(
        "deeptutor-theme-custom",
        JSON.stringify({
          primary: "280 100% 50%",
          ring: "280 100% 50%",
        }),
      );
    });

    await page.goto("/");

    await expect
      .poll(() =>
        page.evaluate(() => ({
          theme: document.documentElement.getAttribute("data-theme"),
          primary: getComputedStyle(document.documentElement).getPropertyValue(
            "--primary",
          ),
          ring: getComputedStyle(document.documentElement).getPropertyValue(
            "--ring",
          ),
        })),
      )
      .toEqual({
        theme: "custom-light",
        primary: "280 100% 50%",
        ring: "280 100% 50%",
      });
  });
});
