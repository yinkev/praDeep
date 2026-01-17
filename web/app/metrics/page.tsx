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
  Loader2,
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
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/Toast'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/dashboard/StatCard'

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
      <div className="h-8 w-20 rounded border border-border bg-surface-raised/50" />
    )
  }

  return (
    <div className="h-8 w-20 rounded border border-border bg-surface-base/50 px-1 py-1 shadow-glass-sm backdrop-blur-md">
      <svg viewBox="0 0 100 32" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(var(--color-accent-primary), 0.2)" />
            <stop offset="100%" stopColor="rgba(var(--color-accent-primary), 0)" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--color-accent-primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
      <div className="flex h-56 items-center justify-center rounded-2xl border border-border bg-surface-elevated/40 text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary backdrop-blur-md">
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
            <stop offset="0%" stopColor="rgba(var(--color-accent-primary), 0.15)" />
            <stop offset="100%" stopColor="rgba(var(--color-accent-primary), 0)" />
          </linearGradient>
          <linearGradient id={`${id}-stroke`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgb(var(--color-accent-primary))" />
            <stop offset="100%" stopColor="rgb(var(--color-accent-primary))" stopOpacity="0.6" />
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
              stroke="rgb(var(--color-border-subtle))"
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
              stroke="rgb(var(--color-accent-primary))"
              strokeOpacity="0.2"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="8" fill="rgb(var(--color-accent-primary))" opacity={0.12} />
            <circle cx={activePoint.x} cy={activePoint.y} r="4" fill="rgb(var(--color-accent-primary))" />
          </>
        )}
      </svg>

      <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-text-quaternary uppercase tracking-tight">
        <span className="tabular-nums">MIN: {formatValue(min)}</span>
        <span className="tabular-nums">MAX: {formatValue(max)}</span>
      </div>

      {activePoint && activeLabel && (
        <div
          className="pointer-events-none absolute top-3 -translate-x-1/2"
          style={{ left: `${tooltipLeftPercent}%` }}
        >
          <div className="rounded border border-border bg-surface-base/90 px-3 py-2 text-[10px] font-mono font-bold text-text-primary shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <span className="text-text-tertiary">{activeLabel.toUpperCase()}</span>
              <span className="text-accent-primary tabular-nums">
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
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md transition-all duration-300',
        connected
          ? 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary'
          : 'border-border bg-surface-elevated text-text-tertiary'
      )}
    >
      {connected ? (
        <>
          <motion.span
            variants={pulseVariants}
            animate="pulse"
            className="h-2 w-2 rounded-full bg-accent-primary"
          />
          <Signal className="h-3.5 w-3.5" />
          <span>Live</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-text-quaternary" />
          <WifiOff className="h-3.5 w-3.5" />
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
    <Card interactive={false} className="relative border-border bg-surface-base">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-secondary border border-border-subtle text-text-tertiary shadow-sm">
          <Icon className="h-4.5 w-4.5" />
        </div>
        {sparklineId && sparklineValues ? (
          <MiniSparkline id={sparklineId} values={sparklineValues} />
        ) : (
          <div className="h-8 w-20" />
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
          {label}
        </div>
        <div
          className={cn(
            'mt-1 text-2xl font-bold tracking-tighter text-text-primary tabular-nums',
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
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated/50 p-1 backdrop-blur-md">
      {options.map(option => {
        const isActive = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all duration-200',
              isActive
                ? 'bg-accent-primary text-white shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-base'
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
            className="w-full text-left outline-none group"
          >
            <Card
              interactive={false}
              className={cn(
                'transition-all duration-300 ease-out-expo border-border bg-surface-base/50',
                isSelected
                  ? 'border-accent-primary/40 bg-surface-secondary shadow-glass-sm ring-1 ring-accent-primary/10'
                  : 'hover:border-accent-primary/20 hover:bg-surface-secondary/40'
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-text-primary">
                        {moduleName}
                      </span>
                      <Badge variant="outline" className="border-border text-[9px] font-mono px-1.5 py-0">
                        {stats.unique_agents} AGENTS
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-tight text-text-tertiary">Calls</div>
                        <div className="mt-0.5 font-mono text-xs text-text-primary tabular-nums">
                          {stats.total_calls}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-tight text-text-tertiary">Error rate</div>
                        <div
                          className={cn(
                            'mt-0.5 font-mono text-xs font-bold tabular-nums',
                            stats.error_rate > 10
                              ? 'text-error'
                              : stats.error_rate > 0
                                ? 'text-warning'
                                : 'text-success'
                          )}
                        >
                          {stats.error_rate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-tight text-text-tertiary">Tokens</div>
                        <div className="mt-0.5 font-mono text-xs text-text-primary tabular-nums">
                          {formatTokens(stats.total_tokens)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold uppercase tracking-tight text-text-tertiary">Cost</div>
                        <div className="mt-0.5 font-mono text-xs text-text-primary tabular-nums">
                          {formatCost(stats.total_cost_usd)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <TrendingUp className={cn(
                    "h-4 w-4 transition-colors",
                    isSelected ? "text-accent-primary" : "text-text-quaternary group-hover:text-text-tertiary"
                  )} />
                </div>
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
    <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">Agents</CardTitle>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
              {selectedModule ? (
                <>
                  FILTERED BY <span className="text-accent-primary">{selectedModule.toUpperCase()}</span>
                </>
              ) : (
                `${rows.length} REGISTERED AGENTS`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-surface-elevated text-text-tertiary border-border text-[9px] font-mono px-2 py-1">
            {rows.length} ROWS
          </Badge>
        </div>
      </CardHeader>

      <CardBody padding="none" className="overflow-hidden border-t border-border">
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-secondary/80 backdrop-blur-md border-b border-border">
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Module
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Calls
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Tokens
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Cost
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                  Success
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary">
                    No agent data available yet.
                  </td>
                </tr>
              ) : (
                rows.map((stats, idx) => (
                  <tr
                    key={`${stats.agent_name}-${stats.module_name}-${idx}`}
                    className="transition-colors hover:bg-surface-secondary/30"
                  >
                    <td className="px-6 py-4 font-bold text-xs uppercase tracking-tight text-text-primary">
                      {stats.agent_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle">
                        {stats.module_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary tabular-nums">
                      {stats.total_invocations}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary tabular-nums">
                      {formatDuration(stats.avg_duration_ms)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary tabular-nums">
                      {formatTokens(stats.total_tokens)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary tabular-nums">
                      {formatCost(stats.total_cost_usd)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          'font-bold tabular-nums text-xs font-mono',
                          stats.success_rate >= 95
                            ? 'text-success'
                            : stats.success_rate >= 80
                              ? 'text-warning'
                              : 'text-error'
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
      </CardBody>
    </Card>
  )
}

function ActivityFeed({ history }: { history: HistoryEntry[] }) {
  const rows = history
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 24)

  return (
    <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
      <CardHeader className="flex-row items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">Recent Activity</CardTitle>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">LAST {rows.length} EVENTS</p>
          </div>
        </div>
      </CardHeader>

      <CardBody padding="none" className="border-t border-border">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary">No recent events</div>
        ) : (
          <div className="divide-y divide-border-subtle/50">
            {rows.map((entry, idx) => (
              <div key={`${entry.timestamp}-${idx}`} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-secondary/20">
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border',
                      entry.success
                        ? 'bg-success-muted/10 text-success border-success/20'
                        : 'bg-error-muted/10 text-error border-error/20'
                    )}
                  >
                    {entry.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="truncate text-xs font-bold uppercase tracking-tight text-text-primary">
                        {entry.agent_name}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-text-tertiary bg-surface-elevated px-1.5 py-0.5 rounded border border-border-subtle">
                        {entry.module_name}
                      </span>
                    </div>
                    <div className="mt-1 text-[9px] font-mono uppercase tracking-tighter text-text-quaternary">
                      {new Date(entry.timestamp).toLocaleString().toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="hidden shrink-0 items-center gap-6 text-[10px] font-mono text-text-tertiary uppercase tabular-nums sm:flex">
                  <span>TIME: {formatDuration(entry.duration_ms)}</span>
                  <span>TOK: {formatTokens(entry.total_tokens)}</span>
                  <span className="text-text-secondary font-bold">{formatCost(entry.cost_usd)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
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
    if (!summary) return `${modulesSorted.length} MODULES`
    return `${modulesSorted.length} MODULES · ${summary.unique_agents} UNIQUE AGENTS`
  }, [modulesSorted.length, summary])

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Metrics') }]}>
      <PageHeader
        title={t('Performance Metrics')}
        description={t('Real-time agent performance monitoring with data streaming')}
        icon={<Activity className="h-5 w-5 text-accent-primary" />}
        className="flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <LiveStatusPill connected={wsConnected} />

            <Button
              variant={autoRefresh ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "text-[10px] font-mono uppercase tracking-widest h-8",
                autoRefresh && "border-accent-primary/20 text-accent-primary"
              )}
              onClick={() => setAutoRefresh(prev => !prev)}
            >
              <RefreshCw className={cn('h-3 w-3 mr-2', autoRefresh && 'animate-spin')} />
              {t('Auto-refresh')}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="text-[10px] font-mono uppercase tracking-widest h-8"
              onClick={fetchMetrics}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              {t('Refresh')}
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="text-[10px] font-mono uppercase tracking-widest h-8"
              onClick={handleExport}
              loading={exporting}
            >
              <Download className="h-3 w-3 mr-2" />
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
            className="flex flex-col items-center justify-center py-32 gap-4"
          >
            <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-tertiary">
              {t('Loading metrics')}
            </span>
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
                interactive={false}
                className="relative overflow-hidden lg:col-span-2 border-border bg-surface-base"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--color-accent-primary),0.06),transparent_60%)]"
                />

                <CardHeader className="relative flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">Trends</CardTitle>
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
                        LAST {recentHistory.length} EVENTS
                      </p>
                    </div>
                  </div>

                  <MetricToggle value={trendMetric} onChange={setTrendMetric} options={metricOptions} />
                </CardHeader>

                <CardBody className="relative p-6 pt-0">
                  <PremiumAreaChart
                    id={`metrics-${trendMetric}`}
                    values={chartValues}
                    labels={chartLabels}
                    formatValue={chartFormatter}
                  />

                  {chartStats && (
                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: 'AVG', val: chartStats.avg },
                        { label: 'P95', val: chartStats.p95 },
                        { label: 'MIN', val: chartStats.min },
                        { label: 'MAX', val: chartStats.max }
                      ].map(stat => (
                        <div key={stat.label} className="rounded-xl border border-border-subtle bg-surface-elevated/40 p-4 shadow-glass-sm backdrop-blur-md">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-text-quaternary">
                            {stat.label}
                          </div>
                          <div className="mt-1 font-mono text-sm font-bold text-text-primary tabular-nums">
                            {chartFormatter(stat.val)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
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
                  valueClassName={(summary?.success_rate ?? 0) >= 95 ? 'text-success' : undefined}
                  sparklineId="kpi-success"
                  sparklineValues={successSeries}
                />
                <KpiCard
                  icon={AlertTriangle}
                  label={t('Errors')}
                  value={(summary?.total_errors ?? 0).toString()}
                  valueClassName={(summary?.total_errors ?? 0) > 0 ? 'text-error' : undefined}
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
              <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
                <CardHeader className="flex-row items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">Module Stats</CardTitle>
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">{modulesSubtext}</p>
                    </div>
                  </div>

                  {selectedModule && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)} className="text-[9px] font-bold uppercase tracking-widest">
                      Reset
                    </Button>
                  )}
                </CardHeader>

                <CardBody className="p-6 pt-0">
                  {modulesSorted.length === 0 ? (
                    <div className="py-16 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary">
                      No module data
                    </div>
                  ) : (
                    <div className="max-h-[32rem] overflow-auto pr-1 no-scrollbar">
                      <ModulesList modules={modulesSorted} selectedModule={selectedModule} onSelect={setSelectedModule} />
                    </div>
                  )}
                </CardBody>
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
