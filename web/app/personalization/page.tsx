'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Gauge,
  Hand,
  RefreshCw,
  Route,
  Sparkles,
  Target,
  Volume2,
  Wand2,
  Eye,
  AlertTriangle,
  X,
  Clock,
} from 'lucide-react'
import { apiUrl, wsUrl } from '@/lib/api'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

// ============================================================================
// Types (match backend)
// ============================================================================

type LearningStyle = 'visual' | 'auditory' | 'kinesthetic'

interface LearningStyleResponse {
  style: LearningStyle
  confidence: number
  evidence: string[]
  recommendations: string[]
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

interface DifficultyRequest {
  topic: string
}

interface DifficultyResponse {
  topic: string
  level: DifficultyLevel
  confidence: number
  reasoning: string
  suggested_next_steps: string[]
}

interface LearningPathRequest {
  topic: string
  target_level: DifficultyLevel
}

interface LearningPathMilestone {
  title: string
  description: string
  estimated_hours: number
  resources: string[]
  activities: string[]
  success_criteria: string[]
}

interface LearningPathResponse {
  topic: string
  current_level: string
  target_level: string
  learning_style: string
  overview: string
  estimated_total_hours: number
  milestones: LearningPathMilestone[]
  tips: string[]
}

type EngagementLevel = 'high' | 'medium' | 'low'
type ImpactLevel = 'high' | 'medium' | 'low'

interface BehaviorInsightsResponse {
  user_id: string
  analyzed_at: number
  strengths: string[]
  improvement_areas: string[]
  patterns: {
    consistency: string
    focus_duration: string
    topic_diversity: string
  }
  engagement_score: number
  engagement_level: EngagementLevel
  recommendations: Array<{
    category: string
    suggestion: string
    impact: ImpactLevel
  }>
  next_steps: string[]
}

// ============================================================================
// Animation Variants (mirrors recommendation page patterns)
// ============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
}

const expandVariants: Variants = {
  collapsed: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
  expanded: {
    opacity: 1,
    height: 'auto',
    marginTop: '1rem',
    transition: {
      duration: 0.4,
      ease: [0.4, 0.0, 0.2, 1],
    },
  },
}

const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -4,
    transition: { duration: 0.2 },
  },
}

// ============================================================================
// Helpers
// ============================================================================

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const formatPercent = (value: number) => `${Math.round(clamp01(value) * 100)}%`

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

const formatTimestamp = (timestamp: number) => {
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const getLearningStyleBadgeStyle = (style: LearningStyle) => {
  switch (style) {
    case 'visual':
      return 'border-blue-500/15 bg-blue-500/10 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
    case 'auditory':
      return 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'kinesthetic':
      return 'border-purple-500/15 bg-purple-500/10 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300'
  }
}

const getDifficultyBadgeStyle = (level: DifficultyLevel) => {
  switch (level) {
    case 'beginner':
      return 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'intermediate':
      return 'border-blue-500/15 bg-blue-500/10 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
    case 'advanced':
      return 'border-amber-500/15 bg-amber-500/10 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'
  }
}

const getEngagementBadgeStyle = (level: EngagementLevel) => {
  switch (level) {
    case 'high':
      return 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
    case 'medium':
      return 'border-blue-500/15 bg-blue-500/10 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
    case 'low':
      return 'border-red-500/15 bg-red-500/10 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
  }
}

const getImpactBadgeStyle = (impact: ImpactLevel) => {
  switch (impact) {
    case 'high':
      return 'border-purple-500/15 bg-purple-500/10 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300'
    case 'medium':
      return 'border-blue-500/15 bg-blue-500/10 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
    case 'low':
      return 'border-zinc-200/70 bg-zinc-100/70 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
  }
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

const glassFieldClassName =
  'bg-white/70 border-white/60 shadow-glass-sm backdrop-blur-md dark:bg-white/5 dark:border-white/10'

const selectClassName = cn(
  'h-10 w-full rounded-lg px-3 text-sm outline-none',
  'border border-white/60 bg-white/70 text-zinc-900 shadow-glass-sm backdrop-blur-md',
  'transition-[border-color,box-shadow,background-color] duration-200 ease-out-expo',
  'hover:border-white/80 focus:border-zinc-400 focus:ring-2 focus:ring-blue-500/20 focus:shadow-glow-blue',
  'dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:border-white/15 dark:focus:border-white/20'
)

const progressTrackClassName =
  'h-2 overflow-hidden rounded-full bg-zinc-200/60 transition-all duration-200 group-hover/metric:h-2.5 dark:bg-white/10'

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init)
  if (!response.ok) {
    const fallback = `Request failed (${response.status})`
    try {
      const data = await response.json()
      const message =
        typeof data?.detail === 'string'
          ? data.detail
          : typeof data?.message === 'string'
            ? data.message
            : fallback
      throw new Error(message)
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : fallback)
    }
  }
  return (await response.json()) as T
}

// ============================================================================
// Component
// ============================================================================

export default function PersonalizationPage() {
  // Learning Style
  const [learningStyle, setLearningStyle] = useState<LearningStyleResponse | null>(null)
  const [learningStyleLoading, setLearningStyleLoading] = useState(false)
  const [learningStyleError, setLearningStyleError] = useState<string | null>(null)
  const [learningStyleExpanded, setLearningStyleExpanded] = useState(false)
  const [learningStyleSuccessAt, setLearningStyleSuccessAt] = useState<number | null>(null)

  // Difficulty
  const [difficultyTopic, setDifficultyTopic] = useState('')
  const [difficultyResult, setDifficultyResult] = useState<DifficultyResponse | null>(null)
  const [difficultyLoading, setDifficultyLoading] = useState(false)
  const [difficultyError, setDifficultyError] = useState<string | null>(null)
  const [difficultyExpanded, setDifficultyExpanded] = useState(false)
  const [difficultySuccessAt, setDifficultySuccessAt] = useState<number | null>(null)

  // Learning Path
  const [pathTopic, setPathTopic] = useState('')
  const [pathTargetLevel, setPathTargetLevel] = useState<DifficultyLevel>('intermediate')
  const [learningPath, setLearningPath] = useState<LearningPathResponse | null>(null)
  const [pathLoading, setPathLoading] = useState(false)
  const [pathError, setPathError] = useState<string | null>(null)
  const [pathProgress, setPathProgress] = useState<string | null>(null)
  const [pathSuccessAt, setPathSuccessAt] = useState<number | null>(null)
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())
  const [useLivePathGeneration, setUseLivePathGeneration] = useState(false)

  // Behavior Insights
  const [behaviorInsights, setBehaviorInsights] = useState<BehaviorInsightsResponse | null>(null)
  const [behaviorLoading, setBehaviorLoading] = useState(false)
  const [behaviorError, setBehaviorError] = useState<string | null>(null)
  const [behaviorExpanded, setBehaviorExpanded] = useState(false)
  const [behaviorSuccessAt, setBehaviorSuccessAt] = useState<number | null>(null)

  const wsRef = useRef<WebSocket | null>(null)

  const clearAll = () => {
    setLearningStyle(null)
    setLearningStyleError(null)
    setLearningStyleExpanded(false)
    setLearningStyleSuccessAt(null)

    setDifficultyTopic('')
    setDifficultyResult(null)
    setDifficultyError(null)
    setDifficultyExpanded(false)
    setDifficultySuccessAt(null)

    setPathTopic('')
    setPathTargetLevel('intermediate')
    setLearningPath(null)
    setPathError(null)
    setPathProgress(null)
    setPathSuccessAt(null)
    setExpandedMilestones(new Set())

    setBehaviorInsights(null)
    setBehaviorError(null)
    setBehaviorExpanded(false)
    setBehaviorSuccessAt(null)
  }

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!learningStyleSuccessAt) return
    const timeout = window.setTimeout(() => setLearningStyleSuccessAt(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [learningStyleSuccessAt])

  useEffect(() => {
    if (!difficultySuccessAt) return
    const timeout = window.setTimeout(() => setDifficultySuccessAt(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [difficultySuccessAt])

  useEffect(() => {
    if (!pathSuccessAt) return
    const timeout = window.setTimeout(() => setPathSuccessAt(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [pathSuccessAt])

  useEffect(() => {
    if (!behaviorSuccessAt) return
    const timeout = window.setTimeout(() => setBehaviorSuccessAt(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [behaviorSuccessAt])

  const styleOptions = useMemo(() => {
    return [
      { id: 'visual' as const, label: 'Visual', icon: <Eye className="h-4 w-4" /> },
      { id: 'auditory' as const, label: 'Auditory', icon: <Volume2 className="h-4 w-4" /> },
      { id: 'kinesthetic' as const, label: 'Kinesthetic', icon: <Hand className="h-4 w-4" /> },
    ]
  }, [])

  const toggleMilestone = (title: string) => {
    setExpandedMilestones(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  const detectLearningStyle = async () => {
    setLearningStyleLoading(true)
    setLearningStyleError(null)
    try {
      const data = await fetchJson<LearningStyleResponse>('/api/v1/personalization/learning-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      setLearningStyle(data)
      setLearningStyleSuccessAt(Date.now())
    } catch (err) {
      setLearningStyleError(getErrorMessage(err))
    } finally {
      setLearningStyleLoading(false)
    }
  }

  const calibrateDifficulty = async () => {
    if (!difficultyTopic.trim()) return
    setDifficultyLoading(true)
    setDifficultyError(null)
    try {
      const payload: DifficultyRequest = { topic: difficultyTopic.trim() }
      const data = await fetchJson<DifficultyResponse>('/api/v1/personalization/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setDifficultyResult(data)
      setDifficultyExpanded(true)
      setDifficultySuccessAt(Date.now())
    } catch (err) {
      setDifficultyError(getErrorMessage(err))
    } finally {
      setDifficultyLoading(false)
    }
  }

  const generateLearningPathRest = async () => {
    const payload: LearningPathRequest = { topic: pathTopic.trim(), target_level: pathTargetLevel }
    const data = await fetchJson<LearningPathResponse>('/api/v1/personalization/learning-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLearningPath(data)
    setExpandedMilestones(new Set(data.milestones.slice(0, 1).map(m => m.title)))
    setPathSuccessAt(Date.now())
  }

  const generateLearningPathStreaming = () => {
    return new Promise<void>((resolve, reject) => {
      const payload: LearningPathRequest = { topic: pathTopic.trim(), target_level: pathTargetLevel }

      setPathProgress('Connecting…')
      if (wsRef.current) wsRef.current.close()

      const ws = new WebSocket(wsUrl('/api/v1/personalization/learning-path/stream'))
      wsRef.current = ws

      const cleanup = () => {
        try {
          ws.close()
        } catch {
          // ignore
        }
        if (wsRef.current === ws) wsRef.current = null
      }

      ws.onopen = () => {
        setPathProgress('Generating…')
        ws.send(JSON.stringify(payload))
      }

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data)
          if (message?.type === 'progress') {
            setPathProgress(message?.content || message?.status || 'Working…')
            return
          }
          if (message?.type === 'result') {
            const data = message.data as LearningPathResponse
            setLearningPath(data)
            setExpandedMilestones(new Set(data.milestones.slice(0, 1).map(m => m.title)))
            setPathProgress(null)
            setPathSuccessAt(Date.now())
            cleanup()
            resolve()
            return
          }
          if (message?.type === 'error') {
            setPathError(String(message?.content || 'Failed to generate learning path'))
            setPathProgress(null)
            cleanup()
            reject(new Error(String(message?.content || 'Failed to generate learning path')))
          }
        } catch (err) {
          setPathProgress(null)
          cleanup()
          reject(err)
        }
      }

      ws.onerror = async () => {
        cleanup()
        try {
          await generateLearningPathRest()
          setPathProgress(null)
          resolve()
        } catch (err) {
          setPathProgress(null)
          reject(err)
        }
      }

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null
      }
    })
  }

  const generateLearningPath = async () => {
    if (!pathTopic.trim()) return
    setPathLoading(true)
    setPathError(null)
    setPathProgress(useLivePathGeneration ? 'Connecting…' : 'Generating…')
    try {
      if (useLivePathGeneration) {
        await generateLearningPathStreaming()
      } else {
        await generateLearningPathRest()
        setPathProgress(null)
      }
    } catch (err) {
      setPathError(getErrorMessage(err))
      setPathProgress(null)
    } finally {
      setPathLoading(false)
    }
  }

  const refreshBehaviorInsights = useCallback(async () => {
    setBehaviorLoading(true)
    setBehaviorError(null)
    try {
      const data = await fetchJson<BehaviorInsightsResponse>('/api/v1/personalization/behavior-insights')
      setBehaviorInsights(data)
      setBehaviorSuccessAt(Date.now())
    } catch (err) {
      setBehaviorError(getErrorMessage(err))
    } finally {
      setBehaviorLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshBehaviorInsights()
  }, [refreshBehaviorInsights])

  const hasAnyData = Boolean(learningStyle || difficultyResult || learningPath || behaviorInsights)

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: 'Personalization' }]}>
      <PageHeader
        title="Personalization"
        description="Tune praDeep to how you learn — adaptive difficulty, paths, and behavior insights."
        icon={<Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        actions={
          hasAnyData || learningStyleError || difficultyError || pathError || behaviorError ? (
            <Button variant="ghost" size="sm" iconLeft={<X className="h-4 w-4" />} onClick={clearAll}>
              Clear
            </Button>
          ) : null
        }
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] items-start"
      >
        <div className="space-y-6">
          {/* Learning Style Detection */}
          <motion.div variants={fadeInUp}>
            <Card
              variant="glass"
              padding="none"
              interactive={false}
              className="overflow-hidden"
              role="region"
              aria-labelledby="learning-style-detection-heading"
            >
              <CardHeader padding="none" className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      id="learning-style-detection-heading"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                      Learning Style Detection
                    </h2>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Identify the style that matches your learning traces.
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {learningStyleSuccessAt ? (
                      <motion.span
                        key="learning-style-success"
                        variants={badgeVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-glass-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Updated
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </CardHeader>

              <CardBody padding="none" className="px-5 pb-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {styleOptions.map(option => {
                    const active = learningStyle?.style === option.id
                    return (
                      <motion.span
                        key={option.id}
                        layout
                        whileHover={{ scale: 1.05, y: -1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-glass-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-md',
                          active
                            ? getLearningStyleBadgeStyle(option.id)
                            : 'border-white/50 bg-white/60 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
                        )}
                      >
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                      </motion.span>
                    )
                  })}
                </div>

                <div className="rounded-xl border border-white/55 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {learningStyle ? (
                          <>
                            Detected:{' '}
                            <span className="font-semibold">{titleCase(learningStyle.style)}</span>
                          </>
                        ) : (
                          'Run detection to personalize recommendations'
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium">Confidence</span>
                      <span className="tabular-nums text-zinc-700 dark:text-zinc-200">
                        {learningStyle ? formatPercent(learningStyle.confidence) : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 group/metric flex items-center gap-3">
                    <div className={cn('flex-1', progressTrackClassName)}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: learningStyle ? `${Math.round(clamp01(learningStyle.confidence) * 100)}%` : '0%',
                        }}
                        transition={{ duration: 0.7, ease: [0.4, 0.0, 0.2, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                      />
                    </div>
                    <div className="w-12 text-right text-xs font-medium text-zinc-700 dark:text-zinc-200 tabular-nums">
                      {learningStyle ? formatPercent(learningStyle.confidence) : '0%'}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="gradient-blue"
                      size="sm"
                      loading={learningStyleLoading}
                      onClick={detectLearningStyle}
                      iconLeft={!learningStyleLoading ? <Wand2 className="h-4 w-4" /> : undefined}
                    >
                      Detect style
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLearningStyleExpanded(v => !v)}
                      iconRight={
                        learningStyleExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      }
                    >
                      Details
                    </Button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {learningStyleError ? (
                    <motion.div
                      key="learning-style-error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="rounded-xl border border-red-500/15 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <div>
                          <div className="font-medium">Couldn’t detect your learning style</div>
                          <div className="mt-0.5 text-xs opacity-90">{learningStyleError}</div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {learningStyleExpanded && learningStyle ? (
                    <motion.div
                      key="learning-style-details"
                      variants={expandVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                              Evidence
                            </div>
                            <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                              {learningStyle.evidence.map((item, idx) => (
                                <li key={`${item}-${idx}`} className="flex items-start gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                              Recommendations
                            </div>
                            <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                              {learningStyle.recommendations.map((item, idx) => (
                                <li key={`${item}-${idx}`} className="flex items-start gap-2">
                                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </CardBody>
            </Card>
          </motion.div>

          {/* Difficulty Calibration */}
          <motion.div variants={fadeInUp}>
            <Card
              variant="glass"
              padding="none"
              interactive={false}
              className="overflow-hidden"
              role="region"
              aria-labelledby="difficulty-calibration-heading"
            >
              <CardHeader padding="none" className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      id="difficulty-calibration-heading"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                      Difficulty Calibration
                    </h2>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Estimate the right challenge level for a topic.
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {difficultySuccessAt ? (
                      <motion.span
                        key="difficulty-success"
                        variants={badgeVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-glass-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Calibrated
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </CardHeader>

              <CardBody padding="none" className="px-5 pb-5 space-y-4">
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    calibrateDifficulty()
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <Input
                      label="Calibration topic"
                      value={difficultyTopic}
                      onChange={e => setDifficultyTopic(e.target.value)}
                      placeholder="e.g. linear algebra"
                      leftIcon={<Target className="h-5 w-5" />}
                      size="lg"
                      className={glassFieldClassName}
                    />
                    <Button
                      type="submit"
                      variant="gradient-emerald"
                      size="lg"
                      loading={difficultyLoading}
                      disabled={!difficultyTopic.trim()}
                      iconLeft={!difficultyLoading ? <Gauge className="h-5 w-5" /> : undefined}
                      className="w-full sm:w-auto"
                    >
                      Calibrate
                    </Button>
                  </div>
                </form>

                <AnimatePresence mode="wait">
                  {difficultyError ? (
                    <motion.div
                      key="difficulty-error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="rounded-xl border border-red-500/15 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <div>
                          <div className="font-medium">Calibration failed</div>
                          <div className="mt-0.5 text-xs opacity-90">{difficultyError}</div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {difficultyResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0.0, 0.2, 1] }}
                    className="rounded-xl border border-white/55 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {difficultyResult.topic}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-glass-sm backdrop-blur-md',
                              getDifficultyBadgeStyle(difficultyResult.level)
                            )}
                          >
                            <span>{titleCase(difficultyResult.level)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs text-zinc-700 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium">
                              {formatPercent(difficultyResult.confidence)}
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400">confidence</span>
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDifficultyExpanded(v => !v)}
                        iconRight={
                          difficultyExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        }
                      >
                        Details
                      </Button>
                    </div>

                    <div className="mt-4 group/metric flex items-center gap-3">
                      <div className={cn('flex-1', progressTrackClassName)}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.round(clamp01(difficultyResult.confidence) * 100)}%`,
                          }}
                          transition={{ duration: 0.7, ease: [0.4, 0.0, 0.2, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        />
                      </div>
                      <div className="w-12 text-right text-xs font-medium text-zinc-700 dark:text-zinc-200 tabular-nums">
                        {formatPercent(difficultyResult.confidence)}
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {difficultyExpanded ? (
                        <motion.div
                          key="difficulty-details"
                          variants={expandVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="overflow-hidden"
                        >
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                Reasoning
                              </div>
                              <div className="mt-2 prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-invert dark:prose-p:text-zinc-300">
                                <ReactMarkdown>{difficultyResult.reasoning}</ReactMarkdown>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                Suggested next steps
                              </div>
                              <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                                {difficultyResult.suggested_next_steps.map((step, idx) => (
                                  <li key={`${step}-${idx}`} className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                ) : null}
              </CardBody>
            </Card>
          </motion.div>

          {/* Learning Path Generator */}
          <motion.div variants={fadeInUp}>
            <Card
              variant="glass"
              padding="none"
              interactive={false}
              className="overflow-hidden"
              role="region"
              aria-labelledby="learning-path-generator-heading"
            >
              <CardHeader padding="none" className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      id="learning-path-generator-heading"
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                      Learning Path Generator
                    </h2>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Generate milestones, hours, and actionable practice.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.label
                      whileHover={{ scale: 1.03, y: -1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="inline-flex cursor-pointer select-none items-center gap-2 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs text-zinc-700 shadow-glass-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={useLivePathGeneration}
                        onChange={e => setUseLivePathGeneration(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 accent-blue-600 dark:border-white/20"
                      />
                      <span className="font-medium">Live</span>
                    </motion.label>

                    <AnimatePresence mode="wait">
                      {pathSuccessAt ? (
                        <motion.span
                          key="path-success"
                          variants={badgeVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-glass-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Ready
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </CardHeader>

              <CardBody padding="none" className="px-5 pb-5 space-y-4">
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    generateLearningPath()
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Learning topic"
                      value={pathTopic}
                      onChange={e => setPathTopic(e.target.value)}
                      placeholder="e.g. neural networks"
                      leftIcon={<Route className="h-5 w-5" />}
                      size="lg"
                      className={glassFieldClassName}
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Target level
                      </label>
                      <select
                        aria-label="Target level"
                        value={pathTargetLevel}
                        onChange={e => setPathTargetLevel(e.target.value as DifficultyLevel)}
                        className={cn(selectClassName, 'h-12')}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <AnimatePresence mode="wait">
                      {pathProgress ? (
                        <motion.div
                          key="path-progress"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-xs text-zinc-600 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                        >
                          <motion.span
                            aria-hidden="true"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                          >
                            <Sparkles className="h-3 w-3" />
                          </motion.span>
                          <span className="font-medium">{pathProgress}</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="path-hint"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-xs text-zinc-500 dark:text-zinc-400"
                        >
                          <span className="font-medium">Tip:</span> Keep milestones small and shippable.
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      variant="gradient-purple"
                      size="lg"
                      loading={pathLoading}
                      disabled={!pathTopic.trim()}
                      iconLeft={!pathLoading ? <Sparkles className="h-5 w-5" /> : undefined}
                      className="w-full sm:w-auto"
                    >
                      Generate path
                    </Button>
                  </div>
                </form>

                <AnimatePresence mode="wait">
                  {pathError ? (
                    <motion.div
                      key="path-error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="rounded-xl border border-red-500/15 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <div>
                          <div className="font-medium">Couldn’t generate a learning path</div>
                          <div className="mt-0.5 text-xs opacity-90">{pathError}</div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {learningPath ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0.0, 0.2, 1] }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border border-white/55 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {learningPath.topic}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs text-zinc-700 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                              <Gauge className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium">{learningPath.current_level}</span>
                              <span className="text-zinc-500 dark:text-zinc-400">→</span>
                              <span className="font-medium">{learningPath.target_level}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs text-zinc-700 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                              <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="font-medium">{titleCase(learningPath.learning_style)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 text-xs text-zinc-700 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                              <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              <span className="font-medium tabular-nums">
                                {Math.round(learningPath.estimated_total_hours)}h
                              </span>
                              <span className="text-zinc-500 dark:text-zinc-400">total</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 prose prose-sm max-w-none prose-p:text-zinc-600 dark:prose-invert dark:prose-p:text-zinc-300">
                        <ReactMarkdown>{learningPath.overview}</ReactMarkdown>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {learningPath.milestones.map((milestone, index) => {
                        const expanded = expandedMilestones.has(milestone.title)
                        return (
                          <motion.div
                            key={milestone.title}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: index * 0.05,
                              type: 'spring',
                              stiffness: 350,
                              damping: 30,
                            }}
                            className="rounded-xl border border-white/55 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                                    <Check className="h-4 w-4" />
                                  </span>
                                  <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                    {milestone.title}
                                  </div>
                                </div>
                                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                                  {milestone.description}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                                    <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <span className="font-medium tabular-nums">
                                      {Math.round(milestone.estimated_hours)}h
                                    </span>
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                                    <Route className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-medium tabular-nums">
                                      {milestone.resources.length}
                                    </span>
                                    <span>resources</span>
                                  </span>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMilestone(milestone.title)}
                                iconRight={
                                  expanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )
                                }
                              >
                                Details
                              </Button>
                            </div>

                            <AnimatePresence initial={false}>
                              {expanded ? (
                                <motion.div
                                  key={`milestone-${milestone.title}-expanded`}
                                  variants={expandVariants}
                                  initial="collapsed"
                                  animate="expanded"
                                  exit="collapsed"
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Resources
                                      </div>
                                      <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                                        {milestone.resources.map((item, idx) => (
                                          <li key={`${item}-${idx}`} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Activities
                                      </div>
                                      <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                                        {milestone.activities.map((item, idx) => (
                                          <li key={`${item}-${idx}`} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Success criteria
                                      </div>
                                      <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                                        {milestone.success_criteria.map((item, idx) => (
                                          <li key={`${item}-${idx}`} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </div>

                    {learningPath.tips?.length ? (
                      <div className="rounded-xl border border-white/55 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                          Tips
                        </div>
                        <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                          {learningPath.tips.map((tip, idx) => (
                            <li key={`${tip}-${idx}`} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </CardBody>
            </Card>
          </motion.div>
        </div>

        {/* Behavior Insights */}
        <motion.div variants={slideInRight}>
          <Card
            variant="glass"
            padding="none"
            interactive={false}
            className="overflow-hidden"
            role="region"
            aria-labelledby="behavior-insights-heading"
          >
            <CardHeader padding="none" className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="behavior-insights-heading"
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                  >
                    Behavior Insights
                  </h2>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Strengths, patterns, engagement, and recommendations.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {behaviorSuccessAt ? (
                      <motion.span
                        key="behavior-success"
                        variants={badgeVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-glass-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Synced
                      </motion.span>
                    ) : null}
                  </AnimatePresence>

                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<RefreshCw className="h-4 w-4" />}
                    onClick={refreshBehaviorInsights}
                    loading={behaviorLoading}
                    aria-label="Refresh insights"
                  >
                    Refresh insights
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardBody padding="none" className="px-5 pb-5 space-y-4">
              <AnimatePresence mode="wait">
                {behaviorError ? (
                  <motion.div
                    key="behavior-error"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="rounded-xl border border-red-500/15 bg-red-500/10 p-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4" />
                      <div>
                        <div className="font-medium">Couldn’t load insights</div>
                        <div className="mt-0.5 text-xs opacity-90">{behaviorError}</div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="rounded-xl border border-white/55 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Engagement
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {behaviorInsights ? (
                        <>
                          <span className="font-medium">{titleCase(behaviorInsights.engagement_level)}</span>{' '}
                          · analyzed {formatTimestamp(behaviorInsights.analyzed_at)}
                        </>
                      ) : behaviorLoading ? (
                        'Analyzing…'
                      ) : (
                        'Refresh to analyze your recent activity.'
                      )}
                    </div>
                  </div>

                  {behaviorInsights ? (
                    <motion.span
                      layout
                      whileHover={{ scale: 1.05, y: -1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-glass-sm backdrop-blur-md',
                        getEngagementBadgeStyle(behaviorInsights.engagement_level)
                      )}
                    >
                      <span>{titleCase(behaviorInsights.engagement_level)}</span>
                    </motion.span>
                  ) : null}
                </div>

                <div className="mt-4 group/metric flex items-center gap-3">
                  <div className={cn('flex-1', progressTrackClassName)}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(clamp01(behaviorInsights?.engagement_score ?? 0) * 100)}%`,
                      }}
                      transition={{ duration: 0.7, ease: [0.4, 0.0, 0.2, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-medium text-zinc-700 dark:text-zinc-200 tabular-nums">
                    {formatPercent(behaviorInsights?.engagement_score ?? 0)}
                  </div>
                </div>

                {behaviorInsights ? (
                  <div className="mt-4 grid gap-3">
                    {[
                      { label: 'Consistency', value: behaviorInsights.patterns.consistency },
                      { label: 'Focus duration', value: behaviorInsights.patterns.focus_duration },
                      { label: 'Topic diversity', value: behaviorInsights.patterns.topic_diversity },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-white/60 bg-white/70 p-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                          {item.label}
                        </div>
                        <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {behaviorInsights ? (
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-xl border border-white/60 bg-white/70 p-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                        Strengths
                      </div>
                      <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                        {behaviorInsights.strengths.slice(0, 3).map((item, idx) => (
                          <li key={`${item}-${idx}`} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-white/60 bg-white/70 p-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                        Recommendations
                      </div>
                      <div className="mt-2 space-y-2">
                        {behaviorInsights.recommendations.slice(0, 2).map((rec, idx) => (
                          <div key={`${rec.category}-${idx}`} className="flex items-start gap-3">
                            <span
                              className={cn(
                                'mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-glass-sm backdrop-blur-md',
                                getImpactBadgeStyle(rec.impact)
                              )}
                            >
                              {titleCase(rec.impact)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                                {rec.category}
                              </div>
                              <div className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-200">
                                {rec.suggestion}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBehaviorExpanded(v => !v)}
                    iconRight={
                      behaviorExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )
                    }
                  >
                    Details
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {behaviorExpanded && behaviorInsights ? (
                  <motion.div
                    key="behavior-details"
                    variants={expandVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="overflow-hidden space-y-4"
                  >
                    <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                            Strengths
                          </div>
                          <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                            {behaviorInsights.strengths.map((item, idx) => (
                              <li key={`${item}-${idx}`} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                            Improvement areas
                          </div>
                          <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                            {behaviorInsights.improvement_areas.map((item, idx) => (
                              <li key={`${item}-${idx}`} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                        Recommendations
                      </div>
                      <div className="mt-2 space-y-3">
                        {behaviorInsights.recommendations.map((rec, idx) => (
                          <motion.div
                            key={`${rec.category}-${idx}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="rounded-xl border border-white/60 bg-white/70 p-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                    {rec.category}
                                  </span>
                                  <span
                                    className={cn(
                                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shadow-glass-sm backdrop-blur-md',
                                      getImpactBadgeStyle(rec.impact)
                                    )}
                                  >
                                    {titleCase(rec.impact)} impact
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                                  {rec.suggestion}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {behaviorInsights.next_steps?.length ? (
                      <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                          Next steps
                        </div>
                        <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                          {behaviorInsights.next_steps.map((step, idx) => (
                            <li key={`${step}-${idx}`} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </PageWrapper>
  )
}
