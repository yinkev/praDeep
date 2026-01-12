'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
import Button, { IconButton } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal'

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Component
// ============================================================================

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
    const notebook = notebooks.find(nb => nb.id === notebookId)
    if (!notebook) return

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

  const selectAllFromNotebook = (notebookId: string, notebookName: string) => {
    const records = notebookRecordsMap.get(notebookId) || []
    setSelectedRecords(prev => {
      const next = new Map(prev)
      records.forEach(r => next.set(r.id, { ...r, notebookId, notebookName }))
      return next
    })
  }

  const deselectAllFromNotebook = (notebookId: string) => {
    const records = notebookRecordsMap.get(notebookId) || []
    const recordIds = new Set(records.map(r => r.id))
    setSelectedRecords(prev => {
      const next = new Map(prev)
      recordIds.forEach(id => next.delete(id))
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solve':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50'
      case 'question':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50'
      case 'research':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
      case 'co_writer':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-white/10'
    }
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
    <div className="relative min-h-dvh overflow-hidden bg-cloud dark:bg-zinc-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_72%)] bg-[linear-gradient(to_right,rgba(24,24,27,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.07)_1px,transparent_1px)] bg-[length:56px_56px] dark:opacity-20 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/15"
        animate={{ y: [0, 18, 0], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 left-8 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10"
        animate={{ y: [0, -12, 0], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <PageWrapper maxWidth="full" showPattern={false} className="min-h-dvh px-0 py-0">
        <main className="relative mx-auto max-w-6xl px-6 py-10">
          <PageHeader
            title={
              <span className="tracking-[-0.03em]">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">Idea</span>{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-fuchsia-400">
                  Generator
                </span>
              </span>
            }
            description="Generate research ideas from notebook sources and/or a prompt."
            icon={<Lightbulb className="h-5 w-5 text-blue-600" />}
            actions={
              <div className="hidden sm:flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  {selectedRecords.size} source{selectedRecords.size === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  {generatedIdeas.length} idea{generatedIdeas.length === 1 ? '' : 's'}
                </span>
                {generatedIdeas.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearResults}
                    iconLeft={<Trash2 className="h-4 w-4" />}
                  >
                    Clear
                  </Button>
                )}
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            {/* Setup */}
            <section className="space-y-6">
              <Card
                variant="glass"
                padding="lg"
                interactive={false}
                className="relative overflow-hidden border-white/55 dark:border-white/10"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]"
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Generate
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Ground ideas with sources, then add an optional prompt for direction.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSourcesOpen(true)}
                        disabled={isGenerating}
                        className="dark:text-zinc-100 dark:border-white/20 dark:hover:bg-white/10 dark:active:bg-white/10"
                        iconLeft={<BookOpen className="h-4 w-4" />}
                      >
                        Sources
                      </Button>
                      {selectedRecords.size > 0 && (
                        <IconButton
                          aria-label="Clear selected sources"
                          size="sm"
                          variant="ghost"
                          onClick={clearAllSelections}
                          icon={<X className="h-4 w-4" />}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <motion.div
                      className="rounded-2xl border border-white/55 bg-white/60 px-4 py-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 transition-all duration-300"
                      animate={{
                        borderColor:
                          selectedRecords.size > 0 ? 'rgba(59, 130, 246, 0.3)' : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Sources
                          </div>
                          <motion.div
                            className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50"
                            key={selectedRecords.size}
                            initial={{ opacity: 0, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {selectedRecords.size === 0
                              ? 'Optional context'
                              : `${selectedRecords.size} record${selectedRecords.size === 1 ? '' : 's'} selected`}
                          </motion.div>
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {selectedRecords.size === 0
                              ? 'Pick notebook records to ground IdeaGen (recommended).'
                              : 'These will be sent as context to the generator.'}
                          </div>
                        </div>
                        <motion.div
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                          animate={{
                            scale: selectedRecords.size > 0 ? [1, 1.1, 1] : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <BookOpen className="h-4 w-4" />
                        </motion.div>
                      </div>

                      <AnimatePresence mode="wait">
                        {selectedRecords.size > 0 && (
                          <motion.div
                            className="mt-3 flex flex-wrap gap-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {selectedRecordsArray.slice(0, 4).map((r, idx) => (
                              <motion.span
                                key={r.id}
                                className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200/70 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-xs backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 hover:shadow-md hover:scale-105 transition-all duration-200"
                                title={`${r.notebookName}: ${getRecordTitle(r)}`}
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                              >
                                <motion.span
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      notebooks.find(nb => nb.id === r.notebookId)?.color ||
                                      '#94a3b8',
                                  }}
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                                />
                                <span className="truncate">{getRecordTitle(r)}</span>
                              </motion.span>
                            ))}
                            {selectedRecordsArray.length > 4 && (
                              <motion.span
                                className="inline-flex items-center px-1 py-1 text-xs text-zinc-500 dark:text-zinc-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                              >
                                +{selectedRecordsArray.length - 4} more
                              </motion.span>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <Textarea
                      label="Prompt (optional)"
                      floatingLabel
                      minRows={6}
                      value={userThoughts}
                      onChange={e => setUserThoughts(e.target.value)}
                      disabled={isGenerating}
                      placeholder="Describe what you want to explore…"
                      leftIcon={<MessageSquare className="h-4 w-4" />}
                      wrapperClassName="text-sm"
                    />

                    <Input
                      label="Project goal (optional)"
                      floatingLabel
                      value={projectGoal}
                      onChange={e => setProjectGoal(e.target.value)}
                      disabled={isGenerating}
                      placeholder="e.g. Identify publishable research questions"
                      leftIcon={<Target className="h-4 w-4" />}
                    />

                    <AnimatePresence mode="wait">
                      {(isGenerating || generationStatus) && (
                        <motion.div
                          className="rounded-2xl border border-white/55 bg-white/60 px-4 py-3 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={isGenerating ? { rotate: 360 } : {}}
                              transition={
                                isGenerating
                                  ? { duration: 1, repeat: Infinity, ease: 'linear' }
                                  : {}
                              }
                            >
                              {isGenerating ? (
                                <Loader2 className="h-4 w-4 text-blue-600" />
                              ) : (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                >
                                  <Check className="h-4 w-4 text-blue-600" />
                                </motion.div>
                              )}
                            </motion.div>
                            <div className="min-w-0 flex-1">
                              <motion.div
                                className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
                                key={generationStatus}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {generationStatus || (isGenerating ? 'Working…' : 'Ready')}
                              </motion.div>
                              <AnimatePresence mode="wait">
                                {progress && (
                                  <motion.div
                                    className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    Step {progress.current} / {progress.total}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <AnimatePresence>
                              {isGenerating && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={stopGeneration}
                                    iconLeft={<StopCircle className="h-4 w-4" />}
                                  >
                                    Stop
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <AnimatePresence mode="wait">
                            {progress && progressPercent !== null && (
                              <motion.div
                                className="mt-3"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              >
                                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                                  <motion.span
                                    key={progressPercent}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {progressPercent}%
                                  </motion.span>
                                  <span>
                                    {Math.max(0, Math.min(progress.current, progress.total))}/
                                    {progress.total}
                                  </span>
                                </div>
                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-200/70 dark:bg-white/10 overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 shadow-sm shadow-blue-500/50"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={startGeneration}
                      loading={isGenerating}
                      disabled={!canGenerate || isGenerating}
                      iconRight={<Sparkles className="h-5 w-5" />}
                    >
                      Generate ideas
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={clearPrompt}
                      disabled={isGenerating || (!userThoughts.trim() && !projectGoal.trim())}
                      className="dark:text-zinc-100 dark:border-white/20 dark:hover:bg-white/10 dark:active:bg-white/10"
                    >
                      Clear inputs
                    </Button>
                  </div>

                  {!canGenerate && (
                    <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                      Add a prompt or select at least one source to enable generation.
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* Results */}
            <section className="min-w-0">
              <Card
                variant="glass"
                padding="none"
                interactive={false}
                className="relative overflow-hidden border-white/55 dark:border-white/10"
              >
                <CardHeader
                  padding="md"
                  className="flex-row items-start justify-between gap-4 bg-white/40 backdrop-blur-md dark:bg-white/5"
                >
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Ideas
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {generatedIdeas.length === 0
                        ? 'Generated ideas will appear here.'
                        : `${generatedIdeas.length} generated • ${selectedIdeasCount} selected`}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {generatedIdeas.length > 0 && (
                      <>
                        <Button variant="ghost" size="sm" onClick={selectAllIdeas}>
                          Select all
                        </Button>
                        <Button variant="ghost" size="sm" onClick={deselectAllIdeas}>
                          Clear selection
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={saveSelectedIdeas}
                          disabled={selectedIdeasCount === 0}
                          iconLeft={<Save className="h-4 w-4" />}
                        >
                          Save selected
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearResults}
                          iconLeft={<Trash2 className="h-4 w-4" />}
                        >
                          Clear
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardBody padding="lg" className="min-h-[520px]">
                  {generatedIdeas.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/70 shadow-sm ring-1 ring-white/60 dark:bg-white/10 dark:ring-white/10">
                        {isGenerating ? (
                          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        ) : (
                          <Brain className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
                        )}
                      </div>
                      <p className="mt-5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        {isGenerating ? 'Generating ideas…' : 'Ready when you are'}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                        {isGenerating
                          ? generationStatus || 'This usually takes a moment.'
                          : 'Select sources and/or add a prompt, then press “Generate ideas”.'}
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 gap-4 md:grid-cols-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <AnimatePresence mode="popLayout">
                        {generatedIdeas.map(idea => (
                          <motion.div
                            key={idea.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <Card
                              variant="glass"
                              padding="none"
                              interactive
                              className={cn(
                                'overflow-hidden border-white/55 dark:border-white/10',
                                idea.selected && 'ring-2 ring-blue-500/20 border-blue-200/70'
                              )}
                            >
                              <CardHeader
                                padding="sm"
                                className="flex-row items-start justify-between gap-4"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <motion.button
                                    type="button"
                                    onClick={() => toggleIdeaSelected(idea.id)}
                                    className={cn(
                                      'mt-0.5 h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
                                      idea.selected
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'border-zinc-300 dark:border-white/20 hover:border-blue-400 dark:hover:border-blue-400 hover:shadow-md hover:scale-110'
                                    )}
                                    aria-pressed={idea.selected}
                                    aria-label={idea.selected ? 'Deselect idea' : 'Select idea'}
                                    whileTap={{ scale: 0.9 }}
                                    animate={idea.selected ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <AnimatePresence mode="wait">
                                      {idea.selected && (
                                        <motion.div
                                          initial={{ scale: 0, rotate: -90 }}
                                          animate={{ scale: 1, rotate: 0 }}
                                          exit={{ scale: 0, rotate: 90 }}
                                          transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20,
                                          }}
                                        >
                                          <Check className="h-4 w-4" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Zap className="h-4 w-4 text-blue-600" />
                                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                        {idea.knowledge_point}
                                      </h3>
                                      <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-white/10">
                                        {idea.research_ideas.length} ideas
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                                      {idea.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <IconButton
                                    aria-label="Save idea"
                                    size="sm"
                                    variant="ghost"
                                    icon={<Save className="h-4 w-4" />}
                                    onClick={() => saveIdea(idea)}
                                  />
                                  <IconButton
                                    aria-label={idea.expanded ? 'Collapse idea' : 'Expand idea'}
                                    size="sm"
                                    variant="ghost"
                                    icon={
                                      <motion.div animate={{ rotate: idea.expanded ? 90 : 0 }}>
                                        <ChevronRight className="h-4 w-4" />
                                      </motion.div>
                                    }
                                    onClick={() => toggleIdeaExpanded(idea.id)}
                                  />
                                </div>
                              </CardHeader>

                              <CardBody padding="sm" className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {idea.research_ideas.slice(0, 3).map((ri, idx) => (
                                    <span
                                      key={`${idea.id}-${idx}`}
                                      className="text-xs bg-white/70 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-200/70 dark:border-white/10 line-clamp-1 max-w-[240px]"
                                      title={ri}
                                    >
                                      {ri}
                                    </span>
                                  ))}
                                  {idea.research_ideas.length > 3 && (
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 px-1 py-1">
                                      +{idea.research_ideas.length - 3} more
                                    </span>
                                  )}
                                </div>

                                <AnimatePresence initial={false}>
                                  {idea.expanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-3 border-t border-zinc-200/60 dark:border-white/10">
                                        <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-headings:text-blue-700 dark:prose-headings:text-blue-300">
                                          <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                          >
                                            {processLatexContent(idea.statement)}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </CardBody>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </CardBody>
              </Card>
            </section>
          </div>

          {/* Sources Modal */}
          <Modal
            isOpen={isSourcesOpen}
            onClose={() => setIsSourcesOpen(false)}
            title="Choose sources"
            size="xl"
          >
            <ModalBody className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900">Notebook records</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Select records to ground IdeaGen. You can mix sources across notebooks.
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllSelections}
                  disabled={selectedRecords.size === 0}
                >
                  Clear all
                </Button>
              </div>

              {loadingNotebooks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : notebooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                  <BookOpen className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No notebooks with records found</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {notebooks.map(notebook => {
                    const isExpanded = expandedNotebooks.has(notebook.id)
                    const records = notebookRecordsMap.get(notebook.id) || []
                    const isLoading = loadingRecordsFor.has(notebook.id)
                    const selectedFromThis = records.filter(r => selectedRecords.has(r.id)).length

                    return (
                      <div key={notebook.id} className="py-3">
                        <button
                          type="button"
                          onClick={() => toggleNotebookExpanded(notebook.id)}
                          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                          aria-expanded={isExpanded}
                        >
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 text-zinc-400 transition-transform duration-200',
                              isExpanded && 'rotate-90'
                            )}
                          />
                          <span
                            className="h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: notebook.color || '#94a3b8' }}
                          />
                          <span className="flex-1 min-w-0 text-sm font-medium text-zinc-900 truncate">
                            {notebook.name}
                          </span>
                          {selectedFromThis > 0 && (
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              {selectedFromThis}
                            </span>
                          )}
                          <span className="text-xs text-zinc-500">{notebook.record_count}</span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 pl-10 pr-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      selectAllFromNotebook(notebook.id, notebook.name)
                                    }
                                    disabled={records.length === 0}
                                  >
                                    Select all
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deselectAllFromNotebook(notebook.id)}
                                    disabled={selectedFromThis === 0}
                                  >
                                    Clear
                                  </Button>
                                </div>

                                {isLoading ? (
                                  <div className="flex items-center justify-center py-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                  </div>
                                ) : records.length === 0 ? (
                                  <div className="py-3 text-xs text-zinc-500">No records</div>
                                ) : (
                                  <div className="space-y-1">
                                    {records.map(record => {
                                      const isSelected = selectedRecords.has(record.id)
                                      return (
                                        <button
                                          key={record.id}
                                          type="button"
                                          onClick={() =>
                                            toggleRecordSelection(
                                              record,
                                              notebook.id,
                                              notebook.name
                                            )
                                          }
                                          className={cn(
                                            'w-full flex items-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
                                            isSelected && 'bg-blue-50/70'
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              'mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border shrink-0',
                                              isSelected
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'border-zinc-200 bg-white'
                                            )}
                                            aria-hidden="true"
                                          >
                                            {isSelected && <Check className="h-3.5 w-3.5" />}
                                          </span>

                                          <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-2 min-w-0">
                                              <span className="text-sm font-medium text-zinc-900 truncate">
                                                {getRecordTitle(record)}
                                              </span>
                                              <span
                                                className={cn(
                                                  'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                                                  getTypeColor(record.type)
                                                )}
                                              >
                                                {record.type || 'record'}
                                              </span>
                                            </span>
                                            {record.user_query && (
                                              <span className="mt-0.5 block text-xs text-zinc-500 line-clamp-2">
                                                {record.user_query}
                                              </span>
                                            )}
                                          </span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="justify-between">
              <div className="text-xs text-zinc-500">
                {selectedRecords.size} selected • {notebooks.length} notebook
                {notebooks.length === 1 ? '' : 's'}
              </div>
              <Button variant="primary" onClick={() => setIsSourcesOpen(false)}>
                Done
              </Button>
            </ModalFooter>
          </Modal>

          {/* Save Modal */}
          {ideaToSave && (
            <AddToNotebookModal
              isOpen={showSaveModal}
              onClose={() => {
                setShowSaveModal(false)
                setIdeaToSave(null)
              }}
              recordType="research"
              title={`Research Idea: ${ideaToSave.knowledge_point}`}
              userQuery={ideaToSave.description}
              output={ideaToSave.statement}
              metadata={{
                ideas_count: ideaToSave.research_ideas.length,
                source: 'ideagen',
              }}
            />
          )}
        </main>
      </PageWrapper>
    </div>
  )
}
