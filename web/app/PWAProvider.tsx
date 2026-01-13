'use client'

import dynamic from 'next/dynamic'

const PWAInit = dynamic(() => import('./pwa-init').then(mod => mod.PWAInit), {
  ssr: false,
})

export function PWAProvider() {
  return <PWAInit />
}
