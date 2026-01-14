import { test, expect } from '@playwright/test'

function normalizePath(pathname: string): string {
  if (!pathname.startsWith('/')) return `/${pathname}`
  return pathname
}

test.describe('PWA assets', () => {
  test('manifest icons exist', async ({ request }) => {
    const manifestRes = await request.get('/manifest.json')
    expect(manifestRes.ok()).toBeTruthy()

    const manifest = (await manifestRes.json()) as {
      icons?: Array<{ src?: string }>
      shortcuts?: Array<{ icons?: Array<{ src?: string }> }>
    }

    const iconSrcs = new Set<string>()

    for (const icon of manifest.icons ?? []) {
      if (icon?.src) iconSrcs.add(normalizePath(icon.src))
    }

    for (const shortcut of manifest.shortcuts ?? []) {
      for (const icon of shortcut.icons ?? []) {
        if (icon?.src) iconSrcs.add(normalizePath(icon.src))
      }
    }

    expect(iconSrcs.size).toBeGreaterThan(0)

    for (const src of iconSrcs) {
      const res = await request.get(src)
      expect(res.ok()).toBeTruthy()
      expect(res.headers()['content-type']).toContain('image/')
    }
  })

  test('dev does not intercept beforeinstallprompt', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('CO-PILOT ACTIVE', { exact: false })).toBeVisible()

    const defaultPrevented = await page.evaluate(() => {
      const evt = new Event('beforeinstallprompt', { cancelable: true })
      window.dispatchEvent(evt)
      return evt.defaultPrevented
    })

    expect(defaultPrevented).toBe(false)
  })

  test('declares scroll-behavior opt-out attribute', async ({ page }) => {
    await page.goto('/')
    const attribute = await page.evaluate(() =>
      document.documentElement.getAttribute('data-scroll-behavior')
    )

    expect(attribute).toBe('smooth')
  })

  test('custom element define is idempotent for known tag', async ({ page }) => {
    await page.goto('/')

    const result = await page.evaluate(() => {
      const tag = 'mce-autosize-textarea'
      class TempEl extends HTMLElement {}

      try {
        customElements.define(tag, TempEl)
      } catch (err) {
        return { ok: false, step: 'first-define', message: String(err) }
      }

      try {
        customElements.define(tag, TempEl)
      } catch (err) {
        return { ok: false, step: 'second-define', message: String(err) }
      }

      return { ok: true }
    })

    expect(result).toEqual({ ok: true })
  })
})
