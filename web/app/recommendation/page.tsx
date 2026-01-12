'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  BookOpen,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import { apiUrl, wsUrl } from '@/lib/api'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Button, { IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface Paper {
  paper_id: string
  title: string
  authors: string[]
  abstract: string
  year: number
  url: string
  source: string
  arxiv_id?: string
  doi?: string
  citation_count?: number
  venue?: string
  fields_of_study?: string[]
  similarity_score: number
  citation_score: number
  recency_score: number
  combined_score: number
  recommendation_reason: string
}

interface RecommendationResult {
  query: string
  papers: Paper[]
  total_candidates: number
  recommendation_type: string
  processing_time_ms: number
  explanation?: string
  related_topics?: string
}

type RecommendationType = 'hybrid' | 'semantic' | 'citation'

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
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
      delayChildren: 0.1,
    },
  },
}

const paperCardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.2,
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
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
}

// ============================================================================
// Helpers
// ============================================================================

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const formatPercent = (value: number) => `${Math.round(clamp01(value) * 100)}%`

const formatAuthors = (authors: string[], max: number = 3) => {
  if (authors.length <= max) return authors.join(', ')
  return `${authors.slice(0, max).join(', ')} et al.`
}

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'semantic_scholar':
      return 'Semantic Scholar'
    case 'openalex':
      return 'OpenAlex'
    default:
      return 'arXiv'
  }
}

const getSourceBadgeStyle = (source: string) => {
  switch (source) {
    case 'arxiv':
      return 'border-red-500/15 bg-red-500/10 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
    case 'semantic_scholar':
      return 'border-blue-500/15 bg-blue-500/10 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
    case 'openalex':
      return 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
    default:
      return 'border-zinc-200/70 bg-zinc-100/70 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
  }
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

function openExternal(url: string) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ============================================================================
// Component
// ============================================================================

export default function RecommendationPage() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [recommendationType, setRecommendationType] = useState<RecommendationType>('hybrid')
  const [yearStart, setYearStart] = useState<number | undefined>(undefined)
  const [yearEnd, setYearEnd] = useState<number | undefined>(undefined)
  const [maxResults, setMaxResults] = useState(10)
  const [generateExplanation, setGenerateExplanation] = useState(true)
  const [suggestTopics, setSuggestTopics] = useState(false)

  // UI state
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set())
  const [savedPapers, setSavedPapers] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      recommendationType !== 'hybrid' ||
      yearStart !== undefined ||
      yearEnd !== undefined ||
      maxResults !== 10 ||
      generateExplanation !== true ||
      suggestTopics !== false
    )
  }, [generateExplanation, maxResults, recommendationType, suggestTopics, yearEnd, yearStart])

  const togglePaperExpand = (paperId: string) => {
    setExpandedPapers(prev => {
      const next = new Set(prev)
      if (next.has(paperId)) next.delete(paperId)
      else next.add(paperId)
      return next
    })
  }

  const resetFilters = () => {
    setRecommendationType('hybrid')
    setYearStart(undefined)
    setYearEnd(undefined)
    setMaxResults(10)
    setGenerateExplanation(true)
    setSuggestTopics(false)
  }

  const clearResults = () => {
    setResult(null)
    setError(null)
    setProgress(null)
    setExpandedPapers(new Set())
  }

  const savePaper = async (paper: Paper) => {
    try {
      await fetch(apiUrl('/api/v1/recommendation/interaction'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: paper.paper_id,
          interaction_type: 'save',
        }),
      })
      setSavedPapers(prev => new Set(prev).add(paper.paper_id))
    } catch (err) {
      console.error('Failed to save paper:', err)
    }
  }

  const fetchPapersRest = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/recommendation/recommend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          max_results: maxResults,
          recommendation_type: recommendationType,
          year_start: yearStart,
          year_end: yearEnd,
          generate_explanation: generateExplanation,
          suggest_topics: suggestTopics,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
      setProgress(null)
    }
  }

  const searchPapers = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setProgress('Connecting…')

    // Close existing WebSocket
    if (wsRef.current) wsRef.current.close()

    const ws = new WebSocket(wsUrl('/api/v1/recommendation/recommend/stream'))
    wsRef.current = ws

    ws.onopen = () => {
      setProgress('Searching…')
      ws.send(
        JSON.stringify({
          query,
          max_results: maxResults,
          recommendation_type: recommendationType,
          year_start: yearStart,
          year_end: yearEnd,
          generate_explanation: generateExplanation,
          suggest_topics: suggestTopics,
        })
      )
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'progress') {
          setProgress(
            data.status === 'started' ? `${data.stage}: Starting…` : `${data.stage}: ${data.status}`
          )
        } else if (data.type === 'result') {
          setResult(data.data)
          setIsLoading(false)
          setProgress(null)
          setExpandedPapers(new Set())
          ws.close()
        } else if (data.type === 'error') {
          setError(data.content)
          setIsLoading(false)
          setProgress(null)
          ws.close()
        }
      } catch (e) {
        console.error('Parse error:', e)
      }
    }

    ws.onerror = () => {
      // Fallback to REST API
      fetchPapersRest()
      ws.close()
    }

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null
    }
  }

  const papers = result?.papers ?? []
  const hasPapers = papers.length > 0

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: 'Recommendations' }]}>
      <PageHeader
        title="Paper Recommendations"
        description="High-signal papers ranked by semantic + citation signals, tuned for deep work."
        icon={<BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        actions={
          result || error || progress ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeft={<X className="h-4 w-4" />}
              onClick={clearResults}
            >
              Clear
            </Button>
          ) : null
        }
      />

      {/* Top: Search + Filters */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] items-start">
        {/* Search */}
        <Card variant="glass" padding="none" interactive={false}>
          <CardHeader padding="none" className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Search</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Use a topic, a question, or a paper title.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Best results with specific queries</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardBody padding="none" className="px-5 pb-5">
            <form
              onSubmit={e => {
                e.preventDefault()
                searchPapers()
              }}
              className="space-y-4"
            >
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. diffusion transformers for video generation"
                leftIcon={<Search className="h-5 w-5" />}
                rightIcon={
                  query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                      aria-label="Clear query"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : undefined
                }
                size="lg"
                className={glassFieldClassName}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {recommendationType === 'hybrid'
                        ? 'Hybrid'
                        : recommendationType === 'semantic'
                          ? 'Semantic'
                          : 'Citation'}
                    </span>
                  </span>
                  {yearStart !== undefined || yearEnd !== undefined ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                      <span className="font-medium">
                        {yearStart ?? '…'}–{yearEnd ?? '…'}
                      </span>
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-2.5 py-1 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <span className="font-medium">{maxResults}</span>
                    <span>max</span>
                  </span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={isLoading}
                  disabled={!query.trim()}
                  iconLeft={!isLoading ? <Sparkles className="h-5 w-5" /> : undefined}
                >
                  {isLoading ? 'Searching…' : 'Recommend'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Filters */}
        <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
          <CardHeader padding="none" className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  <SlidersHorizontal className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Filters
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Adjust ranking strategy and output.
                </div>
              </div>
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  iconLeft={<RefreshCw className="h-4 w-4" />}
                >
                  Reset
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardBody padding="none" className="px-5 pb-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Recommendation Type
              </label>
              <select
                value={recommendationType}
                onChange={e => setRecommendationType(e.target.value as RecommendationType)}
                className={selectClassName}
              >
                <option value="hybrid">Hybrid (Recommended)</option>
                <option value="semantic">Semantic Similarity</option>
                <option value="citation">Citation-based</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year from"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 2018"
                value={yearStart ?? ''}
                onChange={e => setYearStart(e.target.value ? parseInt(e.target.value) : undefined)}
                size="sm"
                className={glassFieldClassName}
              />
              <Input
                label="Year to"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 2025"
                value={yearEnd ?? ''}
                onChange={e => setYearEnd(e.target.value ? parseInt(e.target.value) : undefined)}
                size="sm"
                className={glassFieldClassName}
              />
            </div>

            <Input
              label="Max results"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={maxResults}
              onChange={e => setMaxResults(parseInt(e.target.value) || 10)}
              size="sm"
              className={glassFieldClassName}
            />

            <div className="space-y-2">
              <label className="flex items-start gap-3 rounded-xl border border-white/55 bg-white/60 p-3 shadow-glass-sm backdrop-blur-md transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8">
                <input
                  type="checkbox"
                  checked={generateExplanation}
                  onChange={e => setGenerateExplanation(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-blue-600 dark:border-white/20"
                />
                <div>
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    AI explanation
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Generate a concise rationale for the ranked list.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-white/55 bg-white/60 p-3 shadow-glass-sm backdrop-blur-md transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8">
                <input
                  type="checkbox"
                  checked={suggestTopics}
                  onChange={e => setSuggestTopics(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-blue-600 dark:border-white/20"
                />
                <div>
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Related topics
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Suggest adjacent areas worth exploring.
                  </div>
                </div>
              </label>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom: Results + Insights */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] items-start">
        {/* Results */}
        <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
          <CardHeader padding="none" className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Results</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {result ? (
                    <>
                      Ranked papers for{' '}
                      <span className="text-zinc-700 dark:text-zinc-200">“{result.query}”</span>
                    </>
                  ) : (
                    'Run a search to see ranked papers.'
                  )}
                </div>
              </div>

              {result ? (
                <div className="flex flex-col items-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {result.papers.length}
                    </span>
                    <span>of {result.total_candidates}</span>
                  </span>
                  <span>{Math.round(result.processing_time_ms)}ms</span>
                </div>
              ) : null}
            </div>
          </CardHeader>

          {/* Status */}
          {(progress || error) && (
            <div className="px-5 pt-5">
              {progress ? (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-500/15 bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="font-medium">{progress}</span>
                  </div>
                  <span className="text-xs text-blue-700/80 dark:text-blue-200/80">Working…</span>
                </div>
              ) : null}

              {error ? (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium">Something went wrong</div>
                    <div className="mt-0.5 text-xs text-red-700/80 dark:text-red-200/80">
                      {error}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <CardBody padding="none" className="pt-2">
            {hasPapers ? (
              <motion.ol
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="divide-y divide-zinc-200/60 dark:divide-white/10"
              >
                {papers.map((paper, index) => {
                  const expanded = expandedPapers.has(paper.paper_id)
                  const isSaved = savedPapers.has(paper.paper_id)
                  const combined = clamp01(paper.combined_score)

                  return (
                    <motion.li
                      key={paper.paper_id}
                      variants={paperCardVariants}
                      layout
                      className="group relative px-5 py-4 transition-all duration-300 ease-out hover:bg-white/40 dark:hover:bg-white/5"
                    >
                      <div className="flex items-start gap-4">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                            delay: index * 0.05,
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/55 bg-white/60 text-xs font-bold text-zinc-700 shadow-glass-sm backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:border-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                        >
                          {index + 1}
                        </motion.div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <motion.button
                                type="button"
                                onClick={() => openExternal(paper.url)}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="block text-left text-sm font-semibold text-zinc-900 transition-colors duration-200 hover:text-blue-700 dark:text-zinc-50 dark:hover:text-blue-300"
                              >
                                <span className="line-clamp-2">{paper.title}</span>
                              </motion.button>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                <span className="text-zinc-600 dark:text-zinc-300">
                                  {formatAuthors(paper.authors)}
                                </span>
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                <span>{paper.year}</span>
                                {paper.venue ? (
                                  <>
                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                    <span className="truncate">{paper.venue}</span>
                                  </>
                                ) : null}
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                                    getSourceBadgeStyle(paper.source)
                                  )}
                                >
                                  {getSourceLabel(paper.source)}
                                </span>

                                {paper.citation_count !== undefined &&
                                paper.citation_count !== null ? (
                                  <span className="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/60 px-2.5 py-1 text-xs text-zinc-600 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                                    {paper.citation_count} citations
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                                  {formatPercent(paper.combined_score)}
                                </span>
                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200/60 dark:bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                    style={{ width: `${Math.round(combined * 100)}%` }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <IconButton
                                  size="sm"
                                  variant={isSaved ? 'secondary' : 'outline'}
                                  icon={
                                    isSaved ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <BookmarkPlus className="h-4 w-4" />
                                    )
                                  }
                                  aria-label={isSaved ? 'Saved' : 'Save paper'}
                                  onClick={() => savePaper(paper)}
                                  disabled={isSaved}
                                  className={
                                    isSaved ? 'text-blue-700 dark:text-blue-200' : undefined
                                  }
                                />

                                <IconButton
                                  size="sm"
                                  variant="ghost"
                                  icon={<ExternalLink className="h-4 w-4" />}
                                  aria-label="Open paper"
                                  onClick={() => openExternal(paper.url)}
                                />

                                <IconButton
                                  size="sm"
                                  variant="ghost"
                                  icon={
                                    expanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )
                                  }
                                  aria-label={expanded ? 'Collapse details' : 'Expand details'}
                                  aria-expanded={expanded}
                                  onClick={() => togglePaperExpand(paper.paper_id)}
                                />
                              </div>
                            </div>
                          </div>

                          {expanded ? (
                            <div className="mt-4 rounded-xl border border-zinc-200/70 bg-white/60 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                              <div className="grid gap-5 md:grid-cols-2">
                                <div className="space-y-4">
                                  {paper.recommendation_reason ? (
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Why this paper
                                      </div>
                                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                                        {paper.recommendation_reason}
                                      </p>
                                    </div>
                                  ) : null}

                                  {paper.abstract ? (
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Abstract
                                      </div>
                                      <div className="mt-2 prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-invert dark:prose-p:text-zinc-300">
                                        <ReactMarkdown>{paper.abstract}</ReactMarkdown>
                                      </div>
                                    </div>
                                  ) : null}

                                  {paper.fields_of_study?.length ? (
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Fields
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {paper.fields_of_study.slice(0, 6).map(field => (
                                          <span
                                            key={field}
                                            className="rounded-full border border-zinc-200/70 bg-zinc-100/70 px-2.5 py-1 text-xs text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                                          >
                                            {field}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                      Signals
                                    </div>
                                    <div className="mt-2 space-y-2">
                                      {[
                                        { label: 'Similarity', value: paper.similarity_score },
                                        { label: 'Citation', value: paper.citation_score },
                                        { label: 'Recency', value: paper.recency_score },
                                      ].map(metric => (
                                        <div key={metric.label} className="flex items-center gap-3">
                                          <div className="w-20 text-xs text-zinc-600 dark:text-zinc-300">
                                            {metric.label}
                                          </div>
                                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200/60 dark:bg-white/10">
                                            <div
                                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                              style={{
                                                width: `${Math.round(clamp01(metric.value) * 100)}%`,
                                              }}
                                            />
                                          </div>
                                          <div className="w-10 text-right text-xs font-medium text-zinc-700 dark:text-zinc-200">
                                            {formatPercent(metric.value)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {(paper.arxiv_id || paper.doi) && (
                                    <div>
                                      <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                                        Identifiers
                                      </div>
                                      <dl className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                                        {paper.arxiv_id ? (
                                          <div className="flex justify-between gap-3">
                                            <dt className="text-zinc-500 dark:text-zinc-400">
                                              arXiv
                                            </dt>
                                            <dd className="font-medium text-zinc-700 dark:text-zinc-200">
                                              {paper.arxiv_id}
                                            </dd>
                                          </div>
                                        ) : null}
                                        {paper.doi ? (
                                          <div className="flex justify-between gap-3">
                                            <dt className="text-zinc-500 dark:text-zinc-400">
                                              DOI
                                            </dt>
                                            <dd className="font-medium text-zinc-700 dark:text-zinc-200">
                                              {paper.doi}
                                            </dd>
                                          </div>
                                        ) : null}
                                      </dl>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : result && papers.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-300">
                  <Search className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  No papers found
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Try a different query or broaden your filters.
                </div>
              </div>
            ) : isLoading ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-200">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Working…
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Streaming progress as results are computed.
                </div>
              </div>
            ) : (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Ready when you are
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Enter a query above to get ranked recommendations.
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Insights */}
        <Card
          variant="glass"
          padding="none"
          interactive={false}
          className="overflow-hidden lg:sticky lg:top-4"
        >
          <CardHeader
            padding="none"
            className="px-5 py-4 bg-gradient-to-r from-blue-50/70 via-white/40 to-transparent dark:from-blue-500/10 dark:via-white/5"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              AI Insights
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Explanation + related topics (optional).
            </div>
          </CardHeader>

          <CardBody padding="none" className="px-5 py-5">
            {result?.explanation || result?.related_topics ? (
              <div className="space-y-6 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                {result.explanation ? (
                  <section>
                    <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                      Why these papers
                    </div>
                    <div className="mt-2 prose prose-sm max-w-none prose-p:text-zinc-600 dark:prose-invert dark:prose-p:text-zinc-300">
                      <ReactMarkdown>{result.explanation}</ReactMarkdown>
                    </div>
                  </section>
                ) : null}

                {result.related_topics ? (
                  <section>
                    <div className="text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                      Related topics to explore
                    </div>
                    <div className="mt-2 prose prose-sm max-w-none prose-p:text-zinc-600 dark:prose-invert dark:prose-p:text-zinc-300">
                      <ReactMarkdown>{result.related_topics}</ReactMarkdown>
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-zinc-500 shadow-glass-sm backdrop-blur-md dark:bg-white/5 dark:text-zinc-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  No insights yet
                </div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Enable “AI explanation” or “Related topics”, then search.
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  )
}
