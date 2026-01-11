import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    headless: true,
  },
})

