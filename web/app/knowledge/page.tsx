'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  CloudUpload,
  Database,
  FileText,
  FolderOpen,
  History,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import VersionsModal from '@/components/knowledge/VersionsModal'
import Button, { IconButton } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { useToast } from '@/components/ui/Toast'
import { apiUrl, wsUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

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
  timestamp?: string
}

type LayoutMode = 'grid' | 'list'

// ============================================================================
// Helpers
// ============================================================================

function formatNumber(value: number) {
  return value.toLocaleString()
}

// Animated number counter component
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value)
  const springValue = useSpring(value, {
    stiffness: 80,
    damping: 15,
    mass: 0.5,
  })

  useEffect(() => {
    return springValue.on('change', latest => {
      setDisplayValue(Math.round(latest))
    })
  }, [springValue])

  useEffect(() => {
    springValue.set(value)
  }, [value, springValue])

  return <>{formatNumber(displayValue)}</>
}

function getProgressHint(progress: ProgressInfo): string | null {
  const stage = progress.stage
  const fileName = progress.file_name?.toLowerCase() || ''
  const message = progress.message?.toLowerCase() || ''

  const looksLikePdf = fileName.endsWith('.pdf')
  const looksLikeMinerU = message.includes('mineru')

  if (stage === 'processing_file' && (looksLikePdf || looksLikeMinerU)) {
    return 'Large PDFs can look “stuck” while MinerU parses a single file. The % reflects file-level progress, not within-file parsing.'
  }

  if (stage === 'processing_file') {
    return 'This step can take a while for large files. The % reflects file-level progress.'
  }

  if (stage === 'processing_documents') {
    return 'Preparing documents for parsing and indexing. Large PDFs can take several minutes.'
  }

  return null
}

type StatusTone = 'blue' | 'emerald' | 'red' | 'zinc'

type KbStatus = {
  label: string
  tone: StatusTone
  icon: typeof Loader2
  loading?: boolean
  percent?: number
}

function getKbStatus(kb: KnowledgeBase, progress?: ProgressInfo): KbStatus {
  if (progress) {
    if (progress.stage === 'completed') {
      return { label: 'Ready', tone: 'emerald', icon: CheckCircle2 }
    }
    if (progress.stage === 'error') {
      return { label: 'Error', tone: 'red', icon: AlertCircle }
    }

    const stageLabels: Record<string, string> = {
      initializing: 'Initializing',
      processing_documents: 'Processing',
      processing_file: 'Parsing & indexing',
      extracting_items: 'Extracting items',
    }

    return {
      label: stageLabels[progress.stage] || 'Indexing',
      tone: 'blue',
      icon: Loader2,
      loading: true,
      percent: progress.progress_percent,
    }
  }

  return kb.statistics.rag_initialized
    ? { label: 'Ready', tone: 'emerald', icon: CheckCircle2 }
    : { label: 'Not indexed', tone: 'zinc', icon: FolderOpen }
}

const toneStyles: Record<StatusTone, { pill: string; icon: string }> = {
  blue: {
    pill: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/20',
    icon: 'text-blue-600 dark:text-blue-300',
  },
  emerald: {
    pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-300',
  },
  red: {
    pill: 'bg-red-50 text-red-700 ring-1 ring-red-200/70 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/20',
    icon: 'text-red-600 dark:text-red-300',
  },
  zinc: {
    pill: 'bg-white/70 text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10',
    icon: 'text-zinc-500 dark:text-zinc-300',
  },
}

function StatusPill({ status }: { status: KbStatus }) {
  const Icon = status.icon
  const percent =
    typeof status.percent === 'number' && Number.isFinite(status.percent)
      ? Math.max(0, Math.min(100, status.percent))
      : undefined

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums transition-all duration-300',
        toneStyles[status.tone].pill
      )}
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5 transition-all duration-300',
          toneStyles[status.tone].icon,
          status.loading && 'animate-spin'
        )}
      />
      <span className="truncate">{status.label}</span>
      <AnimatePresence mode="wait">
        {status.loading && percent !== undefined && (
          <motion.span
            key="percent"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 0.7, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="tabular-nums"
          >
            {Math.round(percent)}%
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card
        variant="glass"
        padding="md"
        interactive={false}
        className="group border-white/55 bg-white/55 transition-all duration-300 hover:border-blue-200/70 hover:bg-white/70 hover:shadow-lg hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-500/20 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-100 group-hover:scale-110 dark:bg-blue-500/15 dark:text-blue-300 dark:group-hover:bg-blue-500/25"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
              <AnimatedNumber value={value} />
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

interface FileDropzoneProps {
  files: FileList | null
  setFiles: (files: FileList | null) => void
  dragActive: boolean
  setDragActive: (active: boolean) => void
  inputId: string
}

function FileDropzone({ files, setFiles, dragActive, setDragActive, inputId }: FileDropzoneProps) {
  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
      if (e.type === 'dragleave') setDragActive(false)
    },
    [setDragActive]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setFiles(e.dataTransfer.files)
    },
    [setDragActive, setFiles]
  )

  return (
    <motion.div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      animate={{
        scale: dragActive ? 1.02 : 1,
        borderColor: dragActive ? 'rgb(59, 130, 246)' : 'rgb(228, 228, 231)',
      }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'rounded-2xl border border-dashed p-6 transition-all duration-300',
        dragActive
          ? 'border-blue-500 bg-blue-50/70 shadow-lg shadow-blue-500/20 dark:bg-blue-500/10'
          : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50'
      )}
    >
      <input
        type="file"
        multiple
        className="hidden"
        id={inputId}
        onChange={e => setFiles(e.target.files)}
        accept=".pdf,.txt,.md"
      />
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center gap-3 text-center"
      >
        <motion.div
          animate={{
            scale: dragActive ? 1.1 : 1,
            rotate: dragActive ? [0, -5, 5, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300',
            dragActive
              ? 'bg-blue-100 text-blue-700 shadow-lg shadow-blue-500/30 dark:bg-blue-500/20'
              : 'bg-white text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
          )}
        >
          <CloudUpload className="h-6 w-6" />
        </motion.div>

        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {files && files.length > 0
              ? `${files.length} file${files.length !== 1 ? 's' : ''} selected`
              : 'Drop files here or click to browse'}
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">PDF, TXT, MD</div>
        </div>
      </label>

      <AnimatePresence>
        {files && files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="mt-4 flex flex-wrap justify-center gap-2"
          >
            {Array.from(files)
              .slice(0, 3)
              .map((file, index) => (
                <motion.span
                  key={file.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="inline-flex max-w-[220px] items-center truncate rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20"
                  title={file.name}
                >
                  {file.name}
                </motion.span>
              ))}
            {files.length > 3 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-zinc-700 dark:text-zinc-300 dark:ring-zinc-600"
              >
                +{files.length - 3} more
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface KnowledgeBaseCardProps {
  kb: KnowledgeBase
  progress?: ProgressInfo
  reindexing: boolean
  onUpload: () => void
  onDelete: () => void
  onReindex: () => void
  onViewVersions: () => void
  onClearProgress: () => void
}

function KnowledgeBaseCard({
  kb,
  progress,
  reindexing,
  onUpload,
  onDelete,
  onReindex,
  onViewVersions,
  onClearProgress,
}: KnowledgeBaseCardProps) {
  const status = getKbStatus(kb, progress)
  const hint = progress ? getProgressHint(progress) : null
  const percent =
    typeof status.percent === 'number' && Number.isFinite(status.percent)
      ? Math.max(0, Math.min(100, status.percent))
      : undefined

  const chunks = kb.statistics.rag?.chunks ?? 0
  const entities = kb.statistics.rag?.entities ?? 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card
        variant="glass"
        padding="none"
        className="group relative flex h-full flex-col border-white/55 bg-white/55 transition-all duration-300 hover:border-blue-200/70 hover:shadow-xl hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-500/20"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        <CardHeader className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:group-hover:bg-blue-500/20">
                <Database className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {kb.name}
                  </h3>
                  {kb.is_default && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-200/70 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/20">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatNumber(kb.statistics.raw_documents)} docs ·{' '}
                  {formatNumber(kb.statistics.images)} images
                </div>
              </div>
            </div>

            <div className="flex flex-none items-start gap-2">
              <StatusPill status={status} />
            </div>
          </div>
        </CardHeader>

        <CardBody className="relative flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Docs
                </span>
                <FileText className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {formatNumber(kb.statistics.raw_documents)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Images
                </span>
                <ImageIcon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {formatNumber(kb.statistics.images)}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200/70 bg-white/60 p-3 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Chunks
                </span>
                <Layers className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50 tabular-nums">
                {formatNumber(chunks)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/70 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Index status
                </div>

                {progress?.message ? (
                  <div className="mt-1 flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="min-w-0 flex-1 truncate">{progress.message}</span>
                    {progress.stage !== 'completed' && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          onClearProgress()
                        }}
                        className="flex-none rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-900/5 hover:text-red-600 dark:hover:bg-white/5 dark:hover:text-red-300"
                        aria-label="Clear progress status"
                        title="Clear progress status"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                    {kb.statistics.rag_initialized
                      ? 'Ready for retrieval and grounded chat.'
                      : 'Not indexed yet.'}
                  </div>
                )}

                {!progress && kb.statistics.rag && (
                  <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formatNumber(chunks)} chunks · {formatNumber(entities)} entities
                  </div>
                )}

                {hint && (
                  <div className="mt-2 text-[11px] italic text-zinc-500 dark:text-zinc-400">
                    {hint}
                  </div>
                )}

                {progress?.file_name && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="truncate">{progress.file_name}</span>
                  </div>
                )}
                {progress && progress.current > 0 && progress.total > 0 && (
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                    File {progress.current} of {progress.total}
                  </div>
                )}
                {progress?.error && (
                  <div className="mt-2 text-[11px] text-red-700 dark:text-red-200">
                    Error: {progress.error}
                  </div>
                )}
              </div>

              {status.loading && percent !== undefined && (
                <div className="flex-none text-xs font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">
                  {Math.round(percent)}%
                </div>
              )}
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
              {status.loading && percent !== undefined ? (
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm shadow-blue-500/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                />
              ) : (
                <motion.div
                  className={cn(
                    'h-full rounded-full transition-colors duration-300',
                    kb.statistics.rag_initialized
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      : 'bg-zinc-300 dark:bg-white/20'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: kb.statistics.rag_initialized ? '100%' : 0 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                />
              )}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {kb.statistics.rag_initialized ? 'RAG enabled' : 'RAG disabled'}
            </div>

            <div className="flex items-center gap-1">
              <IconButton
                icon={<History className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                aria-label="Version history"
                onClick={onViewVersions}
              />
              <IconButton
                icon={<RefreshCw className={cn('h-4 w-4', reindexing && 'animate-spin')} />}
                variant="ghost"
                size="sm"
                aria-label="Re-index"
                onClick={onReindex}
                disabled={reindexing}
              />
              <IconButton
                icon={<Upload className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                aria-label="Upload documents"
                onClick={onUpload}
              />
              <IconButton
                icon={<Trash2 className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                aria-label="Delete knowledge base"
                onClick={onDelete}
                className="hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/40 dark:hover:!text-red-300"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Main
// ============================================================================

export default function KnowledgePage() {
  const toast = useToast()

  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layout, setLayout] = useState<LayoutMode>('grid')
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
      if (!saved) return

      const parsed = JSON.parse(saved)
      const now = new Date().getTime()
      const thirtyMinutes = 30 * 60 * 1000
      const cleaned: Record<string, ProgressInfo> = {}

      const isProgressInfo = (value: unknown): value is ProgressInfo => {
        if (!value || typeof value !== 'object') return false
        const record = value as Record<string, unknown>
        return (
          typeof record.stage === 'string' &&
          typeof record.message === 'string' &&
          typeof record.current === 'number' &&
          typeof record.total === 'number' &&
          typeof record.progress_percent === 'number' &&
          (record.timestamp === undefined || typeof record.timestamp === 'string')
        )
      }

      const parsedEntries =
        parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}

      Object.entries(parsedEntries).forEach(([kbName, progress]) => {
        if (!isProgressInfo(progress)) return

        if (progress.timestamp) {
          const progressTime = new Date(progress.timestamp).getTime()
          const age = now - progressTime

          if (progress.stage === 'completed' || progress.stage === 'error' || age < thirtyMinutes) {
            cleaned[kbName] = progress
          }
          return
        }

        if (progress.stage === 'completed' || progress.stage === 'error') {
          cleaned[kbName] = progress
        }
      })

      setProgressMap(cleaned)
      localStorage.setItem('kb_progress_map', JSON.stringify(cleaned))
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
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : undefined
      const resolvedMessage = err instanceof Error ? err.message : String(err)
      let errorMessage = resolvedMessage || 'Failed to load knowledge bases.'
      if (errorName === 'TypeError' && resolvedMessage.includes('fetch')) {
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

  const handleDelete = async (name: string) => {
    if (
      !confirm(`Are you sure you want to delete knowledge base "${name}"? This cannot be undone.`)
    ) {
      return
    }

    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${name}`), { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete knowledge base')
      clearProgress(name)
      await fetchKnowledgeBases()
      toast.success(`Deleted “${name}”.`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete knowledge base')
    }
  }

  const handleReindex = async (name: string) => {
    if (!confirm(`Re-index "${name}"? This will rebuild the RAG index from existing documents.`)) {
      return
    }

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
      toast.info(`Re-index started for “${name}”.`)
    } catch (err: unknown) {
      const resolvedMessage = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to re-index: ${resolvedMessage}`)
    } finally {
      setReindexingKb(null)
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
      toast.success('Files uploaded. Processing started in background.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to upload files')
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

      toast.success('Knowledge base created. Initialization started in background.')
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }
      const resolvedMessage = err instanceof Error ? err.message : String(err)
      toast.error(`Failed to create knowledge base: ${resolvedMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const totalStats = kbs.reduce(
    (acc, kb) => ({
      documents: acc.documents + kb.statistics.raw_documents,
      images: acc.images + kb.statistics.images,
      chunks: acc.chunks + (kb.statistics.rag?.chunks || 0),
    }),
    { documents: 0, images: 0, chunks: 0 }
  )

  const itemsLayoutClassName =
    layout === 'grid'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr'
      : 'grid grid-cols-1 gap-3'

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: 'Knowledge Bases' }]}>
      <PageHeader
        title="Knowledge Bases"
        description="Manage your content repositories and keep them indexed for grounded retrieval."
        icon={<BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        className="flex-col gap-4 sm:flex-row sm:items-start"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center rounded-xl border border-white/55 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <IconButton
                icon={<LayoutGrid className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                aria-label="Grid view"
                aria-pressed={layout === 'grid'}
                onClick={() => setLayout('grid')}
                className={cn(
                  'transition-colors',
                  layout === 'grid'
                    ? '!bg-white/90 !text-blue-600 shadow-sm border border-zinc-200/70 hover:!bg-white/90 dark:!bg-zinc-950/60 dark:!text-blue-300 dark:border-white/10 dark:hover:!bg-zinc-950/60'
                    : '!bg-transparent text-zinc-600 hover:!bg-white/70 hover:!text-zinc-900 dark:text-zinc-300 dark:hover:!bg-white/5 dark:hover:!text-zinc-50'
                )}
              />
              <IconButton
                icon={<List className="h-4 w-4" />}
                variant="ghost"
                size="sm"
                aria-label="List view"
                aria-pressed={layout === 'list'}
                onClick={() => setLayout('list')}
                className={cn(
                  'transition-colors',
                  layout === 'list'
                    ? '!bg-white/90 !text-blue-600 shadow-sm border border-zinc-200/70 hover:!bg-white/90 dark:!bg-zinc-950/60 dark:!text-blue-300 dark:border-white/10 dark:hover:!bg-zinc-950/60'
                    : '!bg-transparent text-zinc-600 hover:!bg-white/70 hover:!text-zinc-900 dark:text-zinc-300 dark:hover:!bg-white/5 dark:hover:!text-zinc-50'
                )}
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw className="h-4 w-4" />}
              onClick={fetchKnowledgeBases}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus className="h-4 w-4" />}
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

      <div className="space-y-6">
        {!loading && kbs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={<Database className="h-4 w-4" />}
              label="Knowledge bases"
              value={kbs.length}
            />
            <SummaryCard
              icon={<FileText className="h-4 w-4" />}
              label="Documents"
              value={totalStats.documents}
            />
            <SummaryCard
              icon={<ImageIcon className="h-4 w-4" />}
              label="Images"
              value={totalStats.images}
            />
            <SummaryCard
              icon={<Layers className="h-4 w-4" />}
              label="Chunks"
              value={totalStats.chunks}
            />
          </div>
        )}

        {error && (
          <Card
            variant="glass"
            padding="sm"
            interactive={false}
            className="border-red-200/70 bg-red-50/60 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-none" />
              <span className="text-sm">{error}</span>
            </div>
          </Card>
        )}

        {loading ? (
          <div className={itemsLayoutClassName}>
            {Array.from({ length: layout === 'grid' ? 6 : 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card
                  variant="glass"
                  padding="none"
                  interactive={false}
                  className="relative h-[340px] overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="flex h-full flex-col p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-xl bg-zinc-200/70 dark:bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 rounded bg-zinc-200/70 dark:bg-white/10" />
                        <div className="h-3 w-24 rounded bg-zinc-200/50 dark:bg-white/5" />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="h-16 rounded-xl bg-zinc-200/50 dark:bg-white/5" />
                      ))}
                    </div>
                    <div className="mt-4 h-24 rounded-2xl bg-zinc-200/50 dark:bg-white/5" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : kbs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <Card
              variant="glass"
              padding="lg"
              interactive={false}
              className="border-white/55 bg-white/55 text-center dark:border-white/10 dark:bg-white/5"
            >
              <div className="mx-auto flex max-w-md flex-col items-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                >
                  <Database className="h-7 w-7" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
                >
                  No knowledge bases yet
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mt-1 text-sm text-zinc-600 dark:text-zinc-300"
                >
                  Create your first knowledge base to start organizing and indexing content for
                  grounded retrieval.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mt-5"
                >
                  <Button
                    variant="primary"
                    iconLeft={<Plus className="h-4 w-4" />}
                    onClick={() => {
                      setFiles(null)
                      setNewKbName('')
                      setCreateModalOpen(true)
                    }}
                  >
                    Create knowledge base
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className={itemsLayoutClassName}
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {kbs.map((kb, index) => (
              <motion.div
                key={kb.name}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                <KnowledgeBaseCard
                  kb={kb}
                  progress={progressMap[kb.name]}
                  reindexing={reindexingKb === kb.name}
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
                  onClearProgress={async () => {
                    await clearProgress(kb.name)
                    fetchKnowledgeBases()
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

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
              <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Upload Documents
              </label>
              <FileDropzone
                files={files}
                setFiles={setFiles}
                dragActive={dragActive}
                setDragActive={setDragActive}
                inputId="kb-create-upload"
              />
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
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

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Documents"
        size="md"
      >
        <form onSubmit={handleUpload}>
          <ModalBody className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Upload PDF, TXT, or MD files to{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{targetKb}</span>.
            </p>

            <FileDropzone
              files={files}
              setFiles={setFiles}
              dragActive={dragActive}
              setDragActive={setDragActive}
              inputId="kb-upload"
            />

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Progress updates will appear on the knowledge base card once processing begins.
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

      <VersionsModal
        isOpen={versionsModalOpen}
        onClose={() => setVersionsModalOpen(false)}
        kbName={versionsKb}
        onVersionChange={() => fetchKnowledgeBases()}
      />
    </PageWrapper>
  )
}
