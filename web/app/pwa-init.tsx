'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa-utils'
import { usePWA } from '@/hooks/usePWA'
import OfflineIndicator from '@/components/pwa/OfflineIndicator'
import InstallPrompt from '@/components/pwa/InstallPrompt'

export function PWAInit() {
  const { isInstalled, isOnline, installPrompt } = usePWA({ registerServiceWorker: false })

  useEffect(() => {
    void registerServiceWorker()
  }, [])

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <InstallPrompt isInstalled={isInstalled} installPrompt={installPrompt} />
    </>
  )
}
