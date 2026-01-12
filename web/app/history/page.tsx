'use client'

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Calculator,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  History,
  Loader2,
  MessageCircle,
  MessageSquare,
  Microscope,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useGlobal } from '@/context/GlobalContext'
import ActivityDetail from '@/components/ActivityDetail'
import ChatSessionDetail from '@/components/ChatSessionDetail'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody } from '@/components/ui/Card'
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
  content: unknown
}

interface ChatSession {
  session_id: string
  title: string
  message_count: number
  last_message: string
  created_at: number
  updated_at: number
}

type IconType = ComponentType<{ className?: string }>

type FilterType = 'all' | 'chat' | 'solve' | 'question' | 'research'

const FILTER_OPTIONS = [
  { value: 'all', labelKey: 'All', icon: Sparkles },
  { value: 'chat', labelKey: 'Chat', icon: MessageCircle },
  { value: 'solve', labelKey: 'Solve', icon: Calculator },
  { value: 'question', labelKey: 'Question', icon: FileText },
  { value: 'research', labelKey: 'Research', icon: Microscope },
] satisfies Array<{ value: FilterType; labelKey: string; icon: IconType }>

type ActivityEntryType = Exclude<HistoryEntry['type'], 'chat'>

const ACTIVITY_CONFIG = {
  solve: {
    icon: Calculator,
    labelKey: 'Solve',
    iconClassName:
      'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/10 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20',
    pillClassName:
      'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300',
  },
  question: {
    icon: FileText,
    labelKey: 'Question',
    iconClassName:
      'bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/10 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/20',
    pillClassName:
      'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300',
  },
  research: {
    icon: Microscope,
    labelKey: 'Research',
    iconClassName:
      'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/10 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20',
    pillClassName:
      'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300',
  },
} satisfies Record<
  ActivityEntryType,
  { icon: IconType; labelKey: string; iconClassName: string; pillClassName: string }
>

type ActivityTimelineItem = { kind: 'activity'; id: string; timestamp: number; entry: HistoryEntry }
type ChatTimelineItem = { kind: 'chat'; id: string; timestamp: number; session: ChatSession }
type TimelineItem = ActivityTimelineItem | ChatTimelineItem

type TimelineGroup = { key: string; label: string; items: TimelineItem[] }

// ============================================================================
// Motion
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 30,
    },
  },
}

// ============================================================================
// Timeline Cards
// ============================================================================

interface TimelineActivityCardProps {
  entry: HistoryEntry
  onOpen: () => void
  locale: string
  t: (key: string) => string
}

function TimelineActivityCard({ entry, onOpen, locale, t }: TimelineActivityCardProps) {
  const config = ACTIVITY_CONFIG[entry.type as ActivityEntryType]
  const IconComponent = config.icon

  return (
    <motion.button
      type="button"
      variants={itemVariants}
      whileHover={{ y: -2 }}
      onClick={onOpen}
      aria-label={entry.title || config.labelKey}
      className={cn(
        'group relative w-full text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
      )}
    >
      <Card
        variant="glass"
        interactive={false}
        padding="none"
        className={cn(
          'transition-[box-shadow,transform,border-color,background-color] duration-200 ease-out-expo',
          'hover:shadow-glass'
        )}
      >
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  config.iconClassName
                )}
              >
                <IconComponent className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      config.pillClassName
                    )}
                  >
                    {t(config.labelKey)}
                  </span>
                  <span className="text-xs text-zinc-400">·</span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.timestamp * 1000).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h3 className="mt-1 truncate pr-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                  {entry.title}
                </h3>
                {entry.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {entry.summary}
                  </p>
                )}
              </div>
            </div>

            <motion.div
              initial={{ x: 0, opacity: 0 }}
              whileHover={{ x: 4, opacity: 1 }}
              className="mt-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
            </motion.div>
          </div>
        </CardBody>
      </Card>
    </motion.button>
  )
}

interface TimelineChatCardProps {
  session: ChatSession
  onView: () => void
  onContinue: () => void
  isLoading: boolean
  locale: string
  t: (key: string) => string
}

function TimelineChatCard({ session, onView, onContinue, isLoading, locale, t }: TimelineChatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      onClick={onView}
      role="button"
      tabIndex={0}
      aria-label={session.title}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onView()
        }
      }}
      className={cn(
        'group cursor-pointer outline-none',
        'focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
      )}
    >
      <Card
        variant="glass"
        interactive={false}
        padding="none"
        className={cn(
          'transition-[box-shadow,transform,border-color,background-color] duration-200 ease-out-expo',
          'hover:shadow-glass'
        )}
      >
        <CardBody className="p-4 sm:p-5">
          <div className="flex gap-4">
            <div className="mt-0.5 shrink-0">
              <motion.div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/10',
                  'dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20'
                )}
                whileHover={{ scale: 1.06, rotate: 4 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
              >
                <MessageCircle className="h-4 w-4" />
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1 gap-3">
                <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:border-blue-400/20 dark:text-blue-300">
                  {t('Chat')}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3 w-3" />
                  {new Date(session.updated_at * 1000).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <h3 className="truncate pr-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                {session.title}
              </h3>

              <div className="mt-1 flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded-full bg-white/60 px-2 py-0.5 text-xs text-zinc-500 shadow-glass-sm backdrop-blur-md dark:bg-white/5 dark:text-zinc-400">
                  {session.message_count} messages
                </span>
                {session.last_message && (
                  <p className="truncate text-sm text-zinc-600 dark:text-zinc-400 flex-1">
                    {session.last_message}
                  </p>
                )}
              </div>
            </div>

            <div className="self-center hidden items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
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

            <div className="self-center sm:hidden">
              <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" />
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Page
// ============================================================================

export default function HistoryPage() {
  const { uiSettings, loadChatSession } = useGlobal()
  const router = useRouter()

  const t = useCallback((key: string) => getTranslation(uiSettings.language, key), [uiSettings.language])
  const locale = uiSettings.language === 'zh' ? 'zh-CN' : 'en-US'

  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const [selectedChatSession, setSelectedChatSession] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      if (filterType !== 'chat') {
        const typeParam = filterType !== 'all' ? `&type=${filterType}` : ''
        const res = await fetch(apiUrl(`/api/v1/dashboard/recent?limit=50${typeParam}`))
        const data = await res.json()
        setEntries(Array.isArray(data) ? data : [])
      } else {
        setEntries([])
      }

      if (filterType === 'all' || filterType === 'chat') {
        try {
          const sessionsRes = await fetch(apiUrl('/api/v1/chat/sessions?limit=20'))
          const sessionsData = await sessionsRes.json()
          setChatSessions(Array.isArray(sessionsData) ? sessionsData : [])
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
  }, [filterType])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleLoadChatSession = useCallback(
    async (sessionId: string) => {
      setLoadingSessionId(sessionId)
      try {
        await loadChatSession(sessionId)
        router.push('/')
      } catch (err) {
        console.error('Failed to load session:', err)
      } finally {
        setLoadingSessionId(null)
      }
    },
    [loadChatSession, router]
  )

  const hasActiveFilters = filterType !== 'all' || Boolean(searchQuery.trim())

  const timelineGroups = useMemo((): TimelineGroup[] => {
    const pad2 = (value: number) => String(value).padStart(2, '0')
    const dateKeyFor = (date: Date) =>
      `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

    const today = new Date()
    const todayKey = dateKeyFor(today)
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const yesterdayKey = dateKeyFor(yesterday)

    const query = searchQuery.trim().toLowerCase()
    const matchesQuery = (value?: string) =>
      !query ? true : (value ?? '').toLowerCase().includes(query)

    const activityItems: ActivityTimelineItem[] = entries
      .filter(entry => entry.type !== 'chat')
      .filter(entry => matchesQuery(entry.title) || matchesQuery(entry.summary))
      .map(entry => ({
        kind: 'activity',
        id: `activity-${entry.id}`,
        timestamp: entry.timestamp,
        entry,
      }))

    const chatItems: ChatTimelineItem[] = chatSessions
      .filter(session => matchesQuery(session.title) || matchesQuery(session.last_message))
      .map(session => ({
        kind: 'chat',
        id: `chat-${session.session_id}`,
        timestamp: session.updated_at || session.created_at,
        session,
      }))

    let items: TimelineItem[]
    if (filterType === 'chat') {
      items = chatItems
    } else if (filterType === 'all') {
      items = [...activityItems, ...chatItems]
    } else {
      items = activityItems.filter(item => item.entry.type === filterType)
    }

    items.sort((a, b) => b.timestamp - a.timestamp)

    const groups = new Map<
      string,
      {
        key: string
        date: Date
        items: TimelineItem[]
      }
    >()

    for (const item of items) {
      const date = new Date(item.timestamp * 1000)
      const key = dateKeyFor(date)
      const existing = groups.get(key)
      if (existing) {
        existing.items.push(item)
        continue
      }
      groups.set(key, { key, date, items: [item] })
    }

    return Array.from(groups.values()).map(group => {
      const label =
        group.key === todayKey
          ? t('Today')
          : group.key === yesterdayKey
            ? t('Yesterday')
            : group.date.toLocaleDateString(locale, (() => {
                const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' }
                if (group.date.getFullYear() !== today.getFullYear()) options.year = 'numeric'
                return options
              })())

      return { key: group.key, label, items: group.items }
    })
  }, [chatSessions, entries, filterType, locale, searchQuery, t])

  return (
    <PageWrapper maxWidth="2xl" showPattern={true}>
      <PageHeader
        title={t('History')}
        description={t('All Activities')}
        icon={<History className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        actions={
          hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterType('all')
                setSearchQuery('')
              }}
              iconLeft={<X className="h-3.5 w-3.5" />}
            >
              {t('Clear Filters')}
            </Button>
          ) : null
        }
      />

      {/* Controls */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
        <Card variant="glass" interactive={false} className="overflow-visible">
          <CardBody className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-md">
                <Input
                  placeholder={`${t('Search')}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  rightIcon={
                    searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                        aria-label={t('Clear Filters')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : undefined
                  }
                  size="sm"
                  className="bg-white/70 border-white/60 shadow-glass-sm backdrop-blur-md dark:bg-white/5 dark:border-white/10"
                />
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 hidden sm:block">
                  <Filter className="h-4 w-4 text-zinc-400" />
                </div>
                <div role="group" aria-label={t('Filter by type')} className="flex flex-wrap gap-2">
                  {FILTER_OPTIONS.map(option => {
                    const isActive = filterType === option.value
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFilterType(option.value)}
                        aria-pressed={isActive}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
                          'shadow-glass-sm backdrop-blur-xl',
                          'transition-[background-color,border-color,color,box-shadow] duration-200 ease-out-expo',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
                          isActive
                            ? 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300'
                            : 'border-white/60 bg-white/60 text-zinc-700 hover:bg-white/80 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-zinc-50'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5',
                            isActive
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-zinc-400 dark:text-zinc-500'
                          )}
                        />
                        {t(option.labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Timeline */}
      <div className="space-y-8">
        {loading ? (
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card variant="glass" interactive={false} className="py-10">
              <CardBody className="flex items-center justify-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span>{t('Loading')}</span>
              </CardBody>
            </Card>
          </motion.div>
        ) : timelineGroups.length === 0 ? (
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card variant="glass" interactive={false} className="py-12">
              <CardBody className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/10 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20">
                  <History className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {t('No history found')}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {t('Your activities will appear here')}
                </p>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10">
            {timelineGroups.map(group => (
              <motion.section key={group.key} variants={itemVariants}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {group.label}
                    </span>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-zinc-600 shadow-sm dark:bg-white/5 dark:text-zinc-300">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-zinc-200/70 dark:bg-white/10" />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/25 via-zinc-200/70 to-transparent dark:from-blue-400/25 dark:via-white/10" />
                  <ol role="list" className="space-y-3">
                    {group.items.map(item => (
                      <li key={item.id} className="relative pl-8">
                        <div className="pointer-events-none absolute left-4 top-[22px] h-2 w-2 -translate-x-1/2 rounded-full bg-blue-500 ring-4 ring-white/70 dark:ring-zinc-950/40" />

                        {item.kind === 'activity' ? (
                          <TimelineActivityCard
                            entry={item.entry}
                            onOpen={() => setSelectedEntry(item.entry)}
                            locale={locale}
                            t={t}
                          />
                        ) : (
                          <TimelineChatCard
                            session={item.session}
                            onView={() => setSelectedChatSession(item.session.session_id)}
                            onContinue={() => handleLoadChatSession(item.session.session_id)}
                            isLoading={loadingSessionId === item.session.session_id}
                            locale={locale}
                            t={t}
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </motion.section>
            ))}
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
