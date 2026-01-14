import { test, expect } from '@playwright/test'

test.describe('Hydration mismatch checks', () => {
  test('home page is client-rendered to avoid SSR mismatch', async ({ page }) => {
    const response = await page.request.get('/')
    const html = await response.text()

    expect(html).not.toContain('CO-PILOT ACTIVE')

    await page.goto('/')
    await page.waitForSelector('main', { state: 'attached' })
    await expect(page.getByText('CO-PILOT ACTIVE', { exact: false })).toBeVisible()
  })
})
