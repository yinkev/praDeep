'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Layers,
  RefreshCw,
  Signal,
  TrendingUp,
  WifiOff,
  Zap,
} from 'lucide-react'
import { apiUrl, wsUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

// ============================================================================
// Types
// ============================================================================

interface MetricsSummary {
  total_calls: number
  total_tokens: number
  total_cost_usd: number
  total_errors: number
  success_rate: number
  active_count: number
  history_count: number
  modules: string[]
  unique_agents: number
}

interface ModuleStats {
  total_calls: number
  total_tokens: number
  total_cost_usd: number
  total_errors: number
  unique_agents: number
  error_rate: number
}

interface AgentStats {
  agent_name: string
  module_name: string
  total_invocations: number
  successful_invocations: number
  failed_invocations: number
  total_duration_ms: number
  avg_duration_ms: number
  min_duration_ms: number
  max_duration_ms: number
  total_prompt_tokens: number
  total_completion_tokens: number
  total_tokens: number
  avg_tokens_per_call: number
  total_api_calls: number
  total_errors: number
  total_cost_usd: number
  success_rate: number
  first_seen: string | null
  last_seen: string | null
}

interface HistoryEntry {
  agent_name: string
  module_name: string
  duration_ms: number | null
  total_tokens: number
  success: boolean
  cost_usd: number
  timestamp: string
}

type TrendMetric = 'tokens' | 'cost' | 'duration'

// ============================================================================
// Helpers
// ============================================================================

const glassCardClassName =
  'border-white/55 bg-white/55 shadow-glass-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5'

const modulePillClassName =
  'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const formatDuration = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || ms === 0) return '0ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return tokens.toString()
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
  return `${(tokens / 1000000).toFixed(2)}M`
}

const formatCost = (cost: number): string => {
  if (cost < 0.01) return `$${cost.toFixed(6)}`
  if (cost < 1) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = clamp(Math.floor((sorted.length - 1) * p), 0, sorted.length - 1)
  return sorted[idx]
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

// ============================================================================
// Motion
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.12, 1],
    transition: { duration: 1.9, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

// ============================================================================
// Charts
// ============================================================================

type ChartPoint = { x: number; y: number; value: number }

function buildLineAreaPath(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) {
    return { line: '', area: '', points: [] as ChartPoint[], min: 0, max: 0 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1e-9, max - min)
  const innerWidth = Math.max(1, width - padding * 2)
  const innerHeight = Math.max(1, height - padding * 2)
  const step = values.length <= 1 ? 0 : innerWidth / (values.length - 1)

  const points = values.map((value, index) => {
    const normalized = (value - min) / range
    const x = padding + index * step
    const y = height - padding - normalized * innerHeight
    return { x, y, value }
  })

  const line = `M ${points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ')}`
  const lastX = points.at(-1)?.x ?? padding
  const area = `${line} L ${lastX.toFixed(2)},${(height - padding).toFixed(2)} L ${padding.toFixed(
    2
  )},${(height - padding).toFixed(2)} Z`

  return { line, area, points, min, max }
}

function MiniSparkline({ id, values }: { id: string; values: number[] }) {
  const { line, area } = buildLineAreaPath(values, 100, 32, 2)

  if (!line) {
    return (
      <div className="h-8 w-20 rounded-lg border border-white/60 bg-white/50 dark:border-white/10 dark:bg-white/5" />
    )
  }

  return (
    <div className="h-8 w-20 rounded-lg border border-white/60 bg-white/50 px-2 py-1 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <svg viewBox="0 0 100 32" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-600 dark:text-blue-400"
        />
      </svg>
    </div>
  )
}

function PremiumAreaChart({
  id,
  values,
  labels,
  formatValue,
}: {
  id: string
  values: number[]
  labels: string[]
  formatValue: (value: number) => string
}) {
  const width = 1000
  const height = 260
  const padding = 18
  const { line, area, points, min, max } = buildLineAreaPath(values, width, height, padding)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const setFromClientX = (clientX: number) => {
    const el = containerRef.current
    if (!el || points.length === 0) return
    const rect = el.getBoundingClientRect()
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    const idx = Math.round(ratio * (points.length - 1))
    setActiveIndex(clamp(idx, 0, points.length - 1))
  }

  const activePoint = activeIndex === null ? null : points[activeIndex]
  const activeLabel = activeIndex === null ? null : labels[activeIndex]

  const tooltipLeftPercent = activePoint ? clamp((activePoint.x / width) * 100, 6, 94) : 0

  if (!line || values.length <= 1) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-white/60 bg-white/45 text-sm text-zinc-500 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
        No chart data yet
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        preserveAspectRatio="none"
        onPointerMove={e => setFromClientX(e.clientX)}
        onPointerLeave={() => setActiveIndex(null)}
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(tick => {
          const y = padding + (height - padding * 2) * tick
          return (
            <line
              key={tick}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-zinc-200/70 dark:text-white/10"
              strokeDasharray="3 3"
            />
          )
        })}

        <path d={area} fill={`url(#${id}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke={`url(#${id}-stroke)`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding}
              y2={height - padding}
              stroke="currentColor"
              className="text-blue-600/35 dark:text-blue-400/35"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="8" fill="rgb(37 99 235)" opacity={0.12} />
            <circle cx={activePoint.x} cy={activePoint.y} r="4" fill="rgb(37 99 235)" />
          </>
        )}
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-mono tabular-nums">{formatValue(min)}</span>
        <span className="font-mono tabular-nums">{formatValue(max)}</span>
      </div>

      {activePoint && activeLabel && (
        <div
          className="pointer-events-none absolute top-3 -translate-x-1/2"
          style={{ left: `${tooltipLeftPercent}%` }}
        >
          <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-xs text-zinc-800 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/70 dark:text-zinc-200">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500 dark:text-zinc-400">{activeLabel}</span>
              <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatValue(activePoint.value)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// UI Pieces
// ============================================================================

function LiveStatusPill({ connected }: { connected: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md',
        connected
          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200'
          : 'border-white/60 bg-white/60 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
      )}
    >
      {connected ? (
        <>
          <motion.span
            variants={pulseVariants}
            animate="pulse"
            className="h-2.5 w-2.5 rounded-full bg-blue-500"
          />
          <Signal className="h-4 w-4" />
          <span>Live</span>
        </>
      ) : (
        <>
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  valueClassName,
  sparklineId,
  sparklineValues,
}: {
  icon: LucideIcon
  label: string
  value: string
  valueClassName?: string
  sparklineId?: string
  sparklineValues?: number[]
}) {
  return (
    <Card variant="glass" padding="md" interactive={false} className={cn('relative', glassCardClassName)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
        {sparklineId && sparklineValues ? (
          <MiniSparkline id={sparklineId} values={sparklineValues} />
        ) : (
          <div className="h-8 w-20" />
        )}
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
        <div
          className={cn(
            'mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums',
            valueClassName
          )}
        >
          {value}
        </div>
      </div>
    </Card>
  )
}

function MetricToggle({
  value,
  onChange,
  options,
}: {
  value: TrendMetric
  onChange: (next: TrendMetric) => void
  options: Array<{ id: TrendMetric; label: string; icon: LucideIcon }>
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/60 p-1 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      {options.map(option => {
        const isActive = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-200 dark:hover:text-white'
            )}
          >
            <option.icon className="h-3.5 w-3.5" />
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ModulesList({
  modules,
  selectedModule,
  onSelect,
}: {
  modules: Array<[string, ModuleStats]>
  selectedModule: string | null
  onSelect: (next: string | null) => void
}) {
  return (
    <div className="space-y-3">
      {modules.map(([moduleName, stats]) => {
        const isSelected = selectedModule === moduleName
        return (
          <button
            key={moduleName}
            type="button"
            onClick={() => onSelect(isSelected ? null : moduleName)}
            className="w-full text-left"
          >
            <Card
              variant="glass"
              padding="md"
              interactive={false}
              className={cn(
                glassCardClassName,
                'transition-[border-color,box-shadow] duration-200 ease-out-expo',
                isSelected
                  ? 'ring-2 ring-blue-500/25 border-blue-500/25 shadow-glass'
                  : 'hover:border-white/80 dark:hover:border-white/20'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-50">
                      {moduleName}
                    </span>
                    <span className={modulePillClassName}>{stats.unique_agents} agents</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Calls</div>
                      <div className="mt-0.5 font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {stats.total_calls}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Error rate</div>
                      <div
                        className={cn(
                          'mt-0.5 font-mono text-sm font-semibold tabular-nums',
                          stats.error_rate > 10
                            ? 'text-rose-500'
                            : stats.error_rate > 0
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                        )}
                      >
                        {stats.error_rate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Tokens</div>
                      <div className="mt-0.5 font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatTokens(stats.total_tokens)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Cost</div>
                      <div className="mt-0.5 font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatCost(stats.total_cost_usd)}
                      </div>
                    </div>
                  </div>
                </div>
                <TrendingUp className="mt-1 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </div>
            </Card>
          </button>
        )
      })}
    </div>
  )
}

function AgentPerformanceTable({
  rows,
  selectedModule,
}: {
  rows: AgentStats[]
  selectedModule: string | null
}) {
  return (
    <Card variant="glass" padding="none" interactive={false} className={cn('overflow-hidden', glassCardClassName)}>
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Agents</h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {selectedModule ? (
                <>
                  Filtered by{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">{selectedModule}</span>
                </>
              ) : (
                `${rows.length} agents`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-xs text-zinc-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            {rows.length} rows
          </span>
        </div>
      </CardHeader>

      <CardContent padding="none" className="overflow-hidden">
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-50/80 backdrop-blur-md dark:bg-zinc-950/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6">
                  Agent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6">
                  Module
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6">
                  Calls
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6">
                  Avg
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6">
                  Tokens
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6">
                  Cost
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 sm:px-6">
                  Success
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No agent data available yet. Run some agents to see metrics.
                  </td>
                </tr>
              ) : (
                rows.map((stats, idx) => (
                  <tr
                    key={`${stats.agent_name}-${stats.module_name}-${idx}`}
                    className="transition-colors hover:bg-zinc-50/60 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-100 sm:px-6">
                      {stats.agent_name}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className={modulePillClassName}>{stats.module_name}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-700 dark:text-zinc-300 tabular-nums sm:px-6">
                      {stats.total_invocations}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-700 dark:text-zinc-300 tabular-nums sm:px-6">
                      {formatDuration(stats.avg_duration_ms)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-700 dark:text-zinc-300 tabular-nums sm:px-6">
                      {formatTokens(stats.total_tokens)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-zinc-700 dark:text-zinc-300 tabular-nums sm:px-6">
                      {formatCost(stats.total_cost_usd)}
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <span
                        className={cn(
                          'font-semibold tabular-nums',
                          stats.success_rate >= 95
                            ? 'text-emerald-500'
                            : stats.success_rate >= 80
                              ? 'text-amber-500'
                              : 'text-rose-500'
                        )}
                      >
                        {stats.success_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityFeed({ history }: { history: HistoryEntry[] }) {
  const rows = history
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 24)

  return (
    <Card variant="glass" padding="none" interactive={false} className={cn('overflow-hidden', glassCardClassName)}>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Recent activity</h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Last {rows.length} events</p>
          </div>
        </div>
      </CardHeader>

      <CardContent padding="none">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No recent activity</div>
        ) : (
          <div className="divide-y divide-zinc-200/60 dark:divide-white/10">
            {rows.map((entry, idx) => (
              <div key={`${entry.timestamp}-${idx}`} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl',
                      entry.success
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                    )}
                  >
                    {entry.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {entry.agent_name}
                      </div>
                      <span className={modulePillClassName}>{entry.module_name}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="hidden shrink-0 items-center gap-6 text-xs text-zinc-600 dark:text-zinc-300 sm:flex">
                  <span className="font-mono tabular-nums">{formatDuration(entry.duration_ms)}</span>
                  <span className="font-mono tabular-nums">{formatTokens(entry.total_tokens)}</span>
                  <span className="font-mono tabular-nums">{formatCost(entry.cost_usd)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Page
// ============================================================================

export default function MetricsPage() {
  const { uiSettings } = useGlobal()
  const t = useCallback((key: string) => getTranslation(uiSettings.language, key), [uiSettings.language])
  const toast = useToast()

  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [moduleStats, setModuleStats] = useState<Record<string, ModuleStats>>({})
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('tokens')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const wsRef = useRef<WebSocket | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const [summaryRes, modulesRes, agentsRes, historyRes] = await Promise.all([
        fetch(apiUrl('/api/v1/metrics/summary')),
        fetch(apiUrl('/api/v1/metrics/modules')),
        fetch(apiUrl('/api/v1/metrics/agents')),
        fetch(apiUrl('/api/v1/metrics/history?limit=60')),
      ])

      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (modulesRes.ok) setModuleStats(await modulesRes.json())
      if (agentsRes.ok) setAgentStats(await agentsRes.json())
      if (historyRes.ok) setHistory(await historyRes.json())
      setLastUpdatedAt(new Date())
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch metrics:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    if (!autoRefresh) return

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl('/api/v1/metrics/stream'))

        ws.onopen = () => setWsConnected(true)
        ws.onmessage = event => {
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'metrics_update' || message.type === 'initial_summary') fetchMetrics()
          } catch (e) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to parse WebSocket message:', e)
            }
          }
        }
        ws.onclose = () => {
          setWsConnected(false)
          setTimeout(connectWebSocket, 5000)
        }
        ws.onerror = () => setWsConnected(false)

        wsRef.current = ws
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('WebSocket connection failed:', err)
        }
      }
    }

    connectWebSocket()

    return () => wsRef.current?.close()
  }, [autoRefresh, fetchMetrics])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(apiUrl('/api/v1/metrics/export'), { method: 'POST' })
      const data = await res.json()
      if (data.success) toast.success(`Report exported to: ${data.filepath}`)
      else toast.error(`Export failed: ${data.error}`)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Export failed:', err)
      }
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const filteredAgents = useMemo(() => {
    const entries = Object.values(agentStats)
    const filtered = selectedModule ? entries.filter(a => a.module_name === selectedModule) : entries
    return filtered.slice().sort((a, b) => b.total_invocations - a.total_invocations)
  }, [agentStats, selectedModule])

  const modulesSorted = useMemo(() => {
    return Object.entries(moduleStats).sort((a, b) => b[1].total_calls - a[1].total_calls)
  }, [moduleStats])

  const recentHistory = useMemo(() => {
    return history
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-60)
  }, [history])

  const tokensSeries = useMemo(() => recentHistory.map(h => h.total_tokens), [recentHistory])
  const costSeries = useMemo(() => recentHistory.map(h => h.cost_usd), [recentHistory])
  const durationSeries = useMemo(() => recentHistory.map(h => h.duration_ms ?? 0), [recentHistory])
  const durationsNonNull = useMemo(
    () => recentHistory.map(h => h.duration_ms).filter((ms): ms is number => typeof ms === 'number'),
    [recentHistory]
  )
  const avgDurationMs = useMemo(() => average(durationsNonNull), [durationsNonNull])
  const successSeries = useMemo(() => recentHistory.map(h => (h.success ? 1 : 0)), [recentHistory])

  const metricOptions = useMemo(
    () =>
      [
        { id: 'tokens' as const, label: t('Tokens'), icon: Layers },
        { id: 'cost' as const, label: t('Cost'), icon: DollarSign },
        { id: 'duration' as const, label: t('Duration'), icon: Clock },
      ] satisfies Array<{ id: TrendMetric; label: string; icon: LucideIcon }>,
    [t]
  )

  const chartValues = useMemo(() => {
    if (trendMetric === 'tokens') return tokensSeries
    if (trendMetric === 'cost') return costSeries
    return durationSeries
  }, [costSeries, durationSeries, tokensSeries, trendMetric])

  const chartLabels = useMemo(
    () =>
      recentHistory.map(entry =>
        new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      ),
    [recentHistory]
  )

  const chartFormatter = useMemo(() => {
    if (trendMetric === 'tokens') return (value: number) => formatTokens(Math.round(value))
    if (trendMetric === 'cost') return (value: number) => formatCost(value)
    return (value: number) => formatDuration(value)
  }, [trendMetric])

  const chartStats = useMemo(() => {
    if (chartValues.length === 0) return null
    return {
      avg: average(chartValues),
      min: Math.min(...chartValues),
      max: Math.max(...chartValues),
      p95: percentile(chartValues, 0.95),
    }
  }, [chartValues])

  const modulesSubtext = useMemo(() => {
    if (!summary) return `${modulesSorted.length} modules`
    return `${modulesSorted.length} modules · ${summary.unique_agents} unique agents`
  }, [modulesSorted.length, summary])

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Metrics') }]}>
      <PageHeader
        title={t('Performance Metrics')}
        description={t('Real-time agent performance monitoring with live data streaming')}
        icon={<Activity className="h-5 w-5 text-blue-600 dark:text-blue-300" />}
        className="flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <LiveStatusPill connected={wsConnected} />

            {lastUpdatedAt && (
              <span className="hidden rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-xs text-zinc-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 sm:inline-flex">
                Updated <span className="ml-1 font-mono tabular-nums">{lastUpdatedAt.toLocaleTimeString()}</span>
              </span>
            )}

            <Button
              variant={autoRefresh ? 'primary' : 'ghost'}
              size="sm"
              iconLeft={<RefreshCw className={cn('h-4 w-4', autoRefresh && 'animate-spin')} />}
              onClick={() => setAutoRefresh(prev => !prev)}
            >
              {t('Auto-refresh')}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw className="h-4 w-4" />}
              onClick={fetchMetrics}
            >
              {t('Refresh')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              iconLeft={<Download className="h-4 w-4" />}
              onClick={handleExport}
              loading={exporting}
            >
              {t('Export Report')}
            </Button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-16"
          >
            <Card variant="glass" padding="none" interactive={false} className={cn('overflow-hidden', glassCardClassName)}>
              <CardContent className="flex items-center gap-3 px-6 py-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 rounded-full border-[3px] border-blue-500 border-t-transparent"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-300">{t('Loading metrics')}...</span>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Overview */}
            <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
              <Card
                variant="glass"
                padding="none"
                interactive={false}
                className={cn('relative overflow-hidden lg:col-span-2', glassCardClassName)}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-35 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)] bg-[linear-gradient(to_right,rgba(24,24,27,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.07)_1px,transparent_1px)] bg-[length:56px_56px] dark:opacity-20 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-40 left-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-500/10"
                />

                <CardHeader className="relative flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Trends</h2>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        Last {recentHistory.length} events
                      </p>
                    </div>
                  </div>

                  <MetricToggle value={trendMetric} onChange={setTrendMetric} options={metricOptions} />
                </CardHeader>

                <CardContent className="relative">
                  <PremiumAreaChart
                    id={`metrics-${trendMetric}`}
                    values={chartValues}
                    labels={chartLabels}
                    formatValue={chartFormatter}
                  />

                  {chartStats && (
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-xl border border-white/60 bg-white/55 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Avg
                        </div>
                        <div className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {chartFormatter(chartStats.avg)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/55 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          p95
                        </div>
                        <div className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {chartFormatter(chartStats.p95)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/55 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Min
                        </div>
                        <div className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {chartFormatter(chartStats.min)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/60 bg-white/55 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Max
                        </div>
                        <div className="mt-1 font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {chartFormatter(chartStats.max)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <KpiCard icon={Zap} label={t('Total Calls')} value={(summary?.total_calls ?? 0).toString()} />
                <KpiCard
                  icon={Layers}
                  label={t('Total Tokens')}
                  value={formatTokens(summary?.total_tokens ?? 0)}
                  sparklineId="kpi-tokens"
                  sparklineValues={tokensSeries}
                />
                <KpiCard
                  icon={DollarSign}
                  label={t('Total Cost')}
                  value={formatCost(summary?.total_cost_usd ?? 0)}
                  sparklineId="kpi-cost"
                  sparklineValues={costSeries}
                />
                <KpiCard
                  icon={CheckCircle2}
                  label={t('Success Rate')}
                  value={`${(summary?.success_rate ?? 0).toFixed(1)}%`}
                  valueClassName={(summary?.success_rate ?? 0) >= 95 ? 'text-emerald-500' : undefined}
                  sparklineId="kpi-success"
                  sparklineValues={successSeries}
                />
                <KpiCard
                  icon={AlertTriangle}
                  label={t('Errors')}
                  value={(summary?.total_errors ?? 0).toString()}
                  valueClassName={(summary?.total_errors ?? 0) > 0 ? 'text-rose-500' : undefined}
                />
                <KpiCard
                  icon={Clock}
                  label={t('Avg Duration')}
                  value={avgDurationMs ? formatDuration(avgDurationMs) : '—'}
                  sparklineId="kpi-duration"
                  sparklineValues={durationSeries}
                />
              </div>
            </motion.section>

            {/* Modules + Agents */}
            <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
              <Card variant="glass" padding="none" interactive={false} className={cn('overflow-hidden', glassCardClassName)}>
                <CardHeader className="flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Modules</h2>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{modulesSubtext}</p>
                    </div>
                  </div>

                  {selectedModule && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>
                      Clear filter
                    </Button>
                  )}
                </CardHeader>

                <CardContent>
                  {modulesSorted.length === 0 ? (
                    <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No module data available yet
                    </div>
                  ) : (
                    <div className="max-h-[32rem] overflow-auto pr-1">
                      <ModulesList modules={modulesSorted} selectedModule={selectedModule} onSelect={setSelectedModule} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="lg:col-span-2">
                <AgentPerformanceTable rows={filteredAgents} selectedModule={selectedModule} />
              </div>
            </motion.section>

            {/* Activity */}
            <motion.section variants={itemVariants}>
              <ActivityFeed history={history} />
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
