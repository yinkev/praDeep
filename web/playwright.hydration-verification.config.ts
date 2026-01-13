import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'tests/hydration-verification.spec.ts',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  webServer: {
    command: 'npm run dev -- --port 3783',
    cwd: __dirname,
    port: 3783,
    reuseExistingServer: true,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:3783',
    headless: true,
  },
})
