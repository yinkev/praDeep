'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  Lightbulb,
  Loader2,
  MessageSquare,
  Save,
  Sparkles,
  StopCircle,
  Target,
  Trash2,
  X,
  Zap,
  ChevronDown,
  Clock,
  Database,
  Search,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import AddToNotebookModal from '@/components/AddToNotebookModal'
import { useGlobal } from '@/context/GlobalContext'
import { apiUrl, wsUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import { cn } from '@/lib/utils'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter, CardTitle } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/EmptyState'

interface Notebook {
  id: string
  name: string
  description: string
  record_count: number
  color: string
}

interface NotebookRecord {
  id: string
  title: string
  user_query: string
  output: string
  type: string
}

interface ResearchIdea {
  id: string
  knowledge_point: string
  description: string
  research_ideas: string[]
  statement: string
  expanded: boolean
  selected: boolean
}

interface SelectedRecord extends NotebookRecord {
  notebookId: string
  notebookName: string
}

const getRecordTitle = (record: NotebookRecord) =>
  record.title?.trim() || record.user_query?.trim() || 'Untitled'

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
}

export default function IdeaGenPage() {
  const { ideaGenState, setIdeaGenState } = useGlobal()

  // Notebook selection state
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set())
  const [notebookRecordsMap, setNotebookRecordsMap] = useState<Map<string, NotebookRecord[]>>(
    new Map()
  )
  const [selectedRecords, setSelectedRecords] = useState<Map<string, SelectedRecord>>(new Map())
  const [loadingNotebooks, setLoadingNotebooks] = useState(true)
  const [loadingRecordsFor, setLoadingRecordsFor] = useState<Set<string>>(new Set())

  // User inputs
  const [userThoughts, setUserThoughts] = useState('')
  const [projectGoal, setProjectGoal] = useState('')

  // Modal state
  const [isSourcesOpen, setIsSourcesOpen] = useState(false)

  // Global state for generation
  const isGenerating = ideaGenState.isGenerating
  const generationStatus = ideaGenState.generationStatus
  const generatedIdeas = ideaGenState.generatedIdeas
  const progress = ideaGenState.progress

  const setIsGenerating = (val: boolean) =>
    setIdeaGenState(prev => ({ ...prev, isGenerating: val }))
  const setGenerationStatus = (val: string) =>
    setIdeaGenState(prev => ({ ...prev, generationStatus: val }))
  const setGeneratedIdeas = (
    updater: ResearchIdea[] | ((prev: ResearchIdea[]) => ResearchIdea[])
  ) => {
    setIdeaGenState(prev => ({
      ...prev,
      generatedIdeas: typeof updater === 'function' ? updater(prev.generatedIdeas) : updater,
    }))
  }
  const setProgress = (val: { current: number; total: number } | null) =>
    setIdeaGenState(prev => ({ ...prev, progress: val }))

  // Save modal
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [ideaToSave, setIdeaToSave] = useState<ResearchIdea | null>(null)

  const wsRef = useRef<WebSocket | null>(null)

  const fetchNotebooks = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/notebook/list'))
      const data = await res.json()
      const notebooksWithRecords = (data.notebooks || []).filter(
        (nb: Notebook) => nb.record_count > 0
      )
      setNotebooks(notebooksWithRecords)
    } catch (err) {
      console.error('Failed to fetch notebooks:', err)
    } finally {
      setLoadingNotebooks(false)
    }
  }, [])

  // Load notebooks
  useEffect(() => {
    fetchNotebooks()
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [fetchNotebooks])

  const fetchNotebookRecords = async (notebookId: string) => {
    if (notebookRecordsMap.has(notebookId)) return

    setLoadingRecordsFor(prev => new Set([...prev, notebookId]))
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${notebookId}`))
      const data = await res.json()
      setNotebookRecordsMap(prev => new Map(prev).set(notebookId, data.records || []))
    } catch (err) {
      console.error('Failed to fetch notebook records:', err)
    } finally {
      setLoadingRecordsFor(prev => {
        const next = new Set(prev)
        next.delete(notebookId)
        return next
      })
    }
  }

  const toggleNotebookExpanded = (notebookId: string) => {
    setExpandedNotebooks(prev => {
      const next = new Set(prev)
      if (next.has(notebookId)) {
        next.delete(notebookId)
      } else {
        next.add(notebookId)
        fetchNotebookRecords(notebookId)
      }
      return next
    })
  }

  const toggleRecordSelection = (
    record: NotebookRecord,
    notebookId: string,
    notebookName: string
  ) => {
    setSelectedRecords(prev => {
      const next = new Map(prev)
      if (next.has(record.id)) {
        next.delete(record.id)
      } else {
        next.set(record.id, { ...record, notebookId, notebookName })
      }
      return next
    })
  }

  const clearAllSelections = () => setSelectedRecords(new Map())

  const canGenerate = selectedRecords.size > 0 || userThoughts.trim().length > 0

  const startGeneration = () => {
    if (!canGenerate) return

    setIsGenerating(true)
    setGenerationStatus('Connecting…')
    setGeneratedIdeas([])
    setProgress(null)

    const ws = new WebSocket(wsUrl('/api/v1/ideagen/generate'))
    wsRef.current = ws

    ws.onopen = () => {
      setGenerationStatus('Initializing…')
      const recordsArray = Array.from(selectedRecords.values()).map(r => ({
        id: r.id,
        title: r.title,
        user_query: r.user_query,
        output: r.output,
        type: r.type,
      }))

      ws.send(
        JSON.stringify({
          records: recordsArray.length > 0 ? recordsArray : undefined,
          user_thoughts: userThoughts.trim() || undefined,
          project_goal: projectGoal.trim() || undefined,
        })
      )
    }

    ws.onmessage = event => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'status':
          setGenerationStatus(data.message)
          if (data.stage === 'complete') setIsGenerating(false)
          if (typeof data.data?.index === 'number' && typeof data.data?.total === 'number') {
            setProgress({ current: data.data.index, total: data.data.total })
          }
          break
        case 'progress':
          if (typeof data.data?.index === 'number' && typeof data.data?.total === 'number') {
            setProgress({ current: data.data.index, total: data.data.total })
          }
          break
        case 'idea':
          setGeneratedIdeas(prev => [
            ...prev,
            {
              ...(data.data as Partial<ResearchIdea>),
              expanded: false,
              selected: false,
            } as ResearchIdea,
          ])
          break
        case 'complete':
          setGenerationStatus('Completed!')
          setIsGenerating(false)
          break
        case 'error':
          setGenerationStatus(`Error: ${data.message || data.content || 'Unknown error'}`)
          setIsGenerating(false)
          break
      }
    }

    ws.onerror = () => {
      setGenerationStatus('Connection error')
      setIsGenerating(false)
    }

    ws.onclose = () => {
      wsRef.current = null
    }
  }

  const stopGeneration = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsGenerating(false)
    setProgress(null)
    setGenerationStatus('Stopped')
  }

  const clearPrompt = () => {
    setProjectGoal('')
    setUserThoughts('')
  }

  const clearResults = () => {
    stopGeneration()
    setGeneratedIdeas([])
    setGenerationStatus('')
  }

  const toggleIdeaExpanded = (ideaId: string) => {
    setGeneratedIdeas(prev =>
      prev.map(idea => (idea.id === ideaId ? { ...idea, expanded: !idea.expanded } : idea))
    )
  }

  const toggleIdeaSelected = (ideaId: string) => {
    setGeneratedIdeas(prev =>
      prev.map(idea => (idea.id === ideaId ? { ...idea, selected: !idea.selected } : idea))
    )
  }

  const selectAllIdeas = () =>
    setGeneratedIdeas(prev => prev.map(idea => ({ ...idea, selected: true })))
  const deselectAllIdeas = () =>
    setGeneratedIdeas(prev => prev.map(idea => ({ ...idea, selected: false })))

  const saveIdea = (idea: ResearchIdea) => {
    setIdeaToSave(idea)
    setShowSaveModal(true)
  }

  const saveSelectedIdeas = () => {
    const selected = generatedIdeas.filter(i => i.selected)
    if (selected.length === 0) return

    const combinedIdea: ResearchIdea = {
      id: 'combined',
      knowledge_point: 'Collection of Research Ideas',
      description: `Research ideas containing ${selected.length} knowledge points`,
      research_ideas: selected.flatMap(i => i.research_ideas),
      statement: selected.map(i => i.statement).join('\n\n---\n\n'),
      expanded: false,
      selected: false,
    }

    setIdeaToSave(combinedIdea)
    setShowSaveModal(true)
  }

  const selectedRecordsArray = useMemo(
    () => Array.from(selectedRecords.values()),
    [selectedRecords]
  )
  const selectedIdeasCount = useMemo(
    () => generatedIdeas.filter(i => i.selected).length,
    [generatedIdeas]
  )
  const progressPercent = useMemo(() => {
    if (!progress?.total || progress.total <= 0) return null
    const ratio = clamp01(progress.current / progress.total)
    return Math.round(ratio * 100)
  }, [progress])

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: 'Idea Generator' }]}>
      <PageHeader
        title="Idea Generator"
        description="Generate research directions from notebook sources and structured prompts."
        icon={<Lightbulb className="h-5 w-5 text-accent-primary" />}
        actions={
          <div className="flex items-center gap-3">
             <div className="flex items-center rounded-full border border-border bg-surface-elevated/50 p-1 shadow-glass-sm backdrop-blur-md">
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                   <BookOpen className="h-3 w-3 text-accent-primary" />
                   <span>{selectedRecords.size} SOURCES</span>
                </div>
                <div className="mx-1 h-3 w-px bg-border-subtle" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                   <Zap className="h-3 w-3 text-accent-primary" />
                   <span>{generatedIdeas.length} IDEAS</span>
                </div>
             </div>
             
             {generatedIdeas.length > 0 && (
               <IconButton
                 aria-label="Clear results"
                 icon={<Trash2 size={16} />}
                 variant="ghost"
                 size="sm"
                 onClick={clearResults}
                 className="text-text-tertiary hover:text-error h-9 w-9 rounded-full"
               />
             )}
          </div>
        }
        className="flex-col gap-6 sm:flex-row sm:items-start mb-8"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
        {/* Setup Column */}
        <div className="space-y-6">
           <Card interactive={false} className="border-border bg-surface-base/80 backdrop-blur-md shadow-glass-sm">
              <CardHeader className="p-6 border-b border-border-subtle">
                 <div className="flex items-center justify-between">
                    <div>
                       <CardTitle className="text-sm font-bold uppercase tracking-widest">Configuration</CardTitle>
                       <p className="mt-1 text-[10px] font-mono text-text-tertiary uppercase">Define generation parameters</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSourcesOpen(true)}
                      disabled={isGenerating}
                      className="text-[10px] font-mono uppercase tracking-widest h-8"
                    >
                      <BookOpen size={12} className="mr-2" />
                      Sources
                    </Button>
                 </div>
              </CardHeader>

              <CardBody className="p-6 space-y-6">
                 {/* Sources Preview */}
                 <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">STAGED_CONTEXT</div>
                    <AnimatePresence mode="popLayout">
                       {selectedRecords.size === 0 ? (
                         <motion.div 
                           initial={{ opacity: 0 }} 
                           animate={{ opacity: 1 }} 
                           className="rounded-xl border border-dashed border-border p-4 text-center"
                         >
                            <p className="text-[10px] font-mono text-text-quaternary uppercase tracking-tight">No sources selected. Generation will be prompt-only.</p>
                         </motion.div>
                       ) : (
                         <motion.div layout className="flex flex-wrap gap-2">
                            {selectedRecordsArray.map((r, idx) => (
                              <motion.div
                                key={r.id}
                                layout
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated pl-1.5 pr-2.5 py-1 transition-all hover:border-accent-primary/20"
                              >
                                 <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                                 <span className="text-[10px] font-bold uppercase tracking-tight text-text-primary truncate max-w-[120px]">{getRecordTitle(r)}</span>
                                 <button onClick={() => setSelectedRecords(prev => { const n = new Map(prev); n.delete(r.id); return n; })} className="text-text-tertiary hover:text-error">
                                    <X size={10} />
                                 </button>
                              </motion.div>
                            ))}
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label htmlFor="goal" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">PROJECT_OBJECTIVE</label>
                       <Input
                         id="goal"
                         placeholder="e.g. Publishable novelty..."
                         value={projectGoal}
                         onChange={e => setProjectGoal(e.target.value)}
                         disabled={isGenerating}
                         className="bg-surface-secondary/40 border-border text-xs font-bold uppercase tracking-tight"
                       />
                    </div>

                    <div className="space-y-2">
                       <label htmlFor="thoughts" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">CREATIVE_PROMPT</label>
                       <Textarea
                         id="thoughts"
                         placeholder="Describe specific themes or constraints..."
                         minRows={5}
                         value={userThoughts}
                         onChange={e => setUserThoughts(e.target.value)}
                         disabled={isGenerating}
                         className="bg-surface-secondary/40 border-border text-xs font-bold uppercase tracking-tight p-4"
                       />
                    </div>
                 </div>

                 {/* Progress Indicator */}
                 <AnimatePresence>
                   {(isGenerating || (generationStatus && !isGenerating)) && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                     >
                        <div className="rounded-2xl border border-accent-primary/20 bg-accent-primary/5 p-4 space-y-4">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 {isGenerating ? <Loader2 className="h-4 w-4 animate-spin text-accent-primary" /> : <Check className="h-4 w-4 text-success" />}
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">{generationStatus}</span>
                              </div>
                               {isGenerating && (
                                 <button 
                                   type="button"
                                   onClick={stopGeneration} 
                                   className="text-[10px] font-mono font-bold text-error uppercase hover:underline"
                                 >
                                   ABORT
                                 </button>
                               )}

                           </div>
                           {progressPercent !== null && (
                             <div className="space-y-2">
                                <div className="flex items-center justify-between text-[9px] font-mono text-text-tertiary uppercase">
                                   <span>PROGRESS</span>
                                   <span>{progressPercent}% ({progress?.current}/{progress?.total})</span>
                                </div>
                                <Progress value={progressPercent} className="h-1" />
                             </div>
                           )}
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </CardBody>

              <CardFooter className="p-6 pt-0">
                 <Button
                   variant="primary"
                   size="lg"
                   className="w-full h-14 text-base font-bold uppercase tracking-[0.2em] shadow-xl"
                   iconLeft={<Sparkles size={20} />}
                   onClick={startGeneration}
                   disabled={!canGenerate || isGenerating}
                   loading={isGenerating}
                 >
                   Execute_Gen
                 </Button>
              </CardFooter>
           </Card>
        </div>

        {/* Results Column */}
        <div className="space-y-6">
           <AnimatePresence mode="wait">
              {generatedIdeas.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                   <EmptyState 
                     icon={<Brain size={32} />} 
                     title="Generator Idle" 
                     description="Initialize sources and prompt to begin mapping research topologies." 
                   />
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                   <div className="flex items-center justify-between px-2 mb-6">
                      <div>
                         <h2 className="text-lg font-bold uppercase tracking-tight text-text-primary">Generated_Outputs</h2>
                         <p className="text-[10px] font-mono text-text-tertiary uppercase">{generatedIdeas.length} CONCEPT_MAPS_STABLE</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" onClick={selectAllIdeas} className="text-[10px] font-mono uppercase tracking-widest">Select All</Button>
                         <Button variant="secondary" size="sm" onClick={saveSelectedIdeas} disabled={selectedIdeasCount === 0} iconLeft={<Save size={14} />} className="text-[10px] font-mono uppercase tracking-widest h-9">Batch Save</Button>
                      </div>
                   </div>

                   {generatedIdeas.map((idea, idx) => (
                     <motion.div key={idea.id} variants={fadeInUp}>
                        <Card 
                          interactive={true} 
                          className={cn(
                            "group border-border bg-surface-base transition-all duration-300",
                            idea.selected && "border-accent-primary/40 ring-1 ring-accent-primary/10 shadow-glass-sm bg-surface-secondary/30"
                          )}
                        >
                           <div className="p-6">
                              <div className="flex items-start justify-between gap-6">
                                 <div className="flex items-start gap-4 min-w-0 flex-1">
                                 <button 
                                   type="button"
                                   onClick={() => toggleIdeaSelected(idea.id)}
                                   className={cn(
                                     "mt-0.5 h-8 w-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all",
                                     idea.selected ? "bg-accent-primary border-accent-primary text-white shadow-lg" : "border-border bg-surface-elevated text-text-tertiary hover:border-accent-primary/40"
                                   )}
                                 >

                                       {idea.selected ? <Check size={16} /> : <Zap size={16} />}
                                    </button>
                                    <div className="min-w-0">
                                       <div className="flex flex-wrap items-center gap-3 mb-2">
                                          <h3 className="text-base font-bold text-text-primary uppercase tracking-tight truncate">{idea.knowledge_point}</h3>
                                          <Badge variant="outline" className="font-mono text-[9px] border-border-subtle bg-surface-secondary/40">{idea.research_ideas.length} SUBS</Badge>
                                       </div>
                                       <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 italic opacity-80">"{idea.description}"</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-1">
                                    <IconButton 
                                      aria-label="Save idea"
                                      icon={<Save size={16} />} 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => saveIdea(idea)} 
                                      className="text-text-tertiary hover:text-accent-primary" 
                                    />
                                    <IconButton 
                                      aria-label={idea.expanded ? "Collapse idea" : "Expand idea"}
                                      icon={<ChevronDown size={18} className={cn("transition-transform duration-300", idea.expanded && "rotate-180")} />} 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => toggleIdeaExpanded(idea.id)} 
                                      className="text-text-tertiary"
                                    />
                                 </div>
                              </div>

                              <AnimatePresence>
                                 {idea.expanded && (
                                   <motion.div
                                     initial={{ height: 0, opacity: 0 }}
                                     animate={{ height: 'auto', opacity: 1 }}
                                     exit={{ height: 0, opacity: 0 }}
                                     className="overflow-hidden"
                                   >
                                      <div className="mt-8 pt-8 border-t border-border-subtle space-y-8">
                                         <article className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                               {processLatexContent(idea.statement)}
                                            </ReactMarkdown>
                                         </article>

                                         <div className="space-y-3">
                                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Sub_Hypotheses</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                               {idea.research_ideas.map((ri, i) => (
                                                 <div key={i} className="p-4 rounded-xl border border-border bg-surface-secondary/20 flex items-start gap-3 transition-colors hover:border-accent-primary/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0 mt-1.5" />
                                                    <p className="text-xs text-text-secondary leading-relaxed">{ri}</p>
                                                 </div>
                                               ))}
                                            </div>
                                         </div>
                                      </div>
                                   </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        </Card>
                     </motion.div>
                   ))}
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

      <Modal isOpen={isSourcesOpen} onClose={() => setIsSourcesOpen(false)} title="SOURCE_CATALOG" size="lg">
         <ModalBody className="p-0">
            <div className="flex h-[500px]">
               {/* Notebook Sidebar */}
               <aside className="w-48 border-r border-border bg-surface-secondary/20 overflow-y-auto p-4 space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-quaternary mb-4 px-2">Collections</div>
                   {notebooks.map(nb => (
                     <button 
                       key={nb.id}
                       type="button"
                       onClick={() => toggleNotebookExpanded(nb.id)}

                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all border mb-1 group",
                        expandedNotebooks.has(nb.id) ? "bg-surface-base border-border shadow-sm" : "border-transparent hover:bg-surface-base/50"
                      )}
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nb.color }} />
                          <div className="min-w-0 flex-1">
                             <div className="text-[11px] font-bold uppercase truncate text-text-primary">{nb.name}</div>
                             <div className="text-[9px] font-mono text-text-tertiary">{nb.record_count} RECS</div>
                          </div>
                       </div>
                    </button>
                  ))}
               </aside>

               {/* Records List */}
               <main className="flex-1 overflow-y-auto p-6 bg-surface-base">
                  {expandedNotebooks.size === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                       <Search size={48} className="mb-4" />
                       <p className="text-xs font-mono uppercase tracking-widest">Select a collection</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                       {Array.from(expandedNotebooks).map(nbId => {
                         const nb = notebooks.find(n => n.id === nbId)
                         const records = notebookRecordsMap.get(nbId) || []
                         const isLoading = loadingRecordsFor.has(nbId)
                         
                         return (
                           <div key={nbId} className="space-y-3">
                              <div className="flex items-center justify-between border-b border-border pb-2">
                                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{nb?.name}</h4>
                                 <Button variant="ghost" size="sm" onClick={() => {
                                   const next = new Map(selectedRecords);
                                   records.forEach(r => {
                                     next.set(r.id, { ...r, notebookId: nbId, notebookName: nb?.name || '' });
                                   });
                                   setSelectedRecords(next);
                                 }} className="text-[9px] font-bold h-6">All</Button>
                              </div>
                              {isLoading ? (
                                <div className="py-8 flex justify-center"><Loader2 size={16} className="animate-spin opacity-40" /></div>
                              ) : (
                                <div className="grid grid-cols-1 gap-2">
                                   {records.map((r, rIdx) => (
                                     <button 
                                       key={`${nbId}-record-${rIdx}`} 
                                       type="button"
                                       onClick={() => toggleRecordSelection(r, nbId, nb?.name || '')}
                                       className={cn(
                                         "text-left p-3 rounded-xl border transition-all flex items-center justify-between group",
                                         selectedRecords.has(r.id) ? "bg-accent-primary/5 border-accent-primary/30" : "bg-surface-secondary/40 border-transparent hover:bg-surface-secondary/60 hover:border-border"
                                       )}
                                     >
                                        <div className="min-w-0 flex-1 flex items-center gap-3">
                                           <div className={cn("w-2 h-2 rounded-full transition-transform", selectedRecords.has(r.id) ? "bg-accent-primary scale-125" : "bg-text-quaternary group-hover:bg-text-tertiary")} />
                                           <span className="text-xs font-medium text-text-primary truncate">{getRecordTitle(r)}</span>
                                        </div>
                                        {selectedRecords.has(r.id) && <Check size={12} className="text-accent-primary shrink-0" />}
                                     </button>
                                   ))}
                                </div>
                              )}
                           </div>
                         )
                       })}
                    </div>
                  )}
               </main>
            </div>
         </ModalBody>
         <ModalFooter className="p-4 bg-surface-secondary/30 border-t border-border">
            <div className="flex-1 text-[10px] font-mono text-text-tertiary uppercase">Selection: <span className="text-accent-primary font-bold">{selectedRecords.size} OBJECTS</span></div>
            <Button variant="primary" onClick={() => setIsSourcesOpen(false)} className="px-8 uppercase font-bold tracking-widest text-[10px] h-9">Commit Selection</Button>
         </ModalFooter>
      </Modal>

      {ideaToSave && (
        <AddToNotebookModal
          isOpen={showSaveModal}
          onClose={() => { setShowSaveModal(false); setIdeaToSave(null); }}
          recordType="research"
          title={ideaToSave.knowledge_point}
          userQuery={userThoughts || projectGoal || 'Generated Ideas'}
          output={ideaToSave.statement}
          metadata={{ research_ideas: ideaToSave.research_ideas }}
        />
      )}
    </PageWrapper>
  )
}
