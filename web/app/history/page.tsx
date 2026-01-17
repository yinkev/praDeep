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
import { Card, CardBody, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'

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
    colorClass: 'text-accent-primary',
    bgClass: 'bg-accent-primary/10',
    borderClass: 'border-accent-primary/20',
  },
  question: {
    icon: FileText,
    labelKey: 'Question',
    colorClass: 'text-accent-primary',
    bgClass: 'bg-accent-primary/10',
    borderClass: 'border-accent-primary/20',
  },
  research: {
    icon: Microscope,
    labelKey: 'Research',
    colorClass: 'text-accent-primary',
    bgClass: 'bg-accent-primary/10',
    borderClass: 'border-accent-primary/20',
  },
} satisfies Record<
  ActivityEntryType,
  { icon: IconType; labelKey: string; colorClass: string; bgClass: string; borderClass: string }
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
        'group relative w-full text-left outline-none rounded-xl',
        'focus-visible:ring-2 focus-visible:ring-accent-primary/30',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
      )}
    >
      <Card
        interactive={false}
        className={cn(
          'transition-all duration-200 ease-out-expo border-border hover:border-accent-primary/40',
          'bg-surface-base hover:bg-surface-elevated hover:shadow-glass-sm'
        )}
      >
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                  config.bgClass,
                  config.colorClass,
                  config.borderClass
                )}
              >
                <IconComponent className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary"
                    className={cn(
                      'text-[10px] uppercase tracking-wider',
                      config.bgClass,
                      config.colorClass,
                      config.borderClass
                    )}
                  >
                    {t(config.labelKey)}
                  </Badge>
                  <span className="text-text-quaternary font-mono text-[10px] tracking-widest">•</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.timestamp * 1000).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h3 className="mt-2 truncate pr-4 text-sm font-bold text-text-primary uppercase tracking-tight transition-colors group-hover:text-accent-primary">
                  {entry.title}
                </h3>
                {entry.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary leading-relaxed">
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
              <ChevronRight className="h-4 w-4 text-text-quaternary group-hover:text-accent-primary" />
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
        'group cursor-pointer outline-none rounded-xl',
        'focus-visible:ring-2 focus-visible:ring-accent-primary/30 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-surface'
      )}
    >
      <Card
        interactive={false}
        className={cn(
          'transition-all duration-200 ease-out-expo border-border hover:border-accent-primary/40',
          'bg-surface-base hover:bg-surface-elevated hover:shadow-glass-sm'
        )}
      >
        <CardBody className="p-4 sm:p-5">
          <div className="flex gap-4">
            <div className="mt-0.5 shrink-0">
              <motion.div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl border',
                  'bg-accent-primary/10 text-accent-primary border-accent-primary/20'
                )}
                whileHover={{ scale: 1.06, rotate: 4 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
              >
                <MessageCircle className="h-4 w-4" />
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2 gap-3">
                <Badge
                  variant="secondary"
                  className="bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-[10px] uppercase tracking-wider"
                >
                  {t('Chat')}
                </Badge>
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                  <Clock className="h-3 w-3" />
                  {new Date(session.updated_at * 1000).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <h3 className="truncate pr-4 text-sm font-bold text-text-primary uppercase tracking-tight transition-colors group-hover:text-accent-primary">
                {session.title}
              </h3>

              <div className="mt-2 flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-mono text-text-tertiary border border-border-subtle uppercase tracking-widest">
                  {session.message_count} MSG
                </span>
                {session.last_message && (
                  <p className="truncate text-sm text-text-secondary flex-1 leading-relaxed italic opacity-80">
                    "{session.last_message}"
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
                className="text-xs font-mono uppercase tracking-widest"
              >
                {t('Continue')}
              </Button>
            </div>

            <div className="self-center sm:hidden">
              <ChevronRight className="h-4 w-4 text-text-quaternary group-hover:text-accent-primary" />
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
        icon={<History className="w-5 h-5 text-accent-primary" />}
        actions={
          hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterType('all')
                setSearchQuery('')
              }}
              className="text-text-tertiary hover:text-accent-primary uppercase font-mono text-[10px] tracking-widest"
            >
              <X className="h-3 w-3 mr-1" />
              {t('Clear Filters')}
            </Button>
          ) : null
        }
      />

      {/* Controls */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
        <Card interactive={false} className="overflow-visible border-border bg-surface-base/50 backdrop-blur-sm">
          <CardBody className="p-4 sm:p-5">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full sm:max-w-md">
                <Input
                  placeholder={`${t('Search')}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-text-tertiary" />}
                  size="sm"
                  className="bg-surface-elevated border-border-subtle focus:border-accent-primary/40 font-mono text-xs uppercase tracking-tight"
                />
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                <div className="flex items-center gap-1">
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
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest',
                          'transition-all duration-200 ease-out-expo',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30',
                          isActive
                            ? 'border-accent-primary bg-accent-primary text-white shadow-sm'
                            : 'border-border-subtle bg-surface-elevated text-text-tertiary hover:border-border hover:text-text-secondary'
                        )}
                      >
                        <Icon className="h-3 w-3" />
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
            <Card interactive={false} className="py-20 border-border bg-surface-base/50">
              <CardBody className="flex flex-col items-center justify-center gap-4 text-sm text-text-tertiary font-mono uppercase tracking-widest">
                <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
                <span>{t('Loading')}</span>
              </CardBody>
            </Card>
          </motion.div>
        ) : timelineGroups.length === 0 ? (
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card interactive={false} className="py-20 border-border bg-surface-base/50">
              <CardBody className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-text-tertiary">
                  <History className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">
                  {t('No history found')}
                </h3>
                <p className="mt-1 text-xs text-text-tertiary uppercase tracking-tight font-mono">
                  {t('Your activities will appear here')}
                </p>
              </CardBody>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
            {timelineGroups.map(group => (
              <motion.section key={group.key} variants={itemVariants}>
                <div className="mb-6 flex items-center gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-1.5 shadow-glass-sm backdrop-blur-md">
                    <Calendar className="h-3.5 w-3.5 text-accent-primary" />
                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-[0.2em] font-mono">
                      {group.label}
                    </span>
                    <Badge variant="outline" className="ml-1 border-border-subtle bg-surface-base text-[10px] font-mono font-bold text-text-tertiary">
                      {group.items.length}
                    </Badge>
                  </div>
                  <div className="h-px flex-1 bg-border-subtle/50" />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-accent-primary/20 via-border-subtle to-transparent" />
                  <ol role="list" className="space-y-4">
                    {group.items.map(item => (
                      <li key={item.id} className="relative pl-10">
                        <div className="pointer-events-none absolute left-4 top-[24px] h-2 w-2 -translate-x-1/2 rounded-full bg-accent-primary ring-4 ring-surface shadow-sm" />

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
