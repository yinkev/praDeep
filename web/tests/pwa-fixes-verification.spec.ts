import { expect, test } from '@playwright/test'

test.describe('Frontend/PWA regression fixes', () => {
  test('Confidence bars use dark-mode background classes', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('deeptutor-theme', 'dark')
    })

    await page.goto('/pwa-fixes-test')

    const badge = page
      .getByTestId('confidence-badge')
      .locator('[title="High confidence (90%)"]')
      .first()

    await expect(badge).toBeVisible()

    const badgeBar = badge.locator('div.w-12.h-1\\.5 > div').first()
    const badgeBarClass = await badgeBar.getAttribute('class')
    expect(badgeBarClass).toContain('dark:bg-emerald-400')

    const meterBar = page.getByTestId('confidence-meter').locator('div.relative.w-full.h-2 > div').first()
    const meterBarClass = await meterBar.getAttribute('class')
    expect(meterBarClass).toContain('dark:bg-emerald-400')
  })

  test('ReasoningSteps toggle does not submit its parent form', async ({ page }) => {
    await page.goto('/pwa-fixes-test')

    await expect(page.getByTestId('form-submit-count')).toHaveText('0')
    await page.getByRole('button', { name: /show my work/i }).click()
    await expect(page.getByTestId('form-submit-count')).toHaveText('0')
  })
})
