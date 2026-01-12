'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileJson,
  HardDrive,
  LayoutGrid,
  List,
  MessageSquareQuote,
  RefreshCw,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { apiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/Button'
import { FullPageLoading } from '@/components/ui/LoadingState'
import { useToast } from '@/components/ui/Toast'

interface Preference {
  response_style: string
  difficulty_level: string
  preferred_explanation_format: string
  enable_examples: boolean
  show_sources: boolean
  custom: Record<string, unknown>
}

interface Topic {
  name: string
  frequency: number
  last_accessed: number
  category?: string
}

interface LearningPatterns {
  interaction_count: number
  preferred_modules: Record<string, number>
  peak_usage_hours: number[]
  learning_velocity: Record<string, { mastery_score: number }>
}

interface RecurringQuestion {
  hash: string
  normalized: string
  frequency: number
  last_asked: number
  examples: string[]
}

type LayoutMode = 'grid' | 'list'

// Premium animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1], // out-expo
    },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300',
        checked ? 'bg-blue-600 shadow-lg shadow-blue-500/25' : 'bg-zinc-200 dark:bg-white/10',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
      )}
    >
      <motion.span
        layout
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow-lg dark:bg-zinc-50',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </motion.button>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  value: number | string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
      }}
      className="h-full"
    >
      <Card
        variant="glass"
        padding="sm"
        className="h-full transition-shadow duration-300 hover:shadow-lg"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-white/10"
          >
            {icon}
          </motion.div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
            <motion.div
              key={value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-0.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums"
            >
              {value}
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

interface ProgressBarProps {
  label: string
  value: number
  maxValue: number
}

function ProgressBar({ label, value, maxValue }: ProgressBarProps) {
  const pct = maxValue > 0 ? Math.min(1, value / maxValue) : 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group flex items-center gap-3"
    >
      <div className="w-28 truncate text-xs font-medium text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
        {label}
      </div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{
            duration: 1.2,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 2,
            delay: 0.2,
            ease: 'easeInOut',
          }}
          className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="w-10 text-right text-xs font-medium text-zinc-500 tabular-nums dark:text-zinc-400"
      >
        {value}
      </motion.div>
    </motion.div>
  )
}

function masteryPercent(score: number) {
  const normalized = score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, normalized))
}

function formatMasteryPercent(score: number) {
  return `${Math.round(masteryPercent(score))}%`
}

interface TopicCardProps {
  topic: Topic
  formatTime: (timestamp: number) => string
}

function TopicCard({ topic, formatTime }: TopicCardProps) {
  return (
    <Card variant="glass" padding="sm" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">{topic.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(topic.last_accessed)}
            </span>
            {topic.category && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-blue-600 dark:text-blue-400">{topic.category}</span>
              </>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-white/10 tabular-nums">
          {topic.frequency}x
        </span>
      </div>
    </Card>
  )
}

interface QuestionCardProps {
  question: RecurringQuestion
  onResolve: () => void
  formatTime: (timestamp: number) => string
}

function QuestionCard({ question, onResolve, formatTime }: QuestionCardProps) {
  return (
    <Card variant="glass" padding="sm" className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 leading-relaxed text-zinc-900 dark:text-zinc-50">
            {question.normalized}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 text-blue-700 ring-1 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-white/10">
              <TrendingUp className="h-3.5 w-3.5" />
              Asked {question.frequency}x
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(question.last_asked)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onResolve}
          className="rounded-xl border border-blue-200/70 bg-blue-50 p-2.5 text-blue-700 shadow-sm transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60 dark:focus-visible:ring-offset-zinc-950"
          aria-label="Mark question as resolved"
          title="Mark as resolved"
        >
          <CheckCircle className="h-5 w-5" />
        </button>
      </div>
    </Card>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  asCard?: boolean
}

function EmptyState({ icon, title, description, asCard = true }: EmptyStateProps) {
  const content = (
    <>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-zinc-400 shadow-sm ring-1 ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-500 dark:ring-white/10">
        {icon}
      </div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
    </>
  )

  if (!asCard) {
    return (
      <div className="rounded-xl border border-white/55 bg-white/70 p-8 text-center shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        {content}
      </div>
    )
  }

  return (
    <Card variant="glass" interactive={false} className="py-12 text-center">
      {content}
    </Card>
  )
}

export default function MemoryPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)
  const toast = useToast()
  const importInputRef = useRef<HTMLInputElement>(null)

  const [layout, setLayout] = useState<LayoutMode>('grid')
  const [preferences, setPreferences] = useState<Preference | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [patterns, setPatterns] = useState<LearningPatterns | null>(null)
  const [questions, setQuestions] = useState<RecurringQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAllMemory = useCallback(async () => {
    setLoading(true)
    try {
      const [prefsRes, topicsRes, patternsRes, questionsRes] = await Promise.all([
        fetch(apiUrl('/api/v1/memory/preferences')),
        fetch(apiUrl('/api/v1/memory/topics?limit=20')),
        fetch(apiUrl('/api/v1/memory/patterns')),
        fetch(apiUrl('/api/v1/memory/questions?min_frequency=1&limit=20')),
      ])

      const prefsData = await prefsRes.json()
      const topicsData = await topicsRes.json()
      const patternsData = await patternsRes.json()
      const questionsData = await questionsRes.json()

      setPreferences(prefsData.preferences)
      setTopics(topicsData.topics)
      setPatterns(patternsData)
      setQuestions(questionsData.questions)
    } catch (err) {
      console.error('Failed to fetch memory:', err)
      toast.error('Failed to load memory data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAllMemory()
  }, [fetchAllMemory])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllMemory()
    setRefreshing(false)
    toast.success('Memory data refreshed')
  }

  const updatePreference = async (key: string, value: unknown) => {
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/api/v1/memory/preferences'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      setPreferences(data.preferences)
      toast.success('Preference updated')
    } catch (err) {
      console.error('Failed to update preference:', err)
      toast.error('Failed to update preference')
    } finally {
      setSaving(false)
    }
  }

  const clearAllMemory = async () => {
    if (!confirm('Clear ALL memory data?')) return

    try {
      await fetch(apiUrl('/api/v1/memory'), { method: 'DELETE' })
      toast.success('Memory cleared')
      fetchAllMemory()
    } catch (err) {
      console.error('Failed to clear memory:', err)
      toast.error('Failed to clear memory')
    }
  }

  const exportMemory = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/memory/export'))
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `praDeep-memory-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Memory exported')
    } catch (err) {
      console.error('Failed to export memory:', err)
      toast.error('Failed to export memory')
    }
  }

  const importMemory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await fetch(apiUrl('/api/v1/memory/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast.success('Memory imported')
      fetchAllMemory()
    } catch (err) {
      console.error('Failed to import memory:', err)
      toast.error('Failed to import memory')
    }
    e.target.value = ''
  }

  const resolveQuestion = async (hash: string) => {
    try {
      await fetch(apiUrl(`/api/v1/memory/questions/${hash}/resolve`), {
        method: 'POST',
      })
      setQuestions(prev => prev.filter(q => q.hash !== hash))
      toast.success('Question marked as resolved')
    } catch (err) {
      console.error('Failed to resolve question:', err)
      toast.error('Failed to resolve question')
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(
      uiSettings.language === 'zh' ? 'zh-CN' : 'en-US',
      { month: 'short', day: 'numeric' }
    )
  }

  const itemsLayoutClassName =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 auto-rows-fr'
      : 'flex flex-col gap-3'

  const moduleUsage = useMemo(() => {
    if (!patterns) return []
    return Object.entries(patterns.preferred_modules)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
  }, [patterns])

  const maxModuleCount = useMemo(() => {
    if (!moduleUsage.length) return 0
    return Math.max(...moduleUsage.map(([, count]) => count))
  }, [moduleUsage])

  const mastery = useMemo(() => {
    if (!patterns) return []
    return Object.entries(patterns.learning_velocity)
      .map(([label, data]) => ({ label, score: data.mastery_score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [patterns])

  if (loading) {
    return <FullPageLoading message={t('Loading memory data...')} />
  }

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Memory') }]}>
      <PageHeader
        title={t('Memory')}
        description={t('Personalization & Learning Patterns')}
        icon={<Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        className="flex-col gap-4 sm:flex-row sm:items-start"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center rounded-xl border border-zinc-200/70 bg-white/60 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <IconButton
                icon={<LayoutGrid className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                aria-label="Grid view"
                onClick={() => setLayout('grid')}
                className={cn(
                  'transition-colors',
                  layout === 'grid'
                    ? '!bg-white/90 !text-blue-600 shadow-sm border border-zinc-200/70 hover:!bg-white/90 dark:!bg-zinc-950/60 dark:!text-blue-400 dark:border-white/10 dark:hover:!bg-zinc-950/60'
                    : '!bg-transparent text-zinc-600 hover:!bg-white/70 hover:!text-zinc-900 dark:text-zinc-300 dark:hover:!bg-white/5 dark:hover:!text-zinc-50'
                )}
              />
              <IconButton
                icon={<List className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                aria-label="List view"
                onClick={() => setLayout('list')}
                className={cn(
                  'transition-colors',
                  layout === 'list'
                    ? '!bg-white/90 !text-blue-600 shadow-sm border border-zinc-200/70 hover:!bg-white/90 dark:!bg-zinc-950/60 dark:!text-blue-400 dark:border-white/10 dark:hover:!bg-zinc-950/60'
                    : '!bg-transparent text-zinc-600 hover:!bg-white/70 hover:!text-zinc-900 dark:text-zinc-300 dark:hover:!bg-white/5 dark:hover:!text-zinc-50'
                )}
              />

              <div className="mx-1 h-6 w-px bg-zinc-200/70 dark:bg-white/10" aria-hidden="true" />

              <IconButton
                size="sm"
                variant="ghost"
                icon={<RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />}
                aria-label="Refresh"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-zinc-700 dark:text-zinc-200"
              />
              <IconButton
                size="sm"
                variant="ghost"
                icon={<Download className="h-4 w-4" />}
                aria-label="Export memory"
                onClick={exportMemory}
                className="text-zinc-700 dark:text-zinc-200"
              />
              <IconButton
                size="sm"
                variant="ghost"
                icon={<Upload className="h-4 w-4" />}
                aria-label="Import memory"
                onClick={() => importInputRef.current?.click()}
                className="text-zinc-700 dark:text-zinc-200"
              />
              <IconButton
                size="sm"
                variant="ghost"
                icon={<Trash2 className="h-4 w-4" />}
                aria-label="Clear all memory"
                onClick={clearAllMemory}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              />
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={importMemory}
              className="hidden"
            />
          </div>
        }
      />

      <div className="space-y-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            value={patterns?.interaction_count ?? '—'}
            label="Total Interactions"
          />
          <StatCard
            icon={<Target className="h-4 w-4" />}
            value={topics.length}
            label="Topics Tracked"
          />
          <StatCard
            icon={<MessageSquareQuote className="h-4 w-4" />}
            value={questions.length}
            label="Questions Tracked"
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-border/40 p-6 dark:border-white/10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-white/10">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {t('Preferences')}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Response style and learning preferences
                  </p>
                </div>
              </div>
              {saving && <span className="text-xs text-zinc-500 dark:text-zinc-400">Saving…</span>}
            </div>

            <div className="p-6">
              {!preferences ? (
                <EmptyState
                  icon={<Settings2 className="h-5 w-5" />}
                  title="No preferences available"
                  description="We couldn’t load your preferences."
                  asCard={false}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Response Style
                    </label>
                    <select
                      value={preferences.response_style}
                      onChange={e => updatePreference('response_style', e.target.value)}
                      disabled={saving}
                      className="mt-2 w-full rounded-xl border border-white/55 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-glass-sm backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                    >
                      <option value="concise">Concise</option>
                      <option value="balanced">Balanced</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Difficulty Level
                    </label>
                    <select
                      value={preferences.difficulty_level}
                      onChange={e => updatePreference('difficulty_level', e.target.value)}
                      disabled={saving}
                      className="mt-2 w-full rounded-xl border border-white/55 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-glass-sm backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                    >
                      <option value="adaptive">Adaptive</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Explanation Format
                    </label>
                    <select
                      value={preferences.preferred_explanation_format}
                      onChange={e =>
                        updatePreference('preferred_explanation_format', e.target.value)
                      }
                      disabled={saving}
                      className="mt-2 w-full rounded-xl border border-white/55 bg-white/70 px-3 py-2 text-sm text-zinc-900 shadow-glass-sm backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                    >
                      <option value="narrative">Narrative</option>
                      <option value="structured">Structured</option>
                      <option value="visual">Visual</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/55 bg-white/70 px-3 py-2 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        Include Examples
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Add more worked examples
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={preferences.enable_examples}
                      onChange={checked => updatePreference('enable_examples', checked)}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/55 bg-white/70 px-3 py-2 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 md:col-span-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        Show Sources
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Include citations when available
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={preferences.show_sources}
                      onChange={checked => updatePreference('show_sources', checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-border/40 p-6 dark:border-white/10">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-white/10">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {t('Learning Patterns')}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    What the system is learning from your usage
                  </p>
                </div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                {patterns?.interaction_count ?? 0} interactions
              </div>
            </div>

            <div className="p-6">
              {!patterns ? (
                <EmptyState
                  icon={<TrendingUp className="h-5 w-5" />}
                  title="No learning data yet"
                  description="Interact with the system and patterns will appear here."
                  asCard={false}
                />
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Module Usage
                      </div>
                      {moduleUsage.length === 0 ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          No module usage yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {moduleUsage.map(([module, count]) => (
                            <ProgressBar
                              key={module}
                              label={module}
                              value={count}
                              maxValue={maxModuleCount}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Peak Usage Hours
                      </div>
                      {patterns.peak_usage_hours.length === 0 ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Not enough data yet
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {patterns.peak_usage_hours.map(hour => (
                            <span
                              key={hour}
                              className="rounded-xl border border-blue-200/60 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm dark:border-white/10 dark:bg-blue-950/40 dark:text-blue-300"
                            >
                              {hour}:00 - {(hour + 1) % 24}:00
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Learning Velocity
                    </div>
                    {mastery.length === 0 ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Not enough signal yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {mastery.map(item => (
                          <div key={item.label} className="flex items-center gap-3">
                            <div className="w-32 truncate text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {item.label}
                            </div>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{
                                  width: formatMasteryPercent(item.score),
                                }}
                              />
                            </div>
                            <div className="w-10 text-right text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                              {formatMasteryPercent(item.score)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {t('Topics')}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {topics.length} topics tracked
              </p>
            </div>
          </div>

          {topics.length === 0 ? (
            <EmptyState
              icon={<Database className="h-5 w-5" />}
              title="No topics tracked yet"
              description="Topics will appear as you interact with the system."
            />
          ) : (
            <div className={itemsLayoutClassName}>
              {topics.map(topic => (
                <TopicCard key={topic.name} topic={topic} formatTime={formatTime} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {t('Recurring Questions')}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Questions you’ve asked multiple times
              </p>
            </div>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              icon={<MessageSquareQuote className="h-5 w-5" />}
              title="No recurring questions yet"
              description="Repeated questions will show up here."
            />
          ) : (
            <div className={itemsLayoutClassName}>
              {questions.map(question => (
                <QuestionCard
                  key={question.hash}
                  question={question}
                  onResolve={() => resolveQuestion(question.hash)}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
            <div className="flex items-start gap-3 border-b border-border/40 p-6 dark:border-white/10">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-white/10">
                <Database className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Memory Systems
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Where state is persisted on disk
                </p>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-white/10">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Persistent user memory (this page)
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Stored in{' '}
                    <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-mono text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                      data/user/memory/*.json
                    </code>{' '}
                    and managed via{' '}
                    <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-mono text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                      /api/v1/memory/*
                    </code>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-white/10">
                  <FileJson className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Solve agent run memory (per run)
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Stored per solve run in{' '}
                    <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-mono text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                      data/user/solve/solve_YYYYMMDD_HHMMSS/
                    </code>
                    .
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
            <div className="flex items-start gap-3 border-b border-border/40 p-6 dark:border-white/10">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-white/10">
                <Upload className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Data Tools
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Export, import, or reset your memory data
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
              <button
                type="button"
                onClick={exportMemory}
                className="group flex items-start gap-3 rounded-xl border border-white/55 bg-white/70 p-4 text-left shadow-glass-sm backdrop-blur-md transition-colors hover:bg-white/85 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <Download className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Export
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Download a JSON snapshot
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="group flex items-start gap-3 rounded-xl border border-white/55 bg-white/70 p-4 text-left shadow-glass-sm backdrop-blur-md transition-colors hover:bg-white/85 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                  <Upload className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Import
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Restore from a snapshot
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={clearAllMemory}
                className="group flex items-start gap-3 rounded-xl border border-red-200/70 bg-red-50/70 p-4 text-left shadow-sm backdrop-blur-md transition-colors hover:bg-red-50 dark:border-red-900/40 dark:bg-red-950/25 dark:hover:bg-red-950/35 sm:col-span-2"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-red-700 dark:text-red-200">
                    Clear all memory
                  </div>
                  <div className="mt-0.5 text-xs text-red-700/80 dark:text-red-200/80">
                    Irreversible. Use export first.
                  </div>
                </div>
              </button>
            </div>
          </Card>
        </section>
      </div>
    </PageWrapper>
  )
}
