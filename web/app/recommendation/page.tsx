'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  BookOpen,
  ExternalLink,
  Loader2,
  Filter,
  Calendar,
  Star,
  Quote,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useGlobal } from '@/context/GlobalContext'
import { apiUrl, wsUrl } from '@/lib/api'

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

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'arxiv':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'semantic_scholar':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'openalex':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatAuthors = (authors: string[], max: number = 3) => {
    if (authors.length <= max) return authors.join(', ')
    return `${authors.slice(0, max).join(', ')} et al.`
  }

  return (
    <div className="h-screen flex flex-col p-4 animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          Paper Recommendations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          ML-based paper recommendations using citation networks, semantic similarity, and your
          reading history
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchPapers()}
              placeholder="Enter research topic, keywords, or paper title..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border transition-all ${
              showFilters
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={searchPapers}
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Find Papers
              </>
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Recommendation Type
              </label>
              <select
                value={recommendationType}
                onChange={e => setRecommendationType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
              >
                <option value="hybrid">Hybrid (Recommended)</option>
                <option value="semantic">Semantic Similarity</option>
                <option value="citation">Citation-based</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="To"
                  value={yearEnd || ''}
                  onChange={e => setYearEnd(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Max Results
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxResults}
                onChange={e => setMaxResults(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={generateExplanation}
                  onChange={e => setGenerateExplanation(e.target.checked)}
                  className="rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">AI Explanation</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={suggestTopics}
                  onChange={e => setSuggestTopics(e.target.checked)}
                  className="rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">Suggest Topics</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {progress && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 mb-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <span className="text-sm text-indigo-700 dark:text-indigo-300">{progress}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 mb-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-hidden flex gap-4">
        {/* Papers list */}
        <div className="flex-1 overflow-y-auto">
          {result && result.papers.length > 0 ? (
            <div className="space-y-4">
              {/* Stats bar */}
              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 px-2">
                <span>
                  Found {result.papers.length} of {result.total_candidates} candidates
                </span>
                <span>Processed in {result.processing_time_ms.toFixed(0)}ms</span>
              </div>

              {/* Paper cards */}
              {result.papers.map((paper, index) => (
                <div
                  key={paper.paper_id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            #{index + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getSourceBadgeColor(
                              paper.source
                            )}`}
                          >
                            {paper.source === 'semantic_scholar'
                              ? 'Semantic Scholar'
                              : paper.source === 'openalex'
                                ? 'OpenAlex'
                                : 'arXiv'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {paper.year}
                          </span>
                          {paper.citation_count !== undefined && paper.citation_count !== null && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Quote className="w-3 h-3" />
                              {paper.citation_count} citations
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {paper.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {formatAuthors(paper.authors)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {(paper.combined_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-400">Match</div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation reason */}
                    <div className="mt-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-indigo-700 dark:text-indigo-300">
                      {paper.recommendation_reason}
                    </div>

                    {/* Expandable abstract */}
                    <div className="mt-3">
                      <button
                        onClick={() => togglePaperExpand(paper.paper_id)}
                        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        {expandedPapers.has(paper.paper_id) ? (
                          <>
                            <ChevronUp className="w-4 h-4" /> Hide abstract
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" /> Show abstract
                          </>
                        )}
                      </button>
                      {expandedPapers.has(paper.paper_id) && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {paper.abstract || 'No abstract available.'}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3">
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        <ExternalLink className="w-4 h-4" /> View Paper
                      </a>
                      <button
                        onClick={() => savePaper(paper)}
                        disabled={savedPapers.has(paper.paper_id)}
                        className={`flex items-center gap-1 text-sm ${
                          savedPapers.has(paper.paper_id)
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {savedPapers.has(paper.paper_id) ? (
                          <>
                            <Star className="w-4 h-4 fill-current" /> Saved
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-4 h-4" /> Save
                          </>
                        )}
                      </button>
                      {paper.fields_of_study && paper.fields_of_study.length > 0 && (
                        <div className="flex-1 flex flex-wrap gap-1 justify-end">
                          {paper.fields_of_study.slice(0, 3).map((field, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-500 dark:text-slate-400"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score breakdown */}
                    {expandedPapers.has(paper.paper_id) && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Semantic</div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {(paper.similarity_score * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Citation</div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {(paper.citation_score * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-1">Recency</div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {(paper.recency_score * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : result && result.papers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <BookOpen className="w-16 h-16 mb-4 opacity-50" />
              <p>No papers found. Try a different search query.</p>
            </div>
          ) : !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p>Enter a research topic to find relevant papers</p>
            </div>
          ) : null}
        </div>

        {/* Explanation panel */}
        {result && (result.explanation || result.related_topics) && (
          <div className="w-96 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                AI Insights
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {result.explanation && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Why these papers?
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{result.explanation}</ReactMarkdown>
                  </div>
                </div>
              )}
              {result.related_topics && (
                <div>
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Related Topics to Explore
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{result.related_topics}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
