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
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { IconButton, Button } from '@/components/ui/Button'
import { FullPageLoading } from '@/components/ui/LoadingState'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/dashboard/StatCard'
import { Switch } from '@/components/ui/switch'

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
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        interactive={true}
        className="h-full border-border bg-surface-base hover:border-accent-primary/20 hover:shadow-glass-sm transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="truncate text-xs font-bold uppercase tracking-widest text-text-primary group-hover:text-accent-primary transition-colors">
              {topic.name}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] font-mono uppercase tracking-widest text-text-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-text-quaternary" />
                {formatTime(topic.last_accessed).toUpperCase()}
              </span>
              {topic.category && (
                <>
                  <span className="text-text-quaternary">•</span>
                  <span className="text-accent-primary opacity-80">{topic.category.toUpperCase()}</span>
                </>
              )}
            </div>
          </div>
          <Badge 
            variant="secondary"
            className="shrink-0 rounded-full bg-accent-primary/10 px-2 py-0.5 text-[10px] font-mono font-bold text-accent-primary border border-accent-primary/20 uppercase tracking-widest"
          >
            {topic.frequency}X
          </Badge>
        </div>
      </Card>
    </motion.div>
  )
}

interface QuestionCardProps {
  question: RecurringQuestion
  onResolve: () => void
  formatTime: (timestamp: number) => string
}

function QuestionCard({ question, onResolve, formatTime }: QuestionCardProps) {
  const [isResolving, setIsResolving] = useState(false)

  const handleResolve = () => {
    setIsResolving(true)
    setTimeout(() => onResolve(), 300)
  }

  return (
    <motion.div
      variants={scaleIn}
      animate={isResolving ? { scale: 0.9, opacity: 0 } : {}}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        interactive={true}
        className="h-full border-border bg-surface-base hover:border-accent-primary/20 hover:shadow-glass-sm transition-all duration-300"
      >
        <div className="flex items-start justify-between gap-6 p-5">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-3 text-sm leading-relaxed text-text-primary font-medium">
              {question.normalized}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[9px] font-mono uppercase tracking-widest text-text-tertiary">
              <span className="flex items-center gap-1.5 text-accent-primary bg-accent-primary/10 border border-accent-primary/20 px-2 py-0.5 rounded-full font-bold">
                <TrendingUp className="h-3 w-3" />
                FREQ: {question.frequency}X
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <Clock className="h-3 w-3 text-text-quaternary" />
                {formatTime(question.last_asked).toUpperCase()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResolve}
            className="shrink-0 group flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised border border-border text-text-tertiary hover:text-success hover:border-success/30 hover:bg-success-muted/10 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/20"
            aria-label="Mark question as resolved"
            title="Mark as resolved"
          >
            <CheckCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </Card>
    </motion.div>
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
    <div className="flex flex-col items-center py-12 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-text-tertiary shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-text-primary">{title}</p>
      <p className="mt-1 text-xs font-mono uppercase tracking-tight text-text-tertiary">{description}</p>
    </div>
  )

  if (!asCard) {
    return (
      <div className="rounded-2xl border border-border bg-surface-base/50 backdrop-blur-md">
        {content}
      </div>
    )
  }

  return (
    <Card interactive={false} className="border-border bg-surface-base/50">
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
      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
      : 'flex flex-col gap-4'

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
    return (
      <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Memory') }]}>
        <PageHeader
          title={t('Memory')}
          description={t('Personalization & Learning Patterns')}
          icon={<Brain className="h-5 w-5 text-accent-primary" />}
        />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-accent-primary" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-tertiary">
            {t('Syncing memory core')}
          </span>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Memory') }]}>
      <PageHeader
        title={t('Memory')}
        description={t('Personalization & Learning Patterns')}
        icon={<Brain className="h-5 w-5 text-accent-primary" />}
        className="flex-col gap-6 sm:flex-row sm:items-start mb-8"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center rounded-full border border-border bg-surface-elevated/50 p-1 shadow-glass-sm backdrop-blur-md">
              <IconButton
                aria-label="Grid view"
                icon={<LayoutGrid className="h-3.5 w-3.5" />}
                variant="ghost"
                size="sm"
                onClick={() => setLayout('grid')}
                className={cn(
                  'rounded-full h-8 w-8 transition-all duration-200',
                  layout === 'grid'
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-base'
                )}
              />
              <IconButton
                aria-label="List view"
                icon={<List className="h-3.5 w-3.5" />}
                variant="ghost"
                size="sm"
                onClick={() => setLayout('list')}
                className={cn(
                  'rounded-full h-8 w-8 transition-all duration-200',
                  layout === 'list'
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-base'
                )}
              />

              <div className="mx-1 h-4 w-px bg-border-subtle" aria-hidden="true" />

              <IconButton
                aria-label="Refresh memory data"
                size="sm"
                variant="ghost"
                icon={<RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />}
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-text-tertiary hover:text-accent-primary h-8 w-8 rounded-full"
              />
              <IconButton
                aria-label="Export memory"
                size="sm"
                variant="ghost"
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={exportMemory}
                className="text-text-tertiary hover:text-accent-primary h-8 w-8 rounded-full"
              />
              <IconButton
                aria-label="Import memory"
                size="sm"
                variant="ghost"
                icon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => importInputRef.current?.click()}
                className="text-text-tertiary hover:text-accent-primary h-8 w-8 rounded-full"
              />
              <IconButton
                aria-label="Clear memory"
                size="sm"
                variant="ghost"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={clearAllMemory}
                className="text-error/60 hover:text-error hover:bg-error-muted/10 h-8 w-8 rounded-full"
              />

              <IconButton
                size="sm"
                variant="ghost"
                icon={<Download className="h-3.5 w-3.5" />}
                aria-label="Export memory"
                onClick={exportMemory}
                className="text-text-tertiary hover:text-accent-primary h-8 w-8 rounded-full"
              />
              <IconButton
                size="sm"
                variant="ghost"
                icon={<Upload className="h-3.5 w-3.5" />}
                aria-label="Import memory"
                onClick={() => importInputRef.current?.click()}
                className="text-text-tertiary hover:text-accent-primary h-8 w-8 rounded-full"
              />
              <IconButton
                size="sm"
                variant="ghost"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                aria-label="Clear all memory"
                onClick={clearAllMemory}
                className="text-error/60 hover:text-error hover:bg-error-muted/10 h-8 w-8 rounded-full"
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

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-12"
      >
        <motion.section variants={fadeInUp} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatCard
            icon={<Sparkles size={20} />}
            value={patterns?.interaction_count ?? '—'}
            label="Total Interactions"
          />
          <StatCard
            icon={<Target size={20} />}
            value={topics.length}
            label="Topics Tracked"
          />
          <StatCard
            icon={<MessageSquareQuote size={20} />}
            value={questions.length}
            label="Questions Tracked"
          />
        </motion.section>

        <motion.section variants={fadeInUp} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
            <CardHeader className="flex items-start justify-between gap-4 p-6 border-b border-border-subtle">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary shadow-sm">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">
                    {t('Preferences')}
                  </CardTitle>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
                    CORE SYSTEM PERSONALIZATION
                  </p>
                </div>
              </div>
              {saving && <Badge variant="outline" className="animate-pulse text-[9px] font-mono uppercase tracking-widest border-accent-primary/20 text-accent-primary">Saving…</Badge>}
            </CardHeader>

            <CardBody className="p-6">
              {!preferences ? (
                <EmptyState
                  icon={<Settings2 className="h-6 w-6" />}
                  title="No preferences available"
                  description="Initial calibration required."
                  asCard={false}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="response-style"
                      className="text-[10px] font-bold uppercase tracking-widest text-text-quaternary ml-1"
                    >
                      Response Style
                    </label>
                    <select
                      id="response-style"
                      value={preferences.response_style}
                      onChange={e => updatePreference('response_style', e.target.value)}
                      disabled={saving}
                      className="w-full rounded-xl border border-border bg-surface-elevated/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-text-primary shadow-glass-sm backdrop-blur-md transition-all hover:border-accent-primary/20 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    >
                      <option value="concise">Concise</option>
                      <option value="balanced">Balanced</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="difficulty-level"
                      className="text-[10px] font-bold uppercase tracking-widest text-text-quaternary ml-1"
                    >
                      Difficulty Level
                    </label>
                    <select
                      id="difficulty-level"
                      value={preferences.difficulty_level}
                      onChange={e => updatePreference('difficulty_level', e.target.value)}
                      disabled={saving}
                      className="w-full rounded-xl border border-border bg-surface-elevated/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-text-primary shadow-glass-sm backdrop-blur-md transition-all hover:border-accent-primary/20 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    >
                      <option value="adaptive">Adaptive</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="explanation-format"
                      className="text-[10px] font-bold uppercase tracking-widest text-text-quaternary ml-1"
                    >
                      Explanation Format
                    </label>
                    <select
                      id="explanation-format"
                      value={preferences.preferred_explanation_format}
                      onChange={e =>
                        updatePreference('preferred_explanation_format', e.target.value)
                      }
                      disabled={saving}
                      className="w-full rounded-xl border border-border bg-surface-elevated/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-text-primary shadow-glass-sm backdrop-blur-md transition-all hover:border-accent-primary/20 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                    >
                      <option value="narrative">Narrative</option>
                      <option value="structured">Structured</option>
                      <option value="visual">Visual</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/50 px-4 py-3 shadow-glass-sm backdrop-blur-md transition-all hover:border-accent-primary/10">
                    <div className="min-w-0 pr-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary">
                        Examples
                      </div>
                      <div className="mt-0.5 text-[9px] font-mono uppercase tracking-tighter text-text-tertiary">
                        WORKED STEP-BY-STEP
                      </div>
                    </div>
                    <Switch
                      checked={preferences.enable_examples}
                      onCheckedChange={checked => updatePreference('enable_examples', checked)}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/50 px-4 py-3 shadow-glass-sm backdrop-blur-md transition-all hover:border-accent-primary/10 md:col-span-2">
                    <div className="min-w-0 pr-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary">
                        Show Sources
                      </div>
                      <div className="mt-0.5 text-[9px] font-mono uppercase tracking-tighter text-text-tertiary">
                        CITATIONS & BIBLIOGRAPHY
                      </div>
                    </div>
                    <Switch
                      checked={preferences.show_sources}
                      onCheckedChange={checked => updatePreference('show_sources', checked)}
                      disabled={saving}
                    />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
            <CardHeader className="flex items-start justify-between gap-4 p-6 border-b border-border-subtle">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary shadow-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">
                    {t('Learning Patterns')}
                  </CardTitle>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
                    OBSERVED USAGE ANALYTICS
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-surface-elevated text-text-tertiary border-border text-[9px] font-mono px-2 py-1">
                {patterns?.interaction_count ?? 0} OPS
              </Badge>
            </CardHeader>

            <CardBody className="p-6">
              {!patterns ? (
                <EmptyState
                  icon={<TrendingUp className="h-6 w-6" />}
                  title="No learning data yet"
                  description="Accumulating interaction signals..."
                  asCard={false}
                />
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-primary">
                        <BarChart3 className="h-3.5 w-3.5 text-accent-primary" />
                        Module Distribution
                      </div>
                      {moduleUsage.length === 0 ? (
                        <p className="text-[10px] font-mono uppercase text-text-quaternary">
                          No signals found
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {moduleUsage.map(([module, count]) => (
                            <div key={module} className="space-y-2">
                               <div className="flex items-center justify-between px-1">
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{module}</span>
                                 <span className="text-[10px] font-mono font-bold text-text-primary">{count}</span>
                               </div>
                               <Progress value={(count / maxModuleCount) * 100} className="h-1" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-primary">
                        <Zap className="h-3.5 w-3.5 text-accent-primary" />
                        Peak Productivity
                      </div>
                      {patterns.peak_usage_hours.length === 0 ? (
                        <p className="text-[10px] font-mono uppercase text-text-quaternary">
                          Insufficient data
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {patterns.peak_usage_hours.map(hour => (
                            <Badge
                              key={hour}
                              variant="secondary"
                              className="rounded-xl border border-border-subtle bg-surface-elevated/40 px-3 py-1 text-[10px] font-mono font-bold text-text-secondary shadow-sm uppercase tracking-widest"
                            >
                              {hour}:00 - {(hour + 1) % 24}:00
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-primary">
                      <Target className="h-3.5 w-3.5 text-accent-primary" />
                      Learning Velocity (Mastery %)
                    </div>
                    {mastery.length === 0 ? (
                      <p className="text-[10px] font-mono uppercase text-text-quaternary">
                        No mastery maps yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {mastery.map(item => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{item.label}</span>
                              <span className="text-[10px] font-mono font-bold text-accent-primary">{formatMasteryPercent(item.score)}</span>
                            </div>
                            <Progress value={masteryPercent(item.score)} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.section>

        <motion.section variants={fadeInUp} className="space-y-6">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-text-primary">
                {t('Topics')}
              </h2>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
                {topics.length} UNIQUE CONCEPTS TRACKED
              </p>
            </div>
          </div>

          {topics.length === 0 ? (
            <EmptyState
              icon={<Database className="h-6 w-6" />}
              title="No topics tracked yet"
              description="Signals appear after first interaction."
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className={itemsLayoutClassName}
            >
              {topics.map(topic => (
                <TopicCard key={topic.name} topic={topic} formatTime={formatTime} />
              ))}
            </motion.div>
          )}
        </motion.section>

        <motion.section variants={fadeInUp} className="space-y-6">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-text-primary">
                {t('Recurring Questions')}
              </h2>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
                CONCEPTS REQUIRING REINFORCEMENT
              </p>
            </div>
          </div>

          {questions.length === 0 ? (
            <EmptyState
              icon={<MessageSquareQuote className="h-6 w-6" />}
              title="No recurring questions yet"
              description="Common patterns will be identified here."
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className={itemsLayoutClassName}
            >
              {questions.map(question => (
                <QuestionCard
                  key={question.hash}
                  question={question}
                  onResolve={() => resolveQuestion(question.hash)}
                  formatTime={formatTime}
                />
              ))}
            </motion.div>
          )}
        </motion.section>

        <motion.section variants={fadeInUp} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
            <CardHeader className="flex items-start gap-4 p-6 border-b border-border-subtle">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary shadow-sm">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">
                  Memory Systems
                </CardTitle>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
                  PERSISTENT STATE INFRASTRUCTURE
                </p>
              </div>
            </CardHeader>

            <CardBody className="p-6 space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl border border-border-subtle bg-surface-elevated/30">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised border border-border text-text-tertiary">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary">
                    PERSISTENT_USER_MEMORY
                  </div>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed opacity-80">
                    Active state stored in{' '}
                    <code className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-mono text-accent-primary border border-border-subtle">
                      data/user/memory/*.json
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl border border-border-subtle bg-surface-elevated/30">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised border border-border text-text-tertiary">
                  <FileJson className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary">
                    SOLVE_SESSION_STATE
                  </div>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed opacity-80">
                    Per-run logs stored in{' '}
                    <code className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-mono text-accent-primary border border-border-subtle">
                      data/user/solve/solve_YYYYMMDD_HHMMSS/
                    </code>
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
            <CardHeader className="flex items-start gap-4 p-6 border-b border-border-subtle">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary border border-border text-text-tertiary shadow-sm">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">
                  Data Tools
                </CardTitle>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-tight text-text-tertiary">
                  SNAPSHOTTING & RECOVERY
                </p>
              </div>
            </CardHeader>

            <CardBody className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <motion.button
                  type="button"
                  onClick={exportMemory}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated/50 p-5 text-left shadow-glass-sm transition-all hover:border-accent-primary/20 hover:bg-surface-secondary"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised border border-border text-text-tertiary group-hover:text-accent-primary group-hover:border-accent-primary/20 transition-all">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary">EXPORT</div>
                    <div className="mt-1 text-[9px] font-mono uppercase tracking-tight text-text-quaternary">SNAP_SNAPSHOT.JSON</div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated/50 p-5 text-left shadow-glass-sm transition-all hover:border-accent-primary/20 hover:bg-surface-secondary"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-raised border border-border text-text-tertiary group-hover:text-accent-primary group-hover:border-accent-primary/20 transition-all">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary">IMPORT</div>
                    <div className="mt-1 text-[9px] font-mono uppercase tracking-tight text-text-quaternary">RESTORE_SNAPSHOT.JSON</div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={clearAllMemory}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center gap-4 rounded-xl border border-error/20 bg-error-muted/5 p-4 text-left shadow-sm transition-all hover:bg-error-muted/10 sm:col-span-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised border border-error/10 text-error/60 group-hover:text-error transition-all">
                    <Trash2 className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-error/80 group-hover:text-error transition-colors">
                      DESTROY_ALL_MEMORY_OBJECTS
                    </div>
                    <div className="mt-1 text-[9px] font-mono uppercase tracking-tight text-error/40 group-hover:text-error/60 transition-colors">
                      IRREVERSIBLE_ACTION. SNAPSHOT_STRONGLY_ADVISED.
                    </div>
                  </div>
                </motion.button>
              </div>
            </CardBody>
          </Card>
        </motion.section>
      </motion.div>
    </PageWrapper>
  )
}
