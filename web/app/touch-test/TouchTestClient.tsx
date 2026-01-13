'use client'

import { useEffect, useMemo, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { ContextMenu } from '@/components/mobile/ContextMenu'
import { useLongPress } from '@/hooks/useLongPress'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { getTouchPoint } from '@/lib/touch-utils'

type TouchTestApi = {
  swipeHandlers: ReturnType<typeof useSwipeGesture>['handlers']
  longPressHandlers: {
    onMouseDown: (event: unknown) => void
    onMouseUp: (event: unknown) => void
    onTouchStart: (event: unknown) => void
    onTouchEnd: (event: unknown) => void
  }
}

export default function TouchTestClient() {
  const [lastSwipe, setLastSwipe] = useState<'none' | 'left' | 'right' | 'up' | 'down'>('none')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const { handlers: swipeHandlers } = useSwipeGesture({
    threshold: 60,
    onSwipeLeft: () => setLastSwipe('left'),
    onSwipeRight: () => setLastSwipe('right'),
    onSwipeUp: () => setLastSwipe('up'),
    onSwipeDown: () => setLastSwipe('down'),
  })

  const baseLongPressHandlers = useLongPress(() => setMenuOpen(true), {
    delay: 150,
    haptic: false,
  })

  const longPressHandlers = useMemo(() => {
    const onTouchStart = (event: any) => {
      setMenuPosition(getTouchPoint(event))
      baseLongPressHandlers.onTouchStart()
    }

    const onMouseDown = (event: any) => {
      setMenuPosition(getTouchPoint(event))
      baseLongPressHandlers.onMouseDown(event)
    }

    return {
      ...baseLongPressHandlers,
      onTouchStart,
      onMouseDown,
    }
  }, [baseLongPressHandlers])

  useEffect(() => {
    ;(window as unknown as { __touchTest?: TouchTestApi }).__touchTest = {
      swipeHandlers,
      longPressHandlers: {
        onMouseDown: longPressHandlers.onMouseDown as unknown as (event: unknown) => void,
        onMouseUp: longPressHandlers.onMouseUp as unknown as (event: unknown) => void,
        onTouchStart: longPressHandlers.onTouchStart as unknown as (event: unknown) => void,
        onTouchEnd: longPressHandlers.onTouchEnd as unknown as (event: unknown) => void,
      },
    }
  }, [longPressHandlers, swipeHandlers])

  const items = useMemo(
    () => [
      {
        icon: MoreHorizontal,
        label: 'Action',
        onClick: () => setMenuOpen(false),
      },
    ],
    []
  )

  return (
    <main className="min-h-screen p-6 flex flex-col gap-6">
      <section className="space-y-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Touch Test</h1>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <div>
            last swipe: <span data-testid="swipe-last">{lastSwipe}</span>
          </div>
          <div>
            menu open: <span data-testid="menu-open">{String(menuOpen)}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm text-slate-700 dark:text-slate-200">Swipe area</div>
        <div
          className="h-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          {...swipeHandlers}
        />
      </section>

      <section className="space-y-3">
        <div className="text-sm text-slate-700 dark:text-slate-200">Long press area</div>
        <div
          className="h-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          {...longPressHandlers}
        />
      </section>

      {menuOpen ? (
        <ContextMenu items={items} position={menuPosition} onClose={() => setMenuOpen(false)} />
      ) : null}
    </main>
  )
}
