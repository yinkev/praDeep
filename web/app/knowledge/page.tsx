'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Database,
  FileText,
  Image as ImageIcon,
  Layers,
  Plus,
  Upload,
  Trash2,
  Loader2,
  X,
  RefreshCw,
  History,
  CloudUpload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import Button, { IconButton } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import VersionsModal from '@/components/knowledge/VersionsModal'
import { apiUrl, wsUrl } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

interface KnowledgeBase {
  name: string
  is_default: boolean
  statistics: {
    raw_documents: number
    images: number
    content_lists: number
    rag_initialized: boolean
    rag?: {
      chunks?: number
      entities?: number
      relations?: number
    }
  }
}

interface ProgressInfo {
  stage: string
  message: string
  current: number
  total: number
  file_name?: string
  progress_percent: number
  error?: string
}

// ============================================================================
// Animation Variants
// ============================================================================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

const uploadAreaVariants = {
  idle: {
    scale: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  dragging: {
    scale: 1.02,
    borderColor: 'rgba(20, 184, 166, 0.8)',
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
}

const pulseAnimation = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

// ============================================================================
// Animated Counter Component
// ============================================================================

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

function AnimatedCounter({ value, duration = 1, className = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef(0)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = value
    const startTime = Date.now()
    const durationMs = duration * 1000

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = Math.round(startValue + (endValue - startValue) * easeOutQuart)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    previousValue.current = value
  }, [value, duration])

  return <span className={className}>{displayValue.toLocaleString()}</span>
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  accentColor?: string
}

function StatCard({ icon, label, value, accentColor = 'teal' }: StatCardProps) {
  const colorClasses = {
    teal: 'from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400',
    blue: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400',
    purple: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400',
    amber: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl p-4
        bg-gradient-to-br ${colorClasses[accentColor as keyof typeof colorClasses]}
        backdrop-blur-sm
      `}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/50 dark:bg-slate-800/50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
            <AnimatedCounter value={value} duration={0.8} />
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Progress Hint Helper
// ============================================================================

function getProgressHint(progress: ProgressInfo): string | null {
  const stage = progress.stage
  const fileName = progress.file_name?.toLowerCase() || ''
  const message = progress.message?.toLowerCase() || ''

  const looksLikePdf = fileName.endsWith('.pdf')
  const looksLikeMinerU = message.includes('mineru')

  if (stage === 'processing_file' && (looksLikePdf || looksLikeMinerU)) {
    return 'Large PDFs can look "stuck" here while MinerU parses a single file. The % reflects file-level progress, not within-file parsing.'
  }

  if (stage === 'processing_file') {
    return 'This step can take a while for large files. The % reflects file-level progress.'
  }

  if (stage === 'processing_documents') {
    return 'Preparing documents for parsing and indexing. For large PDFs this can take several minutes.'
  }

  return null
}

// ============================================================================
// Glass Upload Area Component
// ============================================================================

interface GlassUploadAreaProps {
  files: FileList | null
  setFiles: (files: FileList | null) => void
  dragActive: boolean
  setDragActive: (active: boolean) => void
  inputId: string
}

function GlassUploadArea({
  files,
  setFiles,
  dragActive,
  setDragActive,
  inputId,
}: GlassUploadAreaProps) {
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true)
      } else if (e.type === 'dragleave') {
        setDragActive(false)
      }
    },
    [setDragActive]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setFiles(e.dataTransfer.files)
      }
    },
    [setDragActive, setFiles]
  )

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl p-8
        border-2 border-dashed
        transition-colors duration-300
        ${
          dragActive
            ? 'border-teal-500 bg-teal-500/10'
            : 'border-slate-200/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-800/40'
        }
        backdrop-blur-xl
      `}
      variants={uploadAreaVariants}
      animate={dragActive ? 'dragging' : 'idle'}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: dragActive ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Animated particles when dragging */}
      <AnimatePresence>
        {dragActive && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-teal-500/40"
                initial={{
                  x: `${20 + i * 15}%`,
                  y: '100%',
                  opacity: 0,
                }}
                animate={{
                  y: '-20%',
                  opacity: [0, 1, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: 'easeOut' as const,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <input
        type="file"
        multiple
        className="hidden"
        id={inputId}
        onChange={e => setFiles(e.target.files)}
        accept=".pdf,.txt,.md"
      />
      <label htmlFor={inputId} className="cursor-pointer flex flex-col items-center gap-4 relative">
        <motion.div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            ${dragActive ? 'bg-teal-500/20' : 'bg-slate-100 dark:bg-slate-700/50'}
            transition-colors duration-300
          `}
          animate={dragActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: dragActive ? Infinity : 0 }}
        >
          <CloudUpload
            className={`w-8 h-8 ${dragActive ? 'text-teal-500' : 'text-slate-400 dark:text-slate-500'}`}
          />
        </motion.div>

        <div className="text-center">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 block">
            {files && files.length > 0 ? (
              <span className="text-teal-600 dark:text-teal-400">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              'Drag & drop files here or click to browse'
            )}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Supports PDF, TXT, MD
          </span>
        </div>

        {files && files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 justify-center mt-2"
          >
            {Array.from(files)
              .slice(0, 3)
              .map((file, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs"
                >
                  {file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}
                </span>
              ))}
            {files.length > 3 && (
              <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
                +{files.length - 3} more
              </span>
            )}
          </motion.div>
        )}
      </label>
    </motion.div>
  )
}

// ============================================================================
// Knowledge Base Card Component
// ============================================================================

interface KBCardProps {
  kb: KnowledgeBase
  progress?: ProgressInfo
  onUpload: () => void
  onDelete: () => void
  onReindex: () => void
  onViewVersions: () => void
  reindexing: boolean
  onClearProgress: () => void
}

function KBCard({
  kb,
  progress,
  onUpload,
  onDelete,
  onReindex,
  onViewVersions,
  reindexing,
  onClearProgress,
}: KBCardProps) {
  const getStatusInfo = () => {
    if (progress) {
      if (progress.stage === 'completed') {
        return { status: 'Ready', color: 'emerald', icon: CheckCircle2 }
      } else if (progress.stage === 'error') {
        return { status: 'Error', color: 'red', icon: AlertCircle }
      } else {
        const stageLabels: Record<string, string> = {
          initializing: 'Initializing',
          processing_documents: 'Processing',
          processing_file: 'Parsing & Indexing',
          extracting_items: 'Extracting Items',
        }
        return {
          status: stageLabels[progress.stage] || progress.stage,
          color: 'blue',
          icon: Loader2,
          loading: true,
          percent: progress.progress_percent,
        }
      }
    }
    return kb.statistics.rag_initialized
      ? { status: 'Ready', color: 'emerald', icon: CheckCircle2 }
      : { status: 'Not Indexed', color: 'slate', icon: FolderOpen }
  }

  const statusInfo = getStatusInfo()
  const hint = progress ? getProgressHint(progress) : null

  return (
    <Card variant="glass" className="group relative">
      {/* Animated background gradient on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        initial={false}
      />

      <CardHeader className="flex items-start justify-between gap-4 relative">
        <div className="flex items-center gap-3">
          <div
            className="
              w-12 h-12 rounded-xl flex items-center justify-center
              bg-gradient-to-br from-teal-500/20 to-cyan-500/20
              border border-teal-500/20
              shadow-lg shadow-teal-500/10
            "
          >
            <Database className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{kb.name}</h3>
            {kb.is_default && (
              <span
                className="
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  bg-teal-100 dark:bg-teal-900/40
                  text-teal-700 dark:text-teal-300
                  text-[10px] font-bold uppercase tracking-wide
                  border border-teal-200 dark:border-teal-800
                "
              >
                <Sparkles className="w-2.5 h-2.5" />
                Default
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - visible on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <IconButton
            icon={<History className="w-4 h-4" />}
            variant="ghost"
            size="sm"
            aria-label="Version History"
            onClick={onViewVersions}
          />
          <IconButton
            icon={<RefreshCw className={`w-4 h-4 ${reindexing ? 'animate-spin' : ''}`} />}
            variant="ghost"
            size="sm"
            aria-label="Re-index"
            onClick={onReindex}
            disabled={reindexing}
          />
          <IconButton
            icon={<Upload className="w-4 h-4" />}
            variant="ghost"
            size="sm"
            aria-label="Upload Documents"
            onClick={onUpload}
          />
          <IconButton
            icon={<Trash2 className="w-4 h-4" />}
            variant="ghost"
            size="sm"
            aria-label="Delete"
            onClick={onDelete}
            className="hover:!bg-red-100 dark:hover:!bg-red-900/40 hover:!text-red-600 dark:hover:!text-red-400"
          />
        </div>
      </CardHeader>

      <CardBody className="space-y-4 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Documents"
            value={kb.statistics.raw_documents}
            accentColor="teal"
          />
          <StatCard
            icon={<ImageIcon className="w-4 h-4" />}
            label="Images"
            value={kb.statistics.images}
            accentColor="purple"
          />
        </div>

        {/* Status Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Status
            </span>
            <span
              className={`
                font-semibold flex items-center gap-1
                ${
                  statusInfo.color === 'emerald'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : statusInfo.color === 'red'
                      ? 'text-red-600 dark:text-red-400'
                      : statusInfo.color === 'blue'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500'
                }
              `}
            >
              {statusInfo.loading && <Loader2 className="w-3 h-3 animate-spin" />}
              {statusInfo.status}
              {statusInfo.percent !== undefined && ` ${statusInfo.percent}%`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            {progress ? (
              <motion.div
                className={`h-full rounded-full ${
                  progress.stage === 'completed'
                    ? 'bg-emerald-500'
                    : progress.stage === 'error'
                      ? 'bg-red-500'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress_percent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            ) : (
              <div
                className={`h-full rounded-full ${
                  kb.statistics.rag_initialized
                    ? 'bg-emerald-500 w-full'
                    : 'bg-slate-300 dark:bg-slate-600 w-0'
                }`}
              />
            )}
          </div>

          {/* Progress Details */}
          {progress && progress.message && (
            <div className="space-y-1">
              <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate">{progress.message}</span>
                {progress.stage !== 'completed' && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onClearProgress()
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                    title="Clear progress status"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {hint && (
                <p className="text-[10px] text-slate-500 dark:text-slate-500/90 italic">{hint}</p>
              )}
              {progress.file_name && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{progress.file_name}</span>
                </div>
              )}
              {progress.current > 0 && progress.total > 0 && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  File {progress.current} of {progress.total}
                </p>
              )}
              {progress.error && (
                <p className="text-[10px] text-red-600 dark:text-red-400">
                  Error: {progress.error}
                </p>
              )}
            </div>
          )}

          {/* RAG Stats */}
          {!progress && kb.statistics.rag && (
            <div className="flex gap-3 text-[10px] text-slate-400 dark:text-slate-500">
              <span>{kb.statistics.rag.chunks} chunks</span>
              <span>-</span>
              <span>{kb.statistics.rag.entities} entities</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function KnowledgePage() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [targetKb, setTargetKb] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)
  const [newKbName, setNewKbName] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [reindexingKb, setReindexingKb] = useState<string | null>(null)
  const [progressMap, setProgressMap] = useState<Record<string, ProgressInfo>>({})
  const [versionsModalOpen, setVersionsModalOpen] = useState(false)
  const [versionsKb, setVersionsKb] = useState<string>('')
  const wsConnectionsRef = useRef<Record<string, WebSocket>>({})
  const kbsNamesRef = useRef<string[]>([])

  // Restore progress state from localStorage (with cleanup of stuck states)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kb_progress_map')
      if (saved) {
        const parsed = JSON.parse(saved)
        const now = new Date().getTime()
        const thirtyMinutes = 30 * 60 * 1000
        const cleaned: Record<string, ProgressInfo> = {}

        Object.entries(parsed).forEach(([kbName, progress]: [string, any]) => {
          if (progress.timestamp) {
            const progressTime = new Date(progress.timestamp).getTime()
            const age = now - progressTime

            if (
              progress.stage === 'completed' ||
              progress.stage === 'error' ||
              age < thirtyMinutes
            ) {
              cleaned[kbName] = progress
            }
          } else {
            if (progress.stage === 'completed' || progress.stage === 'error') {
              cleaned[kbName] = progress
            }
          }
        })

        setProgressMap(cleaned)
        localStorage.setItem('kb_progress_map', JSON.stringify(cleaned))
      }
    } catch (e) {
      console.error('Failed to load progress from localStorage:', e)
    }
  }, [])

  // Persist progress state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kb_progress_map', JSON.stringify(progressMap))
    } catch (e) {
      console.error('Failed to save progress to localStorage:', e)
    }
  }, [progressMap])

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const listUrl = apiUrl('/api/v1/knowledge/list')
      const res = await fetch(listUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: Failed to fetch knowledge bases`
        try {
          const errorData = await res.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          const text = await res.text()
          errorMessage = `${errorMessage}. Response: ${text.substring(0, 200)}`
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      if (!Array.isArray(data)) {
        throw new Error(`Invalid response format: expected array, got ${typeof data}`)
      }

      setKbs(data)
      setError(null)
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to load knowledge bases.'
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = `Network error: Cannot connect to backend. Please ensure the backend is running.`
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKnowledgeBases()
  }, [fetchKnowledgeBases])

  // WebSocket connections for progress updates
  useEffect(() => {
    if (loading || !kbs) return

    const currentKbNames = [...kbs.map(kb => kb.name)].sort()
    const currentKbNamesStr = currentKbNames.join(',')
    const prevKbNames = [...(kbsNamesRef.current || [])].sort()
    const prevKbNamesStr = prevKbNames.join(',')

    if (
      currentKbNamesStr === prevKbNamesStr &&
      currentKbNamesStr !== '' &&
      Object.keys(wsConnectionsRef.current).length > 0
    ) {
      return
    }

    if (kbs.length === 0) {
      if (Object.keys(wsConnectionsRef.current).length > 0) {
        Object.values(wsConnectionsRef.current).forEach(ws => {
          if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            ws.close()
          }
        })
        wsConnectionsRef.current = {}
      }
      kbsNamesRef.current = []
      return
    }

    Object.entries(wsConnectionsRef.current).forEach(([kbName, ws]) => {
      if (!kbs.find(kb => kb.name === kbName)) {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close()
        }
        delete wsConnectionsRef.current[kbName]
      }
    })

    const connections: Record<string, WebSocket> = { ...wsConnectionsRef.current }

    kbs.forEach(kb => {
      if (connections[kb.name] && connections[kb.name].readyState !== WebSocket.CLOSED) {
        return
      }

      const ws = new WebSocket(wsUrl(`/api/v1/knowledge/${kb.name}/progress/ws`))

      ws.onopen = () => {
        console.log(`[Progress WS] Connected for KB: ${kb.name}`)
      }

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'progress' && data.data) {
            if (kb.statistics.rag_initialized) {
              const progressStage = data.data.stage
              const progressTime = data.data.timestamp ? new Date(data.data.timestamp).getTime() : 0
              const now = new Date().getTime()
              const fiveMinutes = 5 * 60 * 1000

              if (progressStage !== 'completed' && progressStage !== 'error') {
                if (!progressTime || now - progressTime > fiveMinutes) {
                  return
                }
              }
            }

            setProgressMap(prev => {
              const updated = { ...prev, [kb.name]: data.data }
              try {
                localStorage.setItem('kb_progress_map', JSON.stringify(updated))
              } catch (e) {
                console.error('Failed to save progress to localStorage:', e)
              }
              return updated
            })
          }
        } catch (e) {
          console.error(`[Progress WS] Error parsing message for ${kb.name}:`, e)
        }
      }

      ws.onerror = error => {
        console.error(`[Progress WS] Error for ${kb.name}:`, error)
      }

      ws.onclose = () => {
        console.log(`[Progress WS] Closed for KB: ${kb.name}`)
      }

      connections[kb.name] = ws
      wsConnectionsRef.current[kb.name] = ws
    })

    kbsNamesRef.current = kbs.map(kb => kb.name)
  }, [kbs, loading])

  // Cleanup WebSocket connections on unmount
  useEffect(() => {
    return () => {
      Object.values(wsConnectionsRef.current).forEach(ws => {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close()
        }
      })
      wsConnectionsRef.current = {}
    }
  }, [])

  const handleDelete = async (name: string) => {
    if (
      !confirm(`Are you sure you want to delete knowledge base "${name}"? This cannot be undone.`)
    )
      return

    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${name}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete knowledge base')
      clearProgress(name)
      fetchKnowledgeBases()
    } catch (err) {
      console.error(err)
      alert('Failed to delete knowledge base')
    }
  }

  const handleReindex = async (name: string) => {
    if (!confirm(`Re-index "${name}"? This will rebuild the RAG index from existing documents.`))
      return

    setReindexingKb(name)
    setProgressMap(prev => {
      const updated = { ...prev }
      delete updated[name]
      return updated
    })

    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${name}/refresh`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full: true }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to start re-indexing')
      }
    } catch (err: any) {
      alert(`Failed to re-index: ${err.message}`)
    } finally {
      setReindexingKb(null)
    }
  }

  const clearProgress = async (kbName: string) => {
    setProgressMap(prev => {
      const updated = { ...prev }
      delete updated[kbName]
      try {
        localStorage.setItem('kb_progress_map', JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save progress to localStorage:', e)
      }
      return updated
    })

    try {
      await fetch(apiUrl(`/api/v1/knowledge/${kbName}/progress/clear`), { method: 'POST' })
    } catch (e) {
      console.error('Failed to clear backend progress:', e)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0 || !targetKb) return

    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach(file => formData.append('files', file))

    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${targetKb}/upload`), {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')

      setUploadModalOpen(false)
      setFiles(null)
      await fetchKnowledgeBases()
      alert('Files uploaded successfully! Processing started in background.')
    } catch (err) {
      console.error(err)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKbName || !files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    formData.append('name', newKbName)
    Array.from(files).forEach(file => formData.append('files', file))

    try {
      const res = await fetch(apiUrl('/api/v1/knowledge/create'), {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Creation failed')
      }

      const result = await res.json()

      const newKb: KnowledgeBase = {
        name: result.name,
        is_default: false,
        statistics: {
          raw_documents: result.files?.length || 0,
          images: 0,
          content_lists: 0,
          rag_initialized: false,
        },
      }

      setKbs(prev => {
        const exists = prev.some(kb => kb.name === newKb.name)
        if (exists) return prev
        return [newKb, ...prev]
      })

      setProgressMap(prev => ({
        ...prev,
        [newKb.name]: {
          stage: 'initializing',
          message: 'Initializing knowledge base...',
          current: 0,
          total: 0,
          file_name: '',
          progress_percent: 0,
          timestamp: new Date().toISOString(),
        },
      }))

      setCreateModalOpen(false)
      setFiles(null)
      setNewKbName('')

      setTimeout(async () => {
        await fetchKnowledgeBases()
      }, 1000)

      alert('Knowledge base created successfully! Initialization started in background.')
    } catch (err: any) {
      console.error(err)
      alert(`Failed to create knowledge base: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  // Calculate total stats
  const totalStats = kbs.reduce(
    (acc, kb) => ({
      documents: acc.documents + kb.statistics.raw_documents,
      images: acc.images + kb.statistics.images,
      chunks: acc.chunks + (kb.statistics.rag?.chunks || 0),
    }),
    { documents: 0, images: 0, chunks: 0 }
  )

  return (
    <PageWrapper maxWidth="2xl" breadcrumbs={[{ label: 'Knowledge Bases' }]}>
      <PageHeader
        title="Knowledge Bases"
        description="Manage and explore your educational content repositories with intelligent RAG indexing."
        icon={<BookOpen className="w-5 h-5" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw className="w-4 h-4" />}
              onClick={async () => {
                setLoading(true)
                await fetchKnowledgeBases()
              }}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus className="w-4 h-4" />}
              onClick={() => {
                setFiles(null)
                setNewKbName('')
                setCreateModalOpen(true)
              }}
            >
              New Knowledge Base
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      {!loading && kbs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <StatCard
            icon={<Database className="w-4 h-4" />}
            label="Total Knowledge Bases"
            value={kbs.length}
            accentColor="teal"
          />
          <StatCard
            icon={<FileText className="w-4 h-4" />}
            label="Total Documents"
            value={totalStats.documents}
            accentColor="blue"
          />
          <StatCard
            icon={<Layers className="w-4 h-4" />}
            label="Total Chunks"
            value={totalStats.chunks}
            accentColor="purple"
          />
        </motion.div>
      )}

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              mb-6 p-4 rounded-xl
              bg-red-50/80 dark:bg-red-900/20
              backdrop-blur-sm
              border border-red-200 dark:border-red-800
              text-red-600 dark:text-red-400
              flex items-center gap-3
            "
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="
                h-64 rounded-2xl
                bg-white/40 dark:bg-slate-800/40
                backdrop-blur-xl
                border border-white/30 dark:border-slate-700/30
                animate-pulse
              "
            />
          ))}
        </div>
      )}

      {/* KB Grid */}
      {!loading && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {kbs.map(kb => (
            <motion.div key={kb.name} variants={cardVariant}>
              <KBCard
                kb={kb}
                progress={progressMap[kb.name]}
                onUpload={() => {
                  setTargetKb(kb.name)
                  setFiles(null)
                  setUploadModalOpen(true)
                }}
                onDelete={() => handleDelete(kb.name)}
                onReindex={() => handleReindex(kb.name)}
                onViewVersions={() => {
                  setVersionsKb(kb.name)
                  setVersionsModalOpen(true)
                }}
                reindexing={reindexingKb === kb.name}
                onClearProgress={async () => {
                  await clearProgress(kb.name)
                  fetchKnowledgeBases()
                }}
              />
            </motion.div>
          ))}

          {/* Empty State */}
          {kbs.length === 0 && (
            <motion.div variants={cardVariant} className="col-span-full text-center py-16">
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                variants={pulseAnimation}
                initial="initial"
                animate="animate"
              >
                <Database className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              </motion.div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Knowledge Bases Yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Create your first knowledge base to start organizing and indexing your educational
                content.
              </p>
              <Button
                variant="primary"
                iconLeft={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setFiles(null)
                  setNewKbName('')
                  setCreateModalOpen(true)
                }}
              >
                Create Knowledge Base
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Create KB Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Knowledge Base"
        size="md"
      >
        <form onSubmit={handleCreate}>
          <ModalBody className="space-y-4">
            <Input
              label="Knowledge Base Name"
              placeholder="e.g., Math101"
              value={newKbName}
              onChange={e => setNewKbName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Upload Documents
              </label>
              <GlassUploadArea
                files={files}
                setFiles={setFiles}
                dragActive={dragActive}
                setDragActive={setDragActive}
                inputId="kb-create-upload"
              />
              <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                Large PDFs may take several minutes to parse. You can leave this page; processing
                continues in the background.
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!newKbName || !files || files.length === 0 || uploading}
              loading={uploading}
            >
              Create & Initialize
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Documents"
        size="md"
      >
        <form onSubmit={handleUpload}>
          <ModalBody className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Upload PDF, TXT, or MD files to{' '}
              <span className="font-semibold text-teal-600 dark:text-teal-400">{targetKb}</span>.
            </p>

            <GlassUploadArea
              files={files}
              setFiles={setFiles}
              dragActive={dragActive}
              setDragActive={setDragActive}
              inputId="kb-upload"
            />

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Progress updates will appear on the KB card once processing begins.
            </p>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!files || files.length === 0 || uploading}
              loading={uploading}
            >
              Upload
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Versions Modal */}
      <VersionsModal
        isOpen={versionsModalOpen}
        onClose={() => setVersionsModalOpen(false)}
        kbName={versionsKb}
        onVersionChange={() => fetchKnowledgeBases()}
      />
    </PageWrapper>
  )
}
