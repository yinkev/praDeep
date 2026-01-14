import { cn } from '@/lib/utils'

export const eliteTheme = {
  density: {
    /** Compact / pro density (requested: "A"). */
    compact: {
      pageX: 'px-5 sm:px-6',
      headerY: 'py-2.5',
      sectionY: 'py-10',
      cardPad: 'p-5',
      cardPadLg: 'p-6',
      tabPad: 'p-0.5',
      tabButton: 'px-3 py-1.5 text-[11px]',
      tabIcon: 'h-3.5 w-3.5',
      monoLabel: 'text-[10px] font-mono uppercase tracking-[0.14em]',
    },
  },
  surface: 'bg-surface dark:bg-zinc-950',
  panel: cn(
    'border border-border bg-surface-elevated/75 shadow-glass-sm backdrop-blur-xl',
    'dark:border-white/10 dark:bg-zinc-950/55'
  ),
  milledBorder: cn(
    'border border-border',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_14px_42px_-28px_rgba(15,23,42,0.24)]',
    'dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_-24px_rgba(0,0,0,0.75)]'
  ),
  recessed: cn(
    'border border-border bg-surface-elevated/70',
    'shadow-[inset_0_2px_7px_rgba(15,23,42,0.07),0_1px_0_rgba(255,255,255,0.35)]',
    'dark:border-white/10 dark:bg-zinc-950/50 dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.55),0_1px_0_rgba(255,255,255,0.06)]'
  ),
} as const
