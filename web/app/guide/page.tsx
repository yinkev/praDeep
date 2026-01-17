'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
  Check,
  Compass,
  BookMarked,
  Brain,
  Lightbulb,
  Target,
  Zap,
  LayoutGrid,
  MoreVertical,
  MessageSquare,
  History,
  Send,
  Plus,
  RefreshCw,
  Bug,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/LoadingState'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

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

interface KnowledgePoint {
  knowledge_title: string
  knowledge_summary: string
  user_difficulty: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

interface SessionState {
  session_id: string | null
  notebook_id: string | null
  notebook_name: string
  knowledge_points: KnowledgePoint[]
  current_index: number
  current_html: string
  status: 'idle' | 'initialized' | 'learning' | 'completed'
  progress: number
  summary: string
}

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
}

// ============================================================================
// Components
// ============================================================================

function ProgressStep({ idx, activeIdx, label, isLast }: { idx: number; activeIdx: number; label: string; isLast?: boolean }) {
  const isCompleted = idx < activeIdx
  const isActive = idx === activeIdx

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300',
        isCompleted ? 'bg-success border-success text-white' : 
        isActive ? 'bg-accent-primary border-accent-primary text-white shadow-sm ring-4 ring-accent-primary/10' :
        'bg-surface-elevated border-border text-text-quaternary'
      )}>
        {isCompleted ? <Check size={12} /> : idx + 1}
      </div>
      <span className={cn(
        'text-[10px] font-bold uppercase tracking-widest hidden md:block',
        isActive ? 'text-text-primary' : 'text-text-tertiary'
      )}>
        {label}
      </span>
      {!isLast && <div className="w-6 h-px bg-border-subtle mx-1 hidden sm:block" />}
    </div>
  )
}

function KbItemCard({ point, idx, activeIdx }: { point: KnowledgePoint; idx: number; activeIdx: number }) {
  const isActive = idx === activeIdx
  const isCompleted = idx < activeIdx

  return (
    <div className={cn(
      'p-4 rounded-xl border transition-all duration-300',
      isActive ? 'bg-surface-secondary border-accent-primary/30 shadow-glass-sm ring-1 ring-accent-primary/10' :
      isCompleted ? 'bg-surface-base border-success/20 opacity-80' :
      'bg-surface-base border-border opacity-50'
    )}>
       <div className="flex items-start gap-3">
          <div className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border',
            isActive ? 'bg-accent-primary text-white border-accent-primary' :
            isCompleted ? 'bg-success text-white border-success' :
            'bg-surface-elevated text-text-tertiary border-border-subtle'
          )}>
            {isCompleted ? <Check size={12} /> : idx + 1}
          </div>
          <div className="min-w-0 flex-1">
             <h4 className={cn('text-xs font-bold uppercase tracking-tight truncate', isActive ? 'text-text-primary' : 'text-text-secondary')}>{point.knowledge_title}</h4>
             <p className="text-[10px] text-text-tertiary line-clamp-1 mt-1">{point.knowledge_summary}</p>
          </div>
          {isActive && <Zap size={14} className="text-accent-primary animate-pulse" />}
       </div>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function GuidePage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [sessionState, setSessionState] = useState<SessionState>({
    session_id: null,
    notebook_id: null,
    notebook_name: '',
    knowledge_points: [],
    current_index: -1,
    current_html: '',
    status: 'idle',
    progress: 0,
    summary: '',
  })

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const htmlFrameRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch(apiUrl('/api/v1/notebook/list'))
      .then(res => res.json())
      .then(data => setNotebooks((data.notebooks || []).filter((nb: Notebook) => nb.record_count > 0)))
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [chatMessages])

  const handleStartLearning = async () => {
    if (!sessionState.session_id) return
    setIsLoading(true)
    try {
      const res = await fetch(apiUrl('/api/v1/guide/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionState.session_id }),
      })
      const data = await res.json()
      if (data.success) {
        setSessionState(prev => ({
          ...prev,
          current_index: data.current_index,
          current_html: data.html || '',
          status: 'learning',
          progress: data.progress || 0,
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionState.session_id) return
    const msg = inputMessage
    setInputMessage('')
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg }])
    
    try {
      const res = await fetch(apiUrl('/api/v1/guide/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionState.session_id, message: msg }),
      })
      const data = await res.json()
      if (data.success) {
        setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.answer }])
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <PageWrapper maxWidth="full" showPattern={false} className="h-screen overflow-hidden px-0 py-0">
       <div className="h-full flex flex-col bg-surface-base">
          {/* Top Control Bar */}
          <header className="shrink-0 h-14 border-b border-border bg-surface-base px-6 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent-primary text-white flex items-center justify-center shadow-lg">
                    <GraduationCap size={18} />
                  </div>
                  <h1 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">Guide_Mode</h1>
                </div>
                
                {sessionState.status !== 'idle' && (
                  <div className="flex items-center gap-1">
                    <ProgressStep idx={0} activeIdx={2} label="Plan" />
                    <ProgressStep idx={1} activeIdx={2} label="Learn" />
                    <ProgressStep idx={2} activeIdx={2} label="Mastery" isLast />
                  </div>
                )}
             </div>

             <div className="flex items-center gap-3">
                {sessionState.status === 'learning' && (
                  <div className="flex items-center gap-4 px-4 py-1.5 rounded-full border border-border bg-surface-secondary/40">
                     <span className="text-[10px] font-mono font-bold text-text-tertiary">PROGRESS: {sessionState.progress}%</span>
                     <div className="w-24 h-1 bg-surface-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-accent-primary" style={{ width: `${sessionState.progress}%` }} />
                     </div>
                  </div>
                )}
                <IconButton
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  icon={sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
             </div>
          </header>

          <div className="flex-1 flex min-h-0 overflow-hidden">
             {/* Interaction Sidebar */}
             <AnimatePresence>
               {!sidebarCollapsed && (
                 <motion.aside
                   initial={{ width: 0, opacity: 0 }}
                   animate={{ width: 380, opacity: 1 }}
                   exit={{ width: 0, opacity: 0 }}
                   className="flex-shrink-0 border-r border-border bg-surface-secondary/10 flex flex-col overflow-hidden"
                 >
                    <div className="flex-1 flex flex-col min-h-0">
                       {sessionState.status === 'idle' ? (
                         <div className="p-6 space-y-8 h-full flex flex-col">
                            <div>
                               <h2 className="text-xl font-bold text-text-primary uppercase tracking-tight mb-2">Sync_Knowledge</h2>
                               <p className="text-xs text-text-tertiary font-mono uppercase tracking-tight">Select sources to generate learn_map</p>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3">
                               {notebooks.map(nb => (
                                 <Card key={nb.id} interactive={true} className="border-border bg-surface-base">
                                    <div className="p-4 flex items-center gap-4">
                                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nb.color }} />
                                       <div className="flex-1 min-w-0">
                                          <div className="text-xs font-bold uppercase truncate text-text-primary">{nb.name}</div>
                                          <div className="text-[10px] font-mono text-text-tertiary">{nb.record_count} RECS</div>
                                       </div>
                                       <IconButton
                                         aria-label={`Add ${nb.name} to plan`}
                                         icon={<Plus size={14} />}
                                         variant="secondary"
                                         size="sm"
                                         className="h-7 w-7 rounded-full"
                                         onClick={() => {}}
                                       />
                                    </div>
                                 </Card>
                               ))}
                            </div>
                            <Button variant="primary" className="w-full h-12 uppercase font-bold tracking-widest shadow-lg" iconRight={<ArrowRight size={16} />}>Generate_Plan</Button>
                         </div>
                       ) : (
                         <div className="h-full flex flex-col">
                            <div className="p-4 border-b border-border bg-surface-base">
                               <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Active_Path</span>
                               <div className="mt-4 space-y-2">
                                  {sessionState.knowledge_points.map((kp, i) => (
                                    <KbItemCard key={i} point={kp} idx={i} activeIdx={sessionState.current_index} />
                                  ))}
                               </div>
                            </div>
                            
                            {/* Chat Module */}
                            <div className="flex-1 flex flex-col min-h-0">
                               <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                                  {chatMessages.map(msg => (
                                    <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                       <div className={cn(
                                         'max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed border',
                                         msg.role === 'user' ? 'bg-accent-primary text-white border-accent-primary' : 'bg-surface-elevated border-border text-text-primary'
                                       )}>
                                          {msg.content}
                                       </div>
                                    </div>
                                  ))}
                               </div>
                               <div className="p-4 border-t border-border bg-surface-base">
                                  <div className="relative">
                                     <Input 
                                       placeholder="Query learning engine..." 
                                       value={inputMessage} 
                                       onChange={e => setInputMessage(e.target.value)} 
                                       className="pr-10 h-10 bg-surface-secondary/40 text-[11px] font-mono uppercase tracking-tight"
                                       onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                     />
                                     <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-primary hover:scale-110 transition-transform">
                                        <Send size={16} />
                                     </button>
                                  </div>
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                 </motion.aside>
               )}
             </AnimatePresence>

             {/* Dynamic Content Area */}
             <main className="flex-1 bg-surface-secondary/10 flex flex-col">
                {sessionState.status === 'idle' ? (
                  <div className="h-full flex items-center justify-center opacity-30 grayscale">
                     <div className="text-center max-w-sm px-12">
                        <Compass size={64} className="mx-auto mb-8 text-text-quaternary" />
                        <h2 className="text-2xl font-bold uppercase tracking-[0.2em] text-text-primary mb-4">Discovery_Pending</h2>
                        <p className="text-sm font-mono uppercase tracking-widest leading-loose">Initialize sources in the interaction panel to generate the learning topology.</p>
                     </div>
                  </div>
                ) : (
                  <div className="h-full relative overflow-hidden">
                     <iframe
                       ref={htmlFrameRef}
                       className="w-full h-full border-none bg-white dark:bg-zinc-950"
                       title="Learning Content"
                     />
                     
                     <div className="absolute bottom-8 right-8 flex items-center gap-3">
                        <Button variant="outline" size="sm" iconLeft={<Bug size={14} />} className="bg-surface-base/80 backdrop-blur-md font-mono text-[10px] uppercase">Fix_Ui</Button>
                        <Button variant="primary" size="lg" onClick={handleStartLearning} className="h-12 px-8 shadow-2xl font-bold uppercase tracking-widest" iconRight={<ArrowRight size={18} />}>
                          {sessionState.status === 'initialized' ? 'START_LEARNING' : 'NEXT_CONCEPT'}
                        </Button>
                     </div>
                  </div>
                )}
             </main>
          </div>
       </div>
    </PageWrapper>
  )
}
