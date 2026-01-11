'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Zap,
  Calendar,
  BookOpen,
  Brain,
  Trophy,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Calculator,
  FileText,
  Microscope,
  MessageCircle,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'

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

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>
    bgColor: string
    textColor: string
    barColor: string
  }
> = {
  solve: {
    icon: Calculator,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    barColor: 'bg-blue-500',
  },
  question: {
    icon: FileText,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    barColor: 'bg-purple-500',
  },
  research: {
    icon: Microscope,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    barColor: 'bg-emerald-500',
  },
  chat: {
    icon: MessageCircle,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    barColor: 'bg-amber-500',
  },
}

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={color}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{score}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  )
}

function ProgressBar({
  value,
  maxValue,
  className,
}: {
  value: number
  maxValue: number
  className: string
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${className}`}
        style={{ width: `${Math.min(percentage, 100)}%`, transition: 'width 0.3s ease-in-out' }}
      />
    </div>
  )
}

function SimpleBarChart({ data, maxHeight = 80 }: { data: TimelineData[]; maxHeight?: number }) {
  if (!data.length) return null

  const maxValue = Math.max(...data.map(d => d.total || 0), 1)

  return (
    <div className="flex items-end gap-1 h-20">
      {data.slice(-14).map((item, idx) => {
        const height = ((item.total || 0) / maxValue) * maxHeight
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
            <div
              className="w-full bg-blue-500 dark:bg-blue-400 rounded-t hover:bg-blue-600 dark:hover:bg-blue-300 transition-colors relative"
              style={{ height: `${Math.max(height, 2)}px` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {item.total} activities
              </div>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full text-center">
              {item.time.slice(-5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)

  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [timeline, setTimeline] = useState<TimelineData[]>([])
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [topics, setTopics] = useState<TopicAnalysis | null>(null)
  const [predictions, setPredictions] = useState<PredictiveMetrics | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
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

      const [summaryData, timelineData, progressData, topicsData, predictionsData] =
        await Promise.all([
          summaryRes.json(),
          timelineRes.json(),
          progressRes.json(),
          topicsRes.json(),
          predictionsRes.json(),
        ])

      setSummary(summaryData)
      setTimeline(timelineData.data || [])
      setProgress(progressData)
      setTopics(topicsData)
      setPredictions(predictionsData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const timeRangeOptions = [
    { value: 'day', label: t('Today') },
    { value: 'week', label: t('This Week') },
    { value: 'month', label: t('This Month') },
    { value: 'all', label: t('All Time') },
  ]

  return (
    <div className="h-screen flex flex-col animate-fade-in p-6">
      {/* Header */}
      <div className="shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {t('Learning Analytics')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {t('Track your learning progress and identify areas for improvement')}
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('Refresh')}
          </button>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {timeRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value as TimeRange)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timeRange === option.value
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{t('Loading analytics')}...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Activities */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('Total Activities')}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {summary?.total_activities || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Learning Streak */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('Current Streak')}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {progress?.current_streak || 0}{' '}
                      <span className="text-base font-normal text-slate-500">{t('days')}</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Topics Covered */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('Topics Covered')}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {topics?.total_topics || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Active Days */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('Active Days')}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {progress?.active_days || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Activity Timeline */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  {t('Activity Timeline')}
                </h3>
                {timeline.length > 0 ? (
                  <SimpleBarChart data={timeline} />
                ) : (
                  <div className="h-20 flex items-center justify-center text-slate-400 dark:text-slate-500">
                    {t('No activity data available')}
                  </div>
                )}
              </div>

              {/* Activity Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  {t('Activity Breakdown')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(summary?.activity_breakdown || {}).map(([type, count]) => {
                    const config = TYPE_CONFIG[type] || TYPE_CONFIG.chat
                    const IconComponent = config.icon
                    const total = summary?.total_activities || 1

                    return (
                      <div key={type} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
                        >
                          <IconComponent className={`w-4 h-4 ${config.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                              {type}
                            </span>
                            <span className="text-slate-500">{count}</span>
                          </div>
                          <ProgressBar
                            value={count}
                            maxValue={total}
                            className={config.barColor}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(summary?.activity_breakdown || {}).length === 0 && (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                      {t('No activities yet')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Scores */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-500" />
                {t('Learning Scores')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <ScoreGauge
                  score={predictions?.overall_score || 0}
                  label={t('Overall')}
                  color="text-blue-500"
                />
                <ScoreGauge
                  score={predictions?.engagement_score || 0}
                  label={t('Engagement')}
                  color="text-emerald-500"
                />
                <ScoreGauge
                  score={predictions?.consistency_score || 0}
                  label={t('Consistency')}
                  color="text-purple-500"
                />
                <ScoreGauge
                  score={predictions?.diversity_score || 0}
                  label={t('Diversity')}
                  color="text-amber-500"
                />
              </div>

              {/* Recommendations */}
              {predictions?.recommendations && predictions.recommendations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    {t('Recommendations')}
                  </h4>
                  <div className="space-y-2">
                    {predictions.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <span className="text-blue-500 mt-0.5">*</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Strength Areas & Knowledge Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Strength Areas */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-emerald-500" />
                  {t('Strength Areas')}
                </h3>
                <div className="space-y-3">
                  {topics?.strength_areas?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                        {item.topic}
                      </span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-2">
                        {item.sessions} {t('sessions')}
                      </span>
                    </div>
                  ))}
                  {(!topics?.strength_areas || topics.strength_areas.length === 0) && (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                      {t('Keep learning to identify your strengths!')}
                    </div>
                  )}
                </div>
              </div>

              {/* Knowledge Gaps */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-amber-500" />
                  {t('Areas to Review')}
                </h3>
                <div className="space-y-3">
                  {topics?.knowledge_gaps?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                        {item.topic}
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                        {item.days_since_last !== undefined
                          ? `${Math.round(item.days_since_last)} ${t('days ago')}`
                          : `${item.sessions} ${t('sessions')}`}
                      </span>
                    </div>
                  ))}
                  {(!topics?.knowledge_gaps || topics.knowledge_gaps.length === 0) && (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                      {t('Great! No knowledge gaps detected.')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* All Topics */}
            {topics?.all_topics && topics.all_topics.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  {t('All Topics')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topics.all_topics.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <span className="truncate max-w-[200px]">{item.topic}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
