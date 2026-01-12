'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  AlertCircle,
  Bold,
  Book,
  ChevronRight,
  Clock,
  Code,
  Database,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Heading1,
  Heading2,
  Headphones,
  Highlighter,
  History,
  Image as ImageIcon,
  Import,
  Italic,
  Link,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Mic,
  Minimize2,
  Minus,
  PenTool,
  Quote,
  Radio,
  Sparkles,
  Strikethrough,
  Underline as UnderlineIcon,
  Wand2,
  WifiOff,
  X,
  Zap,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'

import AddToNotebookModal from '@/components/AddToNotebookModal'
import NotebookImportModal from '@/components/NotebookImportModal'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card'
import Button, { IconButton } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/LoadingState'
import { useToast } from '@/components/ui/Toast'
import { apiUrl } from '@/lib/api'
import { parseKnowledgeBaseList } from '@/lib/knowledge'
import { processLatexContent } from '@/lib/latex'

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
}

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 24 },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
}

// AI mark tag regex patterns
const AI_MARK_REGEX = /<span\s+data-rough-notation="[^"]+">([^<]*)<\/span>/g

type WorkspaceView = 'split' | 'write' | 'preview'
type CoWriterAction = 'rewrite' | 'shorten' | 'expand' | 'automark'
type ContextSource = 'rag' | 'web' | null

type TextSelection = {
  start: number
  end: number
  text: string
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

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
    <IconButton
      icon={icon}
      aria-label={title}
      onClick={onClick}
      title={title}
      variant="ghost"
      size="sm"
      className={
        active
          ? 'rounded-xl bg-blue-100/80 text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-300'
          : 'rounded-xl text-zinc-500 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100'
      }
    />
  )
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-zinc-200/70 dark:bg-white/10" />
}

// ============================================================================
// Action Card Component
// ============================================================================

interface ActionCardProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  colorScheme: 'amber' | 'blue' | 'emerald'
}

function ActionCard({ icon, label, active, onClick, colorScheme }: ActionCardProps) {
  const colorClasses = {
    amber: {
      active:
        'bg-amber-50 dark:bg-amber-900/40 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300',
      inactive:
        'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-amber-50/60 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-300',
    },
    blue: {
      active:
        'bg-blue-50 dark:bg-blue-900/35 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300',
      inactive:
        'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300',
    },
    emerald: {
      active:
        'bg-emerald-50 dark:bg-emerald-900/35 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300',
      inactive:
        'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300',
    },
  } as const

  return (
    <Button
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={[
        '!h-auto !px-3 !py-3 !rounded-xl !flex-col !items-center !justify-center',
        'text-xs font-medium border transition-all',
        active ? colorClasses[colorScheme].active : colorClasses[colorScheme].inactive,
      ].join(' ')}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </Button>
  )
}

// ============================================================================
// History Item Component
// ============================================================================

interface OperationHistoryItem {
  id: string
  action: string
  timestamp: string
  input?: { original_text?: string }
  source?: string
}

interface HistoryItemProps {
  operation: OperationHistoryItem
}

function HistoryItem({ operation }: HistoryItemProps) {
  const actionColors: Record<string, string> = {
    rewrite: 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    shorten: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    automark: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    expand: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="cursor-pointer rounded-xl border border-white/40 bg-white/60 p-3 backdrop-blur-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-white/5"
      whileHover={{ y: -2 }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span
          className={[
            'rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase',
            actionColors[operation.action] ||
              'bg-zinc-100/80 dark:bg-white/10 text-zinc-700 dark:text-zinc-200',
          ].join(' ')}
        >
          {operation.action}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          <Clock className="h-3 w-3" />
          {new Date(operation.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="truncate text-xs text-zinc-700 dark:text-zinc-300">
        &quot;{operation.input?.original_text?.substring(0, 48)}...&quot;
      </div>
      {operation.source && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          {operation.source === 'rag' ? (
            <Database className="h-2.5 w-2.5" />
          ) : (
            <Globe className="h-2.5 w-2.5" />
          )}
          {operation.source.toUpperCase()}
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CoWriterPage() {
  const toast = useToast()

  // Core state
  const [content, setContent] = useState(
    '# Welcome to Co-Writer\n\nSelect text to see the magic happen.\n\n## Features\n\n- **Bold** text with Ctrl+B\n- *Italic* text with Ctrl+I\n- <u>Underline</u> with Ctrl+U\n- <mark>Highlight</mark> with Ctrl+H\n- AI-powered editing and auto-marking\n'
  )
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const [instruction, setInstruction] = useState('')
  const [selectedAction, setSelectedAction] = useState<CoWriterAction>('rewrite')
  const [source, setSource] = useState<ContextSource>(null)
  const [selectedKb, setSelectedKb] = useState('')
  const [kbs, setKbs] = useState<string[]>([])
  const [operationHistory, setOperationHistory] = useState<OperationHistoryItem[]>([])

  // UI state
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('split')
  const [hideAiMarks, setHideAiMarks] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Podcast / narration state
  const [isPodcastExpanded, setIsPodcastExpanded] = useState(false)
  const [narrationStyle, setNarrationStyle] = useState<'friendly' | 'academic' | 'concise'>(
    'friendly'
  )
  const [narrationScript, setNarrationScript] = useState('')
  const [narrationKeyPoints, setNarrationKeyPoints] = useState<string[]>([])
  const [narrationLoading, setNarrationLoading] = useState(false)
  const [narrationError, setNarrationError] = useState<string | null>(null)
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null)
  const [ttsVoices, setTtsVoices] = useState<Array<{ id: string; name: string; description?: string }>>(
    []
  )
  const [selectedVoice, setSelectedVoice] = useState('alloy')
  const [audioInfo, setAudioInfo] = useState<{
    audioUrl?: string
    audioId?: string
    voice?: string
  } | null>(null)
  const [showNarrationNotebookModal, setShowNarrationNotebookModal] = useState(false)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const isSyncingScroll = useRef(false)

  const fetchHistory = useCallback(() => {
    fetch(apiUrl('/api/v1/co_writer/history'))
      .then(res => {
        if (res.ok) return res.json()
        throw new Error(`HTTP ${res.status}`)
      })
      .then((data: { history?: unknown }) => {
        const history = Array.isArray(data.history) ? (data.history as OperationHistoryItem[]) : []
        setOperationHistory(history)
        setBackendConnected(true)
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Failed to fetch history:', getErrorMessage(err))
        }
        setBackendConnected(false)
      })
  }, [])

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
      }

      setBackendConnected(false)
      return false
    } catch (error: unknown) {
      setBackendConnected(false)
      const errorName = error instanceof Error ? error.name : undefined
      if (!silent && errorName !== 'AbortError' && process.env.NODE_ENV === 'development') {
        console.debug('Backend connection check failed:', getErrorMessage(error))
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
            return
          }
        }
      } catch {
        // ignore
      }

      setTtsAvailable(false)
      setTtsVoices([])
    }
    fetchTtsConfig()
  }, [])

  // Fetch KBs and history
  useEffect(() => {
    const loadData = async () => {
      setBackendConnected(null)
      try {
        const isConnected = await checkBackendConnection(true)
        if (!isConnected) return

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          const res = await fetch(apiUrl('/api/v1/knowledge/list'), { signal: controller.signal })
          clearTimeout(timeoutId)
          if (res.ok) {
            const data = await res.json()
            const names = parseKnowledgeBaseList(data).map(kb => kb.name)
            setKbs(names)
            if (names.length > 0) setSelectedKb(names[0])
          }
        } catch (err: unknown) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('Failed to fetch KBs:', getErrorMessage(err))
          }
        }

        fetchHistory()
      } catch (error: unknown) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('Failed to initialize:', getErrorMessage(error))
        }
      }
    }

    loadData()
  }, [checkBackendConnection, fetchHistory])

  // Auto clear source when automark is selected
  useEffect(() => {
    if (selectedAction === 'automark') setSource(null)
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

  const getDisplayContent = useCallback(() => {
    if (!hideAiMarks) return content
    return content.replace(AI_MARK_REGEX, '$1')
  }, [content, hideAiMarks])

  // Smart AI mark protection while editing (hide marks mode)
  const mergeEditWithMarks = useCallback((original: string, oldPlain: string, newPlain: string): string => {
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

    while (diffStart < oldPlain.length && diffStart < newPlain.length && oldPlain[diffStart] === newPlain[diffStart]) {
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
        const textAtPosition = newPlain.substring(newPosition, newPosition + mark.innerText.length)
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
  }, [])

  const handleContentChange = useCallback(
    (newValue: string) => {
      if (!hideAiMarks) {
        setContent(newValue)
        return
      }

      setContent(prevContent => {
        const oldDisplayContent = prevContent.replace(AI_MARK_REGEX, '$1')
        const newDisplayContent = newValue
        if (oldDisplayContent === newDisplayContent) return prevContent
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

    let newDisplayContent: string
    let newStart: number
    let newEnd: number

    if (textBefore === before && textAfter === after) {
      newDisplayContent =
        textarea.value.substring(0, start - before.length) +
        selectedText +
        textarea.value.substring(end + after.length)
      newStart = start - before.length
      newEnd = end - before.length
    } else {
      newDisplayContent =
        textarea.value.substring(0, start) + before + selectedText + after + textarea.value.substring(end)
      newStart = start + before.length
      newEnd = end + before.length
    }

    handleContentChange(newDisplayContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newStart, newEnd)
    }, 0)
  }, [handleContentChange])

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
      lines[i] = allHavePrefix ? lines[i].substring(prefix.length) : prefix + lines[i]
    }

    handleContentChange(lines.join('\n'))
  }, [handleContentChange])

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

  const mapPlainIndexToContentIndex = useCallback(
    (plainIndex: number) => {
      const openTagPrefix = '<span data-rough-notation="'
      const closeTag = '</span>'

      let contentIndex = 0
      let plainOffset = 0

      while (contentIndex < content.length && plainOffset < plainIndex) {
        if (content.startsWith(openTagPrefix, contentIndex)) {
          const tagEnd = content.indexOf('>', contentIndex)
          if (tagEnd === -1) break
          contentIndex = tagEnd + 1
          continue
        }

        if (content.startsWith(closeTag, contentIndex)) {
          contentIndex += closeTag.length
          continue
        }

        contentIndex++
        plainOffset++
      }

      return contentIndex
    },
    [content]
  )

  const updateSelectionFromTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const plainStart = textarea.selectionStart
    const plainEnd = textarea.selectionEnd
    const selectedPlainText = textarea.value.substring(plainStart, plainEnd)

    if (selectedPlainText.trim().length === 0) {
      setSelection(null)
      return
    }

    const start = hideAiMarks ? mapPlainIndexToContentIndex(plainStart) : plainStart
    const end = hideAiMarks ? mapPlainIndexToContentIndex(plainEnd) : plainEnd

    setSelection({ start, end, text: selectedPlainText })
  }, [hideAiMarks, mapPlainIndexToContentIndex])

  const handleAction = async (action: CoWriterAction) => {
    if (!selection) return

    if (backendConnected === false) {
      const isConnected = await checkBackendConnection()
      if (!isConnected) {
        toast.error('Backend service not connected. Run: python start.py', 'Backend offline')
        return
      }
    }

    setIsProcessing(true)

    try {
      let editedText: string
      const apiEndpoint = action === 'automark' ? '/api/v1/co_writer/automark' : '/api/v1/co_writer/edit'
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
        if (!data.marked_text) throw new Error('Invalid response: missing marked_text field')
        editedText = data.marked_text
      } else {
        const requestBody: Record<string, unknown> = {
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
        if (!data.edited_text) throw new Error('Invalid response: missing edited_text field')
        editedText = data.edited_text
      }

      const newContent = content.substring(0, selection.start) + editedText + content.substring(selection.end)
      setContent(newContent)
      setSelection(null)
      fetchHistory()
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Action error:', error)
      }
      setBackendConnected(false)

      let errorMessage = 'Error processing request'
      const resolvedMessage = getErrorMessage(error)
      if (error instanceof TypeError && (resolvedMessage.includes('fetch') || resolvedMessage === 'Failed to fetch')) {
        errorMessage = 'Cannot connect to backend service. Run: python start.py'
      } else if (resolvedMessage) {
        errorMessage = resolvedMessage
      }

      toast.error(errorMessage, 'Request failed')
    } finally {
      setIsProcessing(false)
    }
  }

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
    const restoreView: WorkspaceView | null = previewRef.current ? null : workspaceView

    if (!previewRef.current) {
      setWorkspaceView('preview')
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }

    if (!previewRef.current) return

    setIsExporting(true)
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
    } catch (e: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PDF export error:', e)
      }
      toast.error('PDF export failed, please try again.', 'Export failed')
    } finally {
      setIsExporting(false)
      if (restoreView) setWorkspaceView(restoreView)
    }
  }

  const handleGenerateNarration = async () => {
    if (!content.trim()) {
      setNarrationError('Current note is empty, cannot generate narration.')
      return
    }

    setNarrationLoading(true)
    setNarrationError(null)
    try {
      const requestBody: Record<string, unknown> = {
        content,
        style: narrationStyle,
        skip_audio: ttsAvailable !== true,
      }

      if (ttsAvailable === true && selectedVoice) {
        requestBody.voice = selectedVoice
      }

      const res = await fetch(apiUrl('/api/v1/co_writer/narrate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
          audioUrl,
          audioId: data.audio_id,
          voice: data.voice,
        })
      } else {
        setAudioInfo(null)
      }
    } catch (e: unknown) {
      setNarrationError(getErrorMessage(e) || 'Failed to generate narration, please try again.')
    } finally {
      setNarrationLoading(false)
    }
  }

  const previewMarkdown = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      components={{
        mark: ({ node, ...props }) => (
          <mark className="bg-yellow-200/80 dark:bg-yellow-500/30 px-1 rounded" {...props} />
        ),
        u: ({ node, ...props }) => <u className="underline decoration-2 decoration-blue-400" {...props} />,
        span: ({ node, ...props }) => {
          const roughNotation = (props as { 'data-rough-notation'?: string })['data-rough-notation']
          if (roughNotation) {
            const styleClasses: Record<string, string> = {
              circle: 'rough-circle',
              highlight: 'rough-highlight',
              box: 'rough-box',
              underline: 'rough-underline',
              bracket: 'rough-bracket',
            }
            return (
              <span
                className={`rough-notation ${styleClasses[roughNotation] || ''}`}
                data-rough-notation={roughNotation}
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
                className="bg-zinc-100/80 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400"
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <pre className="bg-zinc-950 text-zinc-50 p-4 rounded-xl overflow-x-auto my-4 shadow-xl">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          )
        },
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-blue-500 pl-4 my-4 italic text-zinc-700 dark:text-zinc-300 bg-blue-50/50 dark:bg-blue-900/20 py-2 rounded-r-xl"
            {...props}
          />
        ),
      }}
    >
      {processLatexContent(content)}
    </ReactMarkdown>
  )

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
        <motion.main
          className="relative mx-auto flex min-h-dvh max-w-[1400px] flex-col px-6 pb-10 pt-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <PageHeader
            title="Co-Writer"
            description="AI-powered markdown editor"
            icon={<Edit3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            className="mb-6"
            actions={
              <div className="flex items-center gap-2">
                {backendConnected !== null && (
                  <div
                    className={[
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur',
                      backendConnected
                        ? 'border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/35 dark:text-emerald-300'
                        : 'border-red-200/70 bg-red-50/70 text-red-700 dark:border-red-800/40 dark:bg-red-950/35 dark:text-red-300',
                    ].join(' ')}
                  >
                    {backendConnected ? (
                      <>
                        <motion.span
                          className="h-2 w-2 rounded-full bg-emerald-500"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        Connected
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3.5 w-3.5" />
                        Offline
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 md:hidden">
                  <IconButton
                    icon={<Book className="h-4 w-4" />}
                    aria-label="Save to notebook"
                    onClick={() => setShowNotebookModal(true)}
                    variant="ghost"
                    size="sm"
                  />
                  <IconButton
                    icon={<Import className="h-4 w-4" />}
                    aria-label="Import from notebook"
                    onClick={() => setShowImportModal(true)}
                    variant="ghost"
                    size="sm"
                  />
                  <IconButton
                    icon={<FileText className="h-4 w-4" />}
                    aria-label="Export markdown"
                    onClick={exportMarkdown}
                    variant="ghost"
                    size="sm"
                  />
                  <IconButton
                    icon={<Download className="h-4 w-4" />}
                    aria-label="Export PDF"
                    onClick={exportPDF}
                    variant="ghost"
                    size="sm"
                    disabled={isExporting}
                  />
                </div>

                <div className="hidden items-center gap-2 md:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<Book className="h-4 w-4" />}
                    onClick={() => setShowNotebookModal(true)}
                    className="text-blue-600 dark:text-blue-400"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<Import className="h-4 w-4" />}
                    onClick={() => setShowImportModal(true)}
                  >
                    Import
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<FileText className="h-4 w-4" />}
                    onClick={exportMarkdown}
                  >
                    .md
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<Download className="h-4 w-4" />}
                    onClick={exportPDF}
                    loading={isExporting}
                  >
                    .pdf
                  </Button>
                </div>
              </div>
            }
          />

          <div className="grid flex-1 min-h-0 gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            <motion.aside variants={slideInLeft} className="flex min-h-0 flex-col gap-6 lg:overflow-y-auto lg:pr-1">
              <Card variant="glass" padding="none" interactive={false} className="relative overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_60%)]"
                />

                <div className="relative flex flex-col">
                  <CardHeader padding="sm" className="flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Assistant</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Edit highlighted text with AI
                        </div>
                      </div>
                    </div>

                    {selection ? (
                      <Button variant="ghost" size="sm" iconLeft={<X className="h-4 w-4" />} onClick={() => setSelection(null)}>
                        Clear
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">No selection</span>
                    )}
                  </CardHeader>

                  <CardBody className="space-y-4">
                    {selection ? (
                      <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Selected
                        </div>
                        <p className="mt-2 line-clamp-4 italic">&quot;{selection.text}&quot;</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-4 text-sm text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                        <div className="flex items-center gap-2 font-medium">
                          <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Select text in the editor to enable actions.
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Tip: Use the toolbar or shortcuts (Ctrl/Cmd + B, I, U, H).
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                      <ActionCard
                        icon={<Wand2 className="h-4 w-4" />}
                        label="Rewrite"
                        active={selectedAction === 'rewrite'}
                        onClick={() => setSelectedAction('rewrite')}
                        colorScheme="blue"
                      />
                      <ActionCard
                        icon={<Minimize2 className="h-4 w-4" />}
                        label="Shorten"
                        active={selectedAction === 'shorten'}
                        onClick={() => setSelectedAction('shorten')}
                        colorScheme="amber"
                      />
                      <ActionCard
                        icon={<Maximize2 className="h-4 w-4" />}
                        label="Expand"
                        active={selectedAction === 'expand'}
                        onClick={() => setSelectedAction('expand')}
                        colorScheme="blue"
                      />
                      <ActionCard
                        icon={<PenTool className="h-4 w-4" />}
                        label="AI Mark"
                        active={selectedAction === 'automark'}
                        onClick={() => setSelectedAction('automark')}
                        colorScheme="emerald"
                      />
                    </div>

                    <Input
                      label="Instruction (optional)"
                      floatingLabel
                      value={instruction}
                      onChange={e => setInstruction(e.target.value)}
                      placeholder="e.g. Make it more formal, clearer, and shorter..."
                    />

                    {selectedAction !== 'automark' && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Context
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => setSource(source === 'rag' ? null : 'rag')}
                            variant="ghost"
                            size="sm"
                            className={
                              source === 'rag'
                                ? '!h-auto !rounded-xl border border-blue-300 bg-blue-50 py-2.5 text-xs text-blue-700 dark:border-blue-600 dark:bg-blue-900/35 dark:text-blue-300'
                                : '!h-auto !rounded-xl border border-zinc-200/70 bg-white/50 py-2.5 text-xs text-zinc-700 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'
                            }
                          >
                            <Database className="h-4 w-4" />
                            RAG
                          </Button>
                          <Button
                            onClick={() => setSource(source === 'web' ? null : 'web')}
                            variant="ghost"
                            size="sm"
                            className={
                              source === 'web'
                                ? '!h-auto !rounded-xl border border-blue-300 bg-blue-50 py-2.5 text-xs text-blue-700 dark:border-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                                : '!h-auto !rounded-xl border border-zinc-200/70 bg-white/50 py-2.5 text-xs text-zinc-700 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'
                            }
                          >
                            <Globe className="h-4 w-4" />
                            Web
                          </Button>
                        </div>

                        {source === 'rag' && kbs.length > 0 && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                            <select
                              value={selectedKb}
                              onChange={e => setSelectedKb(e.target.value)}
                              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] focus:border-zinc-400 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                            >
                              {kbs.map(kb => (
                                <option key={kb} value={kb}>
                                  {kb}
                                </option>
                              ))}
                            </select>
                          </motion.div>
                        )}
                      </div>
                    )}

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleAction(selectedAction)}
                      loading={isProcessing}
                      disabled={!selection}
                      className="w-full"
                      iconLeft={!isProcessing && <Zap className="h-4 w-4" />}
                    >
                      {isProcessing
                        ? 'Processing...'
                        : `Apply ${
                            selectedAction === 'automark'
                              ? 'AI Mark'
                              : selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)
                          }`}
                    </Button>
                  </CardBody>

                  <CardFooter padding="sm" className="justify-between">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {backendConnected === false ? 'Backend offline. Start it with python start.py.' : ' '}
                    </span>
                    <Button variant="ghost" size="sm" iconLeft={<History className="h-4 w-4" />} onClick={fetchHistory}>
                      Refresh
                    </Button>
                  </CardFooter>
                </div>
              </Card>

              <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
                <CardHeader padding="sm" className="flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">History</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Recent backend edits</div>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="space-y-2 max-h-72 overflow-y-auto">
                  {operationHistory.length === 0 ? (
                    <div className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      <History className="mx-auto h-10 w-10 opacity-30" />
                      <div className="mt-2">No history yet</div>
                    </div>
                  ) : (
                    [...operationHistory]
                      .reverse()
                      .slice(0, 12)
                      .map(op => <HistoryItem key={op.id} operation={op} />)
                  )}
                </CardBody>
              </Card>

              <Card variant="glass" padding="none" interactive={false} className="overflow-hidden">
                <CardHeader padding="sm" className="flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <Radio className="h-5 w-5" />
                    </div>
                    <div className="leading-tight">
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Podcast Narration
                        {ttsAvailable === false && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            Script only
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Generate a narration script (and audio when available)
                      </div>
                    </div>
                  </div>

                  <IconButton
                    icon={
                      <motion.div animate={{ rotate: isPodcastExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    }
                    aria-label={isPodcastExpanded ? 'Collapse podcast panel' : 'Expand podcast panel'}
                    onClick={() => setIsPodcastExpanded(!isPodcastExpanded)}
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                  />
                </CardHeader>

                <AnimatePresence initial={false}>
                  {isPodcastExpanded && (
                    <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                      <CardBody className="space-y-4">
                        <div className="space-y-2">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Style
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['friendly', 'academic', 'concise'] as const).map(style => (
                              <Button
                                key={style}
                                variant="ghost"
                                size="sm"
                                onClick={() => setNarrationStyle(style)}
                                className={
                                  narrationStyle === style
                                    ? '!h-auto !rounded-xl border border-blue-300 bg-blue-50 py-2 text-xs text-blue-700 dark:border-blue-600 dark:bg-blue-900/35 dark:text-blue-300'
                                    : '!h-auto !rounded-xl border border-zinc-200/70 bg-white/50 py-2 text-xs text-zinc-700 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'
                                }
                              >
                                {style.charAt(0).toUpperCase() + style.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {ttsAvailable && ttsVoices.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              Voice
                            </div>
                            <select
                              value={selectedVoice}
                              onChange={e => setSelectedVoice(e.target.value)}
                              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] focus:border-zinc-400 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                            >
                              {ttsVoices.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            iconLeft={narrationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                            onClick={handleGenerateNarration}
                            loading={narrationLoading}
                          >
                            {narrationLoading ? 'Generating…' : 'Generate'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            iconLeft={<Book className="h-4 w-4" />}
                            onClick={() => setShowNarrationNotebookModal(true)}
                            disabled={!narrationScript}
                          >
                            Save to Notebook
                          </Button>
                        </div>

                        {narrationError && (
                          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            <AlertCircle className="h-4 w-4" />
                            {narrationError}
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs text-zinc-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              Script
                            </div>
                            <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                              {narrationScript || 'Generate to see a narration script…'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-zinc-200/70 bg-white/70 p-3 text-xs text-zinc-800 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                              <Headphones className="h-3.5 w-3.5" />
                              Key points
                            </div>
                            {narrationKeyPoints.length > 0 ? (
                              <ul className="mt-2 list-disc space-y-1 pl-4">
                                {narrationKeyPoints.map((kp, idx) => (
                                  <li key={idx}>{kp}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-zinc-500 dark:text-zinc-400 italic">
                                Key points will appear here…
                              </p>
                            )}
                          </div>

                          {audioInfo?.audioUrl && (
                            <audio controls className="h-10 w-full rounded-lg">
                              <source src={audioInfo.audioUrl} type="audio/mpeg" />
                            </audio>
                          )}
                        </div>
                      </CardBody>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.aside>

            <motion.section variants={slideInRight} className="min-h-0">
              <Card variant="glass" padding="none" interactive={false} className="relative h-full overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_60%)]"
                />

                <div className="relative flex h-full flex-col">
                  <CardHeader padding="sm" className="flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                        <Edit3 className="h-5 w-5" />
                      </div>
                      <div className="leading-tight">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Workspace</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Markdown editor · Live preview
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center rounded-xl border border-zinc-200/70 bg-white/70 p-1 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                        {([
                          { key: 'write', label: 'Write' },
                          { key: 'split', label: 'Split' },
                          { key: 'preview', label: 'Preview' },
                        ] as const).map(opt => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setWorkspaceView(opt.key)}
                            className={[
                              'rounded-lg px-3 py-1.5 font-semibold transition-colors',
                              workspaceView === opt.key
                                ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-zinc-50'
                                : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-zinc-50',
                            ].join(' ')}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={hideAiMarks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        onClick={() => setHideAiMarks(!hideAiMarks)}
                        className={hideAiMarks ? 'text-blue-600 dark:text-blue-400' : ''}
                      >
                        {hideAiMarks ? 'Show Marks' : 'Hide Marks'}
                      </Button>

                      <span className="hidden lg:inline text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                        {content.length} chars · {content.split('\n').length} lines
                      </span>
                    </div>
                  </CardHeader>

                  <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200/70 bg-white/40 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center gap-0.5">
                      <ToolbarButton icon={<Bold className="h-4 w-4" />} onClick={() => wrapSelection('**', '**')} title="Bold (Ctrl+B)" />
                      <ToolbarButton icon={<Italic className="h-4 w-4" />} onClick={() => wrapSelection('*', '*')} title="Italic (Ctrl+I)" />
                      <ToolbarButton icon={<UnderlineIcon className="h-4 w-4" />} onClick={() => wrapSelection('<u>', '</u>')} title="Underline (Ctrl+U)" />
                      <ToolbarButton icon={<Highlighter className="h-4 w-4" />} onClick={() => wrapSelection('<mark>', '</mark>')} title="Highlight (Ctrl+H)" />
                      <ToolbarButton icon={<Strikethrough className="h-4 w-4" />} onClick={() => wrapSelection('~~', '~~')} title="Strikethrough" />
                      <ToolbarButton icon={<Code className="h-4 w-4" />} onClick={() => wrapSelection('`', '`')} title="Inline code" />
                    </div>

                    <ToolbarDivider />

                    <div className="flex items-center gap-0.5">
                      <ToolbarButton icon={<Heading1 className="h-4 w-4" />} onClick={() => toggleLinePrefix('# ')} title="Heading 1" />
                      <ToolbarButton icon={<Heading2 className="h-4 w-4" />} onClick={() => toggleLinePrefix('## ')} title="Heading 2" />
                      <ToolbarButton icon={<List className="h-4 w-4" />} onClick={() => toggleLinePrefix('- ')} title="Bullet list" />
                      <ToolbarButton icon={<ListOrdered className="h-4 w-4" />} onClick={() => toggleLinePrefix('1. ')} title="Numbered list" />
                      <ToolbarButton icon={<Quote className="h-4 w-4" />} onClick={() => toggleLinePrefix('> ')} title="Quote" />
                    </div>

                    <ToolbarDivider />

                    <div className="flex items-center gap-0.5">
                      <ToolbarButton icon={<Link className="h-4 w-4" />} onClick={() => wrapSelection('[', '](url)')} title="Link" />
                      <ToolbarButton icon={<ImageIcon className="h-4 w-4" />} onClick={() => wrapSelection('![', '](url)')} title="Image" />
                      <ToolbarButton
                        icon={<Minus className="h-4 w-4" />}
                        onClick={() => {
                          const textarea = textareaRef.current
                          if (!textarea) return
                          const pos = textarea.selectionStart
                          setContent(content.substring(0, pos) + '\n\n---\n\n' + content.substring(pos))
                        }}
                        title="Horizontal rule"
                      />
                    </div>

                    <div className="flex-1" />
                  </div>

                  <div className="flex-1 min-h-0">
                    {workspaceView === 'split' && (
                      <div className="grid h-full min-h-0 grid-cols-1 divide-y divide-zinc-200/70 dark:divide-white/10 lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
                        <div ref={editorContainerRef} className="min-h-0 overflow-y-auto" onScroll={handleEditorScroll}>
                          <Textarea
                            ref={textareaRef}
                            value={hideAiMarks ? getDisplayContent() : content}
                            onChange={e => handleContentChange(e.target.value)}
                            onMouseUp={updateSelectionFromTextarea}
                            onKeyUp={updateSelectionFromTextarea}
                            onSelect={updateSelectionFromTextarea}
                            minRows={24}
                            wrapperClassName="h-full"
                            className="h-full w-full resize-none !bg-transparent !border-0 !shadow-none !ring-0 !px-6 !py-6 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:!border-transparent focus:!ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                            placeholder="Start writing your markdown here…"
                          />
                        </div>

                        <div
                          ref={previewRef}
                          className="min-h-0 overflow-y-auto p-6 prose prose-zinc prose-sm max-w-none dark:prose-invert"
                          onScroll={handlePreviewScroll}
                        >
                          {previewMarkdown}
                        </div>
                      </div>
                    )}

                    {workspaceView === 'write' && (
                      <div ref={editorContainerRef} className="h-full min-h-0 overflow-y-auto" onScroll={handleEditorScroll}>
                        <Textarea
                          ref={textareaRef}
                          value={hideAiMarks ? getDisplayContent() : content}
                          onChange={e => handleContentChange(e.target.value)}
                          onMouseUp={updateSelectionFromTextarea}
                          onKeyUp={updateSelectionFromTextarea}
                          onSelect={updateSelectionFromTextarea}
                          minRows={24}
                          wrapperClassName="h-full"
                          className="h-full w-full resize-none !bg-transparent !border-0 !shadow-none !ring-0 !px-6 !py-6 font-mono text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:!border-transparent focus:!ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                          placeholder="Start writing your markdown here…"
                        />
                      </div>
                    )}

                    {workspaceView === 'preview' && (
                      <div
                        ref={previewRef}
                        className="h-full min-h-0 overflow-y-auto p-6 prose prose-zinc prose-sm max-w-none dark:prose-invert"
                        onScroll={handlePreviewScroll}
                      >
                        {previewMarkdown}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.section>
          </div>
        </motion.main>

        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80"
            >
              <Card variant="glass" className="flex flex-col items-center gap-4 p-8">
                <Spinner size="lg" />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Exporting…</span>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
    </div>
  )
}
