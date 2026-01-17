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
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/dashboard/StatCard'
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
  return (
    <div className={cn('relative', className)}>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated/50 p-1 shadow-glass-sm backdrop-blur-md'
        )}
      >
        {options.map((option) => {
          const isActive = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ease-out-expo',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30',
                isActive
                  ? 'bg-accent-primary text-white shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-base'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ChartShell({ children, title, subtitle, icon: Icon }: { children: React.ReactNode; title: string; subtitle?: string; icon: React.ElementType }) {
  return (
    <Card interactive={false} className="overflow-hidden border-border bg-surface-base">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="rounded-lg bg-surface-elevated p-2 border border-border-subtle">
          <Icon className="h-4 w-4 text-accent-primary" />
        </div>
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-tight">{subtitle}</p>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-2">
        <div className="rounded-xl border border-border-subtle bg-surface-elevated/30 p-6 overflow-hidden">
          {children}
        </div>
      </CardBody>
    </Card>
  )
}

function TimelineChart({ data, unitLabel }: { data: TimelineData[]; unitLabel: string }) {
  const points = data.slice(-14)
  const maxValue = Math.max(...points.map(p => p.total || 0), 1)

  return (
    <div className="flex h-32 items-end gap-2 px-2">
      {points.map((point, idx) => {
        const heightPercent = Math.max(2, (Math.max(0, point.total || 0) / maxValue) * 100)
        const label = point.time.length >= 5 ? point.time.slice(-5) : point.time

        return (
          <div key={`${point.time}-${idx}`} className="group relative flex-1">
            <div className="relative h-32 overflow-hidden rounded-sm bg-surface-elevated/50">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-[1px] bg-accent-primary transition-all duration-500 ease-out-expo group-hover:brightness-110 shadow-[0_0_15px_rgba(var(--color-accent-primary),0.2)]"
                style={{ height: `${heightPercent}%` }}
              />
            </div>

            <div className="mt-2 text-center text-[8px] font-mono font-bold text-text-quaternary uppercase tracking-tighter">
              {label}
            </div>

            <div
              className={cn(
                'pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-50',
                'rounded border border-border bg-surface-base px-2 py-1 text-[10px] font-mono font-bold text-text-primary shadow-glass-sm backdrop-blur-md',
                'opacity-0 transition-opacity duration-150 group-hover:opacity-100'
              )}
            >
              {point.total} {unitLabel.toUpperCase()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">{label}</span>
        <span className="text-[10px] font-mono font-bold tabular-nums text-accent-primary">
          {Math.round(safeScore)}%
        </span>
      </div>
      <Progress value={safeScore} className="h-1.5" />
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
        icon={<BarChart3 className="h-5 w-5 text-accent-primary" />}
        actions={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-3">
              <Clock className="h-3.5 w-3.5 text-text-quaternary" />
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
              className="font-mono text-[10px] uppercase tracking-widest h-8"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              {t('Refresh')}
            </Button>
          </div>
        }
        className="flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8"
      />

      <div className="space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-tertiary">
              {t('Loading analytics')}
            </span>
          </div>
        ) : error ? (
          <Card interactive={false} className="border-error/20 bg-error-muted/10">
            <CardBody className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-primary">
                {t('Error')}
              </h2>
              <p className="mt-1 text-xs font-mono text-text-tertiary uppercase tracking-tight">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAnalytics}
                className="mt-6"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                {t('Refresh')}
              </Button>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Zap size={20} />}
                label={t('Total Activities')}
                value={summary?.total_activities ?? 0}
              />
              <StatCard
                icon={<Trophy size={20} />}
                label={t('Current Streak')}
                value={progress?.current_streak ?? 0}
                trend={`${progress?.active_days ?? 0} ACTIVE`}
              />
              <StatCard
                icon={<BookOpen size={20} />}
                label={t('Topics Covered')}
                value={topics?.total_topics ?? 0}
              />
              <StatCard
                icon={<Calendar size={20} />}
                label={t('Active Days')}
                value={progress?.active_days ?? 0}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartShell 
                  title={t('Activity Timeline')} 
                  subtitle={timeRangeLabel.toUpperCase()} 
                  icon={TrendingUp}
                >
                  {timeline.length > 0 ? (
                    <TimelineChart data={timeline} unitLabel={t('activities')} />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary">
                      {t('No activity data available')}
                    </div>
                  )}
                </ChartShell>
              </div>

              <ChartShell 
                title={t('Activity Breakdown')} 
                subtitle={`${t('Activities total')}: ${totalActivities.toLocaleString()}`} 
                icon={Target}
              >
                {breakdownEntries.length > 0 ? (
                  <div className="space-y-6">
                    {breakdownEntries.map(([type, count]) => {
                      const Icon = ACTIVITY_TYPE_ICON[type] ?? MessageCircle
                      const percentage =
                        totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0
                      const typeLabel = t(`${type.slice(0, 1).toUpperCase()}${type.slice(1)}`)

                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated text-accent-primary border border-border-subtle shadow-glass-sm">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-[10px] font-bold uppercase tracking-widest text-text-primary">
                                  {typeLabel}
                                </div>
                                <div className="text-[10px] font-mono text-text-tertiary tabular-nums uppercase">
                                  {count.toLocaleString()} · {percentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary">
                    {t('No activities yet')}
                  </div>
                )}
              </ChartShell>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card interactive={false} className="border-border bg-surface-base">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="rounded-lg bg-surface-elevated p-2 border border-border-subtle">
                    <Sparkles className="h-4 w-4 text-accent-primary" />
                  </div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">
                    {t('Learning Scores')}
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 bg-surface-elevated/30 p-6 rounded-xl border border-border-subtle">
                    <ScoreBar label={t('Overall')} score={predictions?.overall_score ?? 0} />
                    <ScoreBar label={t('Engagement')} score={predictions?.engagement_score ?? 0} />
                    <ScoreBar label={t('Consistency')} score={predictions?.consistency_score ?? 0} />
                    <ScoreBar label={t('Diversity')} score={predictions?.diversity_score ?? 0} />
                  </div>

                  {predictions?.recommendations && predictions.recommendations.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-primary">
                        <Sparkles className="h-3 w-3 text-accent-primary" />
                        {t('Recommendations')}
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {predictions.recommendations.map((rec, idx) => (
                          <div
                            key={`${idx}-${rec}`}
                            className={cn(
                              'flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-elevated/40 px-4 py-3 text-xs text-text-secondary shadow-glass-sm backdrop-blur-md transition-colors hover:border-accent-primary/20 group'
                            )}
                          >
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 group-hover:scale-125 transition-transform" />
                            <span className="leading-relaxed">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              <div className="space-y-6">
                <ChartShell 
                  title={t('Strength Areas')} 
                  subtitle={`${t('Topics')}: ${(topics?.total_topics ?? 0).toLocaleString()}`} 
                  icon={ArrowUpRight}
                >
                  {topics?.strength_areas && topics.strength_areas.length > 0 ? (
                    <div className="space-y-4">
                      {topics.strength_areas.slice(0, 5).map((item, idx) => {
                        const count = item.sessions ?? item.count ?? 0
                        const percentage = Math.round((count / strengthMax) * 100)
                        return (
                          <div
                            key={`${idx}-${item.topic}`}
                            className="group"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <div className="truncate text-[10px] font-bold uppercase tracking-widest text-text-primary group-hover:text-accent-primary transition-colors">
                                  {item.topic}
                                </div>
                                <div className="text-[9px] font-mono text-text-tertiary uppercase tracking-tight">
                                  {count} {t('sessions')}
                                </div>
                              </div>
                              <div className="text-[10px] font-mono font-bold text-accent-primary">
                                {percentage}%
                              </div>
                            </div>
                            <Progress value={percentage} className="h-1" />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary">
                      {t('Keep learning to identify your strengths!')}
                    </div>
                  )}
                </ChartShell>

                <ChartShell 
                  title={t('Areas to Review')} 
                  subtitle={t('Knowledge Gaps Detected')}
                  icon={ArrowDownRight}
                >
                  {topics?.knowledge_gaps && topics.knowledge_gaps.length > 0 ? (
                    <div className="space-y-3">
                      {topics.knowledge_gaps.slice(0, 5).map((item, idx) => {
                        const badge =
                          item.days_since_last !== undefined
                            ? `${Math.round(item.days_since_last)}D AGO`
                            : `${item.sessions ?? item.count ?? 0} SES`

                        return (
                          <div
                            key={`${idx}-${item.topic}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-elevated/40 px-4 py-3 shadow-glass-sm backdrop-blur-md hover:border-accent-primary/20 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-[10px] font-bold uppercase tracking-widest text-text-primary">
                                {item.topic}
                              </div>
                            </div>

                            <span className="shrink-0 rounded-full bg-accent-primary/10 px-2 py-0.5 text-[8px] font-mono font-bold text-accent-primary border border-accent-primary/20 uppercase tracking-widest">
                              {badge}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-[10px] font-mono uppercase tracking-[0.2em] text-text-quaternary">
                      {t('Great! No knowledge gaps detected.')}
                    </div>
                  )}
                </ChartShell>
              </div>
            </div>

            {topics?.all_topics && topics.all_topics.length > 0 && (
              <Card interactive={false} className="border-border bg-surface-base">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="rounded-lg bg-surface-elevated p-2 border border-border-subtle">
                    <BookOpen className="h-4 w-4 text-accent-primary" />
                  </div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-text-primary">
                    {t('All Topics')}
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {topics.all_topics.map((item, idx) => (
                      <Badge
                        key={`${idx}-${item.topic}`}
                        variant="secondary"
                        className="rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-[9px] font-bold text-text-secondary uppercase tracking-widest hover:border-accent-primary/30 hover:text-accent-primary transition-all cursor-default"
                        title={`${item.topic} (${item.count ?? item.sessions ?? 0})`}
                      >
                        <span className="truncate max-w-[120px]">{item.topic}</span>
                        <span className="ml-2 shrink-0 font-mono text-accent-primary opacity-60">
                          {item.count ?? item.sessions ?? 0}
                        </span>
                      </Badge>
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
