'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Edit3,
  Wand2,
  Minimize2,
  Maximize2,
  Globe,
  Database,
  Loader2,
  X,
  History,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Minus,
  Download,
  FileText,
  PenTool,
  Sparkles,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  AlertCircle,
  Book,
  Mic,
  Headphones,
  Radio,
  ChevronDown,
  ChevronRight,
  Import,
  GripVertical,
  Clock,
  Zap,
} from 'lucide-react'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import NotebookImportModal from '@/components/NotebookImportModal'
import { apiUrl } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { processLatexContent } from '@/lib/latex'
import PageWrapper from '@/components/ui/PageWrapper'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
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
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// AI Mark tag regex patterns
const AI_MARK_REGEX = /<span\s+data-rough-notation="[^"]+">([^<]*)<\/span>/g
const AI_MARK_OPEN_TAG = /<span\s+data-rough-notation="[^"]+">/g
const AI_MARK_CLOSE_TAG = /<\/span>/g

// ============================================================================
// Toolbar Button Component
// ============================================================================

interface ToolbarButtonProps {
  icon: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
}

function ToolbarButton({ icon, onClick, title, active }: ToolbarButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      className={`
        p-2 rounded-xl transition-all
        ${
          active
            ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
    </motion.button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-slate-200/60 dark:bg-slate-600/60 mx-1" />
}

// ============================================================================
// Action Card Component (for AI actions popover)
// ============================================================================

interface ActionCardProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  colorScheme: 'teal' | 'amber' | 'blue' | 'emerald'
}

function ActionCard({ icon, label, active, onClick, colorScheme }: ActionCardProps) {
  const colorClasses = {
    teal: {
      active:
        'bg-teal-50 dark:bg-teal-900/40 border-teal-400 dark:border-teal-600 text-teal-600 dark:text-teal-300',
      inactive:
        'border-transparent text-slate-500 dark:text-slate-400 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-300',
    },
    amber: {
      active:
        'bg-amber-50 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-300',
      inactive:
        'border-transparent text-slate-500 dark:text-slate-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-300',
    },
    blue: {
      active:
        'bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-300',
      inactive:
        'border-transparent text-slate-500 dark:text-slate-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-300',
    },
    emerald: {
      active:
        'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-300',
      inactive:
        'border-transparent text-slate-500 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-300',
    },
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all text-xs font-medium border-2
        ${active ? colorClasses[colorScheme].active : colorClasses[colorScheme].inactive}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      {label}
    </motion.button>
  )
}

// ============================================================================
// History Item Component
// ============================================================================

interface HistoryItemProps {
  operation: {
    id: string
    action: string
    timestamp: string
    input?: { original_text?: string }
    source?: string
  }
}

function HistoryItem({ operation }: HistoryItemProps) {
  const actionColors: Record<string, string> = {
    rewrite: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
    shorten: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    automark: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    expand: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-xl hover:shadow-md transition-all cursor-pointer group"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${actionColors[operation.action] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
        >
          {operation.action}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(operation.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
        "{operation.input?.original_text?.substring(0, 40)}..."
      </div>
      {operation.source && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
          {operation.source === 'rag' ? (
            <Database className="w-2.5 h-2.5" />
          ) : (
            <Globe className="w-2.5 h-2.5" />
          )}
          {operation.source.toUpperCase()}
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// Main Co-Writer Page Component
// ============================================================================

export default function CoWriterPage() {
  // State
  const [content, setContent] = useState(
    '# Welcome to Co-Writer\n\nSelect text to see the magic happen.\n\n## Features\n\n- **Bold** text with Ctrl+B\n- *Italic* text with Ctrl+I\n- <u>Underline</u> with Ctrl+U\n- <mark>Highlight</mark> with Ctrl+H\n- AI-powered editing and auto-marking\n'
  )
  const [selection, setSelection] = useState<{
    start: number
    end: number
    text: string
  } | null>(null)
  const [popover, setPopover] = useState<{
    visible: boolean
    x: number
    y: number
  } | null>(null)
  const [instruction, setInstruction] = useState('')
  const [selectedAction, setSelectedAction] = useState<
    'rewrite' | 'shorten' | 'expand' | 'automark'
  >('rewrite')
  const [source, setSource] = useState<'rag' | 'web' | null>(null)
  const [selectedKb, setSelectedKb] = useState('')
  const [kbs, setKbs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [operationHistory, setOperationHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [hideAiMarks, setHideAiMarks] = useState(false)
  const [rawContent, setRawContent] = useState('')
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Podcast / Narration states
  const [isPodcastExpanded, setIsPodcastExpanded] = useState(false)
  const [narrationStyle, setNarrationStyle] = useState<'friendly' | 'academic' | 'concise'>(
    'friendly'
  )
  const [narrationScript, setNarrationScript] = useState<string>('')
  const [narrationKeyPoints, setNarrationKeyPoints] = useState<string[]>([])
  const [narrationLoading, setNarrationLoading] = useState<boolean>(false)
  const [narrationError, setNarrationError] = useState<string | null>(null)
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null)
  const [ttsVoices, setTtsVoices] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([])
  const [selectedVoice, setSelectedVoice] = useState<string>('alloy')
  const [audioInfo, setAudioInfo] = useState<{
    audioUrl?: string
    audioId?: string
    voice?: string
  } | null>(null)
  const [showNarrationNotebookModal, setShowNarrationNotebookModal] = useState(false)

  // Panel resize state
  const [panelWidth, setPanelWidth] = useState(50) // percentage
  const [isDragging, setIsDragging] = useState(false)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSyncingScroll = useRef(false)

  // Check backend connection status
  const checkBackendConnection = useCallback(async (silent: boolean = false) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const response = await fetch(apiUrl('/api/v1/co_writer/history'), {
        method: 'GET',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (response.ok) {
        setBackendConnected(true)
        return true
      } else {
        setBackendConnected(false)
        return false
      }
    } catch (error: any) {
      setBackendConnected(false)
      if (!silent && error.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
        console.debug('Backend connection check failed:', error.message)
      }
      return false
    }
  }, [])

  // Check TTS configuration
  useEffect(() => {
    const fetchTtsConfig = async () => {
      try {
        const statusRes = await fetch(apiUrl('/api/v1/co_writer/tts/status'))
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (statusData.available) {
            setTtsAvailable(true)
            if (statusData.default_voice) {
              setSelectedVoice(statusData.default_voice)
            }
            const voicesRes = await fetch(apiUrl('/api/v1/co_writer/tts/voices'))
            if (voicesRes.ok) {
              const voicesData = await voicesRes.json()
              setTtsVoices(voicesData.voices || [])
            }
          } else {
            setTtsAvailable(false)
          }
        } else {
          setTtsAvailable(false)
        }
      } catch (e) {
        setTtsAvailable(false)
      }
    }
    fetchTtsConfig()
  }, [])

  // Fetch KBs
  useEffect(() => {
    const loadData = async () => {
      setBackendConnected(null)
      try {
        const isConnected = await checkBackendConnection(true)
        if (isConnected) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            const res = await fetch(apiUrl('/api/v1/knowledge/list'), {
              signal: controller.signal,
            })
            clearTimeout(timeoutId)
            if (res.ok) {
              const data = await res.json()
              setKbs(data.map((kb: any) => kb.name))
              if (data.length > 0) setSelectedKb(data[0].name)
            }
          } catch (err: any) {
            if (process.env.NODE_ENV === 'development') {
              console.debug('Failed to fetch KBs:', err.message)
            }
          }
          fetchHistory()
        }
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Failed to initialize:', error.message)
        }
      }
    }
    loadData()
  }, [checkBackendConnection])

  const fetchHistory = () => {
    fetch(apiUrl('/api/v1/co_writer/history'))
      .then(res => {
        if (res.ok) return res.json()
        throw new Error(`HTTP ${res.status}`)
      })
      .then(data => {
        setOperationHistory(data.history || [])
        setBackendConnected(true)
      })
      .catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Failed to fetch history:', err.message)
        }
        setBackendConnected(false)
      })
  }

  // Auto clear source when automark is selected
  useEffect(() => {
    if (selectedAction === 'automark') {
      setSource(null)
    }
  }, [selectedAction])

  // Synchronized scroll
  const handleEditorScroll = useCallback(() => {
    if (isSyncingScroll.current) return
    const editor = editorContainerRef.current
    const preview = previewRef.current
    if (!editor || !preview) return

    isSyncingScroll.current = true
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight)

    requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }, [])

  const handlePreviewScroll = useCallback(() => {
    if (isSyncingScroll.current) return
    const editor = editorContainerRef.current
    const preview = previewRef.current
    if (!editor || !preview) return

    isSyncingScroll.current = true
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    editor.scrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight)

    requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }, [])

  // Hide AI Marks
  const getDisplayContent = useCallback(() => {
    if (!hideAiMarks) return content
    return content.replace(AI_MARK_REGEX, '$1')
  }, [content, hideAiMarks])

  useEffect(() => {
    if (hideAiMarks && !rawContent) {
      setRawContent(content)
    } else if (!hideAiMarks && rawContent) {
      setRawContent('')
    }
  }, [hideAiMarks])

  // Smart AI mark protection
  const mergeEditWithMarks = useCallback(
    (original: string, oldPlain: string, newPlain: string): string => {
      interface MarkInfo {
        tag: string
        innerText: string
        plainStart: number
        plainEnd: number
      }

      const marks: MarkInfo[] = []
      const regex = /<span\s+data-rough-notation="([^"]+)">([^<]*)<\/span>/g
      let match

      let plainOffset = 0
      let lastIndex = 0

      while ((match = regex.exec(original)) !== null) {
        const tag = match[1]
        const innerText = match[2]
        const htmlStart = match.index
        const htmlEnd = htmlStart + match[0].length

        const textBefore = original.substring(lastIndex, htmlStart)
        plainOffset += textBefore.length

        marks.push({
          tag,
          innerText,
          plainStart: plainOffset,
          plainEnd: plainOffset + innerText.length,
        })

        plainOffset += innerText.length
        lastIndex = htmlEnd
      }

      let diffStart = 0
      let diffEndOld = oldPlain.length
      let diffEndNew = newPlain.length

      while (
        diffStart < oldPlain.length &&
        diffStart < newPlain.length &&
        oldPlain[diffStart] === newPlain[diffStart]
      ) {
        diffStart++
      }

      while (
        diffEndOld > diffStart &&
        diffEndNew > diffStart &&
        oldPlain[diffEndOld - 1] === newPlain[diffEndNew - 1]
      ) {
        diffEndOld--
        diffEndNew--
      }

      const marksToKeep: Array<{ mark: MarkInfo; newPosition: number }> = []

      for (const mark of marks) {
        const editStartsInsideMark = diffStart > mark.plainStart && diffStart < mark.plainEnd
        const editEndsInsideMark = diffEndOld > mark.plainStart && diffEndOld < mark.plainEnd
        const editCompletelyInsideMark = diffStart >= mark.plainStart && diffEndOld <= mark.plainEnd

        if (editCompletelyInsideMark || editStartsInsideMark || editEndsInsideMark) {
          continue
        }

        let newPosition = mark.plainStart

        if (diffEndOld <= mark.plainStart) {
          const editLengthDiff = diffEndNew - diffStart - (diffEndOld - diffStart)
          newPosition = mark.plainStart + editLengthDiff
        } else if (diffStart >= mark.plainEnd) {
          newPosition = mark.plainStart
        } else {
          const searchRadius = 50
          const searchStart = Math.max(0, mark.plainStart - searchRadius)
          const searchEnd = Math.min(newPlain.length, mark.plainEnd + searchRadius)
          const searchArea = newPlain.substring(searchStart, searchEnd)
          const foundIndex = searchArea.indexOf(mark.innerText)

          if (foundIndex !== -1) {
            newPosition = searchStart + foundIndex
          } else {
            continue
          }
        }

        if (newPosition >= 0 && newPosition + mark.innerText.length <= newPlain.length) {
          const textAtPosition = newPlain.substring(
            newPosition,
            newPosition + mark.innerText.length
          )
          if (textAtPosition === mark.innerText) {
            marksToKeep.push({ mark, newPosition })
          }
        }
      }

      marksToKeep.sort((a, b) => b.newPosition - a.newPosition)

      let result = newPlain
      for (const { mark, newPosition } of marksToKeep) {
        const before = result.substring(0, newPosition)
        const after = result.substring(newPosition + mark.innerText.length)
        const markedText = `<span data-rough-notation="${mark.tag}">${mark.innerText}</span>`
        result = before + markedText + after
      }

      return result
    },
    []
  )

  const handleContentChange = useCallback(
    (newValue: string) => {
      if (!hideAiMarks) {
        setContent(newValue)
        return
      }

      setContent(prevContent => {
        const oldDisplayContent = prevContent.replace(AI_MARK_REGEX, '$1')
        const newDisplayContent = newValue

        if (oldDisplayContent === newDisplayContent) {
          return prevContent
        }

        return mergeEditWithMarks(prevContent, oldDisplayContent, newDisplayContent)
      })
    },
    [hideAiMarks, mergeEditWithMarks]
  )

  // Wrap selection with markers
  const wrapSelection = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    if (selectedText.length === 0) return

    const textBefore = textarea.value.substring(Math.max(0, start - before.length), start)
    const textAfter = textarea.value.substring(end, end + after.length)

    let newContent: string
    let newStart: number
    let newEnd: number

    if (textBefore === before && textAfter === after) {
      newContent =
        textarea.value.substring(0, start - before.length) +
        selectedText +
        textarea.value.substring(end + after.length)
      newStart = start - before.length
      newEnd = end - before.length
    } else {
      newContent =
        textarea.value.substring(0, start) +
        before +
        selectedText +
        after +
        textarea.value.substring(end)
      newStart = start + before.length
      newEnd = end + before.length
    }

    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }, [])

  // Toggle line prefix
  const toggleLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const lines = textarea.value.split('\n')

    let charCount = 0
    let startLine = 0
    let endLine = 0

    for (let i = 0; i < lines.length; i++) {
      if (charCount <= start && start <= charCount + lines[i].length) {
        startLine = i
      }
      if (charCount <= end && end <= charCount + lines[i].length) {
        endLine = i
        break
      }
      charCount += lines[i].length + 1
    }

    let allHavePrefix = true
    for (let i = startLine; i <= endLine; i++) {
      if (!lines[i].startsWith(prefix)) {
        allHavePrefix = false
        break
      }
    }

    for (let i = startLine; i <= endLine; i++) {
      if (allHavePrefix) {
        lines[i] = lines[i].substring(prefix.length)
      } else {
        lines[i] = prefix + lines[i]
      }
    }

    setContent(lines.join('\n'))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!textareaRef.current || document.activeElement !== textareaRef.current) return

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault()
            wrapSelection('**', '**')
            break
          case 'i':
            e.preventDefault()
            wrapSelection('*', '*')
            break
          case 'u':
            e.preventDefault()
            wrapSelection('<u>', '</u>')
            break
          case 'h':
            e.preventDefault()
            wrapSelection('<mark>', '</mark>')
            break
          case 's':
            if (e.shiftKey) {
              e.preventDefault()
              wrapSelection('~~', '~~')
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [wrapSelection])

  // Handle selection for popover
  const handleMouseUp = (e: React.MouseEvent) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value.substring(start, end)

    if (text.trim().length > 0) {
      const rect = textarea.getBoundingClientRect()
      let x = e.clientX
      let y = e.clientY + 10

      setSelection({ start, end, text })
      setPopover({ visible: true, x, y })
      setInstruction('')
      setSelectedAction('rewrite')
      setSource(null)
    } else {
      setPopover(null)
      setSelection(null)
    }
  }

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setPopover(null)
        setSelection(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle AI action
  const handleAction = async (action: 'rewrite' | 'shorten' | 'expand' | 'automark') => {
    if (!selection) return

    if (backendConnected === false) {
      const isConnected = await checkBackendConnection()
      if (!isConnected) {
        alert(
          `Backend service not connected\n\nPlease ensure the backend is running:\n${apiUrl('')}\n\nRun: python start.py`
        )
        return
      }
    }

    setIsProcessing(true)

    try {
      let editedText: string
      const apiEndpoint =
        action === 'automark' ? '/api/v1/co_writer/automark' : '/api/v1/co_writer/edit'
      const requestUrl = apiUrl(apiEndpoint)

      if (action === 'automark') {
        const res = await fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: selection.text }),
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to auto-mark text: ${res.status} ${res.statusText}\n${errorText}`)
        }

        const data = await res.json()
        if (!data.marked_text) {
          throw new Error('Invalid response: missing marked_text field')
        }
        editedText = data.marked_text
      } else {
        const requestBody: any = {
          text: selection.text,
          instruction: instruction || `Please ${action} this text.`,
          action,
        }

        if (source) {
          requestBody.source = source
          if (source === 'rag' && selectedKb) {
            requestBody.kb_name = selectedKb
          }
        }

        const res = await fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(`Failed to edit text: ${res.status} ${res.statusText}\n${errorText}`)
        }

        const data = await res.json()
        if (!data.edited_text) {
          throw new Error('Invalid response: missing edited_text field')
        }
        editedText = data.edited_text
      }

      const newContent =
        content.substring(0, selection.start) + editedText + content.substring(selection.end)
      setContent(newContent)
      setPopover(null)
      setSelection(null)
      fetchHistory()
    } catch (error: any) {
      console.error('Action error:', error)
      setBackendConnected(false)

      let errorMessage = 'Error processing request'
      if (
        error instanceof TypeError &&
        (error.message.includes('fetch') || error.message === 'Failed to fetch')
      ) {
        errorMessage = `Cannot connect to backend service\n\nRun: python start.py`
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  // Export functions
  const exportMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = async () => {
    if (!previewRef.current) return
    setIsProcessing(true)

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pdfWidth - margin * 2

      const imgProps = pdf.getImageProperties(imgData)
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width

      let heightLeft = imgHeight
      let position = margin

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
      heightLeft -= pdfHeight - margin * 2

      while (heightLeft > 0) {
        pdf.addPage()
        position = margin - (imgHeight - heightLeft)
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight)
        heightLeft -= pdfHeight - margin * 2
      }

      pdf.save('document.pdf')
    } catch (e) {
      console.error('PDF export error:', e)
      alert('PDF export failed, please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle panel resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      const clampedWidth = Math.max(30, Math.min(70, newWidth))
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

  // Generate narration
  const handleGenerateNarration = async () => {
    if (!content.trim()) {
      setNarrationError('Current note is empty, cannot generate narration.')
      return
    }
    setNarrationLoading(true)
    setNarrationError(null)
    try {
      const res = await fetch(apiUrl('/api/v1/co_writer/narrate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          style: narrationStyle,
          skip_audio: !ttsAvailable,
        }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setNarrationScript(data.script || '')
      setNarrationKeyPoints(data.key_points || [])
      if (data.has_audio && data.audio_url) {
        const audioUrl = data.audio_url.startsWith('http') ? data.audio_url : apiUrl(data.audio_url)
        setAudioInfo({
          audioUrl: audioUrl,
          audioId: data.audio_id,
          voice: data.voice,
        })
      } else {
        setAudioInfo(null)
      }
    } catch (e: any) {
      setNarrationError(e?.message || 'Failed to generate narration, please try again.')
    } finally {
      setNarrationLoading(false)
    }
  }

  return (
    <PageWrapper maxWidth="full" showPattern className="!p-0 h-screen overflow-hidden">
      <motion.div
        ref={containerRef}
        className="h-full flex gap-0"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* LEFT PANEL - Editor */}
        <motion.div
          variants={slideInLeft}
          className="flex flex-col overflow-hidden"
          style={{ width: `${panelWidth}%` }}
        >
          <Card variant="glass" hoverEffect={false} className="h-full flex flex-col !rounded-none">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20"
                  whileHover={{ scale: 1.05 }}
                >
                  <Edit3 className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Co-Writer
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    AI-powered markdown editor
                  </p>
                </div>
              </div>

              {/* Connection Status */}
              {backendConnected !== null && (
                <div
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all
                    ${
                      backendConnected
                        ? 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/60'
                        : 'bg-red-50/80 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-700/60'
                    }
                  `}
                >
                  {backendConnected ? (
                    <>
                      <motion.span
                        className="w-2 h-2 bg-emerald-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      <span className="font-medium">Offline</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="px-4 py-2 border-b border-white/20 dark:border-slate-700/30 bg-white/30 dark:bg-slate-800/30 flex items-center gap-1 flex-wrap shrink-0">
              {/* Formatting */}
              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  icon={<Bold className="w-4 h-4" />}
                  onClick={() => wrapSelection('**', '**')}
                  title="Bold (Ctrl+B)"
                />
                <ToolbarButton
                  icon={<Italic className="w-4 h-4" />}
                  onClick={() => wrapSelection('*', '*')}
                  title="Italic (Ctrl+I)"
                />
                <ToolbarButton
                  icon={<UnderlineIcon className="w-4 h-4" />}
                  onClick={() => wrapSelection('<u>', '</u>')}
                  title="Underline (Ctrl+U)"
                />
                <ToolbarButton
                  icon={<Highlighter className="w-4 h-4" />}
                  onClick={() => wrapSelection('<mark>', '</mark>')}
                  title="Highlight (Ctrl+H)"
                />
                <ToolbarButton
                  icon={<Strikethrough className="w-4 h-4" />}
                  onClick={() => wrapSelection('~~', '~~')}
                  title="Strikethrough"
                />
                <ToolbarButton
                  icon={<Code className="w-4 h-4" />}
                  onClick={() => wrapSelection('`', '`')}
                  title="Inline Code"
                />
              </div>

              <ToolbarDivider />

              {/* Headings & Lists */}
              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  icon={<Heading1 className="w-4 h-4" />}
                  onClick={() => toggleLinePrefix('# ')}
                  title="Heading 1"
                />
                <ToolbarButton
                  icon={<Heading2 className="w-4 h-4" />}
                  onClick={() => toggleLinePrefix('## ')}
                  title="Heading 2"
                />
                <ToolbarButton
                  icon={<List className="w-4 h-4" />}
                  onClick={() => toggleLinePrefix('- ')}
                  title="Bullet List"
                />
                <ToolbarButton
                  icon={<ListOrdered className="w-4 h-4" />}
                  onClick={() => toggleLinePrefix('1. ')}
                  title="Numbered List"
                />
                <ToolbarButton
                  icon={<Quote className="w-4 h-4" />}
                  onClick={() => toggleLinePrefix('> ')}
                  title="Quote"
                />
              </div>

              <ToolbarDivider />

              {/* Insert */}
              <div className="flex items-center gap-0.5">
                <ToolbarButton
                  icon={<Link className="w-4 h-4" />}
                  onClick={() => wrapSelection('[', '](url)')}
                  title="Link"
                />
                <ToolbarButton
                  icon={<Image className="w-4 h-4" />}
                  onClick={() => wrapSelection('![', '](url)')}
                  title="Image"
                />
                <ToolbarButton
                  icon={<Minus className="w-4 h-4" />}
                  onClick={() => {
                    const textarea = textareaRef.current
                    if (!textarea) return
                    const pos = textarea.selectionStart
                    setContent(content.substring(0, pos) + '\n\n---\n\n' + content.substring(pos))
                  }}
                  title="Horizontal Rule"
                />
              </div>

              <ToolbarDivider />

              {/* Import */}
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<Import className="w-3.5 h-3.5" />}
                onClick={() => setShowImportModal(true)}
                className="text-blue-600 dark:text-blue-400"
              >
                Import
              </Button>

              <div className="flex-1" />

              {/* Stats */}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {content.length} chars | {content.split('\n').length} lines
              </div>
            </div>

            {/* Editor Area */}
            <div
              ref={editorContainerRef}
              className="flex-1 overflow-y-auto"
              onScroll={handleEditorScroll}
            >
              <textarea
                ref={textareaRef}
                value={hideAiMarks ? getDisplayContent() : content}
                onChange={e => handleContentChange(e.target.value)}
                onMouseUp={handleMouseUp}
                className="w-full h-full min-h-full p-6 resize-none outline-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="Start writing your markdown here..."
                style={{ minHeight: '100%' }}
              />
            </div>
          </Card>
        </motion.div>

        {/* Resizable Divider */}
        <div
          className={`
            relative w-1 cursor-col-resize z-20 shrink-0
            bg-slate-200/60 dark:bg-slate-700/60
            hover:bg-teal-400/60 dark:hover:bg-teal-500/60
            transition-colors duration-200
            ${isDragging ? 'bg-teal-400/60 dark:bg-teal-500/60' : ''}
          `}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 flex items-center justify-center">
            <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
        </div>

        {/* RIGHT PANEL - Preview & Suggestions */}
        <motion.div
          variants={slideInRight}
          className="flex-1 flex flex-col overflow-hidden min-w-0"
        >
          <Card variant="glass" hoverEffect={false} className="h-full flex flex-col !rounded-none">
            {/* Preview Header */}
            <div className="px-5 py-4 border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Preview</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live preview | Synced scroll
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={
                    hideAiMarks ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )
                  }
                  onClick={() => setHideAiMarks(!hideAiMarks)}
                  className={hideAiMarks ? 'text-emerald-600 dark:text-emerald-400' : ''}
                >
                  {hideAiMarks ? 'Show Marks' : 'Hide Marks'}
                </Button>

                <ToolbarDivider />

                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Book className="w-3.5 h-3.5" />}
                  onClick={() => setShowNotebookModal(true)}
                  className="text-indigo-600 dark:text-indigo-400"
                >
                  Save
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<FileText className="w-3.5 h-3.5" />}
                  onClick={exportMarkdown}
                >
                  .md
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={<Download className="w-3.5 h-3.5" />}
                  onClick={exportPDF}
                  loading={isProcessing}
                >
                  .pdf
                </Button>

                <ToolbarDivider />

                <Button
                  variant={showHistory ? 'secondary' : 'ghost'}
                  size="sm"
                  iconLeft={<History className="w-3.5 h-3.5" />}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  History
                </Button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 flex min-h-0 relative">
              {/* Main Preview */}
              <div
                ref={previewRef}
                className="flex-1 overflow-y-auto p-6 prose prose-slate dark:prose-invert prose-sm max-w-none"
                onScroll={handlePreviewScroll}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                  components={{
                    mark: ({ node, ...props }) => (
                      <mark
                        className="bg-yellow-200/80 dark:bg-yellow-500/30 px-1 rounded"
                        {...props}
                      />
                    ),
                    u: ({ node, ...props }) => (
                      <u className="underline decoration-2 decoration-teal-400" {...props} />
                    ),
                    span: ({ node, ...props }) => {
                      const dataAttr = (props as any)['data-rough-notation']
                      if (dataAttr) {
                        const styleClasses: Record<string, string> = {
                          circle: 'rough-circle',
                          highlight: 'rough-highlight',
                          box: 'rough-box',
                          underline: 'rough-underline',
                          bracket: 'rough-bracket',
                        }
                        return (
                          <span
                            className={`rough-notation ${styleClasses[dataAttr] || ''}`}
                            data-rough-notation={dataAttr}
                            {...props}
                          />
                        )
                      }
                      return <span {...props} />
                    },
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse" {...props} />
                      </div>
                    ),
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !match && !className

                      if (isInline) {
                        return (
                          <code
                            className="bg-slate-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400"
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      }

                      return (
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto my-4 shadow-xl">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      )
                    },
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-teal-500 pl-4 my-4 italic text-slate-600 dark:text-slate-400 bg-teal-50/50 dark:bg-teal-900/20 py-2 rounded-r-xl"
                        {...props}
                      />
                    ),
                  }}
                >
                  {processLatexContent(content)}
                </ReactMarkdown>
              </div>

              {/* History Panel Overlay */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-0 bottom-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-white/40 dark:border-slate-700/40 flex flex-col shadow-2xl z-10"
                  >
                    <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-500" />
                        Version History
                      </h3>
                      <motion.button
                        onClick={() => setShowHistory(false)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </motion.button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {operationHistory.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          No history available
                        </div>
                      ) : (
                        [...operationHistory]
                          .reverse()
                          .map(op => <HistoryItem key={op.id} operation={op} />)
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Podcast Section (Collapsible) */}
            <div className="border-t border-white/20 dark:border-slate-700/30 shrink-0">
              <motion.button
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/20 dark:hover:bg-slate-800/20 transition-colors"
                onClick={() => setIsPodcastExpanded(!isPodcastExpanded)}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: isPodcastExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </motion.div>
                  <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Podcast Narration
                  </span>
                  {ttsAvailable === false && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                      Script only
                    </span>
                  )}
                </div>
              </motion.button>

              <AnimatePresence>
                {isPodcastExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4">
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          iconLeft={
                            narrationLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )
                          }
                          onClick={handleGenerateNarration}
                          loading={narrationLoading}
                        >
                          {narrationLoading ? 'Generating...' : 'Generate Podcast'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeft={<Book className="w-4 h-4" />}
                          onClick={() => setShowNarrationNotebookModal(true)}
                          disabled={!narrationScript}
                        >
                          Save to Notebook
                        </Button>
                      </div>

                      {narrationError && (
                        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
                          <AlertCircle className="w-4 h-4" />
                          {narrationError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {/* Script */}
                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-xl p-3 h-32 overflow-y-auto">
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                            Script
                          </div>
                          {narrationScript ? (
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {narrationScript}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                              Generate to see script...
                            </p>
                          )}
                        </div>

                        {/* Key Points & Audio */}
                        <div className="space-y-3">
                          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/40 dark:border-slate-700/40 rounded-xl p-3 h-20 overflow-y-auto">
                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                              <Headphones className="w-3 h-3" />
                              Key Points
                            </div>
                            {narrationKeyPoints.length > 0 ? (
                              <ul className="list-disc pl-4 text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
                                {narrationKeyPoints.map((kp, idx) => (
                                  <li key={idx}>{kp}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                                Key points will appear here...
                              </p>
                            )}
                          </div>

                          {audioInfo?.audioUrl && (
                            <audio
                              controls
                              className="w-full h-9 rounded-lg"
                              style={{ borderRadius: '8px' }}
                            >
                              <source src={audioInfo.audioUrl} type="audio/mpeg" />
                            </audio>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* AI Edit Popover */}
        <AnimatePresence>
          {popover && (
            <motion.div
              ref={popoverRef}
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                position: 'fixed',
                left: Math.min(window.innerWidth - 360, Math.max(20, popover.x - 170)),
                top: Math.min(window.innerHeight - 500, popover.y),
              }}
              className="z-50 w-[340px]"
            >
              <Card
                variant="glass"
                hoverEffect={false}
                className="shadow-2xl border border-white/40 dark:border-slate-600/40"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/20 dark:border-slate-700/30 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 dark:from-teal-900/30 dark:to-cyan-900/30 flex justify-between items-center rounded-t-2xl">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    AI Edit Assistant
                  </div>
                  <motion.button
                    onClick={() => setPopover(null)}
                    className="p-1 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </motion.button>
                </div>

                <CardBody className="space-y-4">
                  {/* Selected Text Preview */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 line-clamp-2 italic">
                    "{selection?.text}"
                  </div>

                  {/* Instruction Input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Instruction (Optional)
                    </label>
                    <input
                      type="text"
                      value={instruction}
                      onChange={e => setInstruction(e.target.value)}
                      placeholder="e.g. Make it more formal..."
                      className="w-full px-3 py-2.5 text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400/60 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    />
                  </div>

                  {/* Source Selection */}
                  {selectedAction !== 'automark' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Context Source
                      </label>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => setSource(source === 'rag' ? null : 'rag')}
                          className={`
                            flex-1 flex items-center justify-center gap-2 py-2.5 text-xs border rounded-xl transition-all
                            ${
                              source === 'rag'
                                ? 'bg-teal-50 dark:bg-teal-900/40 border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300'
                                : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                            }
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Database className="w-4 h-4" />
                          RAG
                        </motion.button>
                        <motion.button
                          onClick={() => setSource(source === 'web' ? null : 'web')}
                          className={`
                            flex-1 flex items-center justify-center gap-2 py-2.5 text-xs border rounded-xl transition-all
                            ${
                              source === 'web'
                                ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                                : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                            }
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Globe className="w-4 h-4" />
                          Web
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* KB Selector */}
                  {source === 'rag' && kbs.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <select
                        value={selectedKb}
                        onChange={e => setSelectedKb(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl outline-none text-slate-800 dark:text-slate-200"
                      >
                        {kbs.map(kb => (
                          <option key={kb} value={kb}>
                            {kb}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3">
                    <div className="grid grid-cols-4 gap-2">
                      <ActionCard
                        icon={<Wand2 className="w-4 h-4" />}
                        label="Rewrite"
                        active={selectedAction === 'rewrite'}
                        onClick={() => setSelectedAction('rewrite')}
                        colorScheme="teal"
                      />
                      <ActionCard
                        icon={<Minimize2 className="w-4 h-4" />}
                        label="Shorten"
                        active={selectedAction === 'shorten'}
                        onClick={() => setSelectedAction('shorten')}
                        colorScheme="amber"
                      />
                      <ActionCard
                        icon={<Maximize2 className="w-4 h-4" />}
                        label="Expand"
                        active={selectedAction === 'expand'}
                        onClick={() => setSelectedAction('expand')}
                        colorScheme="blue"
                      />
                      <ActionCard
                        icon={<PenTool className="w-4 h-4" />}
                        label="AI Mark"
                        active={selectedAction === 'automark'}
                        onClick={() => setSelectedAction('automark')}
                        colorScheme="emerald"
                      />
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleAction(selectedAction)}
                      loading={isProcessing}
                      className="w-full"
                      iconLeft={!isProcessing && <Zap className="w-4 h-4" />}
                    >
                      {isProcessing
                        ? 'Processing...'
                        : `Apply ${selectedAction === 'automark' ? 'AI Mark' : selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)}`}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Loading Overlay */}
        <AnimatePresence>
          {isProcessing && !popover && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <Card variant="glass" className="p-8 flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <span className="font-medium text-slate-700 dark:text-slate-200">Exporting...</span>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals */}
      <AddToNotebookModal
        isOpen={showNotebookModal}
        onClose={() => setShowNotebookModal(false)}
        recordType="co_writer"
        title={`Co-Writer Document - ${new Date().toLocaleDateString()}`}
        userQuery="Co-Writer edited document"
        output={content}
        metadata={{
          char_count: content.length,
          line_count: content.split('\n').length,
        }}
      />

      <NotebookImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importedContent => {
          const newContent = content ? content + '\n\n' + importedContent : importedContent
          setContent(newContent)
        }}
      />

      <AddToNotebookModal
        isOpen={showNarrationNotebookModal}
        onClose={() => setShowNarrationNotebookModal(false)}
        recordType="co_writer"
        title={`Co-Writer Podcast - ${new Date().toLocaleDateString()}`}
        userQuery={content.substring(0, 120)}
        output={narrationScript}
        metadata={{
          char_count: narrationScript.length,
          style: narrationStyle,
          key_points: narrationKeyPoints,
          audio_url: audioInfo?.audioUrl,
          audio_id: audioInfo?.audioId,
          voice: audioInfo?.voice,
        }}
      />
    </PageWrapper>
  )
}
