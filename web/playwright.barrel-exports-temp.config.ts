import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "tests/barrel-exports-verification.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  webServer: {
    command: "npm run dev -- --port 3100",
    cwd: __dirname,
    port: 3100,
    reuseExistingServer: true,
    timeout: 120000,
  },
  use: {
    baseURL: "http://localhost:3100",
    headless: true,
  },
});

