import { test, expect } from '@playwright/test'

test.describe('Performance Metrics Dashboard', () => {
  test('should load the metrics page and display main components', async ({ page }) => {
    // Navigate to metrics page
    await page.goto('/metrics')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check that the page title/header is displayed
    await expect(page.getByRole('heading', { name: /Performance Metrics/i })).toBeVisible()

    // Check for page subtitle
    await expect(page.locator('text=/Real-time agent performance monitoring/i')).toBeVisible()

    // Wait for loading to complete
    await page.waitForTimeout(2000)

    // Check that summary cards are displayed
    await expect(page.locator('text=/Total Calls/i').first()).toBeVisible()
    await expect(page.locator('text=/Total Tokens/i').first()).toBeVisible()
    await expect(page.locator('text=/Total Cost/i').first()).toBeVisible()
    await expect(page.locator('text=/Success Rate/i').first()).toBeVisible()
    await expect(page.locator('text=/Errors/i').first()).toBeVisible()
    await expect(page.locator('text=/Unique Agents/i').first()).toBeVisible()
  })

  test('should display Module Statistics section', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check that Module Statistics section is visible
    await expect(page.locator('text=/Module Statistics/i')).toBeVisible()
  })

  test('should display Agent Performance section', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check that Agent Performance section is visible
    await expect(page.locator('text=/Agent Performance/i')).toBeVisible()

    // Check that the table headers are present
    await expect(page.locator('text=/Agent/i').first()).toBeVisible()
    await expect(page.locator('text=/Module/i').first()).toBeVisible()
    await expect(page.locator('text=/Calls/i').first()).toBeVisible()
    await expect(page.locator('text=/Avg Time/i').first()).toBeVisible()
    await expect(page.locator('text=/Tokens/i').first()).toBeVisible()
    await expect(page.locator('text=/Cost/i').first()).toBeVisible()
    await expect(page.locator('text=/Success/i').first()).toBeVisible()
  })

  test('should display Recent Activity section', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check that Recent Activity section is visible
    await expect(page.locator('text=/Recent Activity/i')).toBeVisible()
  })

  test('should have refresh and export buttons', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForLoadState('networkidle')

    // Check for auto-refresh toggle
    await expect(page.locator('text=/Auto-refresh/i')).toBeVisible()

    // Check for manual refresh button
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible()

    // Check for export button
    await expect(page.getByRole('button', { name: /Export Report/i })).toBeVisible()
  })

  test('should show connection status indicator', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForLoadState('networkidle')

    // Check for connection status (either Live or Disconnected)
    const connectionStatus = page.locator('text=/Live|Disconnected/i')
    await expect(connectionStatus).toBeVisible()
  })

  test('should be accessible from sidebar navigation', async ({ page }) => {
    // Go to home page first
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Click on Metrics link in sidebar
    await page.getByRole('link', { name: /Metrics/i }).click()

    // Verify we are on metrics page
    await expect(page).toHaveURL('/metrics')
    await expect(page.getByRole('heading', { name: /Performance Metrics/i })).toBeVisible()
  })

  test('should toggle auto-refresh when clicked', async ({ page }) => {
    await page.goto('/metrics')
    await page.waitForLoadState('networkidle')

    // Get the auto-refresh button
    const autoRefreshButton = page.locator('button:has-text("Auto-refresh")')
    await expect(autoRefreshButton).toBeVisible()

    // Click to toggle off
    await autoRefreshButton.click()
    await page.waitForTimeout(500)

    // Click to toggle back on
    await autoRefreshButton.click()
    await page.waitForTimeout(500)

    // Button should still be visible after toggling
    await expect(autoRefreshButton).toBeVisible()
  })
})
