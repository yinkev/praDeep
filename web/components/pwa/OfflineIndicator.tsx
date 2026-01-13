'use client'

type OfflineIndicatorProps = {
  isOnline: boolean
}

export default function OfflineIndicator({ isOnline }: OfflineIndicatorProps) {
  if (isOnline) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface-elevated/90 px-4 py-2 text-xs font-semibold text-text-primary shadow-lg backdrop-blur"
      role="status"
      aria-live="polite"
    >
      You are offline. Some features may be unavailable.
    </div>
  )
}
