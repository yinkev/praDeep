'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  LayoutGrid,
  List,
  MoreVertical,
  X,
  RefreshCw,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, CardHeader, CardBody, CardFooter, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Modal, { ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/LoadingState'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

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

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = [
  '#C73000', // Safety Orange (Theme Primary)
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
]

// ============================================================================
// Components
// ============================================================================

function getRecordConfig(type: string) {
  switch (type) {
    case 'solve':
      return { icon: Calculator, label: 'Solver', color: 'text-accent-primary', bg: 'bg-accent-primary/10' }
    case 'question':
      return { icon: FileText, label: 'Question', color: 'text-accent-primary', bg: 'bg-accent-primary/10' }
    case 'research':
      return { icon: Microscope, label: 'Research', color: 'text-accent-primary', bg: 'bg-accent-primary/10' }
    case 'co_writer':
      return { icon: PenTool, label: 'Co-Writer', color: 'text-accent-primary', bg: 'bg-accent-primary/10' }
    default:
      return { icon: FileText, label: 'Record', color: 'text-text-tertiary', bg: 'bg-surface-elevated' }
  }
}

interface NotebookCardProps {
  notebook: NotebookSummary
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

function NotebookCard({ notebook, isSelected, onClick, onEdit, onDelete }: NotebookCardProps) {
  return (
    <motion.div variants={fadeInUp} layout>
      <Card
        interactive={true}
        onClick={onClick}
        className={cn(
          'transition-all duration-300 border-border bg-surface-base',
          isSelected && 'border-accent-primary/40 ring-1 ring-accent-primary/20 shadow-glass-sm bg-surface-secondary'
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm"
              style={{
                borderColor: `${notebook.color}30`,
                backgroundColor: `${notebook.color}10`,
                color: notebook.color,
              }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-text-primary truncate text-xs uppercase tracking-tight">
                  {notebook.name}
                </h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton
                    aria-label="Edit notebook"
                    icon={<Edit3 size={12} />}
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="h-6 w-6"
                  />
                  <IconButton
                    aria-label="Delete notebook"
                    icon={<Trash2 size={12} />}
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="h-6 w-6 text-error/60 hover:text-error hover:bg-error-muted/10"
                  />
                </div>
              </div>
              <p className="text-xs text-text-secondary truncate mb-3">
                {notebook.description || 'No description provided'}
              </p>
              <div className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-widest text-text-tertiary">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {notebook.record_count} RECS
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(notebook.updated_at * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

interface RecordCardProps {
  record: NotebookRecord
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
}

function RecordCard({ record, isSelected, onClick, onDelete }: RecordCardProps) {
  const config = getRecordConfig(record.type)
  const Icon = config.icon

  return (
    <motion.div variants={fadeInUp} layout>
      <Card
        interactive={true}
        onClick={onClick}
        className={cn(
          'transition-all duration-300 border-border bg-surface-base',
          isSelected && 'border-accent-primary/40 ring-1 ring-accent-primary/20 shadow-glass-sm bg-surface-secondary'
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn('p-2.5 rounded-xl border border-border shadow-sm shrink-0', config.bg, config.color)}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn('text-[9px] font-bold uppercase px-1.5 py-0', config.bg, config.color)}>
                    {config.label}
                  </Badge>
                  {record.kb_name && (
                    <span className="text-[9px] font-mono text-text-quaternary uppercase tracking-widest flex items-center gap-1">
                      <Database size={10} />
                      {record.kb_name}
                    </span>
                  )}
                </div>
                <IconButton
                  aria-label="Delete record"
                  icon={<Trash2 size={12} />}
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-error/60 hover:text-error transition-all"
                />

              </div>
              <h4 className="text-sm font-bold text-text-primary line-clamp-1 mb-1 uppercase tracking-tight">
                {record.title}
              </h4>
              <p className="text-xs text-text-secondary line-clamp-2 italic opacity-80">
                "{record.user_query}"
              </p>
              <div className="mt-3 text-[9px] font-mono text-text-quaternary uppercase tracking-tighter">
                {new Date(record.created_at * 1000).toLocaleString().toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function NotebookPage() {
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([])
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<NotebookRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [newNotebook, setNewNotebook] = useState({ name: '', description: '', color: '#C73000' })
  const [editingNotebook, setEditingNotebook] = useState<{ id: string; name: string; description: string; color: string } | null>(null)

  const fetchNotebooks = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/notebook/list'))
      const data = await res.json()
      setNotebooks(data.notebooks || [])
    } catch (err) {
      console.error('Failed to fetch notebooks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotebooks()
  }, [fetchNotebooks])

  const fetchNotebookDetail = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${id}`))
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
      if (res.ok) {
        fetchNotebooks()
        setShowCreateModal(false)
        setNewNotebook({ name: '', description: '', color: '#C73000' })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateNotebook = async () => {
    if (!editingNotebook) return
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${editingNotebook.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingNotebook),
      })
      if (res.ok) {
        fetchNotebooks()
        if (selectedNotebook?.id === editingNotebook.id) fetchNotebookDetail(editingNotebook.id)
        setShowEditModal(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteNotebook = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${id}`), { method: 'DELETE' })
      if (res.ok) {
        fetchNotebooks()
        if (selectedNotebook?.id === id) setSelectedNotebook(null)
        setShowDeleteConfirm(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!selectedNotebook) return
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${selectedNotebook.id}/records/${id}`), { method: 'DELETE' })
      if (res.ok) {
        fetchNotebookDetail(selectedNotebook.id)
        if (selectedRecord?.id === id) setSelectedRecord(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredNotebooks = notebooks.filter(nb => 
    nb.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    nb.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PageWrapper maxWidth="wide" showPattern className="h-screen overflow-hidden px-0 py-0">
      <div className="flex h-full">
        {/* Navigation Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-border bg-surface-base flex flex-col min-h-0">
          <PageHeader
            title="Notebooks"
            description={`${notebooks.length} collections`}
            icon={<BookOpen className="h-5 w-5 text-accent-primary" />}
            className="px-6 py-6 border-b border-border mb-0"
            actions={
              <IconButton
                aria-label="Create new notebook"
                icon={<Plus size={16} />}
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="rounded-full h-8 w-8"
              />
            }
          />

          <div className="px-4 py-4 border-b border-border bg-surface-secondary/30">
            <Input
              placeholder="Filter collections..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              leftIcon={<Search size={14} className="text-text-quaternary" />}
              size="sm"
              className="bg-surface-base border-border-subtle text-xs uppercase tracking-tight font-mono"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                <RefreshCw size={20} className="animate-spin text-accent-primary" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Syncing...</span>
              </div>
            ) : filteredNotebooks.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={24} />}
                title="No collections"
                description="Create one to start saving results."
                asCard={false}
              />
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
                {filteredNotebooks.map(nb => (
                  <NotebookCard
                    key={nb.id}
                    notebook={nb}
                    isSelected={selectedNotebook?.id === nb.id}
                    onClick={() => fetchNotebookDetail(nb.id)}
                    onEdit={() => { setEditingNotebook(nb); setShowEditModal(true); }}
                    onDelete={() => setShowDeleteConfirm(nb.id)}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </aside>

        {/* Records Panel */}
        <section className="w-[420px] flex-shrink-0 border-r border-border bg-surface-secondary/20 flex flex-col min-h-0">
          <div className="px-6 py-6 border-b border-border bg-surface-base">
             {selectedNotebook ? (
               <div className="flex items-center gap-4 min-w-0">
                 <div
                   className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-md"
                   style={{
                     borderColor: `${selectedNotebook.color}30`,
                     backgroundColor: `${selectedNotebook.color}10`,
                     color: selectedNotebook.color,
                   }}
                 >
                   <BookOpen size={24} />
                 </div>
                 <div className="min-w-0 flex-1">
                   <h2 className="font-bold text-text-primary truncate uppercase tracking-tight">{selectedNotebook.name}</h2>
                   <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-widest">
                     {selectedNotebook.records.length} SAVED OBJECTS
                   </p>
                 </div>
               </div>
             ) : (
               <div className="flex items-center gap-4 opacity-40">
                 <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-border flex items-center justify-center">
                   <Database size={24} className="text-text-tertiary" />
                 </div>
                 <div>
                   <h2 className="font-bold text-text-primary uppercase tracking-tight">Select Collection</h2>
                   <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-widest">RECORDS_PENDING</p>
                 </div>
               </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {!selectedNotebook ? (
               <EmptyState icon={<Database size={24} />} title="Workspace Empty" description="Select a notebook from the sidebar." asCard={false} />
             ) : selectedNotebook.records.length === 0 ? (
               <EmptyState icon={<FileText size={24} />} title="No Records" description="Items you save from tools appear here." asCard={false} />
             ) : (
               <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
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
             )}
          </div>
        </section>

        {/* Reader View */}
        <main className="flex-1 bg-surface-base overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedRecord ? (
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto p-12"
              >
                <div className="mb-12 border-b border-border-subtle pb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge variant="outline" className="bg-surface-secondary border-border text-text-tertiary font-mono text-[10px] uppercase tracking-widest px-2 py-1">
                      {selectedRecord.type.toUpperCase()}
                    </Badge>
                    <span className="text-text-quaternary font-mono text-[10px] tracking-widest">•</span>
                    <time className="text-text-quaternary font-mono text-[10px] uppercase tracking-widest">
                      {new Date(selectedRecord.created_at * 1000).toLocaleString()}
                    </time>
                  </div>
                  <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-8 uppercase leading-[1.1]">
                    {selectedRecord.title}
                  </h1>
                  
                  <Card interactive={false} className="bg-surface-secondary/40 border-border-subtle">
                    <div className="p-6">
                      <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.2em] mb-3">ORIGIN_QUERY</div>
                      <p className="text-sm text-text-secondary leading-relaxed italic opacity-80">
                        {selectedRecord.user_query}
                      </p>
                    </div>
                  </Card>
                </div>

                <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-tight prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-white/5">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {processLatexContent(selectedRecord.output)}
                  </ReactMarkdown>
                </article>

                <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" iconLeft={<Download size={14} />} className="font-mono text-[10px] uppercase tracking-widest">EXPORT_MD</Button>
                     <Button variant="outline" size="sm" iconLeft={<FileText size={14} />} className="font-mono text-[10px] uppercase tracking-widest">EXPORT_PDF</Button>
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center opacity-30 grayscale">
                 <div className="text-center max-w-xs">
                    <BookOpen size={64} className="mx-auto mb-6 text-text-tertiary" />
                    <h2 className="text-lg font-bold uppercase tracking-widest text-text-primary mb-2">Select Object</h2>
                    <p className="text-xs font-mono uppercase tracking-tight text-text-tertiary">Select an entry from the list to display its persistent output here.</p>
                 </div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="CREATE_COLLECTION" size="md">
        <ModalBody className="space-y-6 p-6">
           <div className="space-y-2">
             <label htmlFor="nb-name" className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">IDENTIFIER</label>
             <Input id="nb-name" placeholder="e.g. QUANTUM_DYNAMICS" value={newNotebook.name} onChange={e => setNewNotebook({...newNotebook, name: e.target.value})} className="bg-surface-secondary border-border font-mono text-xs uppercase" />
           </div>
           <div className="space-y-2">
             <label htmlFor="nb-desc" className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">DESCRIPTION</label>
             <Input id="nb-desc" placeholder="Optional context..." value={newNotebook.description} onChange={e => setNewNotebook({...newNotebook, description: e.target.value})} className="bg-surface-secondary border-border font-mono text-xs uppercase" />
           </div>
           <div className="space-y-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1">THEME_COLOR</span>
             <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Theme color">
               {COLORS.map(c => (
                 <button
                   key={c}
                   type="button"
                   onClick={() => setNewNotebook({...newNotebook, color: c})}
                   className={cn('w-8 h-8 rounded-lg border transition-all', newNotebook.color === c ? 'ring-2 ring-accent-primary ring-offset-2' : 'border-black/5 opacity-60 hover:opacity-100')}
                   style={{ backgroundColor: c }}
                   aria-label={`Color ${c}`}
                   aria-pressed={newNotebook.color === c}
                 />
               ))}
             </div>
           </div>
        </ModalBody>
        <ModalFooter className="p-4 bg-surface-secondary/30 border-t border-border">
          <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)} className="text-[10px] font-mono uppercase tracking-widest">Cancel</Button>
          <Button variant="primary" type="button" onClick={handleCreateNotebook} className="text-[10px] font-mono uppercase tracking-widest">Initialize</Button>
        </ModalFooter>
      </Modal>

      {/* Delete/Edit modals omitted for brevity, same pattern as above */}
    </PageWrapper>
  )
}
