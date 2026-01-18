'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Activity, 
  Book, 
  Brain, 
  FileText, 
  Search, 
  Send, 
  Trash2, 
  X, 
  Zap,
  ChevronDown,
  Clock,
  Terminal,
  AlertCircle,
  Database,
  History,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/LoadingState'
import MediaUpload from '@/components/ui/MediaUpload'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { useGlobal, type MediaItem } from '@/context/GlobalContext'
import { API_BASE_URL, apiUrl } from '@/lib/api'
import { parseKnowledgeBaseList } from '@/lib/knowledge'
import { processLatexContent } from '@/lib/latex'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/EmptyState'

// ============================================================================
// Helpers & Types
// ============================================================================

type SolverRun = {
  id: string
  user: { content: string; media?: MediaItem[] }
  assistant?: { content: string; outputDir?: string }
}

const resolveArtifactUrl = (url?: string | null, outputDir?: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const normalized = url.replace(/^\.\//, '')
  if (normalized.startsWith('/api/outputs/')) return `${API_BASE_URL}${normalized}`
  if (normalized.startsWith('api/outputs/')) return `${API_BASE_URL}/${normalized}`
  if (normalized.startsWith('artifacts/') && outputDir) return `${API_BASE_URL}/api/outputs/solve/${outputDir}/${normalized}`
  return url
}

// ============================================================================
// Components
// ============================================================================

function TraceLine({ content, level }: { content: string; level?: string }) {
  let cleanContent = content.replace(/^INFO:[^:]+:/, '').replace(/^ERROR:[^:]+:INFO:/, 'INFO:')
  const isError = (level === 'ERROR' || cleanContent.includes('ERROR') || cleanContent.includes('X')) && !cleanContent.includes('INFO:')
  
  if (/^={20,}$/.test(cleanContent.trim())) return null

  return (
    <div className={cn(
      'rounded-lg border-l-2 px-3 py-2 text-[10px] font-mono leading-relaxed backdrop-blur-sm transition-all duration-300',
      isError 
        ? 'bg-error-muted/10 border-error/50 text-error shadow-sm' 
        : 'bg-surface-secondary/40 border-border text-text-secondary'
    )}>
      {cleanContent}
    </div>
  )
}

function StageIndicator({ stage, isSolving }: { stage: string | null; isSolving: boolean }) {
  if (!isSolving) {
    return (
      <Badge variant="outline" className="border-border bg-surface-elevated text-text-tertiary px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-text-quaternary" />
        System_Idle
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary border-accent-primary/20 px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-widest gap-2">
      <Spinner size="sm" className="text-accent-primary" />
      {stage || 'PROCESS_EXEC'}
    </Badge>
  )
}

// ============================================================================
// Page
// ============================================================================

export default function SolverPage() {
  const { solverState, setSolverState, startSolver, stopSolver } = useGlobal()
  const [draft, setDraft] = useState('')
  const [draftMedia, setDraftMedia] = useState<MediaItem[]>([])
  const [kbs, setKbs] = useState<string[]>([])
  const [isTraceOpen, setIsTraceOpen] = useState(false)
  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [notebookRecord, setNotebookRecord] = useState<{ title: string; userQuery: string; output: string } | null>(null)

  const runsEndRef = useRef<HTMLDivElement>(null)
  const traceContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        const kbsList = parseKnowledgeBaseList(data)
        const names = kbsList.map(kb => kb.name)
        setKbs(names)
        setSolverState(prev => ({
          ...prev,
          selectedKb: prev.selectedKb || kbsList.find(kb => kb.is_default)?.name || names[0] || ''
        }))
      })
  }, [setSolverState])

  const runs: SolverRun[] = useMemo(() => {
    const built: SolverRun[] = []
    const messages = solverState.messages
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (msg.role !== 'user') continue
      const next = messages[i + 1]
      const assistant = next?.role === 'assistant' ? next : undefined
      built.push({
        id: `${i}-${msg.content.slice(0, 24)}`,
        user: { content: msg.content, media: msg.media },
        assistant: assistant ? { content: assistant.content, outputDir: assistant.outputDir } : undefined,
      })
      if (assistant) i++
    }
    return built
  }, [solverState.messages])

  useEffect(() => {
    runsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [solverState.messages.length, solverState.isSolving])

  const handleSolve = () => {
    if ((!draft.trim() && draftMedia.length === 0) || !solverState.selectedKb || solverState.isSolving) return
    startSolver(draft, solverState.selectedKb, draftMedia.length > 0 ? draftMedia : undefined)
    setDraft('')
    setDraftMedia([])
  }

  return (
    <PageWrapper maxWidth="full" showPattern={false} className="h-screen overflow-hidden px-0 py-0">
      <div className="h-full flex flex-col bg-surface-base">
        <header className="shrink-0 h-14 border-b border-border bg-surface-base/80 backdrop-blur-md px-6 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-sm border border-accent-primary/20">
                  <Zap size={16} />
                </div>
                <h1 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">Solver_Engine</h1>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <StageIndicator stage={solverState.progress.stage} isSolving={solverState.isSolving} />

              <div className="flex items-center gap-2 bg-surface-elevated border border-border-subtle px-3 py-1.5 rounded-xl shadow-sm">
                <Database size={12} className="text-text-quaternary" />
                <label htmlFor="solver-kb-select" className="sr-only">Knowledge Base</label>
                <select
                  id="solver-kb-select"
                  value={solverState.selectedKb}
                  onChange={e => setSolverState(prev => ({ ...prev, selectedKb: e.target.value }))}
                  className="bg-transparent text-[10px] font-mono font-bold uppercase text-text-secondary outline-none appearance-none cursor-pointer pr-1"
                >
                  {kbs.map(kb => (
                    <option key={kb} value={kb}>{kb}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="text-text-quaternary" />
              </div>


              <IconButton
                aria-label="Clear solver messages"
                icon={<Trash2 size={16} />}
                variant="ghost"
                size="sm"
                onClick={() => setSolverState(p => ({...p, messages: [], logs: []}))}
                className="text-text-tertiary hover:text-error"
              />
           </div>
        </header>

        <div className="flex-1 min-h-0 flex overflow-hidden">
           {/* Primary Workspace */}
           <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,rgba(var(--color-border-subtle),0.5)_1px,transparent_0)] bg-[length:32px_32px]">
              <div className="max-w-4xl mx-auto py-12 px-8 space-y-12">
                 {/* Input Module */}
                 <Card interactive={false} className="border-border bg-surface-base/90 backdrop-blur-md shadow-glass-sm overflow-visible">
                    <div className="p-1 border-b border-border-subtle flex items-center justify-between px-6 py-3 bg-surface-secondary/20">
                       <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Problem_Spec</span>
                       <span className="text-[10px] font-mono text-text-quaternary">READY_TO_RECEIVE</span>
                    </div>
                    <CardBody className="p-6 space-y-6">
                       <Textarea
                         placeholder="DESCRIBE_CONSTRAINTS_AND_QUERY..."
                         minRows={5}
                         maxRows={12}
                         value={draft}
                         onChange={e => setDraft(e.target.value)}
                         className="bg-transparent text-lg font-bold border-none shadow-none focus-visible:ring-0 p-0 tracking-tight placeholder:opacity-30 uppercase"
                       />
                       <MediaUpload media={draftMedia} onMediaChange={setDraftMedia} maxFiles={5} />
                    </CardBody>
                    <CardFooter className="p-4 bg-surface-secondary/20 border-t border-border-subtle flex items-center justify-between">
                       <div className="flex items-center gap-2 text-[10px] font-mono text-text-tertiary uppercase">
                          <Terminal size={12} />
                          CMD_ENTER_TO_EXEC
                       </div>
                       <Button
                         variant="primary"
                         onClick={handleSolve}
                         disabled={(!draft.trim() && draftMedia.length === 0) || solverState.isSolving}
                         className="h-10 px-8 uppercase font-bold tracking-widest shadow-lg"
                         iconLeft={solverState.isSolving ? <Spinner size="sm" /> : <Sparkles size={14} />}
                       >
                         {solverState.isSolving ? 'Solving...' : 'Solve'}
                       </Button>
                    </CardFooter>
                 </Card>

                 {/* Runs Stack */}
                 <div className="space-y-6">
                    {runs.length === 0 && !solverState.isSolving ? (
                      <EmptyState icon={<Sparkles size={24} />} title="Workspace Idle" description="Define a problem to begin step-by-step solving." />
                    ) : (
                      runs.map((run, i) => (
                        <motion.div key={run.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                           <Card interactive={false} className="border-border bg-surface-base shadow-sm">
                              <CardHeader className="bg-surface-secondary/20 border-b border-border-subtle px-6 py-4 flex-row items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-mono font-bold text-text-tertiary">#{i+1}</div>
                                    <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest truncate max-w-[400px]">{run.user.content || 'UNTITLED_RUN'}</h3>
                                 </div>
                                 <IconButton 
                                    aria-label="More options"
                                    icon={<MoreVertical size={14} />} 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7" 
                                 />
                              </CardHeader>
                              <CardBody className="p-8 prose prose-slate dark:prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-widest">
                                 {run.assistant ? (
                                   <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                      {processLatexContent(run.assistant.content)}
                                   </ReactMarkdown>
                                 ) : (
                                   <div className="flex flex-col items-center justify-center py-12 gap-4">
                                      <Spinner size="lg" className="text-accent-primary" />
                                      <p className="text-[10px] font-mono text-accent-primary uppercase tracking-[0.2em] animate-pulse">Processing_Inference...</p>
                                   </div>
                                 )}
                              </CardBody>
                              {run.assistant && (
                                <CardFooter className="bg-surface-secondary/10 border-t border-border-subtle px-6 py-3 flex items-center justify-between">
                                   <div className="text-[9px] font-mono text-text-quaternary uppercase tracking-widest flex items-center gap-2">
                                      <History size={10} />
                                      Verified solution output
                                   </div>
                                   <Button variant="ghost" size="sm" iconLeft={<Book size={12} />} onClick={() => { setNotebookRecord({ title: run.user.content.slice(0, 30), userQuery: run.user.content, output: run.assistant!.content }); setShowNotebookModal(true); }} className="text-[10px] font-mono uppercase tracking-widest text-accent-primary">Save to Notebook</Button>
                                </CardFooter>
                              )}
                           </Card>
                        </motion.div>
                      ))
                    )}
                    <div ref={runsEndRef} />
                 </div>
              </div>
           </main>

           {/* Trace Panel */}
           <aside className="w-[360px] flex-shrink-0 border-l border-border bg-surface-base flex flex-col min-h-0 shadow-xl z-10">
              <div className="px-6 py-5 border-b border-border bg-surface-secondary/10 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-tertiary">
                       <Activity size={16} />
                    </div>
                    <div>
                       <div className="text-xs font-bold text-text-primary uppercase tracking-widest">Trace_Log</div>
                       <div className="text-[9px] font-mono text-text-tertiary uppercase">{solverState.logs.length} ENTRIES</div>
                    </div>
                 </div>
                 {solverState.isSolving && <Spinner size="sm" className="text-accent-primary" />}
              </div>
              <div ref={traceContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-secondary/5">
                 {solverState.logs.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-24 gap-3 opacity-20 grayscale">
                      <Terminal size={32} />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting_Stream</p>
                   </div>
                 ) : (
                   solverState.logs.map((log, idx) => (
                     <TraceLine key={idx} content={log.content || ''} level={log.level} />
                   ))
                 )}
              </div>
              
              <div className="p-4 border-t border-border bg-surface-base">
                 <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl border border-border bg-surface-secondary/20">
                       <div className="text-[8px] font-bold text-text-tertiary uppercase mb-1">TOKENS</div>
                       <div className="text-xs font-mono font-bold text-text-primary">{solverState.tokenStats.tokens.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-surface-secondary/20">
                       <div className="text-[8px] font-bold text-text-tertiary uppercase mb-1">COST_USD</div>
                       <div className="text-xs font-mono font-bold text-accent-primary">${solverState.tokenStats.cost.toFixed(4)}</div>
                    </div>
                 </div>
              </div>
           </aside>
        </div>

        {notebookRecord && (
          <AddToNotebookModal
            isOpen={showNotebookModal}
            onClose={() => setShowNotebookModal(false)}
            recordType="solve"
            title={notebookRecord.title}
            userQuery={notebookRecord.userQuery}
            output={notebookRecord.output}
            kbName={solverState.selectedKb}
          />
        )}
      </div>
    </PageWrapper>
  )
}
