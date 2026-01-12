'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Save,
  Sparkles,
  Brain,
  Zap,
  X,
  Target,
  MessageSquare,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl, wsUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import { useGlobal } from '@/context/GlobalContext'
import PageWrapper from '@/components/ui/PageWrapper'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'

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

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

const ideaCardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
}

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

  // Load notebooks
  useEffect(() => {
    fetchNotebooks()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const fetchNotebooks = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/notebook/list'))
      const data = await res.json()
      const notebooksWithRecords = (data.notebooks || []).filter(
        (nb: Notebook) => nb.record_count > 0
      )
      setNotebooks(notebooksWithRecords)
      setLoadingNotebooks(false)
    } catch (err) {
      console.error('Failed to fetch notebooks:', err)
      setLoadingNotebooks(false)
    }
  }

  const fetchNotebookRecords = async (notebookId: string) => {
    if (notebookRecordsMap.has(notebookId)) return // Already fetched

    setLoadingRecordsFor(prev => new Set([...prev, notebookId]))
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${notebookId}`))
      const data = await res.json()
      setNotebookRecordsMap(prev => new Map(prev).set(notebookId, data.records || []))
    } catch (err) {
      console.error('Failed to fetch notebook records:', err)
    } finally {
      setLoadingRecordsFor(prev => {
        const newSet = new Set(prev)
        newSet.delete(notebookId)
        return newSet
      })
    }
  }

  const toggleNotebookExpanded = (notebookId: string) => {
    const notebook = notebooks.find(nb => nb.id === notebookId)
    if (!notebook) return

    setExpandedNotebooks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notebookId)) {
        newSet.delete(notebookId)
      } else {
        newSet.add(notebookId)
        // Fetch records when expanding
        fetchNotebookRecords(notebookId)
      }
      return newSet
    })
  }

  const toggleRecordSelection = (
    record: NotebookRecord,
    notebookId: string,
    notebookName: string
  ) => {
    setSelectedRecords(prev => {
      const newMap = new Map(prev)
      if (newMap.has(record.id)) {
        newMap.delete(record.id)
      } else {
        newMap.set(record.id, { ...record, notebookId, notebookName })
      }
      return newMap
    })
  }

  const selectAllFromNotebook = (notebookId: string, notebookName: string) => {
    const records = notebookRecordsMap.get(notebookId) || []
    setSelectedRecords(prev => {
      const newMap = new Map(prev)
      records.forEach(r => newMap.set(r.id, { ...r, notebookId, notebookName }))
      return newMap
    })
  }

  const deselectAllFromNotebook = (notebookId: string) => {
    const records = notebookRecordsMap.get(notebookId) || []
    const recordIds = new Set(records.map(r => r.id))
    setSelectedRecords(prev => {
      const newMap = new Map(prev)
      recordIds.forEach(id => newMap.delete(id))
      return newMap
    })
  }

  const clearAllSelections = () => {
    setSelectedRecords(new Map())
  }

  // Check if we can generate (either have records or user thoughts)
  const canGenerate = selectedRecords.size > 0 || userThoughts.trim().length > 0

  const startGeneration = () => {
    if (!canGenerate) return

    setIsGenerating(true)
    setGenerationStatus('Connecting...')
    setGeneratedIdeas([])
    setProgress(null)

    const ws = new WebSocket(wsUrl('/api/v1/ideagen/generate'))
    wsRef.current = ws

    ws.onopen = () => {
      setGenerationStatus('Initializing...')
      // Send records directly for cross-notebook support (can be empty if only user thoughts)
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
          // Check if this is the "complete" stage from backend
          if (data.stage === 'complete') {
            setIsGenerating(false)
          }
          // Update progress from status data if available
          if (data.data?.index && data.data?.total) {
            setProgress({ current: data.data.index, total: data.data.total })
          }
          break
        case 'progress':
          if (data.data?.index && data.data?.total) {
            setProgress({ current: data.data.index, total: data.data.total })
          }
          break
        case 'idea':
          setGeneratedIdeas(prev => [...prev, { ...data.data, selected: false }])
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
      setGenerationStatus('Connection Error')
      setIsGenerating(false)
    }

    ws.onclose = () => {
      wsRef.current = null
    }
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

  const selectAllIdeas = () => {
    setGeneratedIdeas(prev => prev.map(idea => ({ ...idea, selected: true })))
  }

  const deselectAllIdeas = () => {
    setGeneratedIdeas(prev => prev.map(idea => ({ ...idea, selected: false })))
  }

  const saveIdea = (idea: ResearchIdea) => {
    setIdeaToSave(idea)
    setShowSaveModal(true)
  }

  const saveSelectedIdeas = () => {
    const selected = generatedIdeas.filter(i => i.selected)
    if (selected.length > 0) {
      // Merge all selected ideas
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
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solve':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'question':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'research':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'co_writer':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <PageWrapper maxWidth="full" showPattern breadcrumbs={[{ label: 'IdeaGen' }]}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-6 h-[calc(100vh-120px)]"
      >
        {/* Left Panel: Source Selection */}
        <motion.div variants={itemVariants} className="w-[420px] shrink-0 flex flex-col gap-4">
          {/* Notebook Selection Card */}
          <Card
            variant="glass"
            hoverEffect={false}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: 'spring' as const, stiffness: 400 }}
                  >
                    <BookOpen className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">
                      Source Selection
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Choose notebooks or records
                    </p>
                  </div>
                </div>
                {selectedRecords.size > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={clearAllSelections}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear ({selectedRecords.size})
                  </motion.button>
                )}
              </div>
            </CardHeader>

            <CardBody className="flex-1 overflow-y-auto !p-0">
              {loadingNotebooks ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div animate={pulseAnimation}>
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                  </motion.div>
                </div>
              ) : notebooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <BookOpen className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No notebooks with records found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                  {notebooks.map((notebook, index) => {
                    const isExpanded = expandedNotebooks.has(notebook.id)
                    const records = notebookRecordsMap.get(notebook.id) || []
                    const isLoading = loadingRecordsFor.has(notebook.id)
                    const selectedFromThis = records.filter(r => selectedRecords.has(r.id)).length

                    return (
                      <motion.div
                        key={notebook.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {/* Notebook Header */}
                        <motion.div
                          className="p-4 flex items-center gap-3 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all"
                          onClick={() => toggleNotebookExpanded(notebook.id)}
                          whileHover={{ x: 4 }}
                        >
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </motion.div>
                          <div
                            className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-700 shadow-sm"
                            style={{ backgroundColor: notebook.color || '#94a3b8' }}
                          />
                          <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                            {notebook.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {selectedFromThis > 0 && (
                              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full">
                                {selectedFromThis}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{notebook.record_count}</span>
                          </div>
                        </motion.div>

                        {/* Records List */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 pl-11 space-y-2">
                                {isLoading ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                                  </div>
                                ) : records.length === 0 ? (
                                  <p className="text-xs text-slate-400 text-center py-2">
                                    No records
                                  </p>
                                ) : (
                                  <>
                                    <div className="flex gap-3 mb-2">
                                      <button
                                        onClick={e => {
                                          e.stopPropagation()
                                          selectAllFromNotebook(notebook.id, notebook.name)
                                        }}
                                        className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors"
                                      >
                                        Select All
                                      </button>
                                      <button
                                        onClick={e => {
                                          e.stopPropagation()
                                          deselectAllFromNotebook(notebook.id)
                                        }}
                                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                                      >
                                        Deselect
                                      </button>
                                    </div>
                                    {records.map(record => (
                                      <motion.div
                                        key={record.id}
                                        onClick={e => {
                                          e.stopPropagation()
                                          toggleRecordSelection(record, notebook.id, notebook.name)
                                        }}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border backdrop-blur-sm ${
                                          selectedRecords.has(record.id)
                                            ? 'bg-teal-50/80 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 shadow-sm'
                                            : 'bg-white/50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                        }`}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <motion.div
                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                              selectedRecords.has(record.id)
                                                ? 'bg-teal-500 border-teal-500 text-white'
                                                : 'border-slate-300 dark:border-slate-500'
                                            }`}
                                            animate={
                                              selectedRecords.has(record.id)
                                                ? { scale: [1, 1.1, 1] }
                                                : {}
                                            }
                                          >
                                            {selectedRecords.has(record.id) && (
                                              <Check className="w-3 h-3" />
                                            )}
                                          </motion.div>
                                          <div className="flex-1 min-w-0">
                                            <span
                                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getTypeColor(record.type)}`}
                                            >
                                              {record.type}
                                            </span>
                                            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 truncate">
                                              {record.title}
                                            </p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Input Area Card */}
          <Card variant="glass" hoverEffect={false}>
            <CardBody className="space-y-4">
              {/* Research Goal Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Research Goal (Optional)
                </label>
                <Textarea
                  value={projectGoal}
                  onChange={e => setProjectGoal(e.target.value)}
                  placeholder="What is your overall research objective?"
                  minRows={2}
                  maxRows={4}
                  size="sm"
                />
              </div>

              {/* User Thoughts Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Your Thoughts {selectedRecords.size > 0 ? '(Optional)' : '(Required)'}
                </label>
                <Textarea
                  value={userThoughts}
                  onChange={e => setUserThoughts(e.target.value)}
                  placeholder={
                    selectedRecords.size > 0
                      ? 'Describe your thoughts or research direction...'
                      : 'Describe your research topic or idea...'
                  }
                  minRows={3}
                  maxRows={5}
                />
                {selectedRecords.size === 0 && (
                  <p className="text-xs text-teal-600/80 dark:text-teal-400/80">
                    Tip: You can generate ideas from text alone, or select notebook records for
                    richer context.
                  </p>
                )}
              </div>

              {/* Generate Button */}
              <Button
                onClick={startGeneration}
                disabled={isGenerating || !canGenerate}
                loading={isGenerating}
                iconLeft={!isGenerating ? <Sparkles className="w-4 h-4" /> : undefined}
                className="w-full"
                size="lg"
              >
                {isGenerating
                  ? 'Generating...'
                  : selectedRecords.size > 0
                    ? `Generate Ideas (${selectedRecords.size} items)`
                    : 'Generate Ideas'}
              </Button>
            </CardBody>
          </Card>
        </motion.div>

        {/* Right Panel: Generated Ideas */}
        <motion.div variants={itemVariants} className="flex-1 flex flex-col min-w-0">
          <Card
            variant="glass"
            hoverEffect={false}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-emerald-500/10 dark:from-teal-500/20 dark:via-cyan-500/20 dark:to-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30"
                    animate={isGenerating ? pulseAnimation : {}}
                  >
                    <Lightbulb className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      IdeaGen
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Discover research ideas from your notes
                    </p>
                  </div>
                </div>

                {generatedIdeas.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Button variant="ghost" size="sm" onClick={selectAllIdeas}>
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveSelectedIdeas}
                      disabled={!generatedIdeas.some(i => i.selected)}
                      iconLeft={<Save className="w-4 h-4" />}
                    >
                      Save Selected
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardHeader>

            {/* Status Bar */}
            <AnimatePresence>
              {(isGenerating || generationStatus) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border-b border-teal-100/50 dark:border-teal-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isGenerating && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        </motion.div>
                      )}
                      <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                        {generationStatus}
                      </span>
                    </div>
                    {progress && (
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-teal-100 dark:bg-teal-900/50 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                          {progress.current} / {progress.total}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ideas List */}
            <CardBody className="flex-1 overflow-y-auto !p-4">
              {generatedIdeas.length === 0 && !isGenerating ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-400"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mb-6 shadow-inner"
                  >
                    <Brain className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                  </motion.div>
                  <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
                    Select notebook records or describe your research topic
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
                    You can select notebooks for context, or simply describe your research direction
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <AnimatePresence mode="popLayout">
                    {generatedIdeas.map((idea, index) => (
                      <motion.div
                        key={idea.id}
                        variants={ideaCardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        custom={index}
                        className={`rounded-2xl border backdrop-blur-xl transition-all overflow-hidden ${
                          idea.selected
                            ? 'bg-teal-50/80 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 shadow-lg shadow-teal-500/10'
                            : 'bg-white/60 dark:bg-slate-800/60 border-white/50 dark:border-slate-700/50 hover:border-teal-200 dark:hover:border-teal-800'
                        }`}
                      >
                        {/* Idea Header */}
                        <div className="p-5 flex items-start gap-4">
                          {/* Selection Checkbox */}
                          <motion.button
                            onClick={() => toggleIdeaSelected(idea.id)}
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              idea.selected
                                ? 'bg-gradient-to-br from-teal-400 to-cyan-500 border-teal-400 text-white shadow-lg shadow-teal-500/30'
                                : 'border-slate-300 dark:border-slate-500 hover:border-teal-400 dark:hover:border-teal-500'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {idea.selected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring' as const, stiffness: 500 }}
                              >
                                <Check className="w-4 h-4" />
                              </motion.div>
                            )}
                          </motion.button>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-teal-500" />
                                {idea.knowledge_point}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full">
                                  {idea.research_ideas.length} ideas
                                </span>
                                <motion.button
                                  onClick={() => saveIdea(idea)}
                                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/40 rounded-xl transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Save to Notebook"
                                >
                                  <Save className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                              {idea.description}
                            </p>

                            {/* Research Ideas Preview */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {idea.research_ideas.slice(0, 3).map((ri, idx) => (
                                <motion.span
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="text-xs bg-white/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-600/50 line-clamp-1 max-w-[220px] backdrop-blur-sm"
                                >
                                  {ri.substring(0, 50)}...
                                </motion.span>
                              ))}
                              {idea.research_ideas.length > 3 && (
                                <span className="text-xs text-slate-400 dark:text-slate-500 px-2 py-1.5">
                                  +{idea.research_ideas.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expand Button */}
                          <motion.button
                            onClick={() => toggleIdeaExpanded(idea.id)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <motion.div animate={{ rotate: idea.expanded ? 90 : 0 }}>
                              <ChevronRight className="w-5 h-5" />
                            </motion.div>
                          </motion.button>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {idea.expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 pt-0 border-t border-slate-100/50 dark:border-slate-700/50">
                                <div className="mt-4 prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:text-teal-700 dark:prose-headings:text-teal-400">
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>

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
    </PageWrapper>
  )
}
