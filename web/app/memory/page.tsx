'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'

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

export default function MemoryPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)

  const [preferences, setPreferences] = useState<Preference | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [patterns, setPatterns] = useState<LearningPatterns | null>(null)
  const [questions, setQuestions] = useState<RecurringQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>('preferences')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      showMessage('error', 'Failed to load memory data')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
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
      showMessage('success', 'Preference updated')
    } catch (err) {
      console.error('Failed to update preference:', err)
      showMessage('error', 'Failed to update preference')
    } finally {
      setSaving(false)
    }
  }

  const clearMemory = async (type?: string) => {
    if (!confirm(type ? `Clear ${type} memory?` : 'Clear ALL memory data?')) return

    try {
      const url = type ? apiUrl(`/api/v1/memory?memory_type=${type}`) : apiUrl('/api/v1/memory')
      await fetch(url, { method: 'DELETE' })
      showMessage('success', `Memory ${type || 'all'} cleared`)
      fetchAllMemory()
    } catch (err) {
      console.error('Failed to clear memory:', err)
      showMessage('error', 'Failed to clear memory')
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
      showMessage('success', 'Memory exported')
    } catch (err) {
      console.error('Failed to export memory:', err)
      showMessage('error', 'Failed to export memory')
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
      showMessage('success', 'Memory imported')
      fetchAllMemory()
    } catch (err) {
      console.error('Failed to import memory:', err)
      showMessage('error', 'Failed to import memory')
    }
    e.target.value = ''
  }

  const resolveQuestion = async (hash: string) => {
    try {
      await fetch(apiUrl(`/api/v1/memory/questions/${hash}/resolve`), {
        method: 'POST',
      })
      setQuestions(questions.filter(q => q.hash !== hash))
      showMessage('success', 'Question marked as resolved')
    } catch (err) {
      console.error('Failed to resolve question:', err)
      showMessage('error', 'Failed to resolve question')
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
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col animate-fade-in p-6">
      {/* Header */}
      <div className="shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              {t('Memory')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {t('Personalization & Learning Patterns')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllMemory}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={exportMemory}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Export Memory"
            >
              <Download className="w-5 h-5" />
            </button>
            <label className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-5 h-5" />
              <input type="file" accept=".json" onChange={importMemory} className="hidden" />
            </label>
            <button
              onClick={() => clearMemory()}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Clear All Memory"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {/* Preferences Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection('preferences')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  {t('Preferences')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Response style and learning preferences
                </p>
              </div>
            </div>
            {activeSection === 'preferences' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {activeSection === 'preferences' && preferences && (
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700">
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="narrative">Narrative</option>
                    <option value="structured">Structured</option>
                    <option value="visual">Visual</option>
                  </select>
                </div>

                {/* Enable Examples */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Include Examples
                  </span>
                  <button
                    onClick={() =>
                      updatePreference('enable_examples', !preferences.enable_examples)
                    }
                    disabled={saving}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.enable_examples ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        preferences.enable_examples ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Sources */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Show Sources
                  </span>
                  <button
                    onClick={() => updatePreference('show_sources', !preferences.show_sources)}
                    disabled={saving}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      preferences.show_sources ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        preferences.show_sources ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Topics Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection('topics')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Hash className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{t('Topics')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {topics.length} topics tracked
                </p>
              </div>
            </div>
            {activeSection === 'topics' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {activeSection === 'topics' && (
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700">
              {topics.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No topics tracked yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                  {topics.map(topic => (
                    <div
                      key={topic.name}
                      className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                          {topic.name}
                        </span>
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          {topic.frequency}x
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatTime(topic.last_accessed)}
                        {topic.category && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span>{topic.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Learning Patterns Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection('patterns')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  {t('Learning Patterns')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {patterns?.interaction_count || 0} total interactions
                </p>
              </div>
            </div>
            {activeSection === 'patterns' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {activeSection === 'patterns' && patterns && (
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Module Usage */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Module Usage
                  </h3>
                  {Object.entries(patterns.preferred_modules).length === 0 ? (
                    <p className="text-sm text-slate-400">No module usage yet</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(patterns.preferred_modules)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([module, count]) => {
                          const maxCount = Math.max(...Object.values(patterns.preferred_modules))
                          const percentage = (count / maxCount) * 100
                          return (
                            <div key={module}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="capitalize text-slate-600 dark:text-slate-400">
                                  {module}
                                </span>
                                <span className="text-slate-500">{count}</span>
                              </div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>

                {/* Peak Hours */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Peak Usage Hours
                  </h3>
                  {patterns.peak_usage_hours.length === 0 ? (
                    <p className="text-sm text-slate-400">Not enough data yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {patterns.peak_usage_hours.map(hour => (
                        <span
                          key={hour}
                          className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium"
                        >
                          {hour}:00 - {(hour + 1) % 24}:00
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stats Cards */}
                <div className="md:col-span-2 grid grid-cols-3 gap-3">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg text-center">
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {patterns.interaction_count}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      Total Interactions
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg text-center">
                    <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {topics.length}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">
                      Topics Tracked
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg text-center">
                    <MessageSquareQuote className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {questions.length}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      Questions Tracked
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recurring Questions Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => toggleSection('questions')}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageSquareQuote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                  {t('Recurring Questions')}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Questions you've asked multiple times
                </p>
              </div>
            </div>
            {activeSection === 'questions' ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {activeSection === 'questions' && (
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700">
              {questions.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <MessageSquareQuote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recurring questions tracked yet</p>
                </div>
              ) : (
                <div className="space-y-3 pt-4">
                  {questions.map(q => (
                    <div key={q.hash} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-slate-900 dark:text-slate-100 line-clamp-2">
                            {q.normalized}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              Asked {q.frequency}x
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last: {formatTime(q.last_asked)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => resolveQuestion(q.hash)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Mark as resolved"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
