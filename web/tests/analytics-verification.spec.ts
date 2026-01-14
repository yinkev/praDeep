import { test, expect } from '@playwright/test'

test.describe('Learning Analytics Dashboard', () => {
  test('should load the analytics page and display main components', async ({ page }) => {
    // Navigate to analytics page
    await page.goto('/analytics')

    // Wait for page content to appear
    await page.waitForSelector('h1', { timeout: 60000 })

    // Check that the page title/header is displayed
    await expect(page.getByRole('heading', { name: /Learning Analytics|学习分析/i })).toBeVisible()

    // Check that time range filter is visible
    await expect(page.getByRole('button', { name: /Today|今天/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /This Week|本周/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /This Month|本月/i })).toBeVisible()

    // Check that refresh button exists
    await expect(page.getByRole('button', { name: /Refresh|刷新/i })).toBeVisible()

    // Wait for data to load (spinner to disappear or cards to appear)
    await page.waitForSelector('text=/Total Activities|总活动数/i', { timeout: 30000 })

    // Check that summary cards are displayed
    await expect(page.locator('text=/Total Activities|总活动数/i')).toBeVisible()
    await expect(page.locator('text=/Current Streak|当前连续/i')).toBeVisible()
    await expect(page.locator('text=/Topics Covered|涵盖主题/i')).toBeVisible()
    await expect(page.locator('text=/Active Days|活跃天数/i')).toBeVisible()
  })

  test('should change time range when filter is clicked', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForSelector('h1', { timeout: 60000 })

    // Click on "This Month" filter
    await page.getByRole('button', { name: /This Month|本月/i }).click()

    // Wait for data to reload
    await page.waitForTimeout(1000)

    // Verify the button is now selected (has shadow-sm class indicating active state)
    const monthButton = page.getByRole('button', { name: /This Month|本月/i })
    await expect(monthButton).toHaveClass(/shadow-sm/)
  })

  test('should display learning scores section', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForSelector('h1', { timeout: 60000 })

    // Wait for data to load
    await page.waitForSelector('text=/Learning Scores|学习评分/i', { timeout: 30000 })

    // Check that Learning Scores section is visible
    await expect(page.locator('text=/Learning Scores|学习评分/i')).toBeVisible()

    // Check for score labels
    await expect(page.locator('text=/Overall|综合/i').first()).toBeVisible()
    await expect(page.locator('text=/Engagement|参与度/i').first()).toBeVisible()
    await expect(page.locator('text=/Consistency|持续性/i').first()).toBeVisible()
    await expect(page.locator('text=/Diversity|多样性/i').first()).toBeVisible()
  })

  test('should display strength areas and knowledge gaps sections', async ({ page }) => {
    await page.goto('/analytics')
    await page.waitForSelector('h1', { timeout: 60000 })

    // Wait for data to load
    await page.waitForSelector('text=/Strength Areas|优势领域/i', { timeout: 30000 })

    // Check that Strength Areas section exists
    await expect(page.locator('text=/Strength Areas|优势领域/i')).toBeVisible()

    // Check that Areas to Review section exists
    await expect(page.locator('text=/Areas to Review|需要复习的领域/i')).toBeVisible()
  })

  test('should be accessible from sidebar navigation', async ({ page }) => {
    // Go to home page first
    await page.goto('/')
    await page.waitForSelector('nav', { timeout: 60000 })

    // Click on Analytics link in sidebar
    await page.getByRole('link', { name: /Analytics|学习分析/i }).click()

    // Verify we are on analytics page
    await expect(page).toHaveURL('/analytics')
    await expect(page.getByRole('heading', { name: /Learning Analytics|学习分析/i })).toBeVisible()
  })
})
