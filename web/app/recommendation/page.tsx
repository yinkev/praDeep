'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  FileText,
  Clock,
  Layers,
  Database,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { apiUrl, wsUrl } from '@/lib/api'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

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

      if (!response.ok) throw new Error('Failed to fetch recommendations')
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
          setProgress(data.status === 'started' ? `${data.stage}: Starting…` : `${data.stage}: ${data.status}`)
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
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: 'Paper Recommendations' }]}>
      <PageHeader
        title="Scholar Recon"
        description="High-signal academic retrieval ranked by semantic similarity and citation density."
        icon={<BookOpen className="h-5 w-5 text-accent-primary" />}
        className="mb-8"
        actions={
          (result || error || progress) && (
            <Button variant="ghost" size="sm" onClick={clearResults} className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary hover:text-accent-primary">
              <X size={12} className="mr-2" />
              Clear Results
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
         {/* Controls Column */}
         <aside className="space-y-6">
            <Card interactive={false} className="border-border bg-surface-base/80 backdrop-blur-md shadow-glass-sm">
               <CardHeader className="p-6 border-b border-border-subtle">
                  <div className="flex items-center justify-between">
                     <div className="text-sm font-bold uppercase tracking-widest">Query Parameters</div>
                     {hasActiveFilters && (
                       <IconButton 
                         aria-label="Reset filters"
                         icon={<RefreshCw size={14} />} 
                         size="sm" 
                         variant="ghost" 
                         onClick={resetFilters} 
                         className="text-text-tertiary" 
                       />
                     )}

                  </div>
               </CardHeader>
               <CardBody className="p-6 space-y-6">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label htmlFor="p-query" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Research_Topic</label>
                        <div className="relative">
                           <Input 
                             id="p-query"
                             placeholder="Search papers or concepts..." 
                             value={query} 
                             onChange={e => setQuery(e.target.value)} 
                             className="h-12 bg-surface-secondary/40 border-border text-xs font-bold uppercase pr-10"
                             onKeyDown={e => e.key === 'Enter' && searchPapers()}
                           />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-quaternary">
                              <Search size={16} />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label htmlFor="ranking-logic" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Ranking_Logic</label>
                        <select
                          id="ranking-logic"
                          value={recommendationType}
                          onChange={e => setRecommendationType(e.target.value as RecommendationType)}
                          className="w-full h-10 rounded-xl border border-border bg-surface-secondary/40 px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-accent-primary/40"
                        >
                           <option value="hybrid">Hybrid (Meta-Rank)</option>
                           <option value="semantic">Semantic Similarity</option>
                           <option value="citation">Citation Density</option>
                        </select>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                           <label htmlFor="start-year" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Start_Year</label>
                           <Input id="start-year" type="number" placeholder="2018" value={yearStart ?? ''} onChange={e => setYearStart(e.target.value ? parseInt(e.target.value) : undefined)} className="text-center font-mono" />
                        </div>
                        <div className="space-y-2">
                           <label htmlFor="end-year" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">End_Year</label>
                           <Input id="end-year" type="number" placeholder="2025" value={yearEnd ?? ''} onChange={e => setYearEnd(e.target.value ? parseInt(e.target.value) : undefined)} className="text-center font-mono" />
                        </div>
                     </div>

                     <div className="space-y-3 pt-2">
                        {[
                          { label: 'AI_EXPLANATION', val: generateExplanation, set: setGenerateExplanation },
                          { label: 'SUGGEST_TOPICS', val: suggestTopics, set: setSuggestTopics }
                        ].map(toggle => (
                          <label key={toggle.label} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-secondary/20 cursor-pointer hover:bg-surface-secondary/40 transition-colors">
                             <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{toggle.label}</span>
                             <input 
                               type="checkbox" 
                               checked={toggle.val} 
                               onChange={e => toggle.set(e.target.checked)} 
                               className="w-4 h-4 rounded border-border accent-accent-primary" 
                             />
                          </label>
                        ))}
                     </div>
                  </div>

                  <AnimatePresence>
                     {progress && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="rounded-2xl border border-accent-primary/20 bg-accent-primary/5 p-4 flex items-center gap-3">
                             <RefreshCw size={14} className="animate-spin text-accent-primary" />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary truncate">{progress}</span>
                          </div>
                       </motion.div>
                     )}
                  </AnimatePresence>
               </CardBody>
               <CardFooter className="p-6 pt-0">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="w-full h-12 text-sm font-bold uppercase tracking-[0.15em] shadow-xl" 
                    iconLeft={<Sparkles size={18} />}
                    onClick={searchPapers}
                    loading={isLoading}
                    disabled={!query.trim()}
                  >
                    Execute Recon
                  </Button>
               </CardFooter>
            </Card>
         </aside>

         {/* Results Column */}
         <div className="space-y-6">
            {!result && !isLoading && !error ? (
              <EmptyState 
                icon={<Database size={32} />} 
                title="Scholar Archive Idle" 
                description="Input a research vector to retrieve and rank relevant literature." 
              />
            ) : error ? (
              <Card interactive={false} className="border-error/20 bg-error-muted/5 p-8 text-center">
                 <X size={32} className="mx-auto mb-4 text-error opacity-40" />
                 <h3 className="text-sm font-bold uppercase tracking-widest text-error mb-1">RECON_FAILURE</h3>
                 <p className="text-xs font-mono text-text-tertiary uppercase">{error}</p>
                 <Button variant="outline" size="sm" onClick={searchPapers} className="mt-6 font-mono text-[10px] uppercase h-8 border-error/20 hover:bg-error-muted/10">Retry_Sync</Button>
              </Card>
            ) : (
              <div className="space-y-6">
                 {result?.explanation && (
                   <Card interactive={false} className="border-accent-primary/20 bg-accent-primary/5 p-6">
                      <div className="flex items-start gap-4">
                         <Sparkles size={18} className="text-accent-primary shrink-0 mt-1" />
                         <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-primary">AI_SYNTHESIS_REPORT</span>
                            <p className="text-sm text-text-primary leading-relaxed">{result.explanation}</p>
                         </div>
                      </div>
                   </Card>
                 )}

                 <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <div>
                          <h2 className="text-lg font-bold uppercase tracking-tight text-text-primary">Ranked_Citations</h2>
                          <p className="text-[10px] font-mono text-text-tertiary uppercase">Found {result?.total_candidates} candidates :: Top {papers.length} mapped</p>
                       </div>
                    </div>

                    {papers.map((paper, idx) => {
                      const isExpanded = expandedPapers.has(paper.paper_id)
                      const isSaved = savedPapers.has(paper.paper_id)
                      const score = Math.round(paper.combined_score * 100)
                      
                      return (
                        <motion.div key={paper.paper_id} variants={fadeInUp}>
                           <Card className={cn("group border-border bg-surface-base transition-all duration-300", isExpanded && "ring-1 ring-accent-primary/10 shadow-glass-sm")}>
                              <div className="p-6">
                                 <div className="flex items-start gap-6">
                                    <div className="flex flex-col items-center gap-2 pt-1 shrink-0">
                                       <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-xs font-bold text-text-primary shadow-sm group-hover:border-accent-primary/30 transition-colors">
                                          {idx + 1}
                                       </div>
                                       <div className="text-[10px] font-mono font-bold text-accent-primary">{score}%</div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="text-[8px] font-mono border-border-subtle bg-surface-elevated uppercase">{paper.source.replace('_', ' ')}</Badge>
                                          {paper.year && <span className="text-[10px] font-mono text-text-tertiary">{paper.year}</span>}
                                          {paper.citation_count !== undefined && (
                                            <span className="text-[10px] font-mono text-text-tertiary border-l border-border-subtle pl-2 flex items-center gap-1">
                                               <Layers size={10} /> {paper.citation_count} CIT
                                            </span>
                                          )}
                                       </div>

                                       <h3 
                                         onClick={() => window.open(paper.url, '_blank')}
                                         className="text-base font-bold text-text-primary uppercase tracking-tight hover:text-accent-primary cursor-pointer transition-colors line-clamp-2"
                                       >
                                         {paper.title}
                                       </h3>
                                       <p className="mt-2 text-[10px] font-mono text-text-tertiary uppercase tracking-tight truncate">{paper.authors.join(' · ')}</p>
                                       
                                        <div className="mt-4 flex items-center gap-4">
                                           <Button variant="ghost" size="sm" iconLeft={<FileText size={14} />} onClick={() => togglePaperExpand(paper.paper_id)} className="text-[10px] font-mono uppercase tracking-widest text-text-secondary h-8 px-2">Abstract</Button>
                                           <Button variant="ghost" size="sm" iconLeft={<ExternalLink size={14} />} onClick={() => window.open(paper.url, '_blank')} className="text-[10px] font-mono uppercase tracking-widest text-text-secondary h-8 px-2">External</Button>
                                           <div className="ml-auto">
                                             <IconButton 
                                               aria-label={isSaved ? "Saved" : "Save paper"}
                                               icon={isSaved ? <Check size={16} /> : <BookmarkPlus size={16} />} 
                                               variant={isSaved ? "secondary" : "ghost"} 
                                               size="sm" 
                                               onClick={() => savePaper(paper)}
                                               disabled={isSaved}
                                               className={cn("rounded-full", isSaved ? "text-success border-success/20 bg-success-muted/10" : "text-text-tertiary hover:text-accent-primary")}
                                             />
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                         <div className="mt-6 pt-6 border-t border-border-subtle space-y-6">
                                            <div className="space-y-2">
                                               <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent-primary">SYNTHESIS_REASON</span>
                                               <p className="text-xs text-text-primary leading-relaxed italic">{paper.recommendation_reason}</p>
                                            </div>
                                            <div className="space-y-2">
                                               <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-tertiary">ABSTRACT_RAW</span>
                                               <p className="text-sm text-text-secondary leading-relaxed">{paper.abstract}</p>
                                            </div>
                                            {paper.fields_of_study && paper.fields_of_study.length > 0 && (
                                              <div className="flex flex-wrap gap-2">
                                                 {paper.fields_of_study.map(f => (
                                                   <Badge key={f} variant="secondary" className="text-[8px] uppercase tracking-widest bg-surface-secondary border-border-subtle">{f}</Badge>
                                                 ))}
                                              </div>
                                            )}
                                         </div>
                                      </motion.div>
                                    )}
                                 </AnimatePresence>
                              </div>
                           </Card>
                        </motion.div>
                      )
                    })}
                 </motion.div>
              </div>
            )}
         </div>
      </div>
    </PageWrapper>
  )
}
