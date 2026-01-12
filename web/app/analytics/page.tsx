'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Calendar,
  Calculator,
  Clock,
  FileText,
  Loader2,
  MessageCircle,
  Microscope,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type TimeRange = 'day' | 'week' | 'month' | 'all'

interface AnalyticsSummary {
  time_range: string
  total_activities: number
  activity_breakdown: Record<string, number>
  total_tokens: number
  total_cost: number
  unique_topics: number
  topics_sample: string[]
}

interface TimelineData {
  time: string
  total: number
  solve?: number
  question?: number
  research?: number
  chat?: number
}

interface LearningProgress {
  time_range: string
  question_sessions: number
  solve_sessions: number
  research_sessions: number
  total_sessions: number
  current_streak: number
  active_days: number
  daily_average: number
}

interface TopicItem {
  topic: string
  sessions?: number
  count?: number
  days_since_last?: number
  activity_types?: Record<string, number>
}

interface TopicAnalysis {
  time_range: string
  total_topics: number
  strength_areas: TopicItem[]
  knowledge_gaps: TopicItem[]
  all_topics: TopicItem[]
}

interface PredictiveMetrics {
  time_range: string
  engagement_score: number
  consistency_score: number
  diversity_score: number
  overall_score: number
  total_activities: number
  active_days: number
  recommendations: string[]
}

type SegmentedOption<TValue extends string> = {
  value: TValue
  label: string
}

function SegmentedControl<TValue extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: TValue
  options: Array<SegmentedOption<TValue>>
  onChange: (next: TValue) => void
  ariaLabel: string
  className?: string
}) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = options.findIndex(o => o.value === value)
      const activeRef = optionRefs.current[activeIndex]
      if (!activeRef) return

      setIndicatorStyle({
        left: activeRef.offsetLeft,
        width: activeRef.offsetWidth,
      })
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [options, value])

  return (
    <div className={cn('relative', className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={e => {
          if (!options.length) return

          const activeIndex = options.findIndex(o => o.value === value)
          const clampIndex = (index: number) => (index + options.length) % options.length
          const goTo = (index: number) => {
            const nextIndex = clampIndex(index)
            const next = options[nextIndex]?.value
            if (!next) return
            onChange(next)
            optionRefs.current[nextIndex]?.focus()
          }

          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            goTo(Math.max(0, activeIndex) - 1)
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            goTo(Math.max(0, activeIndex) + 1)
          } else if (e.key === 'Home') {
            e.preventDefault()
            goTo(0)
          } else if (e.key === 'End') {
            e.preventDefault()
            goTo(options.length - 1)
          }
        }}
        className={cn(
          'relative inline-flex items-center gap-1 rounded-xl border border-glass-border bg-glass p-1 shadow-glass-sm backdrop-blur-md',
          'dark:border-white/10 dark:bg-white/5'
        )}
      >
        {options.map((option, index) => {
          const isActive = option.value === value

          return (
            <button
              key={option.value}
              ref={el => {
                optionRefs.current[index] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={cn(
                'relative z-10 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
                isActive
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              )}
            >
              {option.label}
            </button>
          )
        })}

        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-1 top-1 rounded-lg border border-white/55 bg-white/80 shadow-sm',
            'dark:border-white/10 dark:bg-zinc-950/50',
            'transition-[left,width] duration-200 ease-out-expo'
          )}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: React.ElementType
  label: string
  value: number
  suffix?: string
}) {
  return (
    <Card variant="glass" padding="none" interactive className="h-full">
      <CardContent className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/15 dark:text-blue-300 dark:ring-blue-500/20">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
              {Number.isFinite(value) ? value.toLocaleString() : '—'}
            </span>
            {suffix && (
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{suffix}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressBar({
  value,
  max,
  className,
}: {
  value: number
  max: number
  className?: string
}) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div className={cn('h-2 w-full rounded-full bg-zinc-200/70 dark:bg-white/10', className)}>
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400',
          'transition-[width] duration-500 ease-out-expo'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

function ChartShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200/70 bg-white/70 shadow-sm',
        'dark:border-white/10 dark:bg-zinc-950/30',
        className
      )}
    >
      {children}
    </div>
  )
}

function TimelineChart({ data, unitLabel }: { data: TimelineData[]; unitLabel: string }) {
  const points = data.slice(-14)
  const maxValue = Math.max(...points.map(p => p.total || 0), 1)

  return (
    <div className="space-y-3">
      <div className="flex h-32 items-end gap-2">
        {points.map((point, idx) => {
          const heightPercent = Math.max(2, (Math.max(0, point.total || 0) / maxValue) * 100)
          const label = point.time.length >= 5 ? point.time.slice(-5) : point.time

          return (
            <div key={`${point.time}-${idx}`} className="group relative flex-1">
              <div className="relative h-32 overflow-hidden rounded-lg bg-zinc-100/80 dark:bg-white/5">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-lg bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_-12px_24px_rgba(59,130,246,0.18)]"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              <div className="mt-2 text-center text-[10px] text-zinc-500 dark:text-zinc-400">
                {label}
              </div>

              <div
                className={cn(
                  'pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap',
                  'rounded-lg border border-white/60 bg-white/85 px-2.5 py-1 text-xs text-zinc-800 shadow-glass-sm backdrop-blur-md',
                  'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
                  'dark:border-white/10 dark:bg-zinc-950/70 dark:text-zinc-100'
                )}
              >
                {point.total} {unitLabel}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
          {Math.round(safeScore)}
        </span>
      </div>
      <ProgressBar value={safeScore} max={100} className="h-2.5" />
    </div>
  )
}

const ACTIVITY_TYPE_ICON: Record<string, React.ElementType> = {
  solve: Calculator,
  question: FileText,
  research: Microscope,
  chat: MessageCircle,
}

export default function AnalyticsPage() {
  const { uiSettings } = useGlobal()
  const t = useCallback(
    (key: string) => getTranslation(uiSettings.language, key),
    [uiSettings.language]
  )

  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [timeline, setTimeline] = useState<TimelineData[]>([])
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [topics, setTopics] = useState<TopicAnalysis | null>(null)
  const [predictions, setPredictions] = useState<PredictiveMetrics | null>(null)

  const timeRangeOptions = useMemo(
    () =>
      [
        { value: 'day', label: t('Today') },
        { value: 'week', label: t('This Week') },
        { value: 'month', label: t('This Month') },
        { value: 'all', label: t('All Time') },
      ] satisfies Array<SegmentedOption<TimeRange>>,
    [t]
  )

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [summaryRes, timelineRes, progressRes, topicsRes, predictionsRes] = await Promise.all([
        fetch(apiUrl(`/api/v1/analytics/summary?time_range=${timeRange}`)),
        fetch(
          apiUrl(`/api/v1/analytics/activity-timeline?time_range=${timeRange}&granularity=day`)
        ),
        fetch(apiUrl(`/api/v1/analytics/learning-progress?time_range=${timeRange}`)),
        fetch(apiUrl(`/api/v1/analytics/topic-analysis?time_range=${timeRange}`)),
        fetch(apiUrl(`/api/v1/analytics/predictions?time_range=${timeRange}`)),
      ])

      const responses = [summaryRes, timelineRes, progressRes, topicsRes, predictionsRes]
      const firstBad = responses.find(r => !r.ok)
      if (firstBad) throw new Error(`Analytics request failed: ${firstBad.status}`)

      const [summaryData, timelineData, progressData, topicsData, predictionsData] =
        await Promise.all([
          summaryRes.json(),
          timelineRes.json(),
          progressRes.json(),
          topicsRes.json(),
          predictionsRes.json(),
        ])

      setSummary(summaryData)
      setTimeline(timelineData?.data ?? [])
      setProgress(progressData)
      setTopics(topicsData)
      setPredictions(predictionsData)
    } catch (fetchError) {
      console.error('Failed to fetch analytics:', fetchError)
      setError(t('Error loading data'))
    } finally {
      setLoading(false)
    }
  }, [t, timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const totalActivities = summary?.total_activities ?? 0
  const breakdownEntries = Object.entries(summary?.activity_breakdown ?? {}).sort(
    (a, b) => b[1] - a[1]
  )

  const strengthMax = Math.max(
    ...(topics?.strength_areas ?? []).map(item => item.sessions ?? item.count ?? 0),
    1
  )
  const timeRangeLabel =
    timeRangeOptions.find(option => option.value === timeRange)?.label ?? timeRange

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Analytics') }]}>
      <PageHeader
        title={t('Learning Analytics')}
        description={t('Track your learning progress and identify areas for improvement')}
        icon={<BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-300" />}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-400" />
              <SegmentedControl<TimeRange>
                ariaLabel={t('Time Range')}
                value={timeRange}
                options={timeRangeOptions}
                onChange={setTimeRange}
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAnalytics}
              loading={loading}
              iconLeft={<RefreshCw className="h-4 w-4" />}
            >
              {t('Refresh')}
            </Button>
          </div>
        }
        className="flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      />

      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
              <CardBody className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm">{t('Loading analytics')}...</span>
              </CardBody>
            </Card>
          </div>
        ) : error ? (
          <Card variant="glass" padding="none" interactive={false}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-700 ring-1 ring-red-500/15 dark:text-red-300 dark:ring-red-500/20">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {t('Error')}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAnalytics}
                iconLeft={<RefreshCw className="h-4 w-4" />}
              >
                {t('Refresh')}
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Zap}
                label={t('Total Activities')}
                value={summary?.total_activities ?? 0}
              />
              <StatCard
                icon={Trophy}
                label={t('Current Streak')}
                value={progress?.current_streak ?? 0}
                suffix={t('days')}
              />
              <StatCard
                icon={BookOpen}
                label={t('Topics Covered')}
                value={topics?.total_topics ?? 0}
              />
              <StatCard
                icon={Calendar}
                label={t('Active Days')}
                value={progress?.active_days ?? 0}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card
                variant="glass"
                padding="none"
                interactive={false}
                className="lg:col-span-2 overflow-hidden"
              >
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50/80 p-2 dark:bg-blue-500/10">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('Activity Timeline')}
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{timeRangeLabel}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="space-y-4">
                  <ChartShell className="overflow-hidden p-6">
                    {timeline.length > 0 ? (
                      <TimelineChart data={timeline} unitLabel={t('activities')} />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                        {t('No activity data available')}
                      </div>
                    )}
                  </ChartShell>
                </CardBody>
              </Card>

              <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50/80 p-2 dark:bg-blue-500/10">
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('Activity Breakdown')}
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('Total Activities')}: {totalActivities.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <ChartShell className="p-6">
                    {breakdownEntries.length > 0 ? (
                      <div className="space-y-4">
                        {breakdownEntries.map(([type, count]) => {
                          const Icon = ACTIVITY_TYPE_ICON[type] ?? MessageCircle
                          const percentage =
                            totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0
                          const typeLabel = t(`${type.slice(0, 1).toUpperCase()}${type.slice(1)}`)

                          return (
                            <div key={type} className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-blue-700 shadow-glass-sm ring-1 ring-white/60 backdrop-blur-md dark:bg-white/5 dark:text-blue-300 dark:ring-white/10">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                      {typeLabel}
                                    </div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                                      {count.toLocaleString()} · {percentage}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <ProgressBar value={count} max={Math.max(totalActivities, 1)} />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        {t('No activities yet')}
                      </div>
                    )}
                  </ChartShell>
                </CardBody>
              </Card>
            </div>

            <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50/80 p-2 dark:bg-blue-500/10">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {t('Learning Scores')}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t('Track your learning progress and identify areas for improvement')}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="space-y-6">
                <ChartShell className="p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <ScoreBar label={t('Overall')} score={predictions?.overall_score ?? 0} />
                    <ScoreBar label={t('Engagement')} score={predictions?.engagement_score ?? 0} />
                    <ScoreBar
                      label={t('Consistency')}
                      score={predictions?.consistency_score ?? 0}
                    />
                    <ScoreBar label={t('Diversity')} score={predictions?.diversity_score ?? 0} />
                  </div>
                </ChartShell>

                {predictions?.recommendations && predictions.recommendations.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {t('Recommendations')}
                    </div>

                    <div className="space-y-2">
                      {predictions.recommendations.map((rec, idx) => (
                        <div
                          key={`${idx}-${rec}`}
                          className={cn(
                            'flex items-start gap-2 rounded-xl border border-white/55 bg-white/60 px-4 py-3 text-sm text-zinc-700 shadow-glass-sm backdrop-blur-md',
                            'dark:border-white/10 dark:bg-white/5 dark:text-zinc-200'
                          )}
                        >
                          <span className="mt-0.5 text-blue-600 dark:text-blue-400">*</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50/80 p-2 dark:bg-blue-500/10">
                      <ArrowUpRight className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('Strength Areas')}
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('Topics Covered')}: {(topics?.total_topics ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <ChartShell className="p-6">
                    {topics?.strength_areas && topics.strength_areas.length > 0 ? (
                      <div className="space-y-3">
                        {topics.strength_areas.slice(0, 8).map((item, idx) => {
                          const count = item.sessions ?? item.count ?? 0
                          return (
                            <div
                              key={`${idx}-${item.topic}`}
                              className="rounded-xl border border-white/55 bg-white/70 px-4 py-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                    {item.topic}
                                  </div>
                                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    {count} {t('sessions')}
                                  </div>
                                </div>
                                <div className="text-xs font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                                  {Math.round((count / strengthMax) * 100)}%
                                </div>
                              </div>
                              <div className="mt-3">
                                <ProgressBar value={count} max={strengthMax} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        {t('Keep learning to identify your strengths!')}
                      </div>
                    )}
                  </ChartShell>
                </CardBody>
              </Card>

              <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50/80 p-2 dark:bg-blue-500/10">
                      <ArrowDownRight className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('Areas to Review')}
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('Track your learning progress and identify areas for improvement')}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <ChartShell className="p-6">
                    {topics?.knowledge_gaps && topics.knowledge_gaps.length > 0 ? (
                      <div className="space-y-3">
                        {topics.knowledge_gaps.slice(0, 8).map((item, idx) => {
                          const badge =
                            item.days_since_last !== undefined
                              ? `${Math.round(item.days_since_last)} ${t('days ago')}`
                              : `${item.sessions ?? item.count ?? 0} ${t('sessions')}`

                          return (
                            <div
                              key={`${idx}-${item.topic}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/55 bg-white/70 px-4 py-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                  {item.topic}
                                </div>
                                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                  {t('Areas to Review')}
                                </div>
                              </div>

                              <span className="shrink-0 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                                {badge}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        {t('Great! No knowledge gaps detected.')}
                      </div>
                    )}
                  </ChartShell>
                </CardBody>
              </Card>
            </div>

            {topics?.all_topics && topics.all_topics.length > 0 && (
              <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50/80 p-2 dark:bg-blue-500/10">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('All Topics')}
                      </h2>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('Topics Covered')}: {(topics?.total_topics ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {topics.all_topics.map((item, idx) => (
                      <span
                        key={`${idx}-${item.topic}`}
                        className={cn(
                          'inline-flex max-w-full items-center gap-2 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-sm text-zinc-700 shadow-glass-sm backdrop-blur-md',
                          'dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-200'
                        )}
                        title={`${item.topic} (${item.count ?? item.sessions ?? 0})`}
                      >
                        <span className="truncate">{item.topic}</span>
                        <span className="shrink-0 text-xs font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                          {item.count ?? item.sessions ?? 0}
                        </span>
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}
