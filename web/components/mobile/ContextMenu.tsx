'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ContextMenuItem = {
  icon: LucideIcon
  label: string
  onClick: () => void
}

export interface ContextMenuProps {
  isOpen: boolean
  items: ContextMenuItem[]
  position: { x: number; y: number }
  onClose: () => void
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
} satisfies Variants

const menuVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 28, stiffness: 360, mass: 0.8 },
  },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.12 } },
} satisfies Variants

const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.001 } },
  exit: { opacity: 0, transition: { duration: 0.001 } },
} satisfies Variants

const EDGE_PADDING = 12
const MENU_OFFSET = 8

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function ContextMenu({ isOpen, items, position, onClose }: ContextMenuProps): ReactNode {
  const prefersReducedMotion = useReducedMotion()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [adjusted, setAdjusted] = useState(position)

  useLayoutEffect(() => {
    if (!isOpen) return
    const menuEl = menuRef.current
    if (!menuEl) return
    if (typeof window === 'undefined') return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const menuWidth = menuEl.offsetWidth
    const menuHeight = menuEl.offsetHeight

    let left = position.x + MENU_OFFSET
    let top = position.y + MENU_OFFSET

    if (left + menuWidth + EDGE_PADDING > viewportWidth) {
      left = position.x - menuWidth - MENU_OFFSET
    }
    if (top + menuHeight + EDGE_PADDING > viewportHeight) {
      top = position.y - menuHeight - MENU_OFFSET
    }

    left = clamp(left, EDGE_PADDING, Math.max(EDGE_PADDING, viewportWidth - menuWidth - EDGE_PADDING))
    top = clamp(top, EDGE_PADDING, Math.max(EDGE_PADDING, viewportHeight - menuHeight - EDGE_PADDING))

    setAdjusted({ x: left, y: top })
  }, [isOpen, position.x, position.y])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const renderedItems = useMemo(
    () =>
      items.map(item => (
        <button
          key={item.label}
          type="button"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
            'text-sm text-slate-900 dark:text-slate-100',
            'hover:bg-slate-100/80 dark:hover:bg-slate-800/80',
            'active:bg-slate-200/70 dark:active:bg-slate-700/70',
          )}
          onClick={() => {
            item.onClick()
            onClose()
          }}
        >
          <item.icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <span className="flex-1">{item.label}</span>
        </button>
      )),
    [items, onClose],
  )

  const backdrop = prefersReducedMotion ? reducedMotionVariants : backdropVariants
  const menuMotion = prefersReducedMotion ? reducedMotionVariants : menuVariants

  const content = (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            data-testid="context-menu-backdrop"
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            data-testid="context-menu"
            ref={menuRef}
            className={cn(
              'fixed z-[9999] min-w-[180px] max-w-[280px]',
              'rounded-xl border border-slate-200/70 dark:border-slate-700/70',
              'bg-white/95 dark:bg-slate-900/95 shadow-xl',
              'p-1',
            )}
            style={{ left: adjusted.x, top: adjusted.y }}
            variants={menuMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={event => event.stopPropagation()}
          >
            {renderedItems}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
