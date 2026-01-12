'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Send,
  Bot,
  User,
  CheckCircle2,
  Book,
  Activity,
  Cpu,
  DollarSign,
  Search,
  Sparkles,
  FileText,
  Terminal,
  GripVertical,
  ChevronRight,
  Zap,
  Brain,
  Lightbulb,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useGlobal, type MediaItem } from '@/context/GlobalContext'
import { API_BASE_URL, apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import MediaUpload from '@/components/ui/MediaUpload'
import PageWrapper from '@/components/ui/PageWrapper'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner, PulseDots } from '@/components/ui/LoadingState'

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
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
// Helper Functions
// ============================================================================

const resolveArtifactUrl = (url?: string | null, outputDir?: string) => {
  if (!url) return ''

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const normalized = url.replace(/^\.\//, '')

  if (normalized.startsWith('/api/outputs/')) {
    return `${API_BASE_URL}${normalized}`
  }

  if (normalized.startsWith('api/outputs/')) {
    return `${API_BASE_URL}/${normalized}`
  }

  if (normalized.startsWith('artifacts/') && outputDir) {
    return `${API_BASE_URL}/api/outputs/solve/${outputDir}/${normalized}`
  }

  return url
}

// ============================================================================
// Step Indicator Component
// ============================================================================

interface StepIndicatorProps {
  stage: 'investigate' | 'solve' | 'response' | null
  isActive: boolean
}

function StepIndicator({ stage, isActive }: StepIndicatorProps) {
  const steps = [
    { id: 'investigate', label: 'Investigate', icon: Search },
    { id: 'solve', label: 'Solve', icon: Brain },
    { id: 'response', label: 'Response', icon: FileText },
  ]

  const currentIndex = steps.findIndex(s => s.id === stage)

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isCompleted = currentIndex > index
        const isCurrent = step.id === stage && isActive

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
              text-xs font-medium hidden sm:block
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
              <ChevronRight
                className={`w-4 h-4 ${
                  isCompleted
                    ? 'text-teal-400 dark:text-teal-500'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Glass Thinking Card Component
// ============================================================================

interface ThinkingCardProps {
  stage: 'investigate' | 'solve' | 'response' | null
  progress: {
    round?: number
    queries?: string[]
    step_id?: string
    step_index?: number
    step_target?: string
  }
}

function ThinkingCard({ stage, progress }: ThinkingCardProps) {
  const getStageConfig = () => {
    switch (stage) {
      case 'investigate':
        return {
          icon: Search,
          title: 'Investigating',
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400/30',
        }
      case 'solve':
        return {
          icon: Sparkles,
          title: 'Solving',
          color: 'from-amber-500 to-orange-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-400/30',
        }
      case 'response':
        return {
          icon: FileText,
          title: 'Responding',
          color: 'from-emerald-500 to-teal-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-400/30',
        }
      default:
        return {
          icon: Brain,
          title: 'Thinking',
          color: 'from-indigo-500 to-purple-500',
          bgColor: 'bg-indigo-500/10',
          borderColor: 'border-indigo-400/30',
        }
    }
  }

  const config = getStageConfig()
  const Icon = config.icon

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/60 dark:bg-slate-900/60
        backdrop-blur-xl backdrop-saturate-150
        border ${config.borderColor}
        shadow-xl shadow-black/5
      `}
    >
      {/* Animated gradient border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10`} />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className={`
              p-2 rounded-xl bg-gradient-to-r ${config.color}
              shadow-lg
            `}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {config.title}
            </h4>
            {progress.round && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Round {progress.round}</p>
            )}
          </div>
          <PulseDots className="ml-auto" />
        </div>

        {/* Content based on stage */}
        {stage === 'investigate' && progress.queries && progress.queries.length > 0 && (
          <motion.div
            className="space-y-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {progress.queries.slice(0, 3).map((query, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30"
              >
                <Search className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {query}
                </span>
              </motion.div>
            ))}
            {progress.queries.length > 3 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 pl-3">
                +{progress.queries.length - 3} more queries...
              </p>
            )}
          </motion.div>
        )}

        {(stage === 'solve' || stage === 'response') && progress.step_id && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className={`
              px-3 py-2 rounded-lg
              ${stage === 'solve' ? 'bg-amber-50/50 dark:bg-amber-900/20' : 'bg-emerald-50/50 dark:bg-emerald-900/20'}
              ${stage === 'solve' ? 'border-amber-200/50 dark:border-amber-700/30' : 'border-emerald-200/50 dark:border-emerald-700/30'}
              border
            `}
          >
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium">Step {progress.step_index || '?'}:</span>{' '}
              {progress.step_target || 'Processing...'}
            </p>
          </motion.div>
        )}

        {!stage && (
          <div className="space-y-2">
            <div className="h-3 w-32 bg-slate-200/50 dark:bg-slate-700/50 rounded animate-pulse" />
            <div className="h-3 w-48 bg-slate-200/50 dark:bg-slate-700/50 rounded animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Message Component
// ============================================================================

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
  media?: MediaItem[]
  outputDir?: string
  onAddToNotebook?: () => void
}

function Message({ role, content, media, outputDir, onAddToNotebook }: MessageProps) {
  const isUser = role === 'user'

  const markdownComponents = {
    img: ({ src, ...props }: React.ComponentProps<'img'>) => (
      <img
        {...props}
        src={resolveArtifactUrl(typeof src === 'string' ? src : '', outputDir) || undefined}
        loading="lazy"
        className="max-w-full h-auto rounded-lg"
      />
    ),
    a: ({ href, ...props }: React.ComponentProps<'a'>) => (
      <a
        {...props}
        href={resolveArtifactUrl(typeof href === 'string' ? href : '', outputDir) || undefined}
        target="_blank"
        rel="noreferrer"
        className="text-teal-600 dark:text-teal-400 hover:underline break-all"
      />
    ),
    pre: (props: React.ComponentProps<'pre'>) => (
      <pre {...props} className="overflow-x-auto max-w-full rounded-lg bg-slate-900 p-4" />
    ),
    code: ({ className, children, ...props }: React.ComponentProps<'code'>) => {
      const isInline = !className
      return (
        <code
          {...props}
          className={
            isInline
              ? 'px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sm break-words'
              : 'block'
          }
        >
          {children}
        </code>
      )
    },
    table: (props: React.ComponentProps<'table'>) => (
      <div className="overflow-x-auto">
        <table {...props} className="min-w-full" />
      </div>
    ),
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex gap-4 w-full"
    >
      {/* Avatar */}
      <motion.div
        className={`
          w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
          ${
            isUser
              ? 'bg-slate-100 dark:bg-slate-800'
              : 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isUser ? (
          <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </motion.div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <Card
          variant={isUser ? 'solid' : 'glass'}
          hoverEffect={false}
          className={`
            ${isUser ? 'rounded-tl-sm' : 'rounded-tl-sm'}
          `}
        >
          <CardBody className="py-4">
            {/* Media Preview for User Messages */}
            {isUser && media && media.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {media.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300/50 dark:border-slate-600/50"
                  >
                    {item.type === 'image' ? (
                      <img
                        src={`data:${item.mimeType};base64,${item.data}`}
                        alt={item.name || `Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Video</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Text */}
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:shadow-inner">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                urlTransform={url => resolveArtifactUrl(url, outputDir)}
                components={markdownComponents}
              >
                {processLatexContent(content)}
              </ReactMarkdown>
            </div>
          </CardBody>

          {/* Assistant Footer */}
          {!isUser && onAddToNotebook && (
            <CardFooter className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Verified by praDeep Logic Engine
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<Book className="w-3 h-3" />}
                onClick={onAddToNotebook}
                className="text-indigo-600 dark:text-indigo-400"
              >
                Add to Notebook
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Log Entry Component
// ============================================================================

interface LogEntryProps {
  content: string
  level: string
}

function LogEntry({ content, level }: LogEntryProps) {
  let cleanContent = content
  cleanContent = cleanContent.replace(/^INFO:[^:]+:/, '')
  cleanContent = cleanContent.replace(/^ERROR:[^:]+:INFO:/, 'INFO:')

  const stageMatch = cleanContent.match(
    /^([>...V~X*])\s*\[Stage:([^\]]+)\]\s*(\w+)(?:\s*\|\s*(.+))?/
  )
  const toolMatch = cleanContent.match(/[Tool Call]\s*Tool:\s*(.+)/)
  const isSeparator = /^={20,}$/.test(cleanContent.trim())
  const isError =
    (level === 'ERROR' && !cleanContent.includes('INFO:')) ||
    (cleanContent.includes('ERROR') && !cleanContent.includes('INFO:')) ||
    cleanContent.includes('X')
  const isComplete = cleanContent.includes('V') || cleanContent.includes('complete')
  const isRunning = cleanContent.includes('...') || cleanContent.includes('>')
  const isToolCall = cleanContent.includes('[Tool Call]') || cleanContent.includes('Tool:')

  let colorClass = 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
  let borderClass = 'border-transparent'

  if (stageMatch) {
    const [, , , status] = stageMatch
    if (status === 'start' || status === 'running') {
      colorClass = 'bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
      borderClass = 'border-teal-400/50'
    } else if (status === 'complete') {
      colorClass = 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
      borderClass = 'border-emerald-400/50'
    } else if (status === 'error') {
      colorClass = 'bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      borderClass = 'border-red-400/50'
    }
  } else if (isSeparator) {
    return null
  } else if (isError) {
    colorClass = 'bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    borderClass = 'border-red-400/50'
  } else if (isToolCall || toolMatch) {
    colorClass = 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    borderClass = 'border-blue-400/50'
  } else if (isComplete) {
    colorClass = 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    borderClass = 'border-emerald-400/50'
  } else if (isRunning) {
    colorClass = 'bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
    borderClass = 'border-teal-400/50'
  }

  return (
    <motion.div
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      className={`
        px-3 py-2 rounded-lg text-xs font-mono
        border-l-2 ${borderClass}
        ${colorClass}
        backdrop-blur-sm
        break-words
      `}
    >
      {cleanContent}
    </motion.div>
  )
}

// ============================================================================
// Main Solver Page Component
// ============================================================================

export default function SolverPage() {
  const { solverState, setSolverState, startSolver } = useGlobal()

  // Local state
  const [inputQuestion, setInputQuestion] = useState('')
  const [inputMedia, setInputMedia] = useState<MediaItem[]>([])
  const [kbs, setKbs] = useState<string[]>([])
  const [panelWidth, setPanelWidth] = useState(400)
  const [isDragging, setIsDragging] = useState(false)

  // Refs
  const logContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const prevLogsLengthRef = useRef<number>(0)
  const prevMessagesLengthRef = useRef<number>(0)
  const prevIsSolvingForLogsRef = useRef<boolean>(false)
  const prevIsSolvingForChatRef = useRef<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Notebook modal state
  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [notebookRecord, setNotebookRecord] = useState<{
    title: string
    userQuery: string
    output: string
  } | null>(null)

  // Fetch KBs on mount
  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        const names = data.map((kb: { name: string }) => kb.name)
        setKbs(names)
        if (!solverState.selectedKb) {
          const defaultKb = data.find((kb: { is_default: boolean }) => kb.is_default)?.name
          if (defaultKb) setSolverState(prev => ({ ...prev, selectedKb: defaultKb }))
          else if (names.length > 0) setSolverState(prev => ({ ...prev, selectedKb: names[0] }))
        }
      })
      .catch(err => console.error('Failed to fetch KBs:', err))
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    const isSolvingChanged = prevIsSolvingForLogsRef.current !== solverState.isSolving

    if (isSolvingChanged && solverState.isSolving) {
      prevLogsLengthRef.current = 0
    }

    if (logContainerRef.current && solverState.isSolving) {
      const currentLogsLength = solverState.logs.length
      if (currentLogsLength > prevLogsLengthRef.current && currentLogsLength > 0) {
        const container = logContainerRef.current
        requestAnimationFrame(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          })
        })
      }
      prevLogsLengthRef.current = currentLogsLength
    } else if (!solverState.isSolving) {
      prevLogsLengthRef.current = solverState.logs.length
    }

    prevIsSolvingForLogsRef.current = solverState.isSolving
  }, [solverState.logs, solverState.isSolving])

  // Auto-scroll chat
  useEffect(() => {
    const isSolvingChanged = prevIsSolvingForChatRef.current !== solverState.isSolving

    if (isSolvingChanged && solverState.isSolving) {
      prevMessagesLengthRef.current = solverState.messages.length
    }

    if (chatEndRef.current && solverState.isSolving) {
      const currentMessagesLength = solverState.messages.length
      if (currentMessagesLength > prevMessagesLengthRef.current && !isSolvingChanged) {
        requestAnimationFrame(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        })
      }
      prevMessagesLengthRef.current = currentMessagesLength
    } else if (!solverState.isSolving) {
      prevMessagesLengthRef.current = solverState.messages.length
    }

    prevIsSolvingForChatRef.current = solverState.isSolving
  }, [solverState.messages, solverState.isSolving])

  // Handle panel resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = containerRect.right - e.clientX
      const clampedWidth = Math.max(300, Math.min(600, newWidth))
      setPanelWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  const handleStart = () => {
    if (!inputQuestion.trim() && inputMedia.length === 0) return
    startSolver(
      inputQuestion,
      solverState.selectedKb,
      inputMedia.length > 0 ? inputMedia : undefined
    )
    setInputQuestion('')
    setInputMedia([])
  }

  const handleAddToNotebook = (msgContent: string) => {
    const userMsgIndex = solverState.messages.findIndex(
      (m, i) =>
        m.role === 'user' &&
        solverState.messages[i + 1]?.role === 'assistant' &&
        solverState.messages[i + 1]?.content === msgContent
    )
    const userQuery =
      userMsgIndex >= 0 ? solverState.messages[userMsgIndex].content : solverState.question
    setNotebookRecord({
      title: userQuery.slice(0, 100) + (userQuery.length > 100 ? '...' : ''),
      userQuery,
      output: msgContent,
    })
    setShowNotebookModal(true)
  }

  // Filter and deduplicate logs
  const filteredLogs = solverState.logs.filter((log, i) => {
    const content = (log.content || '').trim()
    if (!content) return false

    const recentLogs = solverState.logs.slice(Math.max(0, i - 10), i)
    if (recentLogs.some(l => (l.content || '').trim() === content)) {
      return false
    }

    if (
      content.includes('Provider List:') ||
      (content.includes('INFO:') && !content.includes('[Stage:') && !content.includes('[Tool')) ||
      (content.match(/^\d{4}-\d{2}-\d{2}/) && !content.includes('[Stage:')) ||
      (content.includes('INFO:MainSolver:') && !content.includes('[Stage:')) ||
      (content.includes('INFO:investigate_agent:') &&
        !content.includes('[Tool') &&
        !content.includes('[Stage:'))
    ) {
      return false
    }

    return true
  })

  return (
    <PageWrapper maxWidth="full" showPattern className="!p-0 h-screen overflow-hidden">
      <div ref={containerRef} className="h-full flex">
        {/* Left Panel: Chat Interface */}
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col overflow-hidden"
          style={{ marginRight: panelWidth }}
        >
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20"
                  whileHover={{ scale: 1.05 }}
                >
                  <Zap className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Smart Solver
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                    </span>
                    Ready
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Step Indicator */}
                {solverState.isSolving && (
                  <StepIndicator
                    stage={solverState.progress.stage}
                    isActive={solverState.isSolving}
                  />
                )}

                {/* KB Selector */}
                <select
                  value={solverState.selectedKb}
                  onChange={e =>
                    setSolverState(prev => ({
                      ...prev,
                      selectedKb: e.target.value,
                    }))
                  }
                  className="text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-3 py-2 outline-none focus:border-teal-400/60 dark:focus:border-teal-500/60 focus:ring-2 focus:ring-teal-400/20 text-slate-700 dark:text-slate-200 transition-all"
                >
                  {kbs.map(kb => (
                    <option key={kb} value={kb}>
                      {kb}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
            {/* Initial State */}
            <AnimatePresence>
              {solverState.messages.length === 0 && !solverState.isSolving && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto"
                >
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-teal-500/20"
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
                    <Lightbulb className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                    How can I help you today?
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    I can help you solve complex STEM problems using multi-step reasoning. Try
                    asking about calculus, physics, or coding algorithms.
                  </p>
                  <motion.div
                    className="grid grid-cols-1 gap-3 w-full"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {[
                      'Calculate the linear convolution of x=[1,2,3] and h=[4,5]',
                      'Explain the backpropagation algorithm in neural networks',
                      'Solve the differential equation dy/dx = x^2',
                    ].map((q, i) => (
                      <motion.button
                        key={i}
                        variants={fadeInUp}
                        onClick={() => setInputQuestion(q)}
                        className="px-5 py-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/10 transition-all text-left text-slate-600 dark:text-slate-300 group"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {q}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            {solverState.messages.map((msg, idx) => (
              <Message
                key={idx}
                role={msg.role}
                content={msg.content}
                media={msg.media}
                outputDir={msg.outputDir}
                onAddToNotebook={
                  msg.role === 'assistant' ? () => handleAddToNotebook(msg.content) : undefined
                }
              />
            ))}

            {/* AI Thinking State */}
            <AnimatePresence>
              {solverState.isSolving && (
                <motion.div
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex gap-4 w-full"
                >
                  <motion.div
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Spinner size="sm" className="text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <ThinkingCard
                      stage={solverState.progress.stage}
                      progress={solverState.progress.progress}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60 shrink-0">
            <div className="mb-3">
              <MediaUpload
                media={inputMedia}
                onMediaChange={setInputMedia}
                disabled={solverState.isSolving}
                maxFiles={5}
              />
            </div>
            <div className="relative">
              <input
                type="text"
                className="w-full px-5 py-4 pr-14 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/60 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200 backdrop-blur-sm"
                placeholder={
                  inputMedia.length > 0
                    ? 'Describe your question about the image(s)...'
                    : 'Ask a difficult question...'
                }
                value={inputQuestion}
                onChange={e => setInputQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleStart()}
                disabled={solverState.isSolving}
              />
              <motion.button
                onClick={handleStart}
                disabled={
                  solverState.isSolving || (!inputQuestion.trim() && inputMedia.length === 0)
                }
                className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl flex items-center justify-center hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {solverState.isSolving ? (
                  <Spinner size="sm" className="text-white" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </div>
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              praDeep can make mistakes. Please verify important information.
            </p>
          </div>
        </motion.div>

        {/* Resizable Divider */}
        <div
          className={`
            absolute top-0 bottom-0 w-1 cursor-col-resize z-20
            bg-slate-200/60 dark:bg-slate-700/60
            hover:bg-teal-400/60 dark:hover:bg-teal-500/60
            transition-colors duration-200
            ${isDragging ? 'bg-teal-400/60 dark:bg-teal-500/60' : ''}
          `}
          style={{ right: panelWidth }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {/* Right Panel: Logic Stream */}
        <motion.div
          variants={slideInRight}
          initial="hidden"
          animate="visible"
          className="fixed top-0 right-0 bottom-0 flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-l border-slate-200/60 dark:border-slate-700/60"
          style={{ width: panelWidth }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Logic Stream
              </h2>
            </div>
            {solverState.isSolving && (
              <span className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                Running
              </span>
            )}
          </div>

          {/* Performance Stats */}
          {solverState.tokenStats.calls > 0 && (
            <div className="px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span className="text-slate-500 dark:text-slate-400">Model:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {solverState.tokenStats.model}
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-600" />
                <div className="text-slate-500 dark:text-slate-400">
                  Calls:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {solverState.tokenStats.calls}
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-600" />
                <div className="text-slate-500 dark:text-slate-400">
                  Tokens:{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {solverState.tokenStats.tokens.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-600" />
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    ${solverState.tokenStats.cost.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Current Progress */}
          <AnimatePresence>
            {solverState.isSolving && solverState.progress.stage && (
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="px-4 py-3 border-b border-teal-200/60 dark:border-teal-700/60 bg-teal-50/50 dark:bg-teal-900/20 shrink-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    className={`
                      p-1.5 rounded-lg
                      ${
                        solverState.progress.stage === 'investigate'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                          : solverState.progress.stage === 'solve'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                      }
                    `}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {solverState.progress.stage === 'investigate' && (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    {solverState.progress.stage === 'solve' && <Sparkles className="w-3.5 h-3.5" />}
                    {solverState.progress.stage === 'response' && (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </motion.div>
                  <div>
                    <div className="text-xs font-semibold text-teal-700 dark:text-teal-300 capitalize">
                      {solverState.progress.stage === 'investigate' && 'Investigating'}
                      {solverState.progress.stage === 'solve' && 'Solving'}
                      {solverState.progress.stage === 'response' && 'Responding'}
                    </div>
                    {solverState.progress.progress.round && (
                      <div className="text-[10px] text-teal-600 dark:text-teal-400">
                        Round {solverState.progress.progress.round}
                      </div>
                    )}
                  </div>
                </div>

                {solverState.progress.stage === 'investigate' &&
                  solverState.progress.progress.queries &&
                  solverState.progress.progress.queries.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {solverState.progress.progress.queries.slice(0, 3).map((query, idx) => (
                        <div
                          key={idx}
                          className="text-[10px] text-teal-600 dark:text-teal-400 pl-2 border-l-2 border-teal-200 dark:border-teal-600 truncate"
                        >
                          {query}
                        </div>
                      ))}
                      {solverState.progress.progress.queries.length > 3 && (
                        <div className="text-[10px] text-teal-500 dark:text-teal-500 pl-2">
                          +{solverState.progress.progress.queries.length - 3} more queries...
                        </div>
                      )}
                    </div>
                  )}

                {(solverState.progress.stage === 'solve' ||
                  solverState.progress.stage === 'response') &&
                  solverState.progress.progress.step_id && (
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-1">
                      Step {solverState.progress.progress.step_index || '?'}:{' '}
                      {solverState.progress.progress.step_target || 'Processing...'}
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity Log */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Activity Log
              </h3>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {filteredLogs.length} entries
              </span>
            </div>

            <div
              ref={logContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 min-h-0"
            >
              {filteredLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3 py-12">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Activity className="w-10 h-10 opacity-20" />
                  </motion.div>
                  <p className="text-sm">Waiting for logic execution...</p>
                </div>
              )}

              {filteredLogs.map((log, i) => (
                <LogEntry key={i} content={log.content || ''} level={log.level || 'info'} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notebook Modal */}
        {notebookRecord && (
          <AddToNotebookModal
            isOpen={showNotebookModal}
            onClose={() => {
              setShowNotebookModal(false)
              setNotebookRecord(null)
            }}
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
