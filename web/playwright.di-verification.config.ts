import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'di-container-verification.spec.ts',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    headless: true,
  },
})
