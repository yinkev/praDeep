'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Sparkles,
  Play,
  MessageSquare,
  Send,
  Loader2,
  Database,
  GraduationCap,
  Globe,
  FileText,
  Book,
  Download,
  FileDown,
  FlaskConical,
  ChevronDown,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { Mermaid } from '@/components/Mermaid'
import { useGlobal } from '@/context/GlobalContext'
import { apiUrl, wsUrl } from '@/lib/api'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import { exportToPdf, preprocessMarkdownForPdf } from '@/lib/pdfExport'
import { useResearchReducer } from '@/hooks/useResearchReducer'
import { ResearchDashboard } from '@/components/research/ResearchDashboard'
import { ResearchEvent } from '@/types/research'
import PageWrapper from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Spinner, PulseDots } from '@/components/ui/LoadingState'

interface ChatMsg {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'topic_proposal'
  proposal?: string
  original_topic?: string
  iteration?: number
  isOptimizing?: boolean
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const scaleIn = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
}

const messageVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
}

export default function ResearchPage() {
  const { researchState: globalResearchState, setResearchState: setGlobalResearchState } =
    useGlobal()

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

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [inputTopic, setInputTopic] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Notebook modal state
  const [showNotebookModal, setShowNotebookModal] = useState(false)

  // PDF export state
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  // Ref for report content (hidden rendered report for PDF)
  const reportContentRef = useRef<HTMLDivElement>(null)

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null)

  // Initialize Knowledge Bases
  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const names = data.map((kb: any) => kb.name)
          setKbs(names)
          if (!selectedKb) {
            const defaultKb = data.find((kb: any) => kb.is_default)?.name || names[0]
            if (defaultKb) setSelectedKb(defaultKb)
          }
        }
      })
      .catch(err => console.error('Failed to fetch KBs:', err))
  }, [])

  // Auto-scroll Chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatHistory])

  // Initial Greeting
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Welcome to Deep Research Lab. \n\nPlease configure your settings above, then enter a research topic below.',
        },
      ])
    }
  }, [])

  // Select latest active task automatically if none selected
  useEffect(() => {
    if (!selectedTaskId && state.activeTaskIds.length > 0) {
      setSelectedTaskId(state.activeTaskIds[0])
    }
  }, [state.activeTaskIds, selectedTaskId])

  // Start Research Function (Local)
  const startResearchLocal = (topic: string) => {
    if (wsRef.current) wsRef.current.close()

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
          let eventType = data.status as string
          dispatch({
            type: eventType as any,
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

    ws.onclose = () => {
      // Optional: handle close
    }
  }

  const handleSendMessage = async () => {
    if (!inputTopic.trim()) return
    if (state.global.stage !== 'idle' && state.global.stage !== 'completed') return

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: inputTopic,
    }

    setChatHistory(prev => [...prev, userMsg])
    setInputTopic('')

    if (!enableOptimization) {
      startResearchLocal(userMsg.content)
      return
    }

    setIsOptimizing(true)
    setChatHistory(prev => [
      ...prev,
      {
        id: 'optimizing',
        role: 'assistant',
        content: 'Optimizing topic...',
        isOptimizing: true,
      },
    ])

    try {
      const res = await fetch(apiUrl('/api/v1/research/optimize_topic'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: userMsg.content,
          iteration: 0,
          kb_name: selectedKb,
        }),
      })
      const data = await res.json()

      setChatHistory(prev => prev.filter(msg => msg.id !== 'optimizing'))

      if (data.error) {
        setChatHistory(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error optimizing: ${data.error}`,
          },
        ])
      } else {
        const optimizedTopic = data.topic || userMsg.content
        setChatHistory(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `I have optimized your topic:\n\n**${optimizedTopic}**\n\n${data.reasoning || ''}\n\nStart research?`,
            type: 'topic_proposal',
            proposal: optimizedTopic,
            original_topic: userMsg.content,
          },
        ])
      }
    } catch (error) {
      setChatHistory(prev => prev.filter(msg => msg.id !== 'optimizing'))
      setChatHistory(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Network error. Try again.`,
        },
      ])
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

      // Use the new PDF export utility
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

  // Status indicator component
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
          className={`w-2.5 h-2.5 rounded-full ${
            isRunning
              ? 'bg-teal-500'
              : isCompleted
                ? 'bg-emerald-500'
                : 'bg-slate-300 dark:bg-slate-600'
          }`}
          animate={isRunning ? { scale: [1, 1.2, 1] } : {}}
          transition={isRunning ? { duration: 1.5, repeat: Infinity } : undefined}
        />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
    <PageWrapper maxWidth="full" showPattern={true} className="p-0">
      <motion.div
        className="h-[calc(100vh-2rem)] flex gap-5 p-5"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* LEFT PANEL - Configuration & Chat */}
        <motion.div
          className="flex-[1_1_33%] min-w-[380px] max-w-[480px] flex flex-col gap-4 h-full"
          variants={fadeInUp}
        >
          {/* Config Card */}
          <Card variant="glass" hoverEffect={false} className="shrink-0 overflow-hidden">
            {/* Config Header - Always visible */}
            <motion.button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/20 dark:hover:bg-slate-800/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center">
                  <Settings className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-left">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    Configuration
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedKb || 'No KB'} | {planMode} mode
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusIndicator />
                <motion.div
                  animate={{ rotate: showConfig ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              </div>
            </motion.button>

            {/* Config Body - Collapsible */}
            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-4 border-t border-white/20 dark:border-slate-700/30 pt-4">
                    {/* KB Selection */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Knowledge Base
                      </label>
                      <select
                        value={selectedKb}
                        onChange={e => setSelectedKb(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/50 transition-all"
                      >
                        {kbs.length === 0 && <option value="">Loading...</option>}
                        {kbs.map(kb => (
                          <option key={kb} value={kb}>
                            {kb}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Plan Mode */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Research Depth
                      </label>
                      <div className="flex bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-1 rounded-xl border border-white/30 dark:border-slate-700/30">
                        {['quick', 'medium', 'deep', 'auto'].map(mode => (
                          <motion.button
                            key={mode}
                            onClick={() => setPlanMode(mode)}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
                              planMode === mode
                                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                            }`}
                            whileTap={{ scale: 0.98 }}
                          >
                            {mode}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Tools */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Research Tools
                      </label>
                      <div className="flex gap-2">
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
                              onClick={() => {
                                if (isSelected && enabledTools.length === 1) return
                                setEnabledTools(prev =>
                                  isSelected
                                    ? prev.filter(t => t !== tool.key)
                                    : [...prev, tool.key]
                                )
                              }}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all border ${
                                isSelected
                                  ? 'bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-700/60 shadow-sm'
                                  : 'bg-white/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-white/40 dark:border-slate-700/40 hover:bg-white/60 dark:hover:bg-slate-700/60'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Icon className="w-4 h-4" />
                              {tool.label}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Optimization Toggle */}
                    <motion.div
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        enableOptimization
                          ? 'bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200/60 dark:border-indigo-700/60'
                          : 'bg-white/40 dark:bg-slate-800/40 border-white/40 dark:border-slate-700/40'
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles
                          className={`w-4 h-4 ${
                            enableOptimization
                              ? 'text-indigo-500 dark:text-indigo-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          Topic Optimization
                        </span>
                      </div>
                      <button
                        onClick={() => setEnableOptimization(!enableOptimization)}
                        className={`w-11 h-6 rounded-full relative transition-all duration-300 ${
                          enableOptimization
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                          animate={{ left: enableOptimization ? 24 : 4 }}
                          transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Chat Interface Card */}
          <Card
            variant="glass"
            hoverEffect={false}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-white/20 dark:border-slate-700/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400/20 to-purple-400/20 flex items-center justify-center">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  Topic Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your research topic
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {chatHistory.map(msg => (
                  <motion.div
                    key={msg.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <motion.div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm backdrop-blur-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-teal-500/90 to-cyan-500/90 text-white rounded-tr-sm shadow-lg shadow-teal-500/20'
                          : 'bg-white/70 dark:bg-slate-800/70 border border-white/40 dark:border-slate-700/40 text-slate-700 dark:text-slate-200 rounded-tl-sm shadow-lg'
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      {msg.isOptimizing ? (
                        <div className="flex items-center gap-3">
                          <Spinner size="sm" />
                          <span>Optimizing topic...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </motion.div>

                    {/* Topic Proposal Actions */}
                    {msg.type === 'topic_proposal' &&
                      msg.proposal &&
                      state.global.stage === 'idle' && (
                        <motion.div
                          className="mt-3 flex gap-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            iconLeft={<Play className="w-3.5 h-3.5" />}
                            onClick={() => startResearchLocal(msg.proposal!)}
                          >
                            Start Research
                          </Button>
                        </motion.div>
                      )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/20 dark:border-slate-700/30">
              <div className="relative flex items-center gap-3">
                <motion.input
                  type="text"
                  value={inputTopic}
                  onChange={e => setInputTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={
                    state.global.stage !== 'idle' && state.global.stage !== 'completed'
                      ? 'Research in progress...'
                      : 'Enter research topic...'
                  }
                  disabled={state.global.stage !== 'idle' && state.global.stage !== 'completed'}
                  className="flex-1 px-4 py-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/50 disabled:opacity-50 transition-all"
                  whileFocus={{ scale: 1.01 }}
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendMessage}
                  disabled={
                    !inputTopic.trim() ||
                    (state.global.stage !== 'idle' && state.global.stage !== 'completed')
                  }
                  className="!px-4"
                >
                  {isOptimizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* RIGHT PANEL - Research Dashboard */}
        <motion.div className="flex-[2_1_67%] min-w-0 h-full" variants={fadeInUp}>
          <Card
            variant="glass"
            hoverEffect={false}
            className="h-full flex flex-col overflow-hidden relative"
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
                  color: '#1e293b',
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
                          borderBottom: '2px solid #e2e8f0',
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
                          color: '#0d9488',
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
                    p: ({ node, ...props }) => (
                      <p style={{ marginBottom: '14px', textAlign: 'justify' }} {...props} />
                    ),
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
                          border: '1px solid #cbd5e1',
                          padding: '10px',
                          backgroundColor: '#f1f5f9',
                          fontWeight: '600',
                          textAlign: 'left',
                        }}
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px' }} {...props} />
                    ),
                    a: ({ node, href, ...props }) => (
                      <a
                        href={href}
                        style={{ color: '#0d9488', textDecoration: 'underline' }}
                        {...props}
                      />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        style={{
                          borderLeft: '4px solid #5eead4',
                          paddingLeft: '16px',
                          margin: '18px 0',
                          color: '#475569',
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
                      <div
                        style={{
                          marginTop: '8px',
                          marginBottom: '8px',
                          paddingLeft: '12px',
                          borderLeft: '2px solid #e2e8f0',
                        }}
                      >
                        {children}
                      </div>
                    ),
                    summary: ({ node, children, ...props }) => (
                      <div
                        style={{
                          fontWeight: '600',
                          color: '#475569',
                          marginBottom: '8px',
                        }}
                      >
                        {children}
                      </div>
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
                            backgroundColor: '#f1f5f9',
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
                            backgroundColor: '#1e293b',
                            color: '#e2e8f0',
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
          </Card>
        </motion.div>
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
    </PageWrapper>
  )
}
