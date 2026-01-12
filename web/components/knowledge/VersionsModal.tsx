'use client'

import { useState, useEffect } from 'react'
import {
  X,
  History,
  Plus,
  Trash2,
  RotateCcw,
  GitCompare,
  Loader2,
  Calendar,
  HardDrive,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'

interface VersionInfo {
  version_id: string
  kb_name: string
  created_at: string
  description: string
  version_type: string
  created_by: string
  document_count: number
  storage_size_bytes: number
  metadata_snapshot: {
    name?: string
    created_at?: string
    description?: string
    version?: string
    last_updated?: string
  }
}

interface VersionsModalProps {
  isOpen: boolean
  onClose: () => void
  kbName: string
  onVersionChange?: () => void
}

export default function VersionsModal({
  isOpen,
  onClose,
  kbName,
  onVersionChange,
}: VersionsModalProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingSnapshot, setCreatingSnapshot] = useState(false)
  const [description, setDescription] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [deletingVersion, setDeletingVersion] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState<string | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  // Fetch versions when modal opens
  useEffect(() => {
    if (isOpen && kbName) {
      fetchVersions()
    }
  }, [isOpen, kbName])

  const fetchVersions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${kbName}/versions`))
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch versions')
      }
      const data = await res.json()
      setVersions(data.versions || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${kbName}/versions`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description || `Snapshot created on ${new Date().toLocaleString()}`,
          created_by: 'user',
        }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to create snapshot')
      }
      await fetchVersions()
      setDescription('')
      setShowCreateForm(false)
      onVersionChange?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreatingSnapshot(false)
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (
      !confirm(`Are you sure you want to delete version "${versionId}"? This cannot be undone.`)
    ) {
      return
    }
    setDeletingVersion(versionId)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${kbName}/versions/${versionId}`), {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete version')
      }
      await fetchVersions()
      onVersionChange?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeletingVersion(null)
    }
  }

  const handleRollback = async (versionId: string) => {
    if (
      !confirm(
        `Are you sure you want to rollback to version "${versionId}"? A backup of the current state will be created first.`
      )
    ) {
      return
    }
    setRollingBack(versionId)
    setError(null)
    try {
      const res = await fetch(
        apiUrl(`/api/v1/knowledge/${kbName}/versions/${versionId}/rollback`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backup_current: true }),
        }
      )
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to start rollback')
      }
      alert('Rollback started. Progress can be monitored in the Knowledge Base status.')
      onVersionChange?.()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRollingBack(null)
    }
  }

  const toggleCompareSelection = (versionId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  const getVersionTypeBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      manual: {
        bg: 'bg-blue-100 dark:bg-blue-900/40',
        text: 'text-blue-700 dark:text-blue-300',
        label: 'Manual',
      },
      auto_backup: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/40',
        text: 'text-yellow-700 dark:text-yellow-300',
        label: 'Auto Backup',
      },
      pre_rollback: {
        bg: 'bg-purple-100 dark:bg-purple-900/40',
        text: 'text-purple-700 dark:text-purple-300',
        label: 'Pre-Rollback',
      },
    }
    const badge = badges[type] || {
      bg: 'bg-slate-100 dark:bg-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      label: type,
    }
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Version History
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{kbName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-3">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Snapshot
            </button>
          ) : (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                onClick={handleCreateSnapshot}
                disabled={creatingSnapshot}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {creatingSnapshot ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setDescription('')
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
          {selectedForCompare.length === 2 && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Compare Selected
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 dark:text-slate-500" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No versions found. Create a snapshot to start tracking history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map(version => (
                <div
                  key={version.version_id}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    selectedForCompare.includes(version.version_id)
                      ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  {/* Version Header */}
                  <div
                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    onClick={() =>
                      setExpandedVersion(
                        expandedVersion === version.version_id ? null : version.version_id
                      )
                    }
                  >
                    <button className="text-slate-400 dark:text-slate-500">
                      {expandedVersion === version.version_id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(version.version_id)}
                      onChange={e => {
                        e.stopPropagation()
                        toggleCompareSelection(version.version_id)
                      }}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {version.version_id}
                        </span>
                        {getVersionTypeBadge(version.version_type)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {version.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(version.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {version.document_count} docs
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatBytes(version.storage_size_bytes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleRollback(version.version_id)}
                        disabled={rollingBack === version.version_id}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                        title="Rollback to this version"
                      >
                        {rollingBack === version.version_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteVersion(version.version_id)}
                        disabled={deletingVersion === version.version_id}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Delete version"
                      >
                        {deletingVersion === version.version_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedVersion === version.version_id && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                            Created By
                          </p>
                          <p className="text-slate-700 dark:text-slate-300">{version.created_by}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                            Version Type
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 capitalize">
                            {version.version_type.replace('_', ' ')}
                          </p>
                        </div>
                        {version.metadata_snapshot?.last_updated && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                              KB Last Updated
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              {version.metadata_snapshot.last_updated}
                            </p>
                          </div>
                        )}
                        {version.metadata_snapshot?.version && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                              KB Version
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                              {version.metadata_snapshot.version}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
          <span>
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs">Select 2 versions to compare changes</span>
        </div>
      </div>

      {/* Compare Modal */}
      {showCompareModal && selectedForCompare.length === 2 && (
        <CompareVersionsModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
          kbName={kbName}
          version1={selectedForCompare[0]}
          version2={selectedForCompare[1]}
        />
      )}
    </div>
  )
}

// Compare Versions Modal Component (inline for simplicity)
interface CompareVersionsModalProps {
  isOpen: boolean
  onClose: () => void
  kbName: string
  version1: string
  version2: string
}

interface ComparisonResult {
  comparison: {
    version_1_id: string
    version_2_id: string
    documents_added: Array<{ filename: string; file_hash: string; file_size: number }>
    documents_deleted: Array<{ filename: string; file_hash: string; file_size: number }>
    documents_modified: Array<{
      filename: string
      old_hash: string
      new_hash: string
      old_size: number
      new_size: number
    }>
    documents_unchanged: Array<{ filename: string; file_hash: string }>
    summary: {
      added_count: number
      deleted_count: number
      modified_count: number
      unchanged_count: number
      total_changes: number
    }
  }
  version_1_info: VersionInfo
  version_2_info: VersionInfo
}

function CompareVersionsModal({
  isOpen,
  onClose,
  kbName,
  version1,
  version2,
}: CompareVersionsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchComparison()
    }
  }, [isOpen, kbName, version1, version2])

  const fetchComparison = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/v1/knowledge/${kbName}/versions/compare`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_1: version1, version_2: version2 }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to compare versions')
      }
      const data = await res.json()
      setComparison(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Compare Versions
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {version1} vs {version2}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 dark:text-slate-500" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
              {error}
            </div>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {comparison.comparison.summary.added_count}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Added</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {comparison.comparison.summary.deleted_count}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">Deleted</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-xl">
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {comparison.comparison.summary.modified_count}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Modified</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl">
                  <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">
                    {comparison.comparison.summary.unchanged_count}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">Unchanged</p>
                </div>
              </div>

              {/* Added Documents */}
              {comparison.comparison.documents_added.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Added Documents
                  </h4>
                  <div className="space-y-1">
                    {comparison.comparison.documents_added.map(doc => (
                      <div
                        key={doc.filename}
                        className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-300">{doc.filename}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deleted Documents */}
              {comparison.comparison.documents_deleted.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Deleted Documents
                  </h4>
                  <div className="space-y-1">
                    {comparison.comparison.documents_deleted.map(doc => (
                      <div
                        key={doc.filename}
                        className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-300 line-through">
                          {doc.filename}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified Documents */}
              {comparison.comparison.documents_modified.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Modified Documents
                  </h4>
                  <div className="space-y-1">
                    {comparison.comparison.documents_modified.map(doc => (
                      <div
                        key={doc.filename}
                        className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-300">{doc.filename}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {(doc.old_size / 1024).toFixed(1)} KB → {(doc.new_size / 1024).toFixed(1)}{' '}
                          KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No changes */}
              {comparison.comparison.summary.total_changes === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No differences found between these versions.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
