'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  BookOpen,
  MessageSquare,
  Send,
  ChevronRight,
  ChevronDown,
  Bug,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Play,
  ChevronLeft,
  X,
  Check,
  Compass,
  BookMarked,
  Brain,
  Lightbulb,
  Target,
  Zap,
} from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import PageWrapper from '@/components/ui/PageWrapper'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Spinner, PulseDots } from '@/components/ui/LoadingState'

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

interface SelectedRecord extends NotebookRecord {
  notebookId: string
  notebookName: string
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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
}

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const pulseGlow: Variants = {
  initial: { boxShadow: '0 0 0 0 rgba(20, 184, 166, 0)' },
  animate: {
    boxShadow: ['0 0 0 0 rgba(20, 184, 166, 0.4)', '0 0 0 12px rgba(20, 184, 166, 0)'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeOut' as const,
    },
  },
}

// ============================================================================
// Progress Indicator Component
// ============================================================================

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  progress: number
  status: 'idle' | 'initialized' | 'learning' | 'completed'
}

function ProgressIndicator({ currentStep, totalSteps, progress, status }: ProgressIndicatorProps) {
  const steps = [
    { id: 'select', label: 'Select', icon: BookOpen },
    { id: 'plan', label: 'Plan', icon: Target },
    { id: 'learn', label: 'Learn', icon: Brain },
    { id: 'complete', label: 'Complete', icon: CheckCircle2 },
  ]

  const getStepIndex = () => {
    switch (status) {
      case 'idle':
        return 0
      case 'initialized':
        return 1
      case 'learning':
        return 2
      case 'completed':
        return 3
      default:
        return 0
    }
  }

  const activeStep = getStepIndex()

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isCompleted = index < activeStep
        const isCurrent = index === activeStep

        return (
          <div key={step.id} className="flex items-center gap-2">
            <motion.div
              className={`
                relative flex items-center justify-center w-8 h-8 rounded-full
                transition-all duration-300
                ${
                  isCurrent
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                    : isCompleted
                      ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }
              `}
              variants={isCurrent ? pulseGlow : undefined}
              initial="initial"
              animate={isCurrent ? 'animate' : 'initial'}
            >
              <Icon className="w-4 h-4" />
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-teal-400/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
            <span
              className={`
              text-xs font-medium hidden md:block
              ${
                isCurrent
                  ? 'text-teal-600 dark:text-teal-400'
                  : isCompleted
                    ? 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-400 dark:text-slate-500'
              }
            `}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="hidden sm:flex items-center">
                <div
                  className={`w-8 h-0.5 ${
                    isCompleted ? 'bg-teal-400 dark:bg-teal-500' : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Knowledge Point Card Component
// ============================================================================

interface KnowledgePointCardProps {
  point: KnowledgePoint
  index: number
  currentIndex: number
  total: number
}

function KnowledgePointCard({ point, index, currentIndex, total }: KnowledgePointCardProps) {
  const isActive = index === currentIndex
  const isCompleted = index < currentIndex
  const isPending = index > currentIndex

  const difficultyColors = {
    easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50',
    medium:
      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/50',
    hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200/50',
  }

  const difficulty = (point.user_difficulty?.toLowerCase() || 'medium') as
    | 'easy'
    | 'medium'
    | 'hard'
  const difficultyClass = difficultyColors[difficulty] || difficultyColors.medium

  return (
    <motion.div
      variants={fadeInUp}
      className={`
        relative px-4 py-3 rounded-xl
        transition-all duration-300
        ${
          isActive
            ? 'bg-teal-50/80 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 shadow-lg shadow-teal-500/10'
            : isCompleted
              ? 'bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50'
              : 'bg-white/30 dark:bg-slate-800/20 border border-slate-200/30 dark:border-slate-700/30'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Step indicator */}
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${
              isCompleted
                ? 'bg-teal-500 text-white'
                : isActive
                  ? 'bg-teal-500 text-white animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }
          `}
        >
          {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={`
              text-sm font-semibold truncate
              ${
                isActive
                  ? 'text-teal-700 dark:text-teal-300'
                  : isCompleted
                    ? 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-500 dark:text-slate-500'
              }
            `}
            >
              {point.knowledge_title}
            </h4>
            {point.user_difficulty && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${difficultyClass}`}>
                {point.user_difficulty}
              </span>
            )}
          </div>
          <p
            className={`
            text-xs line-clamp-2
            ${
              isActive
                ? 'text-teal-600/80 dark:text-teal-400/80'
                : 'text-slate-400 dark:text-slate-500'
            }
          `}
          >
            {point.knowledge_summary}
          </p>
        </div>

        {/* Status indicator */}
        {isActive && (
          <motion.div
            className="flex-shrink-0"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Zap className="w-4 h-4 text-teal-500" />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Chat Message Component
// ============================================================================

interface MessageProps {
  message: ChatMessage
}

function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isLoading = isSystem && message.content.includes('\u23F3')

  const markdownComponents: Components = {
    table: ({ ...props }) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <table
          className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm"
          {...props}
        />
      </div>
    ),
    thead: ({ ...props }) => <thead className="bg-slate-50 dark:bg-slate-800" {...props} />,
    th: ({ ...props }) => (
      <th
        className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-200 dark:border-slate-700"
        {...props}
      />
    ),
    tbody: ({ ...props }) => (
      <tbody
        className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900"
        {...props}
      />
    ),
    td: ({ ...props }) => (
      <td
        className="px-3 py-2 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800"
        {...props}
      />
    ),
    tr: ({ ...props }) => (
      <tr
        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
        {...props}
      />
    ),
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <Card
          variant={isUser ? 'default' : isLoading ? 'outlined' : 'glass'}
          interactive={false}
          className={`
            ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}
            ${isLoading ? 'border-amber-300/50 dark:border-amber-600/50 bg-amber-50/30 dark:bg-amber-900/20' : ''}
            ${isSystem && !isLoading ? 'border-blue-300/50 dark:border-blue-600/50 bg-blue-50/30 dark:bg-blue-900/20' : ''}
          `}
        >
          <CardBody className="py-3 px-4">
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
              >
                {processLatexContent(message.content)}
              </ReactMarkdown>
            </div>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Main Guide Page Component
// ============================================================================

export default function GuidePage() {
  // Multi-notebook selection
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set())
  const [notebookRecordsMap, setNotebookRecordsMap] = useState<Map<string, NotebookRecord[]>>(
    new Map()
  )
  const [selectedRecords, setSelectedRecords] = useState<Map<string, SelectedRecord>>(new Map())
  const [loadingNotebooks, setLoadingNotebooks] = useState(true)
  const [loadingRecordsFor, setLoadingRecordsFor] = useState<Set<string>>(new Set())

  // Session state
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

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // UI state
  const [showDebugModal, setShowDebugModal] = useState(false)
  const [debugDescription, setDebugDescription] = useState('')
  const [fixingHtml, setFixingHtml] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWide, setSidebarWide] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const htmlFrameRef = useRef<HTMLIFrameElement>(null)

  // Load notebooks
  useEffect(() => {
    fetchNotebooks()
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatMessages])

  // Helper function to inject KaTeX into HTML
  const injectKaTeX = (html: string): string => {
    const htmlLower = html.toLowerCase()
    const hasKaTeX =
      htmlLower.includes('katex.min.css') ||
      htmlLower.includes('katex.min.js') ||
      htmlLower.includes('katex@') ||
      htmlLower.includes('cdn.jsdelivr.net/npm/katex') ||
      htmlLower.includes('unpkg.com/katex')

    if (hasKaTeX) return html

    const katexCSS =
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous">'
    const katexJS =
      '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8" crossorigin="anonymous"></script>'
    const katexAutoRender =
      '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" integrity="sha384-+VBxd3r6XgURycqtZ117n7w6ODWgRrA7TlVzRsFtwW3ZxUo8h4w20Z5J3d3xjfcw" crossorigin="anonymous" onload="renderMathInElement(document.body);"></script>'

    const katexInjection = `  ${katexCSS}\n  ${katexJS}\n  ${katexAutoRender}`

    if (html.includes('</head>')) {
      return html.replace('</head>', `${katexInjection}\n</head>`)
    }

    if (html.includes('<head>')) {
      return html.replace(/<head([^>]*)>/i, `<head$1>\n${katexInjection}`)
    }

    if (html.includes('<html')) {
      return html.replace(
        /(<html[^>]*>)/i,
        `$1\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n${katexInjection}\n</head>`
      )
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${katexInjection}
</head>
<body>
${html}
</body>
</html>`
  }

  // Update HTML iframe
  useEffect(() => {
    if (!sessionState.current_html) return

    const timer = setTimeout(() => {
      if (htmlFrameRef.current) {
        const iframe = htmlFrameRef.current
        const htmlWithKaTeX = injectKaTeX(sessionState.current_html)

        try {
          iframe.srcdoc = htmlWithKaTeX
        } catch (e) {
          console.warn('srcdoc not supported:', e)
          const handleLoad = () => {
            try {
              const doc = iframe.contentDocument || iframe.contentWindow?.document
              if (doc) {
                doc.open()
                doc.write(htmlWithKaTeX)
                doc.close()
              }
            } catch (err) {
              console.error('Failed to write to iframe:', err)
            }
          }

          if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            handleLoad()
          } else {
            iframe.onload = handleLoad
          }
        }
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [sessionState.current_html, sessionState.current_index])

  const addLoadingMessage = (message: string) => {
    const loadingMsg: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'system',
      content: `\u23F3 ${message}`,
      timestamp: Date.now(),
    }
    setChatMessages(prev => [...prev, loadingMsg])
    return loadingMsg.id
  }

  const removeLoadingMessage = (id: string) => {
    setChatMessages(prev => prev.filter(msg => msg.id !== id))
  }

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
    if (notebookRecordsMap.has(notebookId)) return

    setLoadingRecordsFor(prev => {
      const newSet = new Set(prev)
      newSet.add(notebookId)
      return newSet
    })
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solve':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50'
      case 'question':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200/50'
      case 'research':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/50'
      case 'co_writer':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/50'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/50'
    }
  }

  const handleCreateSession = async () => {
    if (selectedRecords.size === 0) return

    setIsLoading(true)
    setLoadingMessage('Analyzing notes and generating learning plan...')
    const loadingId = addLoadingMessage('Analyzing notes and generating learning plan...')

    try {
      const recordsArray = Array.from(selectedRecords.values()).map(r => ({
        id: r.id,
        title: r.title,
        user_query: r.user_query,
        output: r.output,
        type: r.type,
      }))

      const res = await fetch(apiUrl('/api/v1/guide/create_session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsArray }),
      })
      const data = await res.json()

      removeLoadingMessage(loadingId)
      setIsLoading(false)
      setLoadingMessage('')

      if (data.success) {
        const notebookNames = Array.from(
          new Set(Array.from(selectedRecords.values()).map(r => r.notebookName))
        )
        const notebookName =
          notebookNames.length === 1
            ? notebookNames[0]
            : `Cross-Notebook (${notebookNames.length} notebooks, ${selectedRecords.size} records)`

        setSessionState({
          session_id: data.session_id,
          notebook_id: 'cross_notebook',
          notebook_name: notebookName,
          knowledge_points: data.knowledge_points || [],
          current_index: -1,
          current_html: '',
          status: 'initialized',
          progress: 0,
          summary: '',
        })

        const planMessage = `**Learning plan generated with ${data.total_points} knowledge points:**\n\n${data.knowledge_points.map((kp: KnowledgePoint, idx: number) => `${idx + 1}. **${kp.knowledge_title}**`).join('\n')}\n\nClick **Start Learning** to begin your journey!`
        setChatMessages([
          {
            id: 'plan',
            role: 'system',
            content: planMessage,
            timestamp: Date.now(),
          },
        ])
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'system',
            content: `Failed to create session: ${data.error}`,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (err) {
      removeLoadingMessage(loadingId)
      setIsLoading(false)
      setLoadingMessage('')
      console.error('Failed to create session:', err)
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Failed to create session, please try again later',
          timestamp: Date.now(),
        },
      ])
    }
  }

  const handleStartLearning = async () => {
    if (!sessionState.session_id) return

    setIsLoading(true)
    setLoadingMessage('Generating interactive learning page...')
    const loadingId = addLoadingMessage('Generating interactive learning page...')

    try {
      const res = await fetch(apiUrl('/api/v1/guide/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionState.session_id }),
      })
      const data = await res.json()

      removeLoadingMessage(loadingId)
      setIsLoading(false)
      setLoadingMessage('')

      if (data.success) {
        const htmlContent = data.html || ''

        setSessionState(prev => ({
          ...prev,
          current_index: data.current_index,
          current_html: htmlContent,
          status: 'learning',
          progress: data.progress || 0,
        }))

        setChatMessages(prev => [
          ...prev,
          {
            id: `start-${Date.now()}`,
            role: 'system',
            content: data.message || 'Starting the first knowledge point',
            timestamp: Date.now(),
          },
        ])
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'system',
            content: `Failed to start learning: ${data.error || 'Unknown error'}`,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (err) {
      removeLoadingMessage(loadingId)
      setIsLoading(false)
      setLoadingMessage('')
      console.error('Failed to start learning:', err)
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Failed to start learning, please try again later',
          timestamp: Date.now(),
        },
      ])
    }
  }

  const handleNextKnowledge = async () => {
    if (!sessionState.session_id) return

    setIsLoading(true)
    setLoadingMessage('Generating next knowledge point...')
    const loadingId = addLoadingMessage('Generating next knowledge point...')

    try {
      const res = await fetch(apiUrl('/api/v1/guide/next'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionState.session_id }),
      })
      const data = await res.json()

      removeLoadingMessage(loadingId)
      setIsLoading(false)
      setLoadingMessage('')

      if (data.success) {
        if (data.status === 'completed') {
          setSessionState(prev => ({
            ...prev,
            status: 'completed',
            summary: data.summary || '',
            progress: 100,
          }))

          setChatMessages(prev => [
            ...prev,
            {
              id: `complete-${Date.now()}`,
              role: 'system',
              content: data.message || 'Congratulations on completing all knowledge points!',
              timestamp: Date.now(),
            },
          ])
        } else {
          setSessionState(prev => ({
            ...prev,
            current_index: data.current_index,
            current_html: data.html || '',
            progress: data.progress || 0,
          }))

          setChatMessages(prev => [
            ...prev,
            {
              id: `next-${Date.now()}`,
              role: 'system',
              content: data.message || 'Moving to next knowledge point',
              timestamp: Date.now(),
            },
          ])
        }
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'system',
            content: `Failed to move to next: ${data.error || 'Unknown error'}`,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (err) {
      removeLoadingMessage(loadingId)
      setIsLoading(false)
      setLoadingMessage('')
      console.error('Failed to move to next:', err)
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Failed to move to next, please try again later',
          timestamp: Date.now(),
        },
      ])
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionState.session_id || sendingMessage) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: Date.now(),
    }

    setChatMessages(prev => [...prev, userMsg])
    const userInput = inputMessage
    setInputMessage('')
    setSendingMessage(true)

    const thinkingId = addLoadingMessage('Thinking...')

    try {
      const res = await fetch(apiUrl('/api/v1/guide/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionState.session_id,
          message: userInput,
        }),
      })
      const data = await res.json()

      removeLoadingMessage(thinkingId)

      if (data.success) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.answer || '',
            timestamp: Date.now(),
          },
        ])
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Error: ${data.error || 'Failed to respond'}`,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (err) {
      removeLoadingMessage(thinkingId)
      console.error('Failed to send message:', err)
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Failed to send message, please try again later',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFixHtml = async () => {
    if (!sessionState.session_id || !debugDescription.trim() || fixingHtml) return

    setFixingHtml(true)
    const loadingId = addLoadingMessage('Fixing HTML page...')

    try {
      const res = await fetch(apiUrl('/api/v1/guide/fix_html'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionState.session_id,
          bug_description: debugDescription,
        }),
      })
      const data = await res.json()

      removeLoadingMessage(loadingId)

      if (data.success) {
        setSessionState(prev => ({
          ...prev,
          current_html: data.html || prev.current_html,
        }))
        setShowDebugModal(false)
        setDebugDescription('')
        setChatMessages(prev => [
          ...prev,
          {
            id: `fix-${Date.now()}`,
            role: 'system',
            content: 'HTML page has been fixed!',
            timestamp: Date.now(),
          },
        ])
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'system',
            content: `Fix failed: ${data.error || 'Unknown error'}`,
            timestamp: Date.now(),
          },
        ])
      }
    } catch (err) {
      removeLoadingMessage(loadingId)
      console.error('Failed to fix HTML:', err)
      setChatMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Fix failed, please try again later',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setFixingHtml(false)
    }
  }

  const canStart = sessionState.status === 'initialized' && sessionState.knowledge_points.length > 0
  const canNext =
    sessionState.status === 'learning' &&
    sessionState.current_index < sessionState.knowledge_points.length - 1
  const isCompleted = sessionState.status === 'completed'
  const isLastKnowledge =
    sessionState.status === 'learning' &&
    sessionState.current_index === sessionState.knowledge_points.length - 1

  const leftWidthPercent = sidebarCollapsed ? 0 : sidebarWide ? 75 : 30
  const rightWidthPercent = sidebarCollapsed ? 100 : sidebarWide ? 25 : 70

  return (
    <PageWrapper maxWidth="full" showPattern className="!p-0 h-screen overflow-hidden">
      <div className="h-full flex relative">
        {/* LEFT PANEL: Selection & Chat */}
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          animate="visible"
          className={`flex flex-col h-full transition-all duration-300 flex-shrink-0 border-r border-slate-200/60 dark:border-slate-700/60 ${sidebarCollapsed ? 'overflow-hidden w-0' : ''}`}
          style={{
            width: sidebarCollapsed ? 0 : `${leftWidthPercent}%`,
            minWidth: sidebarCollapsed ? 0 : '320px',
            maxWidth: sidebarCollapsed ? 0 : '600px',
          }}
        >
          {/* Header with Progress */}
          <div className="shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="px-4 py-3 flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20"
                whileHover={{ scale: 1.05 }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Guided Learning
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sessionState.status === 'idle'
                    ? 'Select materials to start'
                    : `${sessionState.knowledge_points.length} knowledge points`}
                </p>
              </div>
            </div>
            <ProgressIndicator
              currentStep={sessionState.current_index + 1}
              totalSteps={sessionState.knowledge_points.length}
              progress={sessionState.progress}
              status={sessionState.status}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Notebook Selection (idle state) */}
            <AnimatePresence>
              {sessionState.status === 'idle' && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <Card
                    variant="glass"
                    interactive={false}
                    className="m-4 flex-1 flex flex-col overflow-hidden"
                  >
                    <CardHeader className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Select Source Materials
                        </span>
                      </div>
                      {selectedRecords.size > 0 && (
                        <button
                          onClick={clearAllSelections}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          Clear ({selectedRecords.size})
                        </button>
                      )}
                    </CardHeader>

                    <CardBody className="flex-1 overflow-y-auto p-0">
                      {loadingNotebooks ? (
                        <div className="flex items-center justify-center py-12">
                          <Spinner size="lg" label="Loading notebooks..." />
                        </div>
                      ) : notebooks.length === 0 ? (
                        <div className="p-6 text-center">
                          <Compass className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-400 dark:text-slate-500">
                            No notebooks with records found
                          </p>
                        </div>
                      ) : (
                        <motion.div
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                          className="divide-y divide-slate-100 dark:divide-slate-700/50"
                        >
                          {notebooks.map(notebook => {
                            const isExpanded = expandedNotebooks.has(notebook.id)
                            const records = notebookRecordsMap.get(notebook.id) || []
                            const isRecordsLoading = loadingRecordsFor.has(notebook.id)
                            const selectedFromThis = records.filter(r =>
                              selectedRecords.has(r.id)
                            ).length

                            return (
                              <motion.div key={notebook.id} variants={fadeInUp}>
                                {/* Notebook Header */}
                                <div
                                  className="p-3 flex items-center gap-2 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                  onClick={() => toggleNotebookExpanded(notebook.id)}
                                >
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                  </motion.div>
                                  <div
                                    className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-800 shadow"
                                    style={{ backgroundColor: notebook.color || '#94a3b8' }}
                                  />
                                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {notebook.name}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {selectedFromThis > 0 && (
                                      <span className="text-teal-600 dark:text-teal-400 font-medium">
                                        {selectedFromThis}/
                                      </span>
                                    )}
                                    {notebook.record_count}
                                  </span>
                                </div>

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
                                      <div className="pl-8 pr-3 pb-3 bg-slate-50/30 dark:bg-slate-800/20">
                                        {isRecordsLoading ? (
                                          <div className="flex items-center justify-center py-6">
                                            <Spinner size="sm" label="Loading..." />
                                          </div>
                                        ) : records.length === 0 ? (
                                          <div className="py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                                            No records
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex gap-2 mb-2 py-1">
                                              <button
                                                onClick={e => {
                                                  e.stopPropagation()
                                                  selectAllFromNotebook(notebook.id, notebook.name)
                                                }}
                                                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                                              >
                                                Select All
                                              </button>
                                              <span className="text-slate-300 dark:text-slate-600">
                                                |
                                              </span>
                                              <button
                                                onClick={e => {
                                                  e.stopPropagation()
                                                  deselectAllFromNotebook(notebook.id)
                                                }}
                                                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                              >
                                                Deselect
                                              </button>
                                            </div>
                                            <motion.div
                                              variants={staggerContainer}
                                              initial="hidden"
                                              animate="visible"
                                              className="space-y-1"
                                            >
                                              {records.map(record => (
                                                <motion.div
                                                  key={record.id}
                                                  variants={fadeInUp}
                                                  onClick={e => {
                                                    e.stopPropagation()
                                                    toggleRecordSelection(
                                                      record,
                                                      notebook.id,
                                                      notebook.name
                                                    )
                                                  }}
                                                  className={`
                                                    p-2 rounded-lg cursor-pointer transition-all border
                                                    ${
                                                      selectedRecords.has(record.id)
                                                        ? 'bg-teal-50/80 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700 shadow-sm'
                                                        : 'bg-white/50 dark:bg-slate-800/30 border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800/50'
                                                    }
                                                  `}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <motion.div
                                                      className={`
                                                        w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all
                                                        ${
                                                          selectedRecords.has(record.id)
                                                            ? 'bg-teal-500 border-teal-500 text-white'
                                                            : 'border-slate-300 dark:border-slate-600'
                                                        }
                                                      `}
                                                      animate={
                                                        selectedRecords.has(record.id)
                                                          ? { scale: [1, 1.2, 1] }
                                                          : {}
                                                      }
                                                      transition={{ duration: 0.2 }}
                                                    >
                                                      {selectedRecords.has(record.id) && (
                                                        <Check className="w-2.5 h-2.5" />
                                                      )}
                                                    </motion.div>
                                                    <div className="flex-1 min-w-0">
                                                      <span
                                                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getTypeColor(record.type)}`}
                                                      >
                                                        {record.type}
                                                      </span>
                                                      <span className="text-xs text-slate-700 dark:text-slate-200 ml-2 truncate">
                                                        {record.title}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              ))}
                                            </motion.div>
                                          </>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      )}
                    </CardBody>

                    <CardFooter>
                      <Button
                        onClick={handleCreateSession}
                        loading={isLoading}
                        disabled={selectedRecords.size === 0}
                        iconLeft={<Sparkles className="w-4 h-4" />}
                        className="w-full"
                      >
                        Generate Learning Plan ({selectedRecords.size} items)
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress & Knowledge Points (initialized/learning state) */}
            {sessionState.status !== 'idle' && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Progress Bar */}
                <div className="px-4 py-3 shrink-0">
                  <Card variant="glass" interactive={false}>
                    <CardBody className="py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Learning Progress
                        </span>
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                          {sessionState.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${sessionState.progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      {sessionState.knowledge_points.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Point {Math.max(0, sessionState.current_index + 1)} of{' '}
                          {sessionState.knowledge_points.length}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        {canStart && (
                          <Button
                            onClick={handleStartLearning}
                            loading={isLoading}
                            iconLeft={<Play className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Start Learning
                          </Button>
                        )}

                        {canNext && (
                          <Button
                            onClick={handleNextKnowledge}
                            loading={isLoading}
                            iconRight={<ChevronRight className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Next
                          </Button>
                        )}

                        {isLastKnowledge && (
                          <Button
                            onClick={handleNextKnowledge}
                            loading={isLoading}
                            iconLeft={<CheckCircle2 className="w-4 h-4" />}
                            className="flex-1"
                          >
                            Complete Learning
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Knowledge Points List */}
                {sessionState.knowledge_points.length > 0 && (
                  <div className="px-4 pb-2 shrink-0">
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="space-y-2 max-h-[200px] overflow-y-auto"
                    >
                      {sessionState.knowledge_points.map((point, index) => (
                        <KnowledgePointCard
                          key={index}
                          point={point}
                          index={index}
                          currentIndex={sessionState.current_index}
                          total={sessionState.knowledge_points.length}
                        />
                      ))}
                    </motion.div>
                  </div>
                )}

                {/* Chat Interface */}
                <Card
                  variant="glass"
                  interactive={false}
                  className="mx-4 mb-4 flex-1 flex flex-col overflow-hidden"
                >
                  <CardHeader className="flex items-center gap-2 py-2">
                    <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Learning Assistant
                    </span>
                  </CardHeader>

                  <CardBody className="flex-1 overflow-hidden p-0">
                    <div ref={chatContainerRef} className="h-full overflow-y-auto p-4 space-y-3">
                      <AnimatePresence>
                        {chatMessages.map(msg => (
                          <Message key={msg.id} message={msg} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardBody>

                  {/* Input Area */}
                  {sessionState.status === 'learning' && (
                    <CardFooter className="py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={e => setInputMessage(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                          placeholder="Have any questions? Ask away..."
                          disabled={sendingMessage}
                          className="flex-1 px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/60 disabled:opacity-50 backdrop-blur-sm"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || sendingMessage}
                          loading={sendingMessage}
                          size="md"
                          className="!px-3"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* TOGGLE BUTTONS */}
        <div
          className="absolute top-4 left-4 z-20 flex gap-2"
          style={{ left: sidebarCollapsed ? 16 : `calc(${leftWidthPercent}% + 16px)` }}
        >
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="secondary"
            size="sm"
            className="!px-2"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
          {!sidebarCollapsed && (
            <Button
              onClick={() => setSidebarWide(!sidebarWide)}
              variant="secondary"
              size="sm"
              className="!px-2"
            >
              <ArrowRight
                className={`w-4 h-4 transition-transform ${sidebarWide ? 'rotate-180' : ''}`}
              />
            </Button>
          )}
        </div>

        {/* RIGHT PANEL: Interactive Content */}
        <motion.div
          variants={slideInRight}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/30 dark:bg-slate-900/30"
        >
          {sessionState.status === 'idle' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-teal-500/20"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut' as const,
                }}
              >
                <Lightbulb className="w-12 h-12" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Start Your Learning Journey
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-8">
                Select materials from your notebooks, and the system will generate a personalized
                learning plan. Through interactive pages and intelligent Q&A, you&apos;ll master all the
                content step by step.
              </p>
              <div className="flex items-center gap-6 text-sm text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Select</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>Learn</span>
                </div>
                <ChevronRight className="w-4 h-4" />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Master</span>
                </div>
              </div>
            </div>
          ) : isCompleted ? (
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Learning Complete!
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Congratulations on finishing your learning session
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <Card variant="glass" interactive={false}>
                  <CardBody>
                    <div className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {processLatexContent(sessionState.summary || '')}
                      </ReactMarkdown>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </motion.div>
          ) : sessionState.status === 'learning' ? (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Debug Button */}
              <Button
                onClick={() => setShowDebugModal(true)}
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 z-10 !px-2"
              >
                <Bug className="w-4 h-4" />
              </Button>

              {/* HTML Content */}
              {sessionState.current_html ? (
                <iframe
                  ref={htmlFrameRef}
                  className="w-full h-full border-0"
                  title="Interactive Learning Content"
                  sandbox="allow-scripts allow-same-origin"
                  key={`html-${sessionState.current_index}-${sessionState.current_html.length}`}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <Spinner size="xl" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {loadingMessage || 'Loading learning content...'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Spinner size="xl" />
              <p className="text-slate-500 dark:text-slate-400">
                {loadingMessage || 'Loading learning content...'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Debug Modal */}
        <AnimatePresence>
          {showDebugModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-md"
              >
                <Card variant="default" interactive={false}>
                  <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bug className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        Fix HTML Issue
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowDebugModal(false)
                        setDebugDescription('')
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                  </CardHeader>
                  <CardBody>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Issue Description
                    </label>
                    <textarea
                      value={debugDescription}
                      onChange={e => setDebugDescription(e.target.value)}
                      placeholder="Describe the HTML issue, e.g.: button not clickable, style display error, interaction not working..."
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none transition-all"
                    />
                  </CardBody>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      onClick={() => {
                        setShowDebugModal(false)
                        setDebugDescription('')
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleFixHtml}
                      disabled={!debugDescription.trim()}
                      loading={fixingHtml}
                      iconLeft={<Bug className="w-4 h-4" />}
                    >
                      Fix
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
