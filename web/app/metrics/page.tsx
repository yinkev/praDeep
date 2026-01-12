'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  TrendingUp,
  BarChart3,
  Cpu,
  Layers,
  Signal,
  WifiOff,
} from 'lucide-react'
import { apiUrl, wsUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

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

// ============================================================================
// Module Colors with Teal Accents
// ============================================================================

const MODULE_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  solve: {
    bg: 'bg-teal-100/80 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200/50 dark:border-teal-800/50',
    glow: 'shadow-teal-500/20',
  },
  research: {
    bg: 'bg-emerald-100/80 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/50 dark:border-emerald-800/50',
    glow: 'shadow-emerald-500/20',
  },
  guide: {
    bg: 'bg-violet-100/80 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/50 dark:border-violet-800/50',
    glow: 'shadow-violet-500/20',
  },
  question: {
    bg: 'bg-amber-100/80 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/50 dark:border-amber-800/50',
    glow: 'shadow-amber-500/20',
  },
  ideagen: {
    bg: 'bg-rose-100/80 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200/50 dark:border-rose-800/50',
    glow: 'shadow-rose-500/20',
  },
  co_writer: {
    bg: 'bg-cyan-100/80 dark:bg-cyan-900/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/50 dark:border-cyan-800/50',
    glow: 'shadow-cyan-500/20',
  },
}

const getModuleColor = (module: string) => {
  return (
    MODULE_COLORS[module] || {
      bg: 'bg-slate-100/80 dark:bg-slate-800/50',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200/50 dark:border-slate-700/50',
      glow: 'shadow-slate-500/20',
    }
  )
}

// ============================================================================
// Format Helpers
// ============================================================================

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

// ============================================================================
// Animation Variants
// ============================================================================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

// ============================================================================
// Glassmorphism Metric Card Component
// ============================================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: 'teal' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan'
  trend?: 'up' | 'down' | 'neutral'
}) {
  const colorConfig = {
    teal: {
      bg: 'from-teal-500/20 to-teal-600/10',
      icon: 'text-teal-500 dark:text-teal-400',
      value: 'text-teal-600 dark:text-teal-300',
      glow: 'shadow-teal-500/10',
    },
    violet: {
      bg: 'from-violet-500/20 to-violet-600/10',
      icon: 'text-violet-500 dark:text-violet-400',
      value: 'text-violet-600 dark:text-violet-300',
      glow: 'shadow-violet-500/10',
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-600/10',
      icon: 'text-emerald-500 dark:text-emerald-400',
      value: 'text-emerald-600 dark:text-emerald-300',
      glow: 'shadow-emerald-500/10',
    },
    rose: {
      bg: 'from-rose-500/20 to-rose-600/10',
      icon: 'text-rose-500 dark:text-rose-400',
      value: 'text-rose-600 dark:text-rose-300',
      glow: 'shadow-rose-500/10',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-600/10',
      icon: 'text-amber-500 dark:text-amber-400',
      value: 'text-amber-600 dark:text-amber-300',
      glow: 'shadow-amber-500/10',
    },
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-600/10',
      icon: 'text-cyan-500 dark:text-cyan-400',
      value: 'text-cyan-600 dark:text-cyan-300',
      glow: 'shadow-cyan-500/10',
    },
  }

  const config = colorConfig[color]

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-white/60 dark:bg-slate-900/40
        backdrop-blur-xl backdrop-saturate-150
        border border-white/40 dark:border-slate-700/40
        shadow-xl ${config.glow}
        transition-shadow duration-300
        hover:shadow-2xl hover:${config.glow}
      `}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-50 pointer-events-none`}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`
            p-2.5 rounded-xl
            bg-white/70 dark:bg-slate-800/70
            backdrop-blur-sm
            shadow-sm
          `}
          >
            <Icon className={`w-5 h-5 ${config.icon}`} />
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <motion.div
          className={`text-3xl font-bold ${config.value} tracking-tight`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
        >
          {value}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Live Status Indicator
// ============================================================================

function LiveIndicator({ connected }: { connected: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        ${
          connected
            ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
        }
        backdrop-blur-sm border
        ${connected ? 'border-emerald-200/50 dark:border-emerald-800/50' : 'border-slate-200/50 dark:border-slate-700/50'}
      `}
    >
      {connected ? (
        <>
          <motion.div
            variants={pulseVariants}
            animate="pulse"
            className="w-2.5 h-2.5 rounded-full bg-emerald-500"
          />
          <Signal className="w-4 h-4" />
          <span className="text-sm font-medium">Live</span>
        </>
      ) : (
        <>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Disconnected</span>
        </>
      )}
    </motion.div>
  )
}

// ============================================================================
// Module Stats Card with Glassmorphism
// ============================================================================

function ModuleCard({
  moduleName,
  stats,
  isSelected,
  onClick,
}: {
  moduleName: string
  stats: ModuleStats
  isSelected: boolean
  onClick: () => void
}) {
  const colors = getModuleColor(moduleName)

  return (
    <motion.button
      variants={scaleIn}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        text-left w-full p-5 rounded-2xl
        transition-all duration-300
        ${
          isSelected
            ? `bg-white/80 dark:bg-slate-800/80 ring-2 ring-teal-500/50 shadow-xl ${colors.glow}`
            : 'bg-white/50 dark:bg-slate-900/30 hover:bg-white/70 dark:hover:bg-slate-800/50'
        }
        backdrop-blur-xl backdrop-saturate-150
        border ${isSelected ? 'border-teal-300/50 dark:border-teal-700/50' : 'border-white/30 dark:border-slate-700/30'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-lg font-semibold capitalize ${colors.text}`}>{moduleName}</span>
        <span
          className={`
          text-xs px-3 py-1.5 rounded-full font-medium
          ${colors.bg} ${colors.text}
          backdrop-blur-sm
        `}
        >
          {stats.unique_agents} agents
        </span>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <StatItem label="Calls" value={stats.total_calls.toString()} />
        <StatItem label="Tokens" value={formatTokens(stats.total_tokens)} />
        <StatItem label="Cost" value={formatCost(stats.total_cost_usd)} />
        <StatItem
          label="Error Rate"
          value={`${stats.error_rate.toFixed(1)}%`}
          valueColor={
            stats.error_rate > 10
              ? 'text-rose-500'
              : stats.error_rate > 0
                ? 'text-amber-500'
                : 'text-emerald-500'
          }
        />
      </motion.div>
    </motion.button>
  )
}

function StatItem({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</div>
      <div className={`font-semibold ${valueColor || 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </div>
    </div>
  )
}

// ============================================================================
// Agent Table with Glass Styling
// ============================================================================

function AgentTable({
  agents,
  selectedModule,
}: {
  agents: [string, AgentStats][]
  selectedModule: string | null
}) {
  return (
    <Card variant="glass" hoverEffect={false} className="overflow-hidden">
      <CardHeader className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/30">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Agent Performance</h2>
          {selectedModule && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Filtered by {selectedModule}
            </span>
          )}
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F7F4EC]/50 dark:bg-slate-800/50">
              <th className="px-5 py-4 text-left font-medium text-slate-600 dark:text-slate-400">
                Agent
              </th>
              <th className="px-5 py-4 text-left font-medium text-slate-600 dark:text-slate-400">
                Module
              </th>
              <th className="px-5 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                Calls
              </th>
              <th className="px-5 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                Avg Time
              </th>
              <th className="px-5 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                Tokens
              </th>
              <th className="px-5 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                Cost
              </th>
              <th className="px-5 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                Success
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D0]/50 dark:divide-slate-700/50">
            <AnimatePresence mode="popLayout">
              {agents.map(([key, stats]) => {
                const colors = getModuleColor(stats.module_name)

                return (
                  <motion.tr
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="hover:bg-white/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                      {stats.agent_name}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`
                        px-2.5 py-1 rounded-lg text-xs font-medium
                        ${colors.bg} ${colors.text}
                        backdrop-blur-sm
                      `}
                      >
                        {stats.module_name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-400">
                      {stats.total_invocations}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-400">
                      {formatDuration(stats.avg_duration_ms)}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-400">
                      {formatTokens(stats.total_tokens)}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-400">
                      {formatCost(stats.total_cost_usd)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`
                        font-semibold
                        ${
                          stats.success_rate >= 95
                            ? 'text-emerald-500'
                            : stats.success_rate >= 80
                              ? 'text-amber-500'
                              : 'text-rose-500'
                        }
                      `}
                      >
                        {stats.success_rate.toFixed(1)}%
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>

            {agents.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-slate-400 dark:text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Cpu className="w-8 h-8 opacity-50" />
                    <span>No agent data available yet. Run some agents to see metrics.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ============================================================================
// Activity History with Animations
// ============================================================================

function ActivityHistory({ history }: { history: HistoryEntry[] }) {
  return (
    <Card variant="glass" hoverEffect={false} className="overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100/80 dark:bg-amber-900/30">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/50 px-3 py-1.5 rounded-full">
          {history.length} entries
        </span>
      </CardHeader>

      <div className="divide-y divide-[#E8E2D0]/50 dark:divide-slate-700/50 max-h-80 overflow-y-auto">
        <AnimatePresence initial={false}>
          {history.map((entry, idx) => {
            const colors = getModuleColor(entry.module_name)

            return (
              <motion.div
                key={`${entry.timestamp}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.02 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-white/30 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`
                      w-3 h-3 rounded-full
                      ${entry.success ? 'bg-emerald-500' : 'bg-rose-500'}
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' as const, stiffness: 500, damping: 25 }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {entry.agent_name}
                      </span>
                      <span
                        className={`
                        px-2 py-0.5 rounded-md text-xs font-medium
                        ${colors.bg} ${colors.text}
                      `}
                      >
                        {entry.module_name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{formatDuration(entry.duration_ms)}</span>
                  <span className="font-mono">{formatTokens(entry.total_tokens)}</span>
                  <span className="font-mono">{formatCost(entry.cost_usd)}</span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {history.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 opacity-50" />
              <span>No recent activity</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function MetricsPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)

  // State
  const [summary, setSummary] = useState<MetricsSummary | null>(null)
  const [moduleStats, setModuleStats] = useState<Record<string, ModuleStats>>({})
  const [agentStats, setAgentStats] = useState<Record<string, AgentStats>>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const wsRef = useRef<WebSocket | null>(null)

  // Fetch data
  const fetchMetrics = useCallback(async () => {
    try {
      const [summaryRes, modulesRes, agentsRes, historyRes] = await Promise.all([
        fetch(apiUrl('/api/v1/metrics/summary')),
        fetch(apiUrl('/api/v1/metrics/modules')),
        fetch(apiUrl('/api/v1/metrics/agents')),
        fetch(apiUrl('/api/v1/metrics/history?limit=50')),
      ])

      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (modulesRes.ok) setModuleStats(await modulesRes.json())
      if (agentsRes.ok) setAgentStats(await agentsRes.json())
      if (historyRes.ok) setHistory(await historyRes.json())
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // WebSocket connection
  useEffect(() => {
    if (!autoRefresh) return

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl('/api/v1/metrics/stream'))

        ws.onopen = () => {
          setWsConnected(true)
          console.log('Metrics WebSocket connected')
        }

        ws.onmessage = event => {
          try {
            const message = JSON.parse(event.data)
            if (message.type === 'metrics_update' || message.type === 'initial_summary') {
              fetchMetrics()
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        ws.onclose = () => {
          setWsConnected(false)
          setTimeout(connectWebSocket, 5000)
        }

        ws.onerror = () => {
          setWsConnected(false)
        }

        wsRef.current = ws
      } catch (err) {
        console.error('WebSocket connection failed:', err)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [autoRefresh, fetchMetrics])

  // Initial fetch
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Export report
  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch(apiUrl('/api/v1/metrics/export'), { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`Report exported to: ${data.filepath}`)
      } else {
        alert(`Export failed: ${data.error}`)
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed')
    } finally {
      setExporting(false)
    }
  }

  // Filter agents by module
  const filteredAgents = selectedModule
    ? Object.entries(agentStats).filter(([_, stats]) => stats.module_name === selectedModule)
    : Object.entries(agentStats)

  return (
    <PageWrapper maxWidth="2xl" showPattern>
      <PageHeader
        title={t('Performance Metrics')}
        description="Real-time agent performance monitoring with live data streaming"
        icon={<Activity className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-3">
            <LiveIndicator connected={wsConnected} />

            <Button
              variant={autoRefresh ? 'primary' : 'ghost'}
              size="sm"
              iconLeft={<RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw className="w-4 h-4" />}
              onClick={fetchMetrics}
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              iconLeft={<Download className="w-4 h-4" />}
              onClick={handleExport}
              loading={exporting}
            >
              Export Report
            </Button>
          </div>
        }
      />

      {/* Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              <MetricCard
                icon={Zap}
                label="Total Calls"
                value={summary?.total_calls || 0}
                color="teal"
              />
              <MetricCard
                icon={Layers}
                label="Total Tokens"
                value={formatTokens(summary?.total_tokens || 0)}
                color="violet"
              />
              <MetricCard
                icon={DollarSign}
                label="Total Cost"
                value={formatCost(summary?.total_cost_usd || 0)}
                color="emerald"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Success Rate"
                value={`${(summary?.success_rate || 0).toFixed(1)}%`}
                color="cyan"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Errors"
                value={summary?.total_errors || 0}
                color="rose"
              />
              <MetricCard
                icon={Cpu}
                label="Unique Agents"
                value={summary?.unique_agents || 0}
                color="amber"
              />
            </motion.div>

            {/* Module Stats */}
            <Card variant="glass" hoverEffect={false}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100/80 dark:bg-teal-900/30">
                    <BarChart3 className="w-5 h-5 text-teal-500" />
                  </div>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                    Module Statistics
                  </h2>
                </div>
                {selectedModule && (
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="text-sm text-teal-500 hover:text-teal-600 dark:hover:text-teal-400 font-medium transition-colors"
                  >
                    Clear filter
                  </button>
                )}
              </CardHeader>

              <CardBody>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {Object.entries(moduleStats).map(([moduleName, stats]) => (
                    <ModuleCard
                      key={moduleName}
                      moduleName={moduleName}
                      stats={stats}
                      isSelected={selectedModule === moduleName}
                      onClick={() =>
                        setSelectedModule(selectedModule === moduleName ? null : moduleName)
                      }
                    />
                  ))}

                  {Object.keys(moduleStats).length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <BarChart3 className="w-8 h-8 opacity-50" />
                        <span>No module data available yet</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </CardBody>
            </Card>

            {/* Agent Stats Table */}
            <AgentTable agents={filteredAgents} selectedModule={selectedModule} />

            {/* Recent Activity */}
            <ActivityHistory history={history} />
          </>
        )}
      </div>
    </PageWrapper>
  )
}
