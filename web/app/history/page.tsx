'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  Clock,
  ChevronRight,
  Calculator,
  FileText,
  Microscope,
  MessageCircle,
  Filter,
  Search,
  Calendar,
  X,
  MessageSquare,
  Loader2,
  Eye,
  Sparkles,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { useGlobal } from '@/context/GlobalContext'
import ActivityDetail from '@/components/ActivityDetail'
import ChatSessionDetail from '@/components/ChatSessionDetail'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

// ============================================================================
// Types
// ============================================================================

interface HistoryEntry {
  id: string
  type: 'solve' | 'question' | 'research' | 'chat'
  title: string
  summary: string
  timestamp: number
  content: any
}

interface ChatSession {
  session_id: string
  title: string
  message_count: number
  last_message: string
  created_at: number
  updated_at: number
}

// ============================================================================
// Configuration
// ============================================================================

const TYPE_CONFIG = {
  solve: {
    icon: Calculator,
    gradient: 'from-teal-400 to-cyan-500',
    bgColor: 'bg-teal-100/80 dark:bg-teal-900/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-200/50 dark:border-teal-700/30',
  },
  question: {
    icon: FileText,
    gradient: 'from-violet-400 to-purple-500',
    bgColor: 'bg-violet-100/80 dark:bg-violet-900/30',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200/50 dark:border-violet-700/30',
  },
  research: {
    icon: Microscope,
    gradient: 'from-emerald-400 to-green-500',
    bgColor: 'bg-emerald-100/80 dark:bg-emerald-900/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200/50 dark:border-emerald-700/30',
  },
  chat: {
    icon: MessageCircle,
    gradient: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-100/80 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200/50 dark:border-amber-700/30',
  },
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'chat', label: 'Chat' },
  { value: 'solve', label: 'Solve' },
  { value: 'question', label: 'Question' },
  { value: 'research', label: 'Research' },
]

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
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

const filterButtonVariants = {
  inactive: { scale: 1 },
  active: {
    scale: 1.02,
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  },
}

// ============================================================================
// Sub-components
// ============================================================================

interface ActivityCardProps {
  entry: HistoryEntry
  onClick: () => void
  language: string
}

function ActivityCard({ entry, onClick, language }: ActivityCardProps) {
  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.chat
  const IconComponent = config.icon

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <Card
        variant="glass"
        hoverEffect={false}
        className={`
          border ${config.borderColor}
          hover:shadow-xl hover:shadow-teal-500/10
          transition-all duration-300
        `}
      >
        <CardBody className="p-4">
          <div className="flex gap-4">
            {/* Icon with gradient background */}
            <div className="mt-0.5 shrink-0">
              <motion.div
                className={`
                  w-11 h-11 rounded-xl
                  bg-gradient-to-br ${config.gradient}
                  flex items-center justify-center
                  shadow-lg shadow-black/10
                `}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
              >
                <IconComponent className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`
                    text-[10px] font-bold uppercase tracking-wider
                    ${config.textColor}
                    px-2 py-0.5 rounded-full ${config.bgColor}
                  `}
                >
                  {entry.type}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(entry.timestamp * 1000).toLocaleTimeString(
                    language === 'zh' ? 'zh-CN' : 'en-US',
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate pr-4 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {entry.title}
              </h3>
              {entry.summary && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {entry.summary}
                </p>
              )}
            </div>

            {/* Arrow indicator */}
            <div className="self-center">
              <motion.div
                initial={{ x: 0, opacity: 0 }}
                whileHover={{ x: 4, opacity: 1 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5 text-teal-500 dark:text-teal-400" />
              </motion.div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

interface ChatSessionCardProps {
  session: ChatSession
  onView: () => void
  onContinue: () => void
  isLoading: boolean
  language: string
  t: (key: string) => string
}

function ChatSessionCard({
  session,
  onView,
  onContinue,
  isLoading,
  language,
  t,
}: ChatSessionCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
    >
      <Card
        variant="glass"
        hoverEffect={false}
        onClick={onView}
        className={`
          border border-amber-200/50 dark:border-amber-700/30
          hover:shadow-xl hover:shadow-amber-500/10
          transition-all duration-300
        `}
      >
        <CardBody className="p-4">
          <div className="flex gap-4">
            {/* Icon */}
            <div className="mt-0.5 shrink-0">
              <motion.div
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-black/10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30">
                  Chat
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(session.updated_at * 1000).toLocaleDateString(
                    language === 'zh' ? 'zh-CN' : 'en-US'
                  )}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate pr-4 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {session.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {session.message_count} messages
                </span>
                {session.last_message && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1">
                    {session.last_message}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="self-center flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation()
                  onView()
                }}
                iconLeft={<Eye className="w-3.5 h-3.5" />}
              >
                {t('View')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={e => {
                  e.stopPropagation()
                  onContinue()
                }}
                loading={isLoading}
                iconLeft={<MessageSquare className="w-3.5 h-3.5" />}
              >
                {t('Continue')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function HistoryPage() {
  const { uiSettings, loadChatSession } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)
  const router = useRouter()

  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [selectedChatSession, setSelectedChatSession] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [filterType])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      // Fetch regular activity history
      if (filterType === 'all' || filterType !== 'chat') {
        const typeParam = filterType !== 'all' ? `&type=${filterType}` : ''
        const res = await fetch(apiUrl(`/api/v1/dashboard/recent?limit=50${typeParam}`))
        const data = await res.json()
        setEntries(data)
      } else {
        setEntries([])
      }

      // Fetch chat sessions
      if (filterType === 'all' || filterType === 'chat') {
        try {
          const sessionsRes = await fetch(apiUrl('/api/v1/chat/sessions?limit=20'))
          const sessionsData = await sessionsRes.json()
          setChatSessions(sessionsData)
        } catch (err) {
          console.error('Failed to fetch chat sessions:', err)
          setChatSessions([])
        }
      } else {
        setChatSessions([])
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadChatSession = async (sessionId: string) => {
    setLoadingSessionId(sessionId)
    try {
      await loadChatSession(sessionId)
      router.push('/')
    } catch (err) {
      console.error('Failed to load session:', err)
    } finally {
      setLoadingSessionId(null)
    }
  }

  const filteredEntries = entries.filter(entry => {
    // Exclude chat type - they are shown in dedicated Chat History section
    if (entry.type === 'chat') return false

    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return entry.title.toLowerCase().includes(query) || entry.summary?.toLowerCase().includes(query)
  })

  const groupEntriesByDate = (entries: HistoryEntry[]) => {
    const groups: { [key: string]: HistoryEntry[] } = {}

    entries.forEach(entry => {
      const date = new Date(entry.timestamp * 1000)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let dateKey: string
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today'
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday'
      } else {
        dateKey = date.toLocaleDateString(uiSettings.language === 'zh' ? 'zh-CN' : 'en-US', {
          month: 'long',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        })
      }

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
    })

    return groups
  }

  const groupedEntries = groupEntriesByDate(filteredEntries)
  const filteredChatSessions = chatSessions.filter(session => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      session.title.toLowerCase().includes(query) ||
      session.last_message?.toLowerCase().includes(query)
    )
  })

  return (
    <PageWrapper maxWidth="xl" showPattern={true}>
      {/* Header */}
      <PageHeader
        title={t('History')}
        description={t('All Activities')}
        icon={<History className="w-5 h-5" />}
      />

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <Card variant="glass" hoverEffect={false} className="overflow-visible">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search Input */}
              <div className="flex-1 min-w-[200px] max-w-md">
                <Input
                  placeholder={`${t('Search')}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  rightIcon={
                    searchQuery ? (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : undefined
                  }
                  size="sm"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="flex bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 gap-1">
                  {FILTER_OPTIONS.map(option => (
                    <motion.button
                      key={option.value}
                      onClick={() => setFilterType(option.value)}
                      variants={filterButtonVariants}
                      animate={filterType === option.value ? 'active' : 'inactive'}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                        ${
                          filterType === option.value
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                        }
                      `}
                    >
                      {t(option.label)}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <Card variant="glass" hoverEffect={false}>
            <CardBody className="p-12">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block mb-4"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent" />
                </motion.div>
                <p className="text-slate-500 dark:text-slate-400">{t('Loading')}...</p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredEntries.length === 0 && filteredChatSessions.length === 0 && (
          <Card variant="glass" hoverEffect={false}>
            <CardBody className="p-12">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
                  className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <Sparkles className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </motion.div>
                <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">
                  {t('No history found')}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                  {t('Your activities will appear here')}
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Activity Timeline */}
        {!loading && filteredEntries.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([dateKey, dateEntries], groupIndex) => (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-200/30 dark:border-teal-700/30">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {dateKey}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-teal-200/50 via-slate-200/50 to-transparent dark:from-teal-700/30 dark:via-slate-700/30" />
                </div>

                {/* Timeline Items */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3 pl-2"
                >
                  {/* Timeline Line */}
                  <div className="relative">
                    <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-300/50 via-slate-200/30 to-transparent dark:from-teal-600/30 dark:via-slate-700/30 rounded-full" />
                    <div className="space-y-3">
                      {dateEntries.map(entry => (
                        <ActivityCard
                          key={entry.id}
                          entry={entry}
                          onClick={() => setSelectedEntry(entry)}
                          language={uiSettings.language}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Chat Sessions Section */}
        {!loading &&
          filteredChatSessions.length > 0 &&
          (filterType === 'all' || filterType === 'chat') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/30 dark:border-amber-700/30">
                  <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {t('Chat History')}
                  </span>
                  <span className="text-xs text-amber-500/70 dark:text-amber-400/70 ml-1">
                    ({filteredChatSessions.length})
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-200/50 via-slate-200/50 to-transparent dark:from-amber-700/30 dark:via-slate-700/30" />
              </div>

              {/* Chat Session Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {filteredChatSessions.map(session => (
                  <ChatSessionCard
                    key={session.session_id}
                    session={session}
                    onView={() => setSelectedChatSession(session.session_id)}
                    onContinue={() => handleLoadChatSession(session.session_id)}
                    isLoading={loadingSessionId === session.session_id}
                    language={uiSettings.language}
                    t={t}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
      </div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <ActivityDetail activity={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </AnimatePresence>

      {/* Chat Session Detail Modal */}
      <AnimatePresence>
        {selectedChatSession && (
          <ChatSessionDetail
            sessionId={selectedChatSession}
            onClose={() => setSelectedChatSession(null)}
            onContinue={() => {
              handleLoadChatSession(selectedChatSession)
              setSelectedChatSession(null)
            }}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
