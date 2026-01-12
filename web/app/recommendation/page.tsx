'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  BookOpen,
  ExternalLink,
  Filter,
  Calendar,
  Star,
  Quote,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  X,
  TrendingUp,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useGlobal } from '@/context/GlobalContext'
import { apiUrl, wsUrl } from '@/lib/api'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardFooter } from '@/components/ui/Card'
import Button, { IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

const filterPanelVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: 16,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
}

const progressVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const insightsPanelVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
    },
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

const getSourceBadgeStyle = (source: string) => {
  switch (source) {
    case 'arxiv':
      return 'bg-red-100/80 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200/50 dark:border-red-700/50'
    case 'semantic_scholar':
      return 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50'
    case 'openalex':
      return 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/50'
    default:
      return 'bg-slate-100/80 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50'
  }
}

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

// ============================================================================
// Main Component
// ============================================================================

export default function RecommendationPage() {
  const { uiSettings } = useGlobal()

  // Search state
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [recommendationType, setRecommendationType] = useState('hybrid')
  const [yearStart, setYearStart] = useState<number | undefined>(undefined)
  const [yearEnd, setYearEnd] = useState<number | undefined>(undefined)
  const [maxResults, setMaxResults] = useState(10)
  const [generateExplanation, setGenerateExplanation] = useState(true)
  const [suggestTopics, setSuggestTopics] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Expanded paper state
  const [expandedPapers, setExpandedPapers] = useState<Set<string>>(new Set())
  const [savedPapers, setSavedPapers] = useState<Set<string>>(new Set())

  // Progress state for WebSocket
  const [progress, setProgress] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const togglePaperExpand = (paperId: string) => {
    setExpandedPapers(prev => {
      const next = new Set(prev)
      if (next.has(paperId)) {
        next.delete(paperId)
      } else {
        next.add(paperId)
      }
      return next
    })
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

  const searchPapers = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setProgress('Searching...')

    // Close existing WebSocket
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Use WebSocket for real-time updates
    const ws = new WebSocket(wsUrl('/api/v1/recommendation/recommend/stream'))
    wsRef.current = ws

    ws.onopen = () => {
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
            data.status === 'started'
              ? `${data.stage}: Starting...`
              : `${data.stage}: ${data.status}`
          )
        } else if (data.type === 'result') {
          setResult(data.data)
          setIsLoading(false)
          setProgress(null)
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
      if (wsRef.current === ws) {
        wsRef.current = null
      }
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

  return (
    <PageWrapper maxWidth="2xl" showPattern>
      {/* Page Header */}
      <PageHeader
        title="Paper Recommendations"
        description="ML-based paper recommendations using citation networks, semantic similarity, and your reading history"
        icon={<BookOpen className="w-5 h-5" />}
      />

      {/* Search Section */}
      <Card variant="glass" className="mb-6" hoverEffect={false}>
        <CardBody className="p-6">
          <div className="flex gap-3">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPapers()}
                placeholder="Enter research topic, keywords, or paper title..."
                leftIcon={<Search className="w-5 h-5" />}
                size="lg"
              />
            </div>

            {/* Filter Toggle */}
            <IconButton
              variant={showFilters ? 'primary' : 'secondary'}
              size="lg"
              icon={<SlidersHorizontal className="w-5 h-5" />}
              aria-label="Toggle filters"
              onClick={() => setShowFilters(!showFilters)}
            />

            {/* Search Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={searchPapers}
              loading={isLoading}
              iconLeft={!isLoading ? <Sparkles className="w-5 h-5" /> : undefined}
            >
              {isLoading ? 'Searching...' : 'Find Papers'}
            </Button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                variants={filterPanelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-[#E8E2D080] dark:border-slate-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Recommendation Type */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Recommendation Type
                      </label>
                      <select
                        value={recommendationType}
                        onChange={e => setRecommendationType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all duration-200"
                      >
                        <option value="hybrid">Hybrid (Recommended)</option>
                        <option value="semantic">Semantic Similarity</option>
                        <option value="citation">Citation-based</option>
                      </select>
                    </div>

                    {/* Year Range */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Year Range
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="From"
                          value={yearStart || ''}
                          onChange={e =>
                            setYearStart(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          className="w-full px-3 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all duration-200"
                        />
                        <input
                          type="number"
                          placeholder="To"
                          value={yearEnd || ''}
                          onChange={e =>
                            setYearEnd(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          className="w-full px-3 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Max Results */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Max Results
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={maxResults}
                        onChange={e => setMaxResults(parseInt(e.target.value) || 10)}
                        className="w-full px-3 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 outline-none transition-all duration-200"
                      />
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-3 pt-1">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={generateExplanation}
                            onChange={e => setGenerateExplanation(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 peer-checked:border-teal-500 peer-checked:bg-teal-500 transition-all duration-200 flex items-center justify-center">
                            <motion.svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{
                                pathLength: generateExplanation ? 1 : 0,
                                opacity: generateExplanation ? 1 : 0,
                              }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </motion.svg>
                          </div>
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                          AI Explanation
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={suggestTopics}
                            onChange={e => setSuggestTopics(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 peer-checked:border-teal-500 peer-checked:bg-teal-500 transition-all duration-200 flex items-center justify-center">
                            <motion.svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{
                                pathLength: suggestTopics ? 1 : 0,
                                opacity: suggestTopics ? 1 : 0,
                              }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </motion.svg>
                          </div>
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                          Suggest Topics
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>

      {/* Progress Indicator */}
      <AnimatePresence>
        {progress && (
          <motion.div
            variants={progressVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mb-6"
          >
            <Card variant="glass" hoverEffect={false}>
              <CardBody className="py-4 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-5 h-5 text-teal-500" />
                </motion.div>
                <span className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                  {progress}
                </span>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Card
              variant="solid"
              hoverEffect={false}
              className="border-red-200 dark:border-red-800/50 bg-red-50/80 dark:bg-red-900/20"
            >
              <CardBody className="py-4 flex items-center gap-3">
                <X className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <div className="flex gap-6">
        {/* Papers Grid */}
        <div className="flex-1 min-w-0">
          {result && result.papers.length > 0 ? (
            <>
              {/* Stats Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4 px-1"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Found {result.papers.length} of {result.total_candidates} candidates
                </span>
                <span>Processed in {result.processing_time_ms.toFixed(0)}ms</span>
              </motion.div>

              {/* Paper Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4"
              >
                {result.papers.map((paper, index) => (
                  <motion.div key={paper.paper_id} variants={cardVariants}>
                    <Card variant="glass" hoverEffect>
                      <CardBody className="p-5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Badges Row */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 text-white text-xs font-bold shadow-sm">
                                {index + 1}
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm ${getSourceBadgeStyle(paper.source)}`}
                              >
                                {getSourceLabel(paper.source)}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                {paper.year}
                              </span>
                              {paper.citation_count !== undefined &&
                                paper.citation_count !== null && (
                                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Quote className="w-3.5 h-3.5" />
                                    {paper.citation_count} citations
                                  </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                              {paper.title}
                            </h3>

                            {/* Authors */}
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {formatAuthors(paper.authors)}
                            </p>
                          </div>

                          {/* Score Badge */}
                          <div className="flex-shrink-0 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20 dark:from-teal-500/30 dark:to-cyan-500/30 border border-teal-200/50 dark:border-teal-600/50 flex flex-col items-center justify-center">
                              <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                {(paper.combined_score * 100).toFixed(0)}%
                              </div>
                              <div className="text-[10px] text-teal-500/80 dark:text-teal-400/80 uppercase tracking-wide">
                                Match
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation Reason */}
                        <div className="mt-4 px-4 py-3 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-100/50 dark:border-teal-800/30">
                          <p className="text-sm text-teal-800 dark:text-teal-200">
                            {paper.recommendation_reason}
                          </p>
                        </div>

                        {/* Expandable Abstract */}
                        <div className="mt-4">
                          <button
                            onClick={() => togglePaperExpand(paper.paper_id)}
                            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                          >
                            {expandedPapers.has(paper.paper_id) ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide abstract
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Show abstract
                              </>
                            )}
                          </button>

                          <AnimatePresence>
                            {expandedPapers.has(paper.paper_id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {paper.abstract || 'No abstract available.'}
                                </p>

                                {/* Score Breakdown */}
                                <div className="mt-4 pt-4 border-t border-[#E8E2D080] dark:border-slate-700/50">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                      <div className="text-xs text-slate-400 mb-1">Semantic</div>
                                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {(paper.similarity_score * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-slate-400 mb-1">Citation</div>
                                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {(paper.citation_score * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-slate-400 mb-1">Recency</div>
                                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {(paper.recency_score * 100).toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </CardBody>

                      <CardFooter className="px-5 py-3 flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={<ExternalLink className="w-4 h-4" />}
                          onClick={() => window.open(paper.url, '_blank')}
                        >
                          View Paper
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeft={
                            savedPapers.has(paper.paper_id) ? (
                              <Star className="w-4 h-4 fill-current text-amber-500" />
                            ) : (
                              <BookmarkPlus className="w-4 h-4" />
                            )
                          }
                          onClick={() => savePaper(paper)}
                          disabled={savedPapers.has(paper.paper_id)}
                          className={
                            savedPapers.has(paper.paper_id)
                              ? 'text-amber-600 dark:text-amber-400'
                              : ''
                          }
                        >
                          {savedPapers.has(paper.paper_id) ? 'Saved' : 'Save'}
                        </Button>

                        {/* Fields of Study */}
                        {paper.fields_of_study && paper.fields_of_study.length > 0 && (
                          <div className="flex-1 flex flex-wrap gap-1.5 justify-end">
                            {paper.fields_of_study.slice(0, 3).map((field, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg text-xs text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : result && result.papers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                No papers found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Try a different search query or adjust your filters.
              </p>
            </motion.div>
          ) : !isLoading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-teal-500 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ready to discover papers
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter a research topic to find relevant papers
              </p>
            </motion.div>
          ) : null}
        </div>

        {/* AI Insights Panel */}
        <AnimatePresence>
          {result && (result.explanation || result.related_topics) && (
            <motion.div
              variants={insightsPanelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="w-96 flex-shrink-0"
            >
              <Card variant="glass" hoverEffect={false} className="sticky top-4">
                <div className="px-5 py-4 border-b border-[#E8E2D080] dark:border-slate-700/50 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/20">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-500" />
                    AI Insights
                  </h3>
                </div>

                <CardBody className="space-y-5 max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {result.explanation && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                        Why these papers?
                      </h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-headings:text-slate-800 dark:prose-headings:text-slate-200">
                        <ReactMarkdown>{result.explanation}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {result.related_topics && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                        Related Topics to Explore
                      </h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300">
                        <ReactMarkdown>{result.related_topics}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
