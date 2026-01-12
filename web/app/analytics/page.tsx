'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Sparkles,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

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
    gradient: string
    iconColor: string
    barGradient: string
  }
> = {
  solve: {
    icon: Calculator,
    gradient: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-500',
    barGradient: 'from-blue-500 to-blue-400',
  },
  question: {
    icon: FileText,
    gradient: 'from-purple-500/20 to-purple-600/10',
    iconColor: 'text-purple-500',
    barGradient: 'from-purple-500 to-purple-400',
  },
  research: {
    icon: Microscope,
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-500',
    barGradient: 'from-emerald-500 to-emerald-400',
  },
  chat: {
    icon: MessageCircle,
    gradient: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-500',
    barGradient: 'from-amber-500 to-amber-400',
  },
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
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

const counterVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
}

// ============================================================================
// Animated Number Counter Component
// ============================================================================

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const startValue = prevValue.current
    const endValue = value
    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.round(startValue + (endValue - startValue) * easeOutQuart)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    prevValue.current = value
  }, [value])

  return (
    <motion.span
      variants={counterVariants}
      initial="hidden"
      animate="visible"
      className="tabular-nums"
    >
      {displayValue.toLocaleString()}
      {suffix}
    </motion.span>
  )
}

// ============================================================================
// Glass Stats Card Component
// ============================================================================

function GlassStatCard({
  title,
  value,
  suffix,
  icon: Icon,
  gradient,
  iconColor,
  delay = 0,
}: {
  title: string
  value: number
  suffix?: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  iconColor: string
  delay?: number
}) {
  return (
    <motion.div variants={itemVariants} className="relative overflow-hidden">
      <Card variant="glass" className="h-full">
        <CardBody className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                <AnimatedCounter value={value} suffix={suffix} />
              </p>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring' as const,
                stiffness: 260,
                damping: 20,
                delay: delay + 0.2,
              }}
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm flex items-center justify-center shadow-lg`}
            >
              <Icon className={`w-7 h-7 ${iconColor}`} />
            </motion.div>
          </div>
        </CardBody>
        {/* Decorative gradient blob */}
        <div
          className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-50`}
        />
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Score Gauge with Animation
// ============================================================================

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 36
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 300)
    return () => clearTimeout(timer)
  }, [score])

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <motion.div variants={itemVariants} className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
          {/* Background track */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-200/50 dark:text-slate-700/50"
          />
          {/* Animated progress */}
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' as const, delay: 0.5 }}
            className={color}
          />
        </svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' as const }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <AnimatedCounter value={score} />
          </span>
        </motion.div>
      </div>
      <span className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
    </motion.div>
  )
}

// ============================================================================
// Animated Progress Bar
// ============================================================================

function AnimatedProgressBar({
  value,
  maxValue,
  gradient,
}: {
  value: number
  maxValue: number
  gradient: string
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
      <motion.div
        className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.3 }}
      />
    </div>
  )
}

// ============================================================================
// Glass Bar Chart
// ============================================================================

function GlassBarChart({ data, maxHeight = 80 }: { data: TimelineData[]; maxHeight?: number }) {
  if (!data.length) return null

  const maxValue = Math.max(...data.map(d => d.total || 0), 1)

  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.slice(-14).map((item, idx) => {
        const height = ((item.total || 0) / maxValue) * maxHeight
        return (
          <motion.div
            key={idx}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: `${Math.max(height, 4)}px`, opacity: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.03, ease: 'easeOut' }}
            className="flex-1 flex flex-col items-center gap-1.5 group"
          >
            <div className="relative w-full">
              <div
                className="w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-lg hover:from-teal-400 hover:to-teal-300 transition-all shadow-lg shadow-teal-500/20"
                style={{ height: `${Math.max(height, 4)}px` }}
              />
              {/* Glassmorphic tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg border border-white/30 dark:border-slate-700/30">
                {item.total} activities
              </div>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate w-full text-center">
              {item.time.slice(-5)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Analytics Page Component
// ============================================================================

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
    <PageWrapper maxWidth="2xl" showPattern>
      {/* Header */}
      <PageHeader
        title={t('Learning Analytics')}
        description={t('Track your learning progress and identify areas for improvement')}
        icon={<BarChart3 className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div className="flex bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl p-1 border border-white/30 dark:border-slate-700/30">
                {timeRangeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as TimeRange)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      timeRange === option.value
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={fetchAnalytics}
              loading={loading}
              iconLeft={<RefreshCw className="w-4 h-4" />}
            >
              {t('Refresh')}
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-64"
          >
            <Card variant="glass" className="px-8 py-6">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                <span>{t('Loading analytics')}...</span>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassStatCard
                title={t('Total Activities')}
                value={summary?.total_activities || 0}
                icon={Zap}
                gradient="from-teal-500/30 to-teal-600/20"
                iconColor="text-teal-500"
                delay={0}
              />
              <GlassStatCard
                title={t('Current Streak')}
                value={progress?.current_streak || 0}
                suffix={` ${t('days')}`}
                icon={Trophy}
                gradient="from-amber-500/30 to-amber-600/20"
                iconColor="text-amber-500"
                delay={0.1}
              />
              <GlassStatCard
                title={t('Topics Covered')}
                value={topics?.total_topics || 0}
                icon={BookOpen}
                gradient="from-emerald-500/30 to-emerald-600/20"
                iconColor="text-emerald-500"
                delay={0.2}
              />
              <GlassStatCard
                title={t('Active Days')}
                value={progress?.active_days || 0}
                icon={Calendar}
                gradient="from-purple-500/30 to-purple-600/20"
                iconColor="text-purple-500"
                delay={0.3}
              />
            </div>

            {/* Activity Timeline & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Activity Timeline */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card variant="glass">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-500" />
                      {t('Activity Timeline')}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    {timeline.length > 0 ? (
                      <GlassBarChart data={timeline} />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        {t('No activity data available')}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>

              {/* Activity Breakdown */}
              <motion.div variants={itemVariants}>
                <Card variant="glass" className="h-full">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-500" />
                      {t('Activity Breakdown')}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      {Object.entries(summary?.activity_breakdown || {}).map(
                        ([type, count], idx) => {
                          const config = TYPE_CONFIG[type] || TYPE_CONFIG.chat
                          const IconComponent = config.icon
                          const total = summary?.total_activities || 1

                          return (
                            <motion.div
                              key={type}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 + 0.3 }}
                              className="flex items-center gap-3"
                            >
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} backdrop-blur-sm flex items-center justify-center`}
                              >
                                <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                                    {type}
                                  </span>
                                  <span className="text-slate-500 font-semibold">{count}</span>
                                </div>
                                <AnimatedProgressBar
                                  value={count}
                                  maxValue={total}
                                  gradient={config.barGradient}
                                />
                              </div>
                            </motion.div>
                          )
                        }
                      )}
                      {Object.keys(summary?.activity_breakdown || {}).length === 0 && (
                        <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                          {t('No activities yet')}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </div>

            {/* Learning Scores */}
            <motion.div variants={itemVariants}>
              <Card variant="glass">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-500" />
                    {t('Learning Scores')}
                  </h3>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ScoreGauge
                      score={predictions?.overall_score || 0}
                      label={t('Overall')}
                      color="text-teal-500"
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="mt-6 pt-5 border-t border-white/30 dark:border-slate-700/30"
                    >
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-500" />
                        {t('Recommendations')}
                      </h4>
                      <div className="space-y-2">
                        {predictions.recommendations.map((rec, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 + idx * 0.1 }}
                            className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-lg px-3 py-2"
                          >
                            <span className="text-teal-500 mt-0.5">*</span>
                            <span>{rec}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardBody>
              </Card>
            </motion.div>

            {/* Strength Areas & Knowledge Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Strength Areas */}
              <motion.div variants={itemVariants}>
                <Card variant="glass" className="h-full">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ArrowUp className="w-5 h-5 text-emerald-500" />
                      {t('Strength Areas')}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      {topics?.strength_areas?.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 + 0.5 }}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm rounded-xl border border-emerald-500/20"
                        >
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                            {item.topic}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 ml-2 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {item.sessions} {t('sessions')}
                          </span>
                        </motion.div>
                      ))}
                      {(!topics?.strength_areas || topics.strength_areas.length === 0) && (
                        <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                          {t('Keep learning to identify your strengths!')}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              {/* Knowledge Gaps */}
              <motion.div variants={itemVariants}>
                <Card variant="glass" className="h-full">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ArrowDown className="w-5 h-5 text-amber-500" />
                      {t('Areas to Review')}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      {topics?.knowledge_gaps?.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 + 0.5 }}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-amber-600/5 backdrop-blur-sm rounded-xl border border-amber-500/20"
                        >
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                            {item.topic}
                          </span>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 ml-2 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            {item.days_since_last !== undefined
                              ? `${Math.round(item.days_since_last)} ${t('days ago')}`
                              : `${item.sessions} ${t('sessions')}`}
                          </span>
                        </motion.div>
                      ))}
                      {(!topics?.knowledge_gaps || topics.knowledge_gaps.length === 0) && (
                        <div className="text-center text-slate-400 dark:text-slate-500 py-4">
                          {t('Great! No knowledge gaps detected.')}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            </div>

            {/* All Topics */}
            {topics?.all_topics && topics.all_topics.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card variant="glass">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-teal-500" />
                      {t('All Topics')}
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-wrap gap-2">
                      {topics.all_topics.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 + 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          className="px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-white/30 dark:border-slate-700/30 shadow-sm cursor-default"
                        >
                          <span className="truncate max-w-[200px]">{item.topic}</span>
                          <span className="text-xs text-teal-500 font-semibold">
                            ({item.count})
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
