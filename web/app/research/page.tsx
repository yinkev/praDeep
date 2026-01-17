'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Book,
  ChevronDown,
  Clock,
  Database,
  Download,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  History,
  Layout,
  Loader2,
  MoreVertical,
  Play,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Zap,
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
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Button, IconButton } from '@/components/ui/Button'
import { useGlobal } from '@/context/GlobalContext'
import { useResearchReducer } from '@/hooks/useResearchReducer'
import { apiUrl, wsUrl } from '@/lib/api'
import { parseKnowledgeBaseList } from '@/lib/knowledge'
import { exportToPdf, preprocessMarkdownForPdf } from '@/lib/pdfExport'
import { ResearchEvent } from '@/types/research'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface TopicProposal {
  originalTopic: string
  proposal: string
  reasoning?: string
}

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
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

  // Mock data for Citations and Related Questions
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
  }, [])

  useEffect(() => {
    if (!selectedTaskId && state.activeTaskIds.length > 0) {
      setSelectedTaskId(state.activeTaskIds[0])
    }
  }, [state.activeTaskIds, selectedTaskId])

  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  const startResearchLocal = (topic: string) => {
    if (wsRef.current) wsRef.current.close()

    setProposal(null)
    setProposalError(null)

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
          setGlobalResearchState(prev => ({
            ...prev,
            status: 'completed',
            report: data.report,
          }))
        } else if (data.type === 'error') {
          dispatch({ type: 'error', content: data.content })
          setGlobalResearchState(prev => ({ ...prev, status: 'idle' }))
        } else {
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
    if (!topic || !canInteract) return

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

  const handleExportPdf = async () => {
    if (!state.reporting.generatedReport || !reportContentRef.current) return

    setIsExportingPdf(true)
    try {
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-secondary/40 backdrop-blur-md transition-all duration-300">
        <motion.div
          className={cn(
            "h-2 w-2 rounded-full",
            isRunning ? "bg-accent-primary" : isCompleted ? "bg-success" : "bg-text-quaternary"
          )}
          animate={isRunning ? { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] } : {}}
          transition={isRunning ? { duration: 1.5, repeat: Infinity } : undefined}
        />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          {state.global.stage === 'idle' ? 'Ready' : state.global.stage === 'completed' ? 'Complete' : state.global.stage}
        </span>
      </div>
    )
  }

  return (
    <PageWrapper maxWidth="full" showPattern={false} className="h-screen overflow-hidden px-0 py-0">
       <div className="h-full flex flex-col bg-surface-base">
          <header className="shrink-0 h-14 border-b border-border bg-surface-base/80 backdrop-blur-md px-6 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-sm border border-accent-primary/20">
                    <FlaskConical size={16} />
                  </div>
                  <h1 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">Deep_Research</h1>
                </div>
                <StatusIndicator />
             </div>

             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-surface-elevated border border-border-subtle px-3 py-1.5 rounded-xl shadow-sm">
                  <Database size={12} className="text-text-quaternary" />
                  <label htmlFor="kb-select" className="sr-only">Knowledge Base</label>
                  <select
                    id="kb-select"
                    value={selectedKb}
                    onChange={e => setSelectedKb(e.target.value)}
                    className="bg-transparent text-[10px] font-mono font-bold uppercase text-text-secondary outline-none appearance-none cursor-pointer pr-1"
                  >
                    {kbs.map(kb => (
                      <option key={kb} value={kb}>{kb}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="text-text-quaternary" />
                </div>
                
                <IconButton 
                  aria-label="Toggle configuration"
                  icon={<Settings size={16} />} 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowConfig(!showConfig)}
                  className={cn("text-text-tertiary transition-colors", showConfig && "text-accent-primary bg-accent-primary/5")}
                />

             </div>
          </header>

          <div className="flex-1 min-h-0 flex overflow-hidden">
             {/* Interaction Sidebar */}
             <AnimatePresence mode="popLayout">
               {showConfig && (
                 <motion.aside
                   initial={{ width: 0, opacity: 0 }}
                   animate={{ width: 380, opacity: 1 }}
                   exit={{ width: 0, opacity: 0 }}
                   className="flex-shrink-0 border-r border-border bg-surface-secondary/10 flex flex-col overflow-hidden"
                 >
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Research_Vector</label>
                          <div className="relative">
                             <Textarea
                               placeholder="ENTER_TOPIC_OR_HYPOTHESIS..."
                               value={inputTopic}
                               onChange={e => setInputTopic(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && !e.shiftKey && prepareTopic()}
                               disabled={!canInteract}
                               minRows={4}
                               className="bg-surface-base border-border text-xs font-bold uppercase p-4 tracking-tight"
                             />
                             <div className="absolute bottom-3 right-3">
                                <Button 
                                  type="button"
                                  variant="primary" 
                                  size="sm" 
                                  onClick={prepareTopic}
                                  disabled={!inputTopic.trim() || !canInteract || isOptimizing}
                                  loading={isOptimizing}
                                  className="h-8 w-8 p-0 rounded-full"
                                >

                                   <ArrowRight size={14} />
                                </Button>
                             </div>
                          </div>
                       </div>

                       {proposal && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="rounded-2xl border border-accent-primary/20 bg-accent-primary/5 p-4 space-y-4">
                               <div className="flex items-center gap-2">
                                  <Sparkles size={14} className="text-accent-primary" />
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary">Proposal_Optimized</span>
                               </div>
                               <p className="text-xs font-bold text-text-primary uppercase leading-relaxed tracking-tight">{proposal.proposal}</p>
                               <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => startResearchLocal(proposal.originalTopic)} className="text-[9px] font-mono uppercase h-7 flex-1">Use Original</Button>
                                  <Button variant="primary" size="sm" onClick={() => { setInputTopic(proposal.proposal); startResearchLocal(proposal.proposal); }} className="text-[9px] font-mono uppercase h-7 flex-1">Accept</Button>
                               </div>
                            </div>
                         </motion.div>
                       )}

                       <div className="space-y-6 pt-4 border-t border-border-subtle">
                          <div className="space-y-3">
                             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Logic_Chain_Mode</label>
                             <div className="grid grid-cols-2 gap-2">
                                {['quick', 'medium', 'deep', 'auto'].map(mode => (
                                  <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setPlanMode(mode)}
                                    className={cn(
                                      "px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                                      planMode === mode 
                                        ? "bg-accent-primary border-accent-primary text-white shadow-sm" 
                                        : "bg-surface-base border-border text-text-tertiary hover:border-accent-primary/20"
                                    )}
                                  >
                                    {mode}
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-3">
                             <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary ml-1">Enabled_Subsystems</label>
                             <div className="flex flex-wrap gap-2">
                                 {[
                                   { key: 'RAG', label: 'Knowledge_Base', icon: Database },
                                   { key: 'Paper', label: 'Academic_Rec', icon: GraduationCap },
                                   { key: 'Web', label: 'Live_Web', icon: Globe },
                                 ].map(tool => {
                                   const isSelected = enabledTools.includes(tool.key)
                                   return (
                                     <button
                                       key={tool.key}
                                       type="button"
                                       onClick={() => {

                                        if (isSelected && enabledTools.length === 1) return
                                        setEnabledTools(p => isSelected ? p.filter(t => t !== tool.key) : [...p, tool.key])
                                      }}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
                                        isSelected 
                                          ? "bg-surface-raised border-accent-primary/40 text-accent-primary shadow-sm" 
                                          : "bg-surface-base border-border text-text-quaternary grayscale opacity-60 hover:opacity-100"
                                      )}
                                    >
                                       <tool.icon size={12} />
                                       {tool.label}
                                    </button>
                                  )
                                })}
                             </div>
                          </div>
                       </div>
                    </div>
                 </motion.aside>
               )}
             </AnimatePresence>

             {/* Main Content Area */}
             <main className="flex-1 min-w-0 bg-surface-secondary/10 flex flex-col">
                <div className="flex-1 relative">
                   <SplitPane
                     className="h-full"
                     defaultRightWidth={380}
                     collapsible
                     leftPanel={
                       <div className="h-full flex flex-col bg-surface-base border-r border-border">
                          <ResearchDashboard
                            state={state}
                            selectedTaskId={selectedTaskId}
                            onTaskSelect={setSelectedTaskId}
                            onAddToNotebook={() => setShowNotebookModal(true)}
                            onExportMarkdown={() => {
                              const blob = new Blob([state.reporting.generatedReport || ''], { type: 'text/markdown' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${state.planning.originalTopic || 'report'}.md`
                              a.click()
                            }}
                            onExportPdf={handleExportPdf}
                            isExportingPdf={isExportingPdf}
                          />
                       </div>
                     }
                     rightPanel={
                        <SourcePanel
                          citations={mockCitations}
                          relatedQuestions={mockRelatedQuestions}
                          onCitationClick={citation => window.open(citation.url, '_blank', 'noopener,noreferrer')}
                          onQuestionClick={q => setInputTopic(q)}
                        />
                     }
                   />
                </div>
             </main>
          </div>
       </div>

       {/* Hidden PDF Render Container */}
       <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px' }}>
          <div ref={reportContentRef} className="bg-white p-12 text-zinc-900 leading-relaxed font-sans text-sm">
             <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                {preprocessMarkdownForPdf(state.reporting.generatedReport || '')}
             </ReactMarkdown>
          </div>
       </div>

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
