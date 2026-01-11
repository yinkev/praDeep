'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
} from 'lucide-react'
import { apiUrl, wsUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'

// Types
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

// Module colors
const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  solve: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  research: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  guide: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  question: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  ideagen: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
  co_writer: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
}

const getModuleColor = (module: string) => {
  return (
    MODULE_COLORS[module] || {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
    }
  )
}

// Format helpers
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
              // Refresh data on updates
              fetchMetrics()
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        ws.onclose = () => {
          setWsConnected(false)
          // Reconnect after 5 seconds
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
    <div className="h-screen flex flex-col animate-fade-in p-6">
      {/* Header */}
      <div className="shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {t('Performance Metrics')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Real-time agent performance monitoring
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Connection status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                wsConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}
              />
              {wsConnected ? 'Live' : 'Disconnected'}
            </div>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </button>

            {/* Manual refresh */}
            <button
              onClick={fetchMetrics}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <SummaryCard
                icon={Zap}
                label="Total Calls"
                value={summary?.total_calls || 0}
                color="blue"
              />
              <SummaryCard
                icon={Layers}
                label="Total Tokens"
                value={formatTokens(summary?.total_tokens || 0)}
                color="purple"
              />
              <SummaryCard
                icon={DollarSign}
                label="Total Cost"
                value={formatCost(summary?.total_cost_usd || 0)}
                color="emerald"
              />
              <SummaryCard
                icon={CheckCircle2}
                label="Success Rate"
                value={`${(summary?.success_rate || 0).toFixed(1)}%`}
                color="green"
              />
              <SummaryCard
                icon={AlertTriangle}
                label="Errors"
                value={summary?.total_errors || 0}
                color="red"
              />
              <SummaryCard
                icon={Cpu}
                label="Unique Agents"
                value={summary?.unique_agents || 0}
                color="amber"
              />
            </div>

            {/* Module Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                    Module Statistics
                  </h2>
                </div>
                {selectedModule && (
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(moduleStats).map(([moduleName, stats]) => {
                  const colors = getModuleColor(moduleName)
                  const isSelected = selectedModule === moduleName

                  return (
                    <button
                      key={moduleName}
                      onClick={() => setSelectedModule(isSelected ? null : moduleName)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.border} ring-2 ring-offset-2 ring-blue-500`
                          : `bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:${colors.bg}`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-semibold capitalize ${colors.text}`}>
                          {moduleName}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                        >
                          {stats.unique_agents} agents
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-slate-500 dark:text-slate-400">Calls</div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {stats.total_calls}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 dark:text-slate-400">Tokens</div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {formatTokens(stats.total_tokens)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 dark:text-slate-400">Cost</div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {formatCost(stats.total_cost_usd)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 dark:text-slate-400">Error Rate</div>
                          <div
                            className={`font-medium ${
                              stats.error_rate > 10
                                ? 'text-red-500'
                                : stats.error_rate > 0
                                  ? 'text-amber-500'
                                  : 'text-green-500'
                            }`}
                          >
                            {stats.error_rate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {Object.keys(moduleStats).length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-400">
                    No module data available yet
                  </div>
                )}
              </div>
            </div>

            {/* Agent Stats Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  Agent Performance
                  {selectedModule && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      ({selectedModule})
                    </span>
                  )}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                        Agent
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                        Module
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        Calls
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        Avg Time
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        Tokens
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        Cost
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        Success
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredAgents.map(([key, stats]) => {
                      const colors = getModuleColor(stats.module_name)

                      return (
                        <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {stats.agent_name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                            >
                              {stats.module_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {stats.total_invocations}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {formatDuration(stats.avg_duration_ms)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {formatTokens(stats.total_tokens)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {formatCost(stats.total_cost_usd)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-medium ${
                                stats.success_rate >= 95
                                  ? 'text-green-500'
                                  : stats.success_rate >= 80
                                    ? 'text-amber-500'
                                    : 'text-red-500'
                              }`}
                            >
                              {stats.success_rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {filteredAgents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No agent data available yet. Run some agents to see metrics.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  Recent Activity
                </h2>
                <span className="text-xs text-slate-400 ml-auto">{history.length} entries</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                {history.map((entry, idx) => {
                  const colors = getModuleColor(entry.module_name)

                  return (
                    <div
                      key={idx}
                      className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            entry.success ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {entry.agent_name}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}
                            >
                              {entry.module_name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>{formatDuration(entry.duration_ms)}</span>
                        <span>{formatTokens(entry.total_tokens)} tokens</span>
                        <span>{formatCost(entry.cost_usd)}</span>
                      </div>
                    </div>
                  )
                })}

                {history.length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-400">No recent activity</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Summary Card Component
function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-500',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'text-purple-500',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: 'text-emerald-500',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500',
    },
  }

  const classes = colorClasses[color] || colorClasses.blue

  return (
    <div
      className={`${classes.bg} rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${classes.icon}`} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${classes.text}`}>{value}</div>
    </div>
  )
}
