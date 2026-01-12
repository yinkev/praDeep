'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Send,
  Loader2,
  Bot,
  User,
  Database,
  Globe,
  Calculator,
  FileText,
  Microscope,
  Lightbulb,
  Trash2,
  ExternalLink,
  BookOpen,
  Sparkles,
  Edit3,
  GraduationCap,
  PenTool,
  MessageCircle,
  Zap,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlobal } from '@/context/GlobalContext'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import { getTranslation } from '@/lib/i18n'
import PageWrapper from '@/components/ui/PageWrapper'
import Button, { IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

// ============================================================================
// Types
// ============================================================================

interface KnowledgeBase {
  name: string
  is_default?: boolean
}

interface RecentHistoryEntry {
  id: string
  timestamp: number
  type: string
  title: string
  summary?: string
  content?: any
}

interface ConversationStarter {
  id: string
  title: string
  prompt: string
  icon: React.ReactNode
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(20, 184, 166, 0.2)',
      '0 0 40px rgba(20, 184, 166, 0.3)',
      '0 0 20px rgba(20, 184, 166, 0.2)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

// ============================================================================
// Component
// ============================================================================

export default function HomePage() {
  const { chatState, setChatState, sendChatMessage, clearChatHistory, newChatSession, uiSettings } =
    useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)
  const toast = useToast()

  const [inputMessage, setInputMessage] = useState('')
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [conversationStarters, setConversationStarters] = useState<ConversationStarter[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch knowledge bases
  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        setKbs(data)
        if (!chatState.selectedKb) {
          const defaultKb = data.find((kb: KnowledgeBase) => kb.is_default)
          if (defaultKb) {
            setChatState(prev => ({ ...prev, selectedKb: defaultKb.name }))
          } else if (data.length > 0) {
            setChatState(prev => ({ ...prev, selectedKb: data[0].name }))
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch KBs:', err)
        toast.error('Failed to load knowledge bases')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch recent activity for conversation starters
  useEffect(() => {
    const starterIcons = [
      <Sparkles key="sparkles" className="w-4 h-4" />,
      <Lightbulb key="lightbulb" className="w-4 h-4" />,
      <BookOpen key="book" className="w-4 h-4" />,
      <GraduationCap key="grad" className="w-4 h-4" />,
      <Zap key="zap" className="w-4 h-4" />,
      <MessageCircle key="msg" className="w-4 h-4" />,
    ]

    const buildStarters = (
      knowledgeBases: KnowledgeBase[],
      researchEntries: RecentHistoryEntry[],
      solveEntries: RecentHistoryEntry[]
    ): ConversationStarter[] => {
      const starters: ConversationStarter[] = []
      let iconIndex = 0

      const latestResearch = researchEntries[0]
      if (latestResearch?.title) {
        starters.push({
          id: `research-summarize-${latestResearch.id}`,
          title: t('Summarize recent research'),
          prompt: `Summarize findings from my recent research on "${latestResearch.title}".`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        })
        starters.push({
          id: `research-quiz-${latestResearch.id}`,
          title: t('Quiz me on recent research'),
          prompt: `Quiz me on the key points from my recent research on "${latestResearch.title}".`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        })
      }

      const latestSolve = solveEntries[0]
      if (latestSolve?.title) {
        starters.push({
          id: `solve-explain-${latestSolve.id}`,
          title: t('Review my recent solve'),
          prompt: `Explain the solution approach and key steps for my recent problem: "${latestSolve.title}".`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        })
      }

      const sortedKbs = [...knowledgeBases].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return a.name.localeCompare(b.name)
      })

      for (const kb of sortedKbs.slice(0, 3)) {
        starters.push({
          id: `kb-quiz-${kb.name}`,
          title: t('Quiz me on a KB topic'),
          prompt: `Quiz me on ${kb.name}.`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        })
      }

      if (starters.length === 0) {
        starters.push(
          {
            id: 'generic-1',
            title: t('Ask for help'),
            prompt: 'Help me get started-what can you do in this app?',
            icon: starterIcons[0],
          },
          {
            id: 'generic-2',
            title: t('Make a plan'),
            prompt: 'Make me a short study plan for today.',
            icon: starterIcons[1],
          }
        )
      }

      return starters.slice(0, 6)
    }

    const fetchStarters = async () => {
      try {
        const [researchRes, solveRes] = await Promise.all([
          fetch(apiUrl('/api/v1/dashboard/recent?limit=5&type=research')),
          fetch(apiUrl('/api/v1/dashboard/recent?limit=5&type=solve')),
        ])

        const researchEntries = (await researchRes.json()) as RecentHistoryEntry[]
        const solveEntries = (await solveRes.json()) as RecentHistoryEntry[]

        setConversationStarters(buildStarters(kbs, researchEntries || [], solveEntries || []))
      } catch (err) {
        setConversationStarters(buildStarters(kbs, [], []))
      }
    }

    fetchStarters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbs, uiSettings.language])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatState.messages])

  const handleSend = () => {
    if (!inputMessage.trim() || chatState.isLoading) return
    sendChatMessage(inputMessage)
    setInputMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    newChatSession()
    toast.info('Started a new conversation')
  }

  const quickActions = [
    {
      icon: Calculator,
      label: t('Smart Problem Solving'),
      href: '/solver',
      color: 'teal',
      description: 'Multi-agent reasoning',
    },
    {
      icon: PenTool,
      label: t('Generate Practice Questions'),
      href: '/question',
      color: 'purple',
      description: 'Auto-validated quizzes',
    },
    {
      icon: Microscope,
      label: t('Deep Research Reports'),
      href: '/research',
      color: 'emerald',
      description: 'Comprehensive analysis',
    },
    {
      icon: Lightbulb,
      label: t('Generate Novel Ideas'),
      href: '/ideagen',
      color: 'amber',
      description: 'Brainstorm & synthesize',
    },
    {
      icon: GraduationCap,
      label: t('Guided Learning'),
      href: '/guide',
      color: 'indigo',
      description: 'Step-by-step tutoring',
    },
    {
      icon: Edit3,
      label: t('Co-Writer'),
      href: '/co_writer',
      color: 'pink',
      description: 'Collaborative writing',
    },
  ]

  const hasMessages = chatState.messages.length > 0

  // ============================================================================
  // Render: Welcome Screen (No Messages)
  // ============================================================================

  if (!hasMessages) {
    return (
      <PageWrapper maxWidth="2xl" showPattern={true} className="h-screen flex flex-col">
        <motion.div
          className="flex-1 flex flex-col items-center justify-center px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Animated Gradient Title */}
          <motion.div variants={fadeInUp} className="text-center max-w-2xl mx-auto mb-10">
            <motion.h1
              className="text-5xl md:text-6xl font-bold mb-4 tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #5EEAD4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear' as const,
              }}
            >
              {t('Welcome to praDeep')}
            </motion.h1>
            <motion.p
              className="text-xl text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t('How can I help you today?')}
            </motion.p>
          </motion.div>

          {/* Glassmorphism Input Box */}
          <motion.div variants={itemVariants} className="w-full max-w-2xl mx-auto mb-12">
            {/* Mode Toggles */}
            <motion.div
              className="flex items-center justify-between mb-4 px-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                {/* RAG Toggle */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setChatState(prev => ({
                      ...prev,
                      enableRag: !prev.enableRag,
                    }))
                  }
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    backdrop-blur-xl border
                    ${
                      chatState.enableRag
                        ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30 shadow-lg shadow-teal-500/10'
                        : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-white/30 dark:border-slate-700/30 hover:bg-white/70 dark:hover:bg-slate-800/70'
                    }
                  `}
                >
                  <Database className="w-4 h-4" />
                  {t('RAG')}
                </motion.button>

                {/* Web Search Toggle */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    setChatState(prev => ({
                      ...prev,
                      enableWebSearch: !prev.enableWebSearch,
                    }))
                  }
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    backdrop-blur-xl border
                    ${
                      chatState.enableWebSearch
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                        : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-white/30 dark:border-slate-700/30 hover:bg-white/70 dark:hover:bg-slate-800/70'
                    }
                  `}
                >
                  <Globe className="w-4 h-4" />
                  {t('Web Search')}
                </motion.button>
              </div>

              {/* KB Selector */}
              <AnimatePresence>
                {chatState.enableRag && (
                  <motion.select
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    value={chatState.selectedKb}
                    onChange={e =>
                      setChatState(prev => ({
                        ...prev,
                        selectedKb: e.target.value,
                      }))
                    }
                    className="text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-xl px-4 py-2 outline-none focus:border-teal-400/60 dark:text-slate-200 transition-all duration-300"
                  >
                    {kbs.map(kb => (
                      <option key={kb.name} value={kb.name}>
                        {kb.name}
                      </option>
                    ))}
                  </motion.select>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Glass Input Field */}
            <motion.div className="relative" animate={isFocused ? pulseGlow.animate : {}}>
              {/* Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-400/20 to-cyan-400/20 blur-xl -z-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: isFocused ? 1 : 0, scale: isFocused ? 1 : 0.95 }}
                transition={{ duration: 0.3 }}
              />

              <input
                ref={inputRef}
                type="text"
                className={`
                  w-full px-6 py-5 pr-16 rounded-2xl text-lg
                  bg-white/70 dark:bg-slate-800/70
                  backdrop-blur-xl backdrop-saturate-150
                  border-2 transition-all duration-300
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                  text-slate-800 dark:text-slate-100
                  shadow-xl shadow-slate-200/30 dark:shadow-slate-900/30
                  ${
                    isFocused
                      ? 'border-teal-400/60 dark:border-teal-500/60 bg-white/90 dark:bg-slate-800/90'
                      : 'border-white/50 dark:border-slate-700/50'
                  }
                  focus:outline-none
                `}
                placeholder={t('Ask anything...')}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={chatState.isLoading}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={chatState.isLoading || !inputMessage.trim()}
                className={`
                  absolute right-3 top-1/2 -translate-y-1/2
                  w-12 h-12 rounded-xl
                  flex items-center justify-center
                  transition-all duration-300
                  ${
                    inputMessage.trim()
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-slate-200/80 dark:bg-slate-700/80 text-slate-400'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {chatState.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Conversation Starters as Glass Cards */}
          {conversationStarters.length > 0 && (
            <motion.div
              variants={containerVariants}
              className="w-full max-w-3xl mx-auto mb-12"
              data-testid="conversation-starters"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <Sparkles className="w-4 h-4 text-teal-500" />
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('Conversation Starters')}
                </h3>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {conversationStarters.map((starter, index) => (
                  <motion.button
                    key={starter.id}
                    variants={itemVariants}
                    custom={index}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    data-testid={`conversation-starter-${starter.id}`}
                    onClick={() => {
                      setInputMessage(starter.prompt)
                      inputRef.current?.focus()
                    }}
                    className={`
                      text-left p-5 rounded-2xl
                      bg-white/50 dark:bg-slate-800/50
                      backdrop-blur-xl backdrop-saturate-150
                      border border-white/30 dark:border-slate-700/30
                      shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20
                      hover:bg-white/70 dark:hover:bg-slate-800/70
                      hover:border-teal-400/30 dark:hover:border-teal-500/30
                      hover:shadow-xl hover:shadow-teal-500/10
                      transition-all duration-300 group
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 group-hover:bg-teal-500/20 transition-colors">
                        {starter.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                          {starter.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {starter.prompt}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Actions Grid */}
          <motion.div variants={containerVariants} className="w-full max-w-4xl mx-auto">
            <motion.h3
              variants={itemVariants}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5 text-center"
            >
              {t('Explore Modules')}
            </motion.h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {quickActions.map((action, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Link href={action.href}>
                    <Card variant="glass" className="p-5 cursor-pointer group" hoverEffect={true}>
                      <div
                        className={`
                          w-12 h-12 rounded-xl mb-4
                          flex items-center justify-center
                          bg-gradient-to-br from-${action.color}-400/20 to-${action.color}-500/20
                          group-hover:from-${action.color}-400/30 group-hover:to-${action.color}-500/30
                          transition-all duration-300
                        `}
                      >
                        <action.icon
                          className={`w-6 h-6 text-${action.color}-500 dark:text-${action.color}-400`}
                        />
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">
                        {action.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {action.description}
                      </p>
                      <ArrowRight className="w-4 h-4 text-slate-400 mt-3 group-hover:text-teal-500 group-hover:translate-x-1 transition-all duration-300" />
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </PageWrapper>
    )
  }

  // ============================================================================
  // Render: Chat Interface (Has Messages)
  // ============================================================================

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Glassmorphism Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-3 border-b border-white/30 dark:border-slate-700/30 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          {/* Mode Toggles */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              setChatState(prev => ({
                ...prev,
                enableRag: !prev.enableRag,
              }))
            }
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300
              backdrop-blur-sm border
              ${
                chatState.enableRag
                  ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30'
                  : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 border-white/30 dark:border-slate-700/30'
              }
            `}
          >
            <Database className="w-3.5 h-3.5" />
            {t('RAG')}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              setChatState(prev => ({
                ...prev,
                enableWebSearch: !prev.enableWebSearch,
              }))
            }
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300
              backdrop-blur-sm border
              ${
                chatState.enableWebSearch
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-white/50 dark:bg-slate-800/50 text-slate-500 border-white/30 dark:border-slate-700/30'
              }
            `}
          >
            <Globe className="w-3.5 h-3.5" />
            {t('Web Search')}
          </motion.button>

          <AnimatePresence>
            {chatState.enableRag && (
              <motion.select
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                value={chatState.selectedKb}
                onChange={e =>
                  setChatState(prev => ({
                    ...prev,
                    selectedKb: e.target.value,
                  }))
                }
                className="text-xs bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-lg px-3 py-1.5 outline-none dark:text-slate-200 transition-all"
              >
                {kbs.map(kb => (
                  <option key={kb.name} value={kb.name}>
                    {kb.name}
                  </option>
                ))}
              </motion.select>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          iconLeft={<Trash2 className="w-3.5 h-3.5" />}
          className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t('New Chat')}
        </Button>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence mode="popLayout">
            {chatState.messages.map((msg, idx) => (
              <motion.div
                key={idx}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="flex gap-4"
              >
                {msg.role === 'user' ? (
                  <>
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 dark:border-slate-600/30">
                      <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </div>
                    {/* User Message Bubble */}
                    <div
                      className={`
                        flex-1 px-5 py-4 rounded-2xl rounded-tl-md
                        bg-slate-100/80 dark:bg-slate-700/80
                        backdrop-blur-sm
                        border border-white/30 dark:border-slate-600/30
                        text-slate-800 dark:text-slate-200
                      `}
                    >
                      {msg.content}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Bot Avatar */}
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30"
                      animate={msg.isStreaming ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 1, repeat: msg.isStreaming ? Infinity : 0 }}
                    >
                      <Bot className="w-5 h-5 text-white" />
                    </motion.div>
                    {/* Bot Message Bubble */}
                    <div className="flex-1 space-y-3">
                      <div
                        className={`
                          px-5 py-4 rounded-2xl rounded-tl-md
                          bg-white/70 dark:bg-slate-800/70
                          backdrop-blur-xl backdrop-saturate-150
                          border border-white/50 dark:border-slate-700/50
                          shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30
                        `}
                      >
                        <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {processLatexContent(msg.content)}
                          </ReactMarkdown>
                        </div>

                        {/* Streaming Indicator */}
                        {msg.isStreaming && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 mt-4 text-teal-600 dark:text-teal-400 text-sm"
                          >
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t('Generating response...')}</span>
                          </motion.div>
                        )}
                      </div>

                      {/* Sources */}
                      {msg.sources &&
                        (msg.sources.rag?.length ?? 0) + (msg.sources.web?.length ?? 0) > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2"
                          >
                            {msg.sources.rag?.map((source, i) => (
                              <div
                                key={`rag-${i}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 backdrop-blur-sm text-teal-600 dark:text-teal-400 rounded-lg text-xs border border-teal-500/20"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>{source.kb_name}</span>
                              </div>
                            ))}
                            {msg.sources.web?.slice(0, 3).map((source, i) => (
                              <a
                                key={`web-${i}`}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 backdrop-blur-sm text-emerald-600 dark:text-emerald-400 rounded-lg text-xs border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                              >
                                <Globe className="w-3 h-3" />
                                <span className="max-w-[150px] truncate">
                                  {source.title || source.url}
                                </span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </motion.div>
                        )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Status Indicator */}
          <AnimatePresence>
            {chatState.isLoading && chatState.currentStage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-4"
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/30"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </motion.div>
                <div
                  className={`
                    flex-1 px-5 py-4 rounded-2xl rounded-tl-md
                    bg-white/50 dark:bg-slate-800/50
                    backdrop-blur-xl
                    border border-white/30 dark:border-slate-700/30
                  `}
                >
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                    </span>
                    {chatState.currentStage === 'rag' && t('Searching knowledge base...')}
                    {chatState.currentStage === 'web' && t('Searching the web...')}
                    {chatState.currentStage === 'generating' && t('Generating response...')}
                    {!['rag', 'web', 'generating'].includes(chatState.currentStage) &&
                      chatState.currentStage}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Glassmorphism Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-white/30 dark:border-slate-700/30 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl px-6 py-4"
      >
        <div className="max-w-4xl mx-auto relative">
          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/10 to-cyan-400/10 blur-xl -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          <input
            ref={inputRef}
            type="text"
            className={`
              w-full px-5 py-4 pr-14 rounded-xl
              bg-white/80 dark:bg-slate-700/80
              backdrop-blur-sm
              border transition-all duration-300
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              text-slate-800 dark:text-slate-200
              ${
                isFocused
                  ? 'border-teal-400/60 dark:border-teal-500/60 shadow-lg shadow-teal-500/10'
                  : 'border-white/50 dark:border-slate-600/50'
              }
              focus:outline-none
            `}
            placeholder={t('Type your message...')}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={chatState.isLoading}
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={chatState.isLoading || !inputMessage.trim()}
            className={`
              absolute right-2 top-1/2 -translate-y-1/2
              w-10 h-10 rounded-lg
              flex items-center justify-center
              transition-all duration-300
              ${
                inputMessage.trim()
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-slate-200/80 dark:bg-slate-600/80 text-slate-400'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {chatState.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
