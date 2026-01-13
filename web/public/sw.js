/* eslint-disable no-restricted-globals */

// praDeep Service Worker
// - Cache-first: static assets (_next/static, images, fonts)
// - Network-first: API calls (/api/**) with offline fallback
// - Stale-while-revalidate: navigations/pages with inline offline HTML fallback

const CACHE_VERSION = 'v1'
const CACHE_PREFIX = 'praDeep'

const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`
const PAGES_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`
const API_CACHE = `${CACHE_PREFIX}-api-${CACHE_VERSION}`

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>praDeep — Offline</title>
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
      .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #0b1220; color: #e5e7eb; }
      .card { width: min(560px, 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; background: rgba(255,255,255,0.06); }
      .brand { font-weight: 700; letter-spacing: 0.2px; }
      .hint { margin-top: 8px; color: rgba(229,231,235,0.85); line-height: 1.5; }
      .pill { display: inline-block; margin-top: 14px; padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18); background: rgba(59,130,246,0.18); }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="brand">praDeep</div>
        <div class="hint">You’re offline and this page isn’t available in cache yet.</div>
        <div class="pill">Reconnect to continue</div>
      </div>
    </div>
  </body>
</html>`

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin
  } catch {
    return false
  }
}

function isApiRequest(request) {
  if (!isSameOrigin(request.url)) return false
  const url = new URL(request.url)
  return url.pathname.startsWith('/api/')
}

function isNextStaticAsset(request) {
  if (!isSameOrigin(request.url)) return false
  const url = new URL(request.url)
  return url.pathname.startsWith('/_next/static/')
}

function isLikelyStaticAsset(request) {
  if (!isSameOrigin(request.url)) return false
  const { destination } = request
  if (destination === 'image' || destination === 'font' || destination === 'style' || destination === 'script') {
    return true
  }

  const url = new URL(request.url)
  const pathname = url.pathname.toLowerCase()
  return (
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.avif') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.otf')
  )
}

function isPageNavigation(request) {
  if (!isSameOrigin(request.url)) return false
  return request.mode === 'navigate' || request.destination === 'document'
}

async function safeCachePut(cacheName, request, response) {
  try {
    if (!response || response.status !== 200) return
    // Avoid caching opaque responses; keep caches same-origin.
    if (response.type === 'opaque') return
    const cache = await caches.open(cacheName)
    await cache.put(request, response)
  } catch {
    // Ignore cache write errors (quota, opaque, etc.)
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  await safeCachePut(cacheName, request, response.clone())
  return response
}

async function staleWhileRevalidate(request, cacheName, { offlineFallback } = {}) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then(async (response) => {
      await safeCachePut(cacheName, request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    fetchPromise.catch(() => null)
    return cached
  }

  const fresh = await fetchPromise
  if (fresh) return fresh
  if (offlineFallback) return offlineFallback()
  throw new Error('offline')
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    await safeCachePut(cacheName, request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'offline', message: 'Network unavailable and no cached response.' }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.map((key) => {
          const isPraDeepCache = key.startsWith(`${CACHE_PREFIX}-`)
          const isCurrent =
            key === STATIC_CACHE || key === PAGES_CACHE || key === API_CACHE
          if (isPraDeepCache && !isCurrent) {
            return caches.delete(key)
          }
          return Promise.resolve(false)
        }),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Only handle same-origin requests. Let the browser handle cross-origin.
  if (!isSameOrigin(request.url)) return

  if (isApiRequest(request)) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  if (isNextStaticAsset(request) || isLikelyStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  if (isPageNavigation(request)) {
    event.respondWith(
      staleWhileRevalidate(request, PAGES_CACHE, {
        offlineFallback: () =>
          new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          }),
      }),
    )
    return
  }

  // Default: keep other same-origin GETs reasonably fresh.
  event.respondWith(staleWhileRevalidate(request, PAGES_CACHE))
})

