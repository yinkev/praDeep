import { test, expect } from "@playwright/test";

test.describe("Voice input (speech-to-text)", () => {
  test("dictates into the home chat input", async ({ page }) => {
    await page.addInitScript(() => {
      // Minimal media API stubs so headless Playwright can exercise the UI flow.
      // The real implementation should use getUserMedia + MediaRecorder.
      (navigator as any).mediaDevices = (navigator as any).mediaDevices || {};
      (navigator.mediaDevices as any).getUserMedia = async () =>
        new MediaStream();

      class FakeMediaRecorder {
        public state: "inactive" | "recording" = "inactive";
        public ondataavailable: ((event: { data: Blob }) => void) | null = null;
        public onstop: (() => void) | null = null;

        start() {
          this.state = "recording";
          queueMicrotask(() => {
            this.ondataavailable?.({
              data: new Blob(["dummy-audio"], { type: "audio/webm" }),
            });
          });
        }

        stop() {
          this.state = "inactive";
          queueMicrotask(() => this.onstop?.());
        }
      }

      (window as any).MediaRecorder = FakeMediaRecorder;
    });

    // Mock backend dependencies so the page renders without a running API.
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/speech/transcribe")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ text: "hello from voice", language: "en" }),
        });
        return;
      }

      // Generic success response for unrelated calls.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/");

    const input = page.getByPlaceholder("Ask Co-Pilot...");
    await expect(input).toBeVisible();

    const voiceButton = page
      .getByRole("button", { name: /voice input/i })
      .first();

    // Start and stop recording.
    await voiceButton.click();
    await voiceButton.click();

    await expect(input).toHaveValue(/hello from voice/i);
  });
});
