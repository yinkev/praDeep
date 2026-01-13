export type CacheStatus = {
  supported: boolean
  cacheKeys: string[]
  entriesByCache: Record<string, number>
  totalEntries: number
}

let activeRegistration: ServiceWorkerRegistration | null = null

function isBrowser() {
  return typeof window !== 'undefined'
}

function canUseServiceWorker() {
  return isBrowser() && 'serviceWorker' in navigator
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!canUseServiceWorker()) return null

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    activeRegistration = registration

    const maybeActivateWaitingWorker = () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }

    maybeActivateWaitingWorker()

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing
      if (!installingWorker) return

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          // If there is an existing controller, this is an update; activate ASAP.
          if (navigator.serviceWorker.controller) {
            installingWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        }
      })
    })

    return registration
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Service worker registration failed', error)
    return null
  }
}

export async function checkForUpdates(): Promise<boolean> {
  if (!canUseServiceWorker()) return false

  try {
    const registration =
      activeRegistration ?? (await navigator.serviceWorker.getRegistration('/'))
    if (!registration) return false
    activeRegistration = registration
    await registration.update()
    return true
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Service worker update check failed', error)
    return false
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!canUseServiceWorker()) return false

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    const results = await Promise.all(registrations.map((r) => r.unregister()))
    activeRegistration = null
    return results.some(Boolean)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Service worker unregistration failed', error)
    return false
  }
}

export async function getCacheStatus(): Promise<CacheStatus> {
  if (!isBrowser() || !('caches' in window)) {
    return { supported: false, cacheKeys: [], entriesByCache: {}, totalEntries: 0 }
  }

  const cacheKeys = await caches.keys()
  const entriesByCache: Record<string, number> = {}

  await Promise.all(
    cacheKeys.map(async (key) => {
      try {
        const cache = await caches.open(key)
        const requests = await cache.keys()
        entriesByCache[key] = requests.length
      } catch {
        entriesByCache[key] = 0
      }
    }),
  )

  const totalEntries = Object.values(entriesByCache).reduce((sum, n) => sum + n, 0)

  return { supported: true, cacheKeys, entriesByCache, totalEntries }
}

