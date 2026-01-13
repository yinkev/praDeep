'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa-utils'
import { usePWA } from '@/hooks/usePWA'
import OfflineIndicator from '@/components/pwa/OfflineIndicator'
import InstallPrompt from '@/components/pwa/InstallPrompt'

export function PWAInit() {
  const { isInstalled, isOnline, installPrompt } = usePWA({ registerServiceWorker: false })

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    void registerServiceWorker()
  }, [])

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <InstallPrompt isInstalled={isInstalled} installPrompt={installPrompt} />
    </>
  )
}
