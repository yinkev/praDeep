'use client'

import { motion } from 'framer-motion'
import { Star, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

type MasteryState = 'NOVICE' | 'SHAKY' | 'COMPETENT' | 'AUTOMATIC'

const stateConfig: Record<MasteryState, { icon: typeof Star; color: string; bg: string; label: string }> = {
  NOVICE: {
    icon: Star,
    color: 'text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-700',
    label: 'Novice',
  },
  SHAKY: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Shaky',
  },
  COMPETENT: {
    icon: CheckCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Competent',
  },
  AUTOMATIC: {
    icon: Zap,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Mastered',
  },
}

export function MasteryIndicator({ state }: { state: MasteryState }) {
  const config = stateConfig[state] || stateConfig.NOVICE
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </motion.div>
  )
}
