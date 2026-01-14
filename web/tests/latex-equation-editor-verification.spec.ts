import { test, expect } from "@playwright/test";

test.describe("WYSIWYG Equation Editor", () => {
  test("inserts LaTeX into focused text input", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder(/Ask Co-Pilot/i);
    await input.click();

    await expect(
      page.getByRole("button", { name: /Insert equation/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Insert equation/i }).click();

    const dialog = page.getByRole("dialog", { name: /Equation editor/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /Alpha/i }).click();
    await expect(dialog.getByTestId("equation-latex")).toContainText("\\alpha");

    await dialog.getByRole("button", { name: /^Insert$/i }).click();

    await expect(input).toHaveValue(/\$\\alpha\$/);
  });
});
