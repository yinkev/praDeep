'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Search,
  Clock,
  FileText,
  Calculator,
  Microscope,
  PenTool,
  ChevronRight,
  ChevronLeft,
  Check,
  FolderOpen,
  Database,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import Button from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/LoadingState'

// ============================================================================
// Types
// ============================================================================

interface NotebookRecord {
  id: string
  type: 'solve' | 'question' | 'research' | 'co_writer'
  title: string
  user_query: string
  output: string
  metadata: Record<string, unknown>
  created_at: number
  kb_name?: string
}

interface Notebook {
  id: string
  name: string
  description: string
  created_at: number
  updated_at: number
  records: NotebookRecord[]
  color: string
  icon: string
}

interface NotebookSummary {
  id: string
  name: string
  description: string
  created_at: number
  updated_at: number
  record_count: number
  color: string
  icon: string
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
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
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
    transition: { duration: 0.15 },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = [
  '#3B82F6', // blue (primary)
  '#14B8A6', // teal
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#3B82F6', // blue (replacing yellow)
  '#22C55E', // green
  '#06B6D4', // cyan
  '#6366F1', // indigo
]

// ============================================================================
// Helper Functions
// ============================================================================

const getRecordIcon = (type: string) => {
  switch (type) {
    case 'solve':
      return <Calculator className="w-4 h-4" />
    case 'question':
      return <FileText className="w-4 h-4" />
    case 'research':
      return <Microscope className="w-4 h-4" />
    case 'co_writer':
      return <PenTool className="w-4 h-4" />
    default:
      return <FileText className="w-4 h-4" />
  }
}

const getRecordLabel = (type: string) => {
  switch (type) {
    case 'solve':
      return 'Solver'
    case 'question':
      return 'Question'
    case 'research':
      return 'Research'
    case 'co_writer':
      return 'Co-Writer'
    default:
      return 'Record'
  }
}

const getRecordStyles = (type: string) => {
  switch (type) {
    case 'solve':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-400/30 dark:border-blue-500/30',
      }
    case 'question':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-400/30 dark:border-purple-500/30',
      }
    case 'research':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-400/30 dark:border-emerald-500/30',
      }
    case 'co_writer':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-400/30 dark:border-blue-500/30',
      }
    default:
      return {
        bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
        text: 'text-zinc-600 dark:text-zinc-400',
        border: 'border-zinc-400/30 dark:border-zinc-500/30',
      }
  }
}

// ============================================================================
// Notebook Card Component
// ============================================================================

interface NotebookCardProps {
  notebook: NotebookSummary
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

function NotebookCard({ notebook, isSelected, onClick, onEdit, onDelete }: NotebookCardProps) {
  return (
    <motion.div variants={listItem} layout>
      <Card
        variant="glass"
        padding="none"
        interactive
        role="button"
        tabIndex={0}
        aria-label={`Open notebook: ${notebook.name}`}
        aria-pressed={isSelected}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        className={`group cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:focus-visible:ring-blue-400/25 ${
          isSelected
            ? 'ring-2 ring-blue-500/35 dark:ring-blue-400/35 shadow-lg shadow-blue-500/10'
            : ''
        }`}
        onClick={onClick}
      >
        <CardBody className="py-3 px-4">
          <div className="flex items-start gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${notebook.color}20, ${notebook.color}40)`,
                color: notebook.color,
              }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <BookOpen className="w-5 h-5" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate text-sm">
                  {notebook.name}
                </h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    onClick={e => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    className="p-1.5 rounded-lg hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit3 className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                  </motion.button>
                  <motion.button
                    onClick={e => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-3 h-3 text-red-500 dark:text-red-400" />
                  </motion.button>
                </div>
              </div>
              {notebook.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mb-2">
                  {notebook.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {notebook.record_count} records
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(notebook.updated_at * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Record Card Component
// ============================================================================

interface RecordCardProps {
  record: NotebookRecord
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
}

function RecordCard({ record, isSelected, onClick, onDelete }: RecordCardProps) {
  const styles = getRecordStyles(record.type)

  return (
    <motion.div variants={listItem} layout>
      <Card
        variant="glass"
        padding="none"
        interactive
        role="button"
        tabIndex={0}
        aria-label={`Open record: ${record.title}`}
        aria-pressed={isSelected}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        className={`cursor-pointer transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:focus-visible:ring-blue-400/25 ${
          isSelected
            ? 'ring-2 ring-blue-500/35 dark:ring-blue-400/35 shadow-lg shadow-blue-500/10'
            : ''
        }`}
        onClick={onClick}
      >
        <CardBody className="py-3 px-4">
          <div className="flex items-start gap-3">
            <motion.div
              className={`p-2 rounded-xl ${styles.bg} ${styles.text} border ${styles.border}`}
              whileHover={{ scale: 1.05 }}
            >
              {getRecordIcon(record.type)}
            </motion.div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}
                >
                  {getRecordLabel(record.type)}
                </span>
                {record.kb_name && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5">
                    <Database className="w-3 h-3" />
                    {record.kb_name}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 line-clamp-1 mb-1">
                {record.title}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {record.user_query}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {new Date(record.created_at * 1000).toLocaleString()}
                </span>
                <motion.button
                  onClick={e => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-3 h-3 text-red-500 dark:text-red-400" />
                </motion.button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Color Picker Component
// ============================================================================

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {COLORS.map(color => (
        <motion.button
          key={color}
          onClick={() => onChange(color)}
          className={`w-8 h-8 rounded-xl transition-all ${
            value === color
              ? 'ring-2 ring-blue-500/60 ring-offset-2 ring-offset-white dark:ring-blue-400/60 dark:ring-offset-zinc-950 scale-110'
              : 'hover:scale-105'
          }`}
          style={{ backgroundColor: color }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        />
      ))}
    </div>
  )
}

// ============================================================================
// Empty State Component
// ============================================================================

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center h-full text-center p-8"
    >
      <motion.div
        className="w-16 h-16 rounded-2xl bg-zinc-100/80 dark:bg-white/5 flex items-center justify-center mb-4 text-zinc-300 dark:text-zinc-600"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs">{description}</p>
      {action}
    </motion.div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function NotebookPage() {
  // State
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([])
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<NotebookRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Panel collapse states
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [middleCollapsed, setMiddleCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)

  // Form states
  const [newNotebook, setNewNotebook] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  })
  const [editingNotebook, setEditingNotebook] = useState<{
    id: string
    name: string
    description: string
    color: string
  } | null>(null)

  // Import state
  const [availableNotebooks, setAvailableNotebooks] = useState<NotebookSummary[]>([])
  const [importSourceNotebook, setImportSourceNotebook] = useState<string>('')
  const [importSourceRecords, setImportSourceRecords] = useState<NotebookRecord[]>([])
  const [selectedImportRecords, setSelectedImportRecords] = useState<Set<string>>(new Set())
  const [loadingImport, setLoadingImport] = useState(false)

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    fetchNotebooks()
  }, [])

  // ============================================================================
  // API Functions
  // ============================================================================

  const fetchNotebooks = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/notebook/list'))
      const data = await res.json()
      setNotebooks(data.notebooks || [])
    } catch (err) {
      console.error('Failed to fetch notebooks:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotebookDetail = async (notebookId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${notebookId}`))
      const data = await res.json()
      setSelectedNotebook(data)
      setSelectedRecord(null)
    } catch (err) {
      console.error('Failed to fetch notebook detail:', err)
    }
  }

  const handleCreateNotebook = async () => {
    if (!newNotebook.name.trim()) return

    try {
      const res = await fetch(apiUrl('/api/v1/notebook/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotebook),
      })
      const data = await res.json()
      if (data.success) {
        fetchNotebooks()
        setShowCreateModal(false)
        setNewNotebook({ name: '', description: '', color: '#3B82F6' })
      }
    } catch (err) {
      console.error('Failed to create notebook:', err)
    }
  }

  const handleUpdateNotebook = async () => {
    if (!editingNotebook || !editingNotebook.name.trim()) return

    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${editingNotebook.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingNotebook.name,
          description: editingNotebook.description,
          color: editingNotebook.color,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchNotebooks()
        if (selectedNotebook?.id === editingNotebook.id) {
          fetchNotebookDetail(editingNotebook.id)
        }
        setShowEditModal(false)
        setEditingNotebook(null)
      }
    } catch (err) {
      console.error('Failed to update notebook:', err)
    }
  }

  const handleDeleteNotebook = async (notebookId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${notebookId}`), {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        fetchNotebooks()
        if (selectedNotebook?.id === notebookId) {
          setSelectedNotebook(null)
        }
        setShowDeleteConfirm(null)
      }
    } catch (err) {
      console.error('Failed to delete notebook:', err)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedNotebook) return

    try {
      const res = await fetch(
        apiUrl(`/api/v1/notebook/${selectedNotebook.id}/records/${recordId}`),
        {
          method: 'DELETE',
        }
      )
      const data = await res.json()
      if (data.success) {
        fetchNotebookDetail(selectedNotebook.id)
        if (selectedRecord?.id === recordId) {
          setSelectedRecord(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete record:', err)
    }
  }

  // ============================================================================
  // Export Functions
  // ============================================================================

  const exportAsMarkdown = () => {
    if (!selectedRecord) return

    const content = `# ${selectedRecord.title}\n\n**Type:** ${selectedRecord.type}\n**Created:** ${new Date(selectedRecord.created_at * 1000).toLocaleString()}\n\n## User Query\n\n${selectedRecord.user_query}\n\n## Output\n\n${selectedRecord.output}`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedRecord.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsPDF = async () => {
    if (!selectedRecord) return

    const printContent = `
      <html>
        <head>
          <title>${selectedRecord.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e293b; }
            .meta { color: #64748b; font-size: 14px; margin-bottom: 20px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
            .query { background: #f0fdfa; padding: 16px; border-radius: 12px; border: 1px solid #99f6e4; }
            .output { background: #f8fafc; padding: 16px; border-radius: 12px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${selectedRecord.title}</h1>
          <div class="meta">${selectedRecord.type.toUpperCase()} - ${new Date(selectedRecord.created_at * 1000).toLocaleString()}</div>
          <div class="section">
            <div class="section-title">User Query</div>
            <div class="query">${selectedRecord.user_query}</div>
          </div>
          <div class="section">
            <div class="section-title">Output</div>
            <div class="output">${selectedRecord.output}</div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // ============================================================================
  // Import Functions
  // ============================================================================

  const openImportModal = async () => {
    if (!selectedNotebook) return

    setShowImportModal(true)
    setLoadingImport(true)

    try {
      const res = await fetch(apiUrl('/api/v1/notebook/list'))
      const data = await res.json()
      const others = (data.notebooks || []).filter(
        (nb: NotebookSummary) => nb.id !== selectedNotebook.id && nb.record_count > 0
      )
      setAvailableNotebooks(others)
    } catch (err) {
      console.error('Failed to fetch notebooks for import:', err)
    } finally {
      setLoadingImport(false)
    }
  }

  const loadImportSourceRecords = async (notebookId: string) => {
    setImportSourceNotebook(notebookId)
    setLoadingImport(true)

    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${notebookId}`))
      const data = await res.json()
      setImportSourceRecords(data.records || [])
      setSelectedImportRecords(new Set())
    } catch (err) {
      console.error('Failed to fetch records for import:', err)
    } finally {
      setLoadingImport(false)
    }
  }

  const toggleImportRecord = (recordId: string) => {
    setSelectedImportRecords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recordId)) {
        newSet.delete(recordId)
      } else {
        newSet.add(recordId)
      }
      return newSet
    })
  }

  const handleImportRecords = async () => {
    if (!selectedNotebook || selectedImportRecords.size === 0) return

    setLoadingImport(true)

    try {
      const recordsToImport = importSourceRecords.filter(r => selectedImportRecords.has(r.id))

      for (const record of recordsToImport) {
        await fetch(apiUrl(`/api/v1/notebook/${selectedNotebook.id}/records`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: record.type,
            title: `[Imported] ${record.title}`,
            user_query: record.user_query,
            output: record.output,
            metadata: {
              ...record.metadata,
              imported_from: importSourceNotebook,
            },
          }),
        })
      }

      fetchNotebookDetail(selectedNotebook.id)
      setShowImportModal(false)
      setImportSourceNotebook('')
      setImportSourceRecords([])
      setSelectedImportRecords(new Set())
    } catch (err) {
      console.error('Failed to import records:', err)
    } finally {
      setLoadingImport(false)
    }
  }

  // ============================================================================
  // Filtered Data
  // ============================================================================

  const filteredNotebooks = notebooks.filter(
    nb =>
      nb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nb.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="relative h-dvh overflow-hidden bg-cloud dark:bg-zinc-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)] bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[length:56px_56px] dark:opacity-20 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-56 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/15"
        animate={{ y: [0, 18, 0], opacity: [0.35, 0.5, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-64 left-8 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10"
        animate={{ y: [0, -12, 0], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <PageWrapper maxWidth="full" showPattern={false} className="h-dvh px-0 py-0">
        <div className="relative flex h-dvh flex-col">
          <div className="shrink-0 border-b border-white/55 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60">
            <div className="px-6 py-5">
              <PageHeader
                title="Notebook"
                description="Organize work across Solver, Question, Research, and Co-Writer"
                icon={<BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                className="mb-0"
                actions={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      iconLeft={<Plus className="w-4 h-4" />}
                      onClick={() => setShowCreateModal(true)}
                    >
                      New Notebook
                    </Button>
                  </div>
                }
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6 pt-6">
            <div className="h-full min-h-0 flex gap-4">
              {/* Left Panel: Notebook List */}
              <AnimatePresence mode="wait" initial={false}>
                {leftCollapsed ? (
                  <motion.div
                    key="left-rail"
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex-shrink-0 h-full"
                  >
                    <Card
                      variant="glass"
                      interactive={false}
                      padding="none"
                      className="h-full w-14 rounded-2xl flex items-center justify-center"
                    >
                      <motion.button
                        onClick={() => setLeftCollapsed(false)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-zinc-700 shadow-sm backdrop-blur-md hover:bg-white/75 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        aria-label="Expand notebooks panel"
                        aria-expanded={!leftCollapsed}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="left-panel"
                    variants={slideInLeft}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex-shrink-0 h-full"
                  >
                    <Card
                      variant="glass"
                      interactive={false}
                      padding="none"
                      className="h-full w-80 rounded-2xl flex flex-col min-h-0"
                    >
                      <CardHeader padding="md" className="bg-white/40 dark:bg-white/5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                Notebooks
                              </h2>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {loading ? 'Loading…' : `${filteredNotebooks.length} notebooks`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="primary"
                              size="sm"
                              iconLeft={<Plus className="w-4 h-4" />}
                              onClick={() => setShowCreateModal(true)}
                            >
                              New
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              iconLeft={<ChevronLeft className="w-4 h-4" />}
                              onClick={() => setLeftCollapsed(true)}
                              aria-label="Collapse notebooks panel"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <Input
                            placeholder="Search notebooks..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                            size="sm"
                          />
                        </div>
                      </CardHeader>

                      <CardBody padding="none" className="flex-1 min-h-0 overflow-y-auto p-3">
                        {loading ? (
                          <div className="flex items-center justify-center h-32">
                            <Spinner size="md" label="Loading notebooks..." />
                          </div>
                        ) : filteredNotebooks.length === 0 ? (
                          <EmptyState
                            icon={<FolderOpen className="w-8 h-8" />}
                            title="No notebooks yet"
                            description="Create your first notebook to start organizing your learning"
                            action={
                              <Button
                                variant="primary"
                                size="sm"
                                iconLeft={<Plus className="w-4 h-4" />}
                                onClick={() => setShowCreateModal(true)}
                              >
                                Create Notebook
                              </Button>
                            }
                          />
                        ) : (
                          <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="space-y-2"
                          >
                            {filteredNotebooks.map(nb => (
                              <NotebookCard
                                key={nb.id}
                                notebook={nb}
                                isSelected={selectedNotebook?.id === nb.id}
                                onClick={() => fetchNotebookDetail(nb.id)}
                                onEdit={() => {
                                  setEditingNotebook({
                                    id: nb.id,
                                    name: nb.name,
                                    description: nb.description,
                                    color: nb.color,
                                  })
                                  setShowEditModal(true)
                                }}
                                onDelete={() => setShowDeleteConfirm(nb.id)}
                              />
                            ))}
                          </motion.div>
                        )}
                      </CardBody>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Middle Panel: Records List */}
              <AnimatePresence mode="wait" initial={false}>
                {middleCollapsed ? (
                  <motion.div
                    key="middle-rail"
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex-shrink-0 h-full"
                  >
                    <Card
                      variant="glass"
                      interactive={false}
                      padding="none"
                      className="h-full w-14 rounded-2xl flex items-center justify-center"
                    >
                      <motion.button
                        onClick={() => setMiddleCollapsed(false)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-zinc-700 shadow-sm backdrop-blur-md hover:bg-white/75 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        aria-label="Expand records panel"
                        aria-expanded={!middleCollapsed}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="middle-panel"
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex-shrink-0 h-full"
                  >
                    <Card
                      variant="glass"
                      interactive={false}
                      padding="none"
                      className="h-full w-[360px] rounded-2xl flex flex-col min-h-0"
                    >
                      <CardHeader
                        padding="md"
                        className="bg-white/35 dark:bg-white/5"
                        style={{
                          backgroundColor: selectedNotebook
                            ? `${selectedNotebook.color}10`
                            : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {selectedNotebook ? (
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <motion.div
                                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                                style={{
                                  background: `linear-gradient(135deg, ${selectedNotebook.color}20, ${selectedNotebook.color}40)`,
                                  color: selectedNotebook.color,
                                }}
                                whileHover={{ scale: 1.05 }}
                              >
                                <BookOpen className="w-6 h-6" />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                  {selectedNotebook.name}
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {selectedNotebook.records.length} records
                                  {selectedNotebook.description
                                    ? ` • ${selectedNotebook.description}`
                                    : ''}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/70 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10">
                                <FileText className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                  Records
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  Select a notebook to view entries
                                </p>
                              </div>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={<ChevronLeft className="w-4 h-4" />}
                            onClick={() => setMiddleCollapsed(true)}
                            aria-label="Collapse records panel"
                          />
                        </div>
                      </CardHeader>

                      <CardBody padding="none" className="flex-1 min-h-0 overflow-y-auto p-3">
                        {selectedNotebook ? (
                          selectedNotebook.records.length === 0 ? (
                            <EmptyState
                              icon={<FileText className="w-8 h-8" />}
                              title="No records yet"
                              description="Add records from Solver, Question, Research, or Co-Writer"
                            />
                          ) : (
                            <motion.div
                              variants={staggerContainer}
                              initial="hidden"
                              animate="visible"
                              className="space-y-2"
                            >
                              {selectedNotebook.records.map(record => (
                                <RecordCard
                                  key={record.id}
                                  record={record}
                                  isSelected={selectedRecord?.id === record.id}
                                  onClick={() => setSelectedRecord(record)}
                                  onDelete={() => handleDeleteRecord(record.id)}
                                />
                              ))}
                            </motion.div>
                          )
                        ) : (
                          <EmptyState
                            icon={<BookOpen className="w-8 h-8" />}
                            title="Select a notebook"
                            description="Choose a notebook from the list to view its records"
                          />
                        )}
                      </CardBody>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Right Panel: Record Detail */}
              <AnimatePresence mode="wait" initial={false}>
                {rightCollapsed ? (
                  <motion.div
                    key="right-rail"
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex-shrink-0 h-full"
                  >
                    <Card
                      variant="glass"
                      interactive={false}
                      padding="none"
                      className="h-full w-14 rounded-2xl flex items-center justify-center"
                    >
                      <motion.button
                        onClick={() => setRightCollapsed(false)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-zinc-700 shadow-sm backdrop-blur-md hover:bg-white/75 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        aria-label="Expand detail panel"
                        aria-expanded={!rightCollapsed}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.button>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="right-panel"
                    variants={slideInRight}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex-1 min-w-0 h-full"
                  >
                    <Card
                      variant="glass"
                      interactive={false}
                      padding="none"
                      className="h-full rounded-2xl flex flex-col min-h-0"
                    >
                      <CardHeader padding="md" className="bg-white/35 dark:bg-white/5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconLeft={<ChevronRight className="w-4 h-4" />}
                              onClick={() => setRightCollapsed(true)}
                              aria-label="Collapse detail panel"
                            />

                            {selectedRecord ? (
                              <>
                                <motion.div
                                  className={`p-2 rounded-xl ${getRecordStyles(selectedRecord.type).bg} ${getRecordStyles(selectedRecord.type).text} border ${getRecordStyles(selectedRecord.type).border}`}
                                  whileHover={{ scale: 1.05 }}
                                >
                                  {getRecordIcon(selectedRecord.type)}
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                    {selectedRecord.title}
                                  </h2>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span
                                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getRecordStyles(selectedRecord.type).bg} ${getRecordStyles(selectedRecord.type).text}`}
                                    >
                                      {getRecordLabel(selectedRecord.type)}
                                    </span>
                                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                      {new Date(selectedRecord.created_at * 1000).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                                  Details
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  Select a record to view output
                                </p>
                              </div>
                            )}
                          </div>

                          {selectedRecord && (
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                iconLeft={<Download className="w-3.5 h-3.5" />}
                                onClick={exportAsMarkdown}
                              >
                                .md
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                iconLeft={<Download className="w-3.5 h-3.5" />}
                                onClick={exportAsPDF}
                              >
                                .pdf
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                iconLeft={<Upload className="w-3.5 h-3.5" />}
                                onClick={openImportModal}
                              >
                                Import
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardBody padding="none" className="flex-1 min-h-0 overflow-y-auto p-6">
                        {selectedRecord ? (
                          <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            className="space-y-6 max-w-4xl mx-auto"
                          >
                            {/* User Query */}
                            <Card variant="glass" interactive={false} padding="none">
                              <CardHeader className="py-3">
                                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                  User Query
                                </h3>
                              </CardHeader>
                              <CardBody className="bg-blue-50/40 dark:bg-blue-950/20">
                                <p className="text-zinc-700 dark:text-zinc-200">
                                  {selectedRecord.user_query}
                                </p>
                              </CardBody>
                            </Card>

                            {/* Output */}
                            <Card variant="glass" interactive={false} padding="none">
                              <CardHeader className="py-3">
                                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  Output
                                </h3>
                              </CardHeader>
                              <CardBody>
                                <div className="prose prose-zinc dark:prose-invert max-w-none prose-sm">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {processLatexContent(selectedRecord.output)}
                                  </ReactMarkdown>
                                </div>
                              </CardBody>
                            </Card>

                            {/* Metadata */}
                            {Object.keys(selectedRecord.metadata).length > 0 && (
                              <Card variant="outlined" interactive={false} padding="none">
                                <CardHeader className="py-3">
                                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Metadata
                                  </h3>
                                </CardHeader>
                                <CardBody>
                                  <pre className="text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto bg-zinc-50/60 dark:bg-white/5 p-3 rounded-lg">
                                    {JSON.stringify(selectedRecord.metadata, null, 2)}
                                  </pre>
                                </CardBody>
                              </Card>
                            )}
                          </motion.div>
                        ) : (
                          <EmptyState
                            icon={<FileText className="w-8 h-8" />}
                            title="Select a record"
                            description="Choose a record from the list to view its details"
                          />
                        )}
                      </CardBody>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Create Notebook Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Notebook"
          size="md"
        >
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="My Notebook"
                value={newNotebook.name}
                onChange={e => setNewNotebook(prev => ({ ...prev, name: e.target.value }))}
              />
              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Description (Optional)
                </label>
                <textarea
                  value={newNotebook.description}
                  onChange={e =>
                    setNewNotebook(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Notes about machine learning..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60 outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Color
                </label>
                <ColorPicker
                  value={newNotebook.color}
                  onChange={color => setNewNotebook(prev => ({ ...prev, color }))}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              iconLeft={<Plus className="w-4 h-4" />}
              onClick={handleCreateNotebook}
              disabled={!newNotebook.name.trim()}
            >
              Create
            </Button>
          </ModalFooter>
        </Modal>

        {/* Edit Notebook Modal */}
        <Modal
          isOpen={showEditModal && !!editingNotebook}
          onClose={() => {
            setShowEditModal(false)
            setEditingNotebook(null)
          }}
          title="Edit Notebook"
          size="md"
        >
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Name"
                value={editingNotebook?.name || ''}
                onChange={e =>
                  setEditingNotebook(prev => (prev ? { ...prev, name: e.target.value } : null))
                }
              />
              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  value={editingNotebook?.description || ''}
                  onChange={e =>
                    setEditingNotebook(prev =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60 outline-none resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Color
                </label>
                <ColorPicker
                  value={editingNotebook?.color || '#14B8A6'}
                  onChange={color => setEditingNotebook(prev => (prev ? { ...prev, color } : null))}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditModal(false)
                setEditingNotebook(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              iconLeft={<Check className="w-4 h-4" />}
              onClick={handleUpdateNotebook}
              disabled={!editingNotebook?.name.trim()}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Delete Notebook?"
          size="sm"
        >
          <ModalBody>
            <div className="text-center">
              <motion.div
                className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </motion.div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                This action cannot be undone. All records in this notebook will be permanently
                deleted.
              </p>
            </div>
          </ModalBody>
          <ModalFooter className="justify-center">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              iconLeft={<Trash2 className="w-4 h-4" />}
              onClick={() => showDeleteConfirm && handleDeleteNotebook(showDeleteConfirm)}
            >
              Delete
            </Button>
          </ModalFooter>
        </Modal>

        {/* Import Records Modal */}
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false)
            setImportSourceNotebook('')
            setImportSourceRecords([])
            setSelectedImportRecords(new Set())
          }}
          title="Import Records"
          size="lg"
        >
          <ModalBody>
            <div className="space-y-4">
              {/* Source Notebook Selection */}
              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Source Notebook
                </label>
                <select
                  value={importSourceNotebook}
                  onChange={e => loadImportSourceRecords(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/60 outline-none text-zinc-900 dark:text-zinc-100 transition-all"
                >
                  <option value="">Select a notebook...</option>
                  {availableNotebooks.map(nb => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name} ({nb.record_count} records)
                    </option>
                  ))}
                </select>
              </div>

              {/* Records Selection */}
              {importSourceNotebook && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Select Records ({selectedImportRecords.size} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedImportRecords(new Set(importSourceRecords.map(r => r.id)))
                        }
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedImportRecords(new Set())}
                        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {loadingImport ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="md" label="Loading records..." />
                    </div>
                  ) : importSourceRecords.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                      No records in this notebook
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {importSourceRecords.map(record => (
                        <motion.div
                          key={record.id}
                          onClick={() => toggleImportRecord(record.id)}
                          className={`
                          p-3 rounded-xl cursor-pointer transition-all border
                          ${
                            selectedImportRecords.has(record.id)
                              ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500/30 dark:border-blue-400/30'
                              : 'bg-white/60 dark:bg-white/5 border-zinc-200/70 dark:border-white/10 hover:border-blue-300/60 dark:hover:border-blue-400/40'
                          }
                        `}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              className={`
                              w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                              ${
                                selectedImportRecords.has(record.id)
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-zinc-300 dark:border-zinc-600'
                              }
                            `}
                              animate={{
                                scale: selectedImportRecords.has(record.id) ? [1, 1.1, 1] : 1,
                              }}
                            >
                              {selectedImportRecords.has(record.id) && (
                                <Check className="w-3 h-3" />
                              )}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getRecordStyles(record.type).bg} ${getRecordStyles(record.type).text}`}
                                >
                                  {record.type}
                                </span>
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                                  {record.title}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                                {record.user_query}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowImportModal(false)
                setImportSourceNotebook('')
                setImportSourceRecords([])
                setSelectedImportRecords(new Set())
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              iconLeft={<Upload className="w-4 h-4" />}
              onClick={handleImportRecords}
              disabled={selectedImportRecords.size === 0 || loadingImport}
              loading={loadingImport}
            >
              Import {selectedImportRecords.size > 0 && `(${selectedImportRecords.size})`}
            </Button>
          </ModalFooter>
        </Modal>
      </PageWrapper>
    </div>
  )
}
