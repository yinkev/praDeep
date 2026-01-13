'use client'

import { useEffect, useState } from 'react'
import type { BeforeInstallPromptEvent } from '@/hooks/usePWA'

type InstallPromptProps = {
  isInstalled: boolean
  installPrompt: BeforeInstallPromptEvent | null
}

export default function InstallPrompt({ isInstalled, installPrompt }: InstallPromptProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (installPrompt) setDismissed(false)
  }, [installPrompt])

  if (isInstalled || !installPrompt || dismissed) return null

  const handleInstall = async () => {
    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome !== 'accepted') setDismissed(true)
    } catch {
      setDismissed(true)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface-elevated/95 p-4 text-text-primary shadow-xl backdrop-blur">
      <div className="text-sm font-semibold">Install this app</div>
      <p className="mt-1 text-xs text-text-secondary">
        Add the app to your home screen for faster access and offline support.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-full bg-accent-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-surface-secondary"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
