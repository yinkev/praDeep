'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Settings2,
  TrendingUp,
  MessageSquareQuote,
  Hash,
  Clock,
  BarChart3,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Zap,
  Database,
  HardDrive,
  FileJson,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import Button, { IconButton } from '@/components/ui/Button'
import { Spinner, FullPageLoading } from '@/components/ui/LoadingState'
import { useToast } from '@/components/ui/Toast'

// ============================================================================
// Types
// ============================================================================

interface Preference {
  response_style: string
  difficulty_level: string
  preferred_explanation_format: string
  enable_examples: boolean
  show_sources: boolean
  custom: Record<string, unknown>
}

interface Topic {
  name: string
  frequency: number
  last_accessed: number
  category?: string
}

interface LearningPatterns {
  interaction_count: number
  preferred_modules: Record<string, number>
  peak_usage_hours: number[]
  learning_velocity: Record<string, { mastery_score: number }>
}

interface RecurringQuestion {
  hash: string
  normalized: string
  frequency: number
  last_asked: number
  examples: string[]
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

const collapseVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut' as const,
    },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
  },
}

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300
        ${checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2
      `}
    >
      <motion.span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
        initial={false}
        animate={{
          x: checked ? 24 : 4,
        }}
        transition={{
          type: 'spring' as const,
          stiffness: 500,
          damping: 30,
        }}
      />
    </button>
  )
}

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  id: string
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: React.ReactNode
}

function CollapsibleSection({
  id,
  icon,
  iconBg,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
  badge,
}: CollapsibleSectionProps) {
  return (
    <Card variant="glass" hoverEffect={false}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/30 dark:hover:bg-slate-700/30 transition-colors rounded-t-2xl"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {icon}
          </motion.div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
              {badge}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={collapseVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-white/20 dark:border-slate-700/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ============================================================================
// Stats Card Component
// ============================================================================

interface StatsCardProps {
  icon: React.ReactNode
  value: number | string
  label: string
  gradient: string
  iconColor: string
  textColor: string
}

function StatsCard({ icon, value, label, gradient, iconColor, textColor }: StatsCardProps) {
  return (
    <motion.div
      className={`p-5 ${gradient} rounded-xl border border-white/20 dark:border-slate-700/30 backdrop-blur-sm`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
    >
      <div className={`${iconColor} mb-2`}>{icon}</div>
      <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
      <div className={`text-xs ${textColor} opacity-80`}>{label}</div>
    </motion.div>
  )
}

// ============================================================================
// Topic Tag Component
// ============================================================================

interface TopicTagProps {
  topic: Topic
  formatTime: (timestamp: number) => string
}

function TopicTag({ topic, formatTime }: TopicTagProps) {
  return (
    <motion.div
      className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30 shadow-sm"
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
          {topic.name}
        </span>
        <span className="text-xs bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full font-medium shadow-sm">
          {topic.frequency}x
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatTime(topic.last_accessed)}</span>
        {topic.category && (
          <>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-teal-600 dark:text-teal-400">{topic.category}</span>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Question Card Component
// ============================================================================

interface QuestionCardProps {
  question: RecurringQuestion
  onResolve: () => void
  formatTime: (timestamp: number) => string
}

function QuestionCard({ question, onResolve, formatTime }: QuestionCardProps) {
  return (
    <motion.div
      className="p-5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30 shadow-sm"
      variants={itemVariants}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
            {question.normalized}
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              Asked {question.frequency}x
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(question.last_asked)}
            </span>
          </div>
        </div>
        <motion.button
          onClick={onResolve}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-xl transition-colors shadow-sm border border-teal-100 dark:border-teal-800/50"
          title="Mark as resolved"
        >
          <CheckCircle className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  label: string
  value: number
  maxValue: number
  color: string
}

function ProgressBar({ label, value, maxValue, color }: ProgressBarProps) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">{label}</span>
        <span className="text-slate-500 font-mono">{value}</span>
      </div>
      <div className="h-2.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function MemoryPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)
  const toast = useToast()

  const [preferences, setPreferences] = useState<Preference | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [patterns, setPatterns] = useState<LearningPatterns | null>(null)
  const [questions, setQuestions] = useState<RecurringQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>('preferences')
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAllMemory()
  }, [])

  const fetchAllMemory = async () => {
    setLoading(true)
    try {
      const [prefsRes, topicsRes, patternsRes, questionsRes] = await Promise.all([
        fetch(apiUrl('/api/v1/memory/preferences')),
        fetch(apiUrl('/api/v1/memory/topics?limit=20')),
        fetch(apiUrl('/api/v1/memory/patterns')),
        fetch(apiUrl('/api/v1/memory/questions?min_frequency=1&limit=20')),
      ])

      const prefsData = await prefsRes.json()
      const topicsData = await topicsRes.json()
      const patternsData = await patternsRes.json()
      const questionsData = await questionsRes.json()

      setPreferences(prefsData.preferences)
      setTopics(topicsData.topics)
      setPatterns(patternsData)
      setQuestions(questionsData.questions)
    } catch (err) {
      console.error('Failed to fetch memory:', err)
      toast.error('Failed to load memory data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllMemory()
    setRefreshing(false)
    toast.success('Memory data refreshed')
  }

  const updatePreference = async (key: string, value: unknown) => {
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/api/v1/memory/preferences'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      const data = await res.json()
      setPreferences(data.preferences)
      toast.success('Preference updated')
    } catch (err) {
      console.error('Failed to update preference:', err)
      toast.error('Failed to update preference')
    } finally {
      setSaving(false)
    }
  }

  const clearMemory = async (type?: string) => {
    if (!confirm(type ? `Clear ${type} memory?` : 'Clear ALL memory data?')) return

    try {
      const url = type ? apiUrl(`/api/v1/memory?memory_type=${type}`) : apiUrl('/api/v1/memory')
      await fetch(url, { method: 'DELETE' })
      toast.success(`Memory ${type || 'all'} cleared`)
      fetchAllMemory()
    } catch (err) {
      console.error('Failed to clear memory:', err)
      toast.error('Failed to clear memory')
    }
  }

  const exportMemory = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/memory/export'))
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `praDeep-memory-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Memory exported')
    } catch (err) {
      console.error('Failed to export memory:', err)
      toast.error('Failed to export memory')
    }
  }

  const importMemory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await fetch(apiUrl('/api/v1/memory/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      toast.success('Memory imported')
      fetchAllMemory()
    } catch (err) {
      console.error('Failed to import memory:', err)
      toast.error('Failed to import memory')
    }
    e.target.value = ''
  }

  const resolveQuestion = async (hash: string) => {
    try {
      await fetch(apiUrl(`/api/v1/memory/questions/${hash}/resolve`), {
        method: 'POST',
      })
      setQuestions(questions.filter(q => q.hash !== hash))
      toast.success('Question marked as resolved')
    } catch (err) {
      console.error('Failed to resolve question:', err)
      toast.error('Failed to resolve question')
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(
      uiSettings.language === 'zh' ? 'zh-CN' : 'en-US',
      { month: 'short', day: 'numeric' }
    )
  }

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  if (loading) {
    return <FullPageLoading message={t('Loading memory data...')} />
  }

  return (
    <PageWrapper maxWidth="xl">
      {/* Page Header */}
      <PageHeader
        title={t('Memory')}
        description={t('Personalization & Learning Patterns')}
        icon={<Brain className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <IconButton
              variant="ghost"
              icon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              aria-label="Refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            />
            <IconButton
              variant="ghost"
              icon={<Download className="w-4 h-4" />}
              aria-label="Export Memory"
              onClick={exportMemory}
            />
            <label className="cursor-pointer">
              <IconButton
                variant="ghost"
                icon={<Upload className="w-4 h-4" />}
                aria-label="Import Memory"
                onClick={() => {}}
              />
              <input type="file" accept=".json" onChange={importMemory} className="hidden" />
            </label>
            <IconButton
              variant="destructive"
              icon={<Trash2 className="w-4 h-4" />}
              aria-label="Clear All Memory"
              onClick={() => clearMemory()}
            />
          </div>
        }
      />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Memory Systems Section */}
        <motion.div variants={itemVariants}>
          <CollapsibleSection
            id="systems"
            icon={<Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-100 dark:bg-purple-900/50"
            title="Memory Systems"
            subtitle="Where state is persisted on disk"
            isOpen={activeSection === 'systems'}
            onToggle={() => toggleSection('systems')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Persistent user memory (this page)
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Stored in{' '}
                  <code className="px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-600/60 text-xs font-mono">
                    data/user/memory/*.json
                  </code>{' '}
                  and managed via{' '}
                  <code className="px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-600/60 text-xs font-mono">
                    /api/v1/memory/*
                  </code>
                </p>
              </div>

              <div className="p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30">
                <div className="flex items-center gap-2 mb-3">
                  <FileJson className="w-4 h-4 text-teal-500" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Solve agent run memory (per run)
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Stored per solve run in{' '}
                  <code className="px-1.5 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-600/60 text-xs font-mono">
                    data/user/solve/solve_YYYYMMDD_HHMMSS/
                  </code>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Docs: <code className="font-mono">docs/architecture/memory-systems.md</code>
            </p>
          </CollapsibleSection>
        </motion.div>

        {/* Preferences Section */}
        <motion.div variants={itemVariants}>
          <CollapsibleSection
            id="preferences"
            icon={<Settings2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
            iconBg="bg-teal-100 dark:bg-teal-900/50"
            title={t('Preferences')}
            subtitle="Response style and learning preferences"
            isOpen={activeSection === 'preferences'}
            onToggle={() => toggleSection('preferences')}
          >
            {preferences && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {/* Response Style */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Response Style
                  </label>
                  <select
                    value={preferences.response_style}
                    onChange={e => updatePreference('response_style', e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-sm"
                  >
                    <option value="concise">Concise</option>
                    <option value="balanced">Balanced</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Difficulty Level
                  </label>
                  <select
                    value={preferences.difficulty_level}
                    onChange={e => updatePreference('difficulty_level', e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-sm"
                  >
                    <option value="adaptive">Adaptive</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Explanation Format */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Explanation Format
                  </label>
                  <select
                    value={preferences.preferred_explanation_format}
                    onChange={e => updatePreference('preferred_explanation_format', e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all shadow-sm"
                  >
                    <option value="narrative">Narrative</option>
                    <option value="structured">Structured</option>
                    <option value="visual">Visual</option>
                  </select>
                </div>

                {/* Enable Examples */}
                <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Include Examples
                  </span>
                  <ToggleSwitch
                    checked={preferences.enable_examples}
                    onChange={checked => updatePreference('enable_examples', checked)}
                    disabled={saving}
                  />
                </div>

                {/* Show Sources */}
                <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-700/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-600/30">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show Sources
                  </span>
                  <ToggleSwitch
                    checked={preferences.show_sources}
                    onChange={checked => updatePreference('show_sources', checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            )}
          </CollapsibleSection>
        </motion.div>

        {/* Topics Section */}
        <motion.div variants={itemVariants}>
          <CollapsibleSection
            id="topics"
            icon={<Hash className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/50"
            title={t('Topics')}
            subtitle={`${topics.length} topics tracked`}
            isOpen={activeSection === 'topics'}
            onToggle={() => toggleSection('topics')}
            badge={
              topics.length > 0 && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                  {topics.length}
                </span>
              )
            }
          >
            {topics.length === 0 ? (
              <div className="py-12 text-center">
                <Hash className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">No topics tracked yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Topics will appear as you interact with the system
                </p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4"
                variants={containerVariants}
              >
                {topics.map(topic => (
                  <TopicTag key={topic.name} topic={topic} formatTime={formatTime} />
                ))}
              </motion.div>
            )}
          </CollapsibleSection>
        </motion.div>

        {/* Learning Patterns Section */}
        <motion.div variants={itemVariants}>
          <CollapsibleSection
            id="patterns"
            icon={<TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-100 dark:bg-amber-900/50"
            title={t('Learning Patterns')}
            subtitle={`${patterns?.interaction_count || 0} total interactions`}
            isOpen={activeSection === 'patterns'}
            onToggle={() => toggleSection('patterns')}
          >
            {patterns && (
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Module Usage */}
                  <div className="p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-500" />
                      Module Usage
                    </h3>
                    {Object.entries(patterns.preferred_modules).length === 0 ? (
                      <p className="text-sm text-slate-400">No module usage yet</p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(patterns.preferred_modules)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([module, count]) => {
                            const maxCount = Math.max(...Object.values(patterns.preferred_modules))
                            return (
                              <ProgressBar
                                key={module}
                                label={module}
                                value={count}
                                maxValue={maxCount}
                                color="bg-gradient-to-r from-amber-400 to-amber-500"
                              />
                            )
                          })}
                      </div>
                    )}
                  </div>

                  {/* Peak Hours */}
                  <div className="p-5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-slate-700/30">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Peak Usage Hours
                    </h3>
                    {patterns.peak_usage_hours.length === 0 ? (
                      <p className="text-sm text-slate-400">Not enough data yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {patterns.peak_usage_hours.map(hour => (
                          <motion.span
                            key={hour}
                            className="px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-800/30 text-amber-700 dark:text-amber-300 rounded-xl text-sm font-medium shadow-sm border border-amber-200/50 dark:border-amber-700/30"
                            whileHover={{ scale: 1.05 }}
                          >
                            {hour}:00 - {(hour + 1) % 24}:00
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <StatsCard
                    icon={<Sparkles className="w-6 h-6" />}
                    value={patterns.interaction_count}
                    label="Total Interactions"
                    gradient="bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/30 dark:to-teal-800/20"
                    iconColor="text-teal-600 dark:text-teal-400"
                    textColor="text-teal-700 dark:text-teal-300"
                  />
                  <StatsCard
                    icon={<Target className="w-6 h-6" />}
                    value={topics.length}
                    label="Topics Tracked"
                    gradient="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    textColor="text-emerald-700 dark:text-emerald-300"
                  />
                  <StatsCard
                    icon={<MessageSquareQuote className="w-6 h-6" />}
                    value={questions.length}
                    label="Questions Tracked"
                    gradient="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20"
                    iconColor="text-purple-600 dark:text-purple-400"
                    textColor="text-purple-700 dark:text-purple-300"
                  />
                </div>
              </div>
            )}
          </CollapsibleSection>
        </motion.div>

        {/* Recurring Questions Section */}
        <motion.div variants={itemVariants}>
          <CollapsibleSection
            id="questions"
            icon={<MessageSquareQuote className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-100 dark:bg-purple-900/50"
            title={t('Recurring Questions')}
            subtitle="Questions you've asked multiple times"
            isOpen={activeSection === 'questions'}
            onToggle={() => toggleSection('questions')}
            badge={
              questions.length > 0 && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                  {questions.length}
                </span>
              )
            }
          >
            {questions.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquareQuote className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400">
                  No recurring questions tracked yet
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Questions asked multiple times will appear here
                </p>
              </div>
            ) : (
              <motion.div className="space-y-3 pt-4" variants={containerVariants}>
                {questions.map(q => (
                  <QuestionCard
                    key={q.hash}
                    question={q}
                    onResolve={() => resolveQuestion(q.hash)}
                    formatTime={formatTime}
                  />
                ))}
              </motion.div>
            )}
          </CollapsibleSection>
        </motion.div>
      </motion.div>
    </PageWrapper>
  )
}
