'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Database,
  FlaskConical,
  Globe,
  GraduationCap,
  Loader2,
  Play,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import { Mermaid } from '@/components/Mermaid'
import { ResearchDashboard } from '@/components/research/ResearchDashboard'
import { SourcePanel } from '@/components/research/SourcePanel'
import type { Citation } from '@/components/research/Citations'
import { SplitPane } from '@/components/ui/SplitPane'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import Button from '@/components/ui/Button'
import { useGlobal } from '@/context/GlobalContext'
import { useResearchReducer } from '@/hooks/useResearchReducer'
import { apiUrl, wsUrl } from '@/lib/api'
import { parseKnowledgeBaseList } from '@/lib/knowledge'
import { exportToPdf, preprocessMarkdownForPdf } from '@/lib/pdfExport'
import { ResearchEvent } from '@/types/research'

interface TopicProposal {
  originalTopic: string
  proposal: string
  reasoning?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
    },
  },
}

export default function ResearchPage() {
  const { setResearchState: setGlobalResearchState } = useGlobal()

  // Local Reducer State for Deep Research Dashboard
  const [state, dispatch] = useResearchReducer()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Config State
  const [selectedKb, setSelectedKb] = useState<string>('')
  const [kbs, setKbs] = useState<string[]>([])
  const [planMode, setPlanMode] = useState<string>('medium')
  const [enabledTools, setEnabledTools] = useState<string[]>(['RAG'])
  const [enableOptimization, setEnableOptimization] = useState<boolean>(true)
  const [showConfig, setShowConfig] = useState<boolean>(true)

  // Topic/Search State
  const [inputTopic, setInputTopic] = useState('')
  const [proposal, setProposal] = useState<TopicProposal | null>(null)
  const [proposalError, setProposalError] = useState<string | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Notebook modal state
  const [showNotebookModal, setShowNotebookModal] = useState(false)

  // PDF export state
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const reportContentRef = useRef<HTMLDivElement>(null)

  // Mock data for Citations and Related Questions (to be replaced with real data)
  const [mockCitations] = useState<Citation[]>([
    {
      id: '1',
      title: 'Introduction to Deep Research Methodologies',
      url: 'https://example.com/research-methods',
      source: 'Research Methods Journal',
    },
    {
      id: '2',
      title: 'AI-Powered Knowledge Discovery',
      url: 'https://example.com/ai-knowledge',
      source: 'AI Research Database',
    },
    {
      id: '3',
      title: 'Systematic Literature Review Techniques',
      url: 'https://example.com/literature-review',
      source: 'Academic Research Portal',
    },
  ])

  const [mockRelatedQuestions] = useState<string[]>([
    'What are the latest advancements in this field?',
    'How does this compare to traditional approaches?',
    'What are the practical applications of these findings?',
  ])

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null)

  const canInteract = state.global.stage === 'idle' || state.global.stage === 'completed'

  const configSummary = useMemo(() => {
    const tools = enabledTools.length ? enabledTools.join(', ') : 'None'
    const kb = selectedKb ? selectedKb : 'No KB'
    return `${kb} • ${planMode} • ${tools}`
  }, [enabledTools, planMode, selectedKb])

  // Initialize Knowledge Bases
  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        const kbs = parseKnowledgeBaseList(data)
        const names = kbs.map(kb => kb.name)
        setKbs(names)
        setSelectedKb(prev => {
          if (prev) return prev
          return kbs.find(kb => kb.is_default)?.name || names[0] || prev
        })
      })
      .catch(err => console.error('Failed to fetch KBs:', err))
  }, [setSelectedKb])

  // Select latest active task automatically if none selected
  useEffect(() => {
    if (!selectedTaskId && state.activeTaskIds.length > 0) {
      setSelectedTaskId(state.activeTaskIds[0])
    }
  }, [state.activeTaskIds, selectedTaskId])

  // Close websocket on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  // Start Research Function (Local)
  const startResearchLocal = (topic: string) => {
    if (wsRef.current) wsRef.current.close()

    setProposal(null)
    setProposalError(null)

    // Update Global State to "running" for sidebar status
    setGlobalResearchState(prev => ({ ...prev, status: 'running', topic }))

    const ws = new WebSocket(wsUrl('/api/v1/research/run'))
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          topic,
          kb_name: selectedKb,
          plan_mode: planMode,
          enabled_tools: enabledTools,
          skip_rephrase: !enableOptimization,
        })
      )
    }

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        // Dispatch all events to reducer
        if (data.type === 'progress') {
          const { type, ...rest } = data
          const eventType = data.status as string
          dispatch({
            type: eventType as ResearchEvent['type'],
            ...rest,
          })
        } else if (data.type === 'log') {
          dispatch({
            type: 'log',
            content: data.content.content || data.content,
          })
        } else if (data.type === 'result') {
          dispatch({
            type: 'reporting_completed',
            word_count: data.metadata?.report_word_count || 0,
            sections: Object.keys(data.metadata?.statistics || {}).length,
            citations: data.metadata?.statistics?.total_tool_calls || 0,
            report: data.report,
          })
          // Update Global State to "completed"
          setGlobalResearchState(prev => ({
            ...prev,
            status: 'completed',
            report: data.report,
          }))
        } else if (data.type === 'error') {
          dispatch({ type: 'error', content: data.content })
          setGlobalResearchState(prev => ({ ...prev, status: 'idle' }))
        } else {
          // Forward other events directly
          dispatch(data as ResearchEvent)
        }
      } catch (e) {
        console.error('WS Parse Error', e)
      }
    }

    ws.onerror = e => {
      console.error('WS Error', e)
      dispatch({ type: 'error', content: 'WebSocket connection failed' })
      setGlobalResearchState(prev => ({ ...prev, status: 'idle' }))
    }
  }

  const prepareTopic = async () => {
    const topic = inputTopic.trim()
    if (!topic) return
    if (!canInteract) return

    setProposal(null)
    setProposalError(null)

    if (!enableOptimization) {
      startResearchLocal(topic)
      return
    }

    setIsOptimizing(true)

    try {
      const res = await fetch(apiUrl('/api/v1/research/optimize_topic'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          iteration: 0,
          kb_name: selectedKb,
        }),
      })

      const data = await res.json()

      if (data.error) {
        setProposalError(typeof data.error === 'string' ? data.error : 'Failed to optimize topic')
        return
      }

      const optimizedTopic = data.topic || topic
      setProposal({
        originalTopic: topic,
        proposal: optimizedTopic,
        reasoning: typeof data.reasoning === 'string' ? data.reasoning : undefined,
      })
    } catch (error) {
      setProposalError('Network error. Try again.')
    } finally {
      setIsOptimizing(false)
    }
  }

  // PDF Export using the new pdfExport utility
  const handleExportPdf = async () => {
    if (!state.reporting.generatedReport) return
    if (!reportContentRef.current) return

    setIsExportingPdf(true)
    try {
      // Wait for Mermaid diagrams and KaTeX formulas to render
      await new Promise(resolve => setTimeout(resolve, 2000))

      await exportToPdf(reportContentRef.current, {
        filename: state.planning.originalTopic || 'research-report',
        marginLeft: 20,
        marginRight: 20,
        marginTop: 25,
        marginBottom: 25,
        showPageNumbers: true,
        scale: 2,
      })
    } catch (err) {
      console.error('PDF Export failed', err)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const StatusIndicator = () => {
    const isRunning = state.global.stage !== 'idle' && state.global.stage !== 'completed'
    const isCompleted = state.global.stage === 'completed'

    return (
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className={`h-2.5 w-2.5 rounded-full ${
            isRunning
              ? 'bg-accent-primary'
              : isCompleted
                ? 'bg-emerald-500'
                : 'bg-zinc-300 dark:bg-white/15'
          }`}
          animate={isRunning ? { scale: [1, 1.25, 1] } : {}}
          transition={isRunning ? { duration: 1.5, repeat: Infinity } : undefined}
        />
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          {state.global.stage === 'idle'
            ? 'Ready'
            : state.global.stage === 'completed'
              ? 'Complete'
              : state.global.stage}
        </span>
      </motion.div>
    )
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-surface-base">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_72%)] bg-[linear-gradient(to_right,rgba(24,24,27,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.07)_1px,transparent_1px)] bg-[length:56px_56px] dark:opacity-20 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-accent-primary/20 blur-3xl dark:bg-accent-primary/15"
        animate={{ y: [0, 18, 0], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 left-8 h-[520px] w-[520px] rounded-full bg-accent-primary/10 blur-3xl dark:bg-accent-primary/10"
        animate={{ y: [0, -12, 0], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
      />

      <PageWrapper
        maxWidth="full"
        showPattern={false}
        breadcrumbs={[{ label: 'Research' }]}
        className="min-h-dvh px-0 py-0"
      >
        <motion.div
          className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-6 pb-10 pt-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <PageHeader
              title={
                <span>
                  <span className="font-bold tracking-tight">Deep</span>{' '}
                  <span className="bg-gradient-to-r from-accent-primary via-accent-primary/80 to-accent-primary/60 bg-clip-text text-transparent">
                    Research
                  </span>
                </span>
              }
              description="Enter a topic, tune your tools, and generate a research report."
              icon={<FlaskConical className="h-5 w-5 text-accent-primary" />}
              actions={<StatusIndicator />}
              className="mb-6"
            />
          </motion.div>

          <motion.div
            className="flex flex-1 min-h-0 flex-col gap-6 lg:flex-row"
            variants={itemVariants}
          >
            {/* LEFT: Search + Controls */}
            <div className="lg:w-[42%] flex min-h-0 flex-col gap-4 shrink-0">
              <Card
                variant="glass"
                padding="none"
                interactive={false}
                className="relative overflow-hidden border-white/55 dark:border-white/10"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]"
                />

                <div className="relative">
                  <CardHeader padding="sm" className="flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated shadow-sm ring-1 ring-border">
                        <Search className="h-5 w-5 text-accent-primary" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text-primary">Topic Search</h2>
                        <p className="truncate text-xs text-text-secondary">
                          One prompt in. A full report out.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline text-xs text-text-secondary">
                        {enableOptimization ? 'Optimize on' : 'Optimize off'}
                      </span>
                      <StatusIndicator />
                    </div>
                  </CardHeader>

                  <CardBody padding="sm" className="space-y-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                      <input
                        type="text"
                        value={inputTopic}
                        onChange={e => setInputTopic(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && prepareTopic()}
                        placeholder={
                          canInteract ? 'Enter a research topic…' : 'Research in progress…'
                        }
                        disabled={!canInteract}
                        className="w-full rounded-2xl border border-border bg-surface-elevated px-5 py-4 pl-11 pr-14 text-base text-text-primary shadow-glass-sm backdrop-blur-md placeholder:text-text-tertiary hover:border-border/80 focus:border-accent-primary/60 focus:outline-none focus:ring-4 focus:ring-accent-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                      />

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={prepareTopic}
                        disabled={!inputTopic.trim() || !canInteract}
                        className={`absolute right-2.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl transition-all duration-200 ${
                          inputTopic.trim() && canInteract
                            ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                            : 'bg-surface-elevated text-text-tertiary'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        aria-label={enableOptimization ? 'Optimize topic' : 'Start research'}
                      >
                        {isOptimizing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : enableOptimization ? (
                          <Sparkles className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>

                    {proposalError && (
                      <div className="rounded-xl border border-red-200/70 bg-red-50/70 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                        {proposalError}
                      </div>
                    )}

                    {proposal && (
                      <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/5 p-4 shadow-sm backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-accent-primary shadow-sm ring-1 ring-border">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="text-sm font-semibold text-text-primary">
                                Suggested topic
                              </h3>
                              <span className="text-xs text-text-secondary">
                                from "{proposal.originalTopic}"
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-text-secondary">
                              Review, edit, then start research.
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-3">
                          <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-text-primary shadow-sm backdrop-blur-md">
                            <p className="text-sm font-semibold leading-snug">
                              {proposal.proposal}
                            </p>
                          </div>

                          {proposal.reasoning && (
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">
                              {proposal.reasoning}
                            </p>
                          )}

                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => startResearchLocal(proposal.originalTopic)}
                              disabled={!canInteract}
                            >
                              Run original
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              iconLeft={<Play className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setInputTopic(proposal.proposal)
                                startResearchLocal(proposal.proposal)
                              }}
                              disabled={!canInteract}
                            >
                              Start research
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardBody>

                  <CardFooter padding="sm" className="items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      Press Enter to {enableOptimization ? 'optimize' : 'start'}
                    </span>
                    <span className="text-xs text-text-secondary">{configSummary}</span>
                  </CardFooter>
                </div>
              </Card>

              <Card
                variant="glass"
                padding="none"
                interactive={false}
                className="shrink-0 overflow-hidden border-white/55 dark:border-white/10"
              >
                <motion.button
                  type="button"
                  onClick={() => setShowConfig(prev => !prev)}
                  className="w-full text-left hover:bg-white/20 dark:hover:bg-white/5"
                  aria-expanded={showConfig}
                >
                  <CardHeader padding="sm" className="flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated shadow-sm ring-1 ring-border">
                        <Settings className="h-5 w-5 text-accent-primary" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text-primary">Controls</h2>
                        <p className="truncate text-xs text-text-secondary">{configSummary}</p>
                      </div>
                    </div>

                    <motion.div
                      aria-hidden="true"
                      animate={{ rotate: showConfig ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4 text-text-tertiary" />
                    </motion.div>
                  </CardHeader>
                </motion.button>

                <AnimatePresence>
                  {showConfig && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <CardBody padding="sm" className="space-y-4">
                        {/* Tools */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                            Tools
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: 'RAG', label: 'RAG', icon: Database },
                              { key: 'Paper', label: 'Paper', icon: GraduationCap },
                              { key: 'Web', label: 'Web', icon: Globe },
                            ].map(tool => {
                              const isSelected = enabledTools.includes(tool.key)
                              const Icon = tool.icon

                              return (
                                <motion.button
                                  key={tool.key}
                                  type="button"
                                  whileHover={{ y: -1 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    if (isSelected && enabledTools.length === 1) return
                                    setEnabledTools(prev =>
                                      isSelected
                                        ? prev.filter(t => t !== tool.key)
                                        : [...prev, tool.key]
                                    )
                                  }}
                                  aria-pressed={isSelected}
                                  className={`
                                    inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
                                    ${
                                      isSelected
                                        ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary'
                                        : 'border-border bg-surface-elevated text-text-secondary hover:bg-surface-elevated/80'
                                    }
                                  `}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {tool.label}
                                </motion.button>
                              )
                            })}
                          </div>
                        </div>

                        {/* KB Selection */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                            Knowledge Base
                          </label>
                          <select
                            value={selectedKb}
                            onChange={e => setSelectedKb(e.target.value)}
                            disabled={!enabledTools.includes('RAG')}
                            className="h-10 w-full rounded-xl border border-border bg-surface-elevated px-4 text-sm text-text-primary outline-none backdrop-blur-md hover:border-border/80 focus:border-accent-primary/60 focus:ring-4 focus:ring-accent-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {kbs.length === 0 && <option value="">Loading...</option>}
                            {kbs.map(kb => (
                              <option key={kb} value={kb}>
                                {kb}
                              </option>
                            ))}
                          </select>
                          {!enabledTools.includes('RAG') && (
                            <p className="mt-1 text-xs text-text-secondary">
                              Enable RAG to use a knowledge base.
                            </p>
                          )}
                        </div>

                        {/* Plan Mode */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                            Research Depth
                          </label>
                          <div className="flex rounded-xl border border-border bg-surface-elevated p-1 backdrop-blur-sm">
                            {['quick', 'medium', 'deep', 'auto'].map(mode => (
                              <motion.button
                                key={mode}
                                type="button"
                                onClick={() => setPlanMode(mode)}
                                className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-all ${
                                  planMode === mode
                                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                                    : 'text-text-secondary hover:bg-surface-elevated/80 hover:text-text-primary'
                                }`}
                                whileTap={{ scale: 0.98 }}
                              >
                                {mode}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Optimization Toggle */}
                        <motion.div
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                            enableOptimization
                              ? 'border-accent-primary/30 bg-accent-primary/5'
                              : 'border-border bg-surface-elevated'
                          }`}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles
                              className={`h-4 w-4 ${
                                enableOptimization ? 'text-accent-primary' : 'text-text-tertiary'
                              }`}
                            />
                            <span className="text-sm font-medium text-text-primary">
                              Topic Optimization
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEnableOptimization(prev => !prev)}
                            className={`relative h-6 w-11 rounded-full transition-all duration-300 ${
                              enableOptimization
                                ? 'bg-accent-primary shadow-lg shadow-accent-primary/20'
                                : 'bg-zinc-200 dark:bg-white/10'
                            }`}
                          >
                            <motion.div
                              className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-md"
                              animate={{ left: enableOptimization ? 24 : 4 }}
                              transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </motion.div>
                      </CardBody>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>

            {/* RIGHT: Results with Split Pane */}
            <div className="flex-1 min-h-0">
              <SplitPane
                leftPanel={
                  <Card
                    variant="glass"
                    padding="none"
                    interactive={false}
                    className="relative flex h-full min-h-0 flex-col overflow-hidden border-white/55 dark:border-white/10"
                  >
                    <ResearchDashboard
                      state={state}
                      selectedTaskId={selectedTaskId}
                      onTaskSelect={setSelectedTaskId}
                      onAddToNotebook={() => setShowNotebookModal(true)}
                      onExportMarkdown={() => {
                        const blob = new Blob([state.reporting.generatedReport || ''], {
                          type: 'text/markdown',
                        })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${state.planning.originalTopic || 'report'}.md`
                        a.click()
                      }}
                      onExportPdf={handleExportPdf}
                      isExportingPdf={isExportingPdf}
                    />
                  </Card>
                }
                rightPanel={
                  <SourcePanel
                    citations={mockCitations}
                    relatedQuestions={mockRelatedQuestions}
                    onCitationClick={citation => {
                      window.open(citation.url, '_blank', 'noopener,noreferrer')
                    }}
                    onQuestionClick={question => {
                      setInputTopic(question)
                    }}
                  />
                }
                defaultRightWidth={360}
                collapsible
                className="h-full"
              />

              {/* Hidden Render Div for PDF */}
              <div
                style={{
                  position: 'absolute',
                  top: '-9999px',
                  left: '-9999px',
                  width: '800px',
                }}
              >
                <div
                  ref={reportContentRef}
                  className="bg-white"
                  style={{
                    padding: '50px 40px',
                    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: '#18181b',
                  }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          style={{
                            fontSize: '26px',
                            fontWeight: 'bold',
                            marginBottom: '20px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid #e4e4e7',
                          }}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            marginTop: '28px',
                            marginBottom: '14px',
                            color: '#2563eb',
                          }}
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            marginTop: '20px',
                            marginBottom: '10px',
                          }}
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => <p style={{ marginBottom: '14px' }} {...props} />,
                      table: ({ node, ...props }) => (
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            margin: '18px 0',
                            fontSize: '13px',
                          }}
                          {...props}
                        />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          style={{
                            border: '1px solid #e4e4e7',
                            padding: '10px',
                            backgroundColor: '#f4f4f5',
                            fontWeight: '600',
                            textAlign: 'left',
                          }}
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td style={{ border: '1px solid #e4e4e7', padding: '10px' }} {...props} />
                      ),
                      a: ({ node, href, ...props }) => (
                        <a
                          href={href}
                          style={{ color: '#2563eb', textDecoration: 'underline' }}
                          {...props}
                        />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          style={{
                            borderLeft: '4px solid #93c5fd',
                            paddingLeft: '16px',
                            margin: '18px 0',
                            color: '#52525b',
                            fontStyle: 'italic',
                          }}
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul style={{ marginLeft: '24px', marginBottom: '14px' }} {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol style={{ marginLeft: '24px', marginBottom: '14px' }} {...props} />
                      ),
                      li: ({ node, ...props }) => <li style={{ marginBottom: '6px' }} {...props} />,
                      details: ({ node, children, ...props }) => (
                        <details
                          style={{
                            marginTop: '8px',
                            marginBottom: '8px',
                            paddingLeft: '12px',
                            borderLeft: '2px solid #e4e4e7',
                          }}
                          {...props}
                        >
                          {children}
                        </details>
                      ),
                      summary: ({ node, children, ...props }) => (
                        <summary
                          style={{
                            fontWeight: '600',
                            color: '#3f3f46',
                            marginBottom: '8px',
                          }}
                          {...props}
                        >
                          {children}
                        </summary>
                      ),
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        const language = match ? match[1] : ''
                        const isInline = !match

                        if (language === 'mermaid') {
                          const chartCode = String(children).replace(/\n$/, '')
                          return <Mermaid chart={chartCode} />
                        }

                        return isInline ? (
                          <code
                            style={{
                              backgroundColor: '#f4f4f5',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontFamily: 'monospace',
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            style={{
                              display: 'block',
                              backgroundColor: '#18181b',
                              color: '#f4f4f5',
                              padding: '16px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontFamily: 'monospace',
                              overflowX: 'auto',
                              whiteSpace: 'pre',
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      pre: ({ node, children, ...props }) => {
                        const child = React.Children.toArray(children)[0] as React.ReactElement<{
                          className?: string
                        }>
                        if (child?.props?.className?.includes('language-mermaid')) {
                          return <>{children}</>
                        }
                        return (
                          <pre style={{ margin: '18px 0' }} {...props}>
                            {children}
                          </pre>
                        )
                      },
                    }}
                  >
                    {preprocessMarkdownForPdf(state.reporting.generatedReport || '')}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>

          <AddToNotebookModal
            isOpen={showNotebookModal}
            onClose={() => setShowNotebookModal(false)}
            recordType="research"
            title={state.planning.originalTopic || 'Research Report'}
            userQuery={state.planning.originalTopic || ''}
            output={state.reporting.generatedReport || ''}
            metadata={{ plan_mode: planMode, enabled_tools: enabledTools }}
            kbName={selectedKb}
          />
        </motion.div>
      </PageWrapper>
    </div>
  )
}
