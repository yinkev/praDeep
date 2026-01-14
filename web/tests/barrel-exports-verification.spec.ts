import { test, expect } from "@playwright/test";

test.describe("Component imports (no barrel exports)", () => {
  test("loads the Question page without barrel imports", async ({ page }) => {
    await page.goto("/question");

    await expect(
      page.getByPlaceholder("e.g. Gradient Descent Optimization"),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: /^Generate Questions$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Generate Questions$/ })).toBeDisabled();
  });
});
