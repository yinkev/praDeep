'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Send,
  Loader2,
  Bot,
  User,
  Database,
  Globe,
  Calculator,
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
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useGlobal } from '@/context/GlobalContext'
import { apiUrl } from '@/lib/api'
import { parseKnowledgeBaseList, type KnowledgeBaseListItem } from '@/lib/knowledge'
import { processLatexContent } from '@/lib/latex'
import { getTranslation } from '@/lib/i18n'
import PageWrapper from '@/components/ui/PageWrapper'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

// ============================================================================
// Types
// ============================================================================

interface RecentHistoryEntry {
  id: string
  timestamp: number
  type: string
  title: string
  summary?: string
  content?: unknown
}

interface ConversationStarter {
  id: string
  title: string
  prompt: string
  icon: React.ReactNode
}

type WelcomeSection = 'hero' | 'starters' | 'modules'

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
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
      stiffness: 350,
      damping: 30,
      mass: 0.8,
    },
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

const headlineVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.08,
    },
  },
}

const headlineLineVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    clipPath: 'inset(0 0 100% 0)',
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0 0 0% 0)',
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

const messageVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
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
    scale: 0.98,
    transition: { duration: 0.15 },
  },
}

// ============================================================================
// Component
// ============================================================================

export default function HomePage() {
  const { chatState, setChatState, sendChatMessage, newChatSession, uiSettings } = useGlobal()
  const t = useCallback(
    (key: string) => getTranslation(uiSettings.language, key),
    [uiSettings.language]
  )
  const toast = useToast()

  const [inputMessage, setInputMessage] = useState('')
  const [kbs, setKbs] = useState<KnowledgeBaseListItem[]>([])
  const [conversationStarters, setConversationStarters] = useState<ConversationStarter[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatPanelRef = useRef<HTMLDivElement>(null)
  const modulesRef = useRef<HTMLDivElement>(null)
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const startersSectionRef = useRef<HTMLElement | null>(null)
  const scrollRootRef = useRef<HTMLElement | null>(null)
  const sectionRatiosRef = useRef<Record<WelcomeSection, number>>({
    hero: 0,
    starters: 0,
    modules: 0,
  })

  const shouldReduceMotion = useReducedMotion()
  const [activeWelcomeSection, setActiveWelcomeSection] = useState<WelcomeSection>('hero')
  const [revealedWelcomeSections, setRevealedWelcomeSections] = useState<
    Record<WelcomeSection, boolean>
  >({
    hero: true,
    starters: false,
    modules: false,
  })

  useLayoutEffect(() => {
    scrollRootRef.current = document.getElementById('app-scroll')
  }, [])

  const { scrollYProgress: pageScrollProgress } = useScroll({ container: scrollRootRef })
  const pageScrollProgressSpring = useSpring(pageScrollProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  })

  const backgroundGridY = useTransform(pageScrollProgressSpring, [0, 1], [0, 120])
  const backgroundGridOpacity = useTransform(pageScrollProgressSpring, [0, 0.22], [0.32, 0.18])

  const { scrollYProgress: heroScrollProgress } = useScroll({
    container: scrollRootRef,
    target: heroSectionRef,
    offset: ['start start', 'end start'],
  })

  const heroCopyY = useTransform(heroScrollProgress, [0, 1], [0, 72])
  const heroCopyOpacity = useTransform(heroScrollProgress, [0, 0.85], [1, 0])
  const heroCopyScale = useTransform(heroScrollProgress, [0, 1], [1, 0.98])
  const heroPanelY = useTransform(heroScrollProgress, [0, 1], [0, -48])
  const heroOrbTopParallaxY = useTransform(heroScrollProgress, [0, 1], [0, 140])
  const heroOrbBottomParallaxY = useTransform(heroScrollProgress, [0, 1], [0, -120])

  // Fetch knowledge bases
  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        const knowledgeBases = parseKnowledgeBaseList(data)
        setKbs(knowledgeBases)
        setChatState(prev => {
          if (prev.selectedKb) return prev

          const defaultKb = knowledgeBases.find(kb => kb.is_default)
          if (defaultKb) return { ...prev, selectedKb: defaultKb.name }
          if (knowledgeBases.length > 0) return { ...prev, selectedKb: knowledgeBases[0].name }
          return prev
        })
      })
      .catch(err => {
        console.error('Failed to fetch KBs:', err)
        toast.error('Failed to load knowledge bases')
      })
  }, [setChatState, toast])

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
      knowledgeBases: KnowledgeBaseListItem[],
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
  }, [kbs, t])

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
      description: 'Multi-agent reasoning',
    },
    {
      icon: PenTool,
      label: t('Generate Practice Questions'),
      href: '/question',
      description: 'Auto-validated quizzes',
    },
    {
      icon: Microscope,
      label: t('Deep Research Reports'),
      href: '/research',
      description: 'Comprehensive analysis',
    },
    {
      icon: Lightbulb,
      label: t('Generate Novel Ideas'),
      href: '/ideagen',
      description: 'Brainstorm & synthesize',
    },
    {
      icon: GraduationCap,
      label: t('Guided Learning'),
      href: '/guide',
      description: 'Step-by-step tutoring',
    },
    {
      icon: Edit3,
      label: t('Co-Writer'),
      href: '/co_writer',
      description: 'Collaborative writing',
    },
  ]

  const hasMessages = chatState.messages.length > 0
  const focusChat = () => {
    chatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const scrollToModules = () => {
    modulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToWelcomeSection = (section: WelcomeSection) => {
    if (section === 'modules') {
      modulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (section === 'starters') {
      startersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    heroSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    if (hasMessages) return

    if (shouldReduceMotion) return

    const observedSections: Array<{ key: WelcomeSection; element: HTMLElement }> = []
    if (heroSectionRef.current) {
      observedSections.push({ key: 'hero', element: heroSectionRef.current })
    }

    if (conversationStarters.length > 0 && startersSectionRef.current) {
      observedSections.push({ key: 'starters', element: startersSectionRef.current })
    } else {
      sectionRatiosRef.current.starters = 0
    }

    if (modulesRef.current) {
      observedSections.push({ key: 'modules', element: modulesRef.current })
    }

    if (observedSections.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const ratios = sectionRatiosRef.current
        const toReveal: WelcomeSection[] = []

        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.welcomeSection as
            | WelcomeSection
            | undefined
          if (!key) continue

          const ratio = entry.isIntersecting ? entry.intersectionRatio : 0
          ratios[key] = ratio

          if (entry.isIntersecting && ratio >= 0.22) {
            toReveal.push(key)
          }
        }

        if (toReveal.length > 0) {
          setRevealedWelcomeSections(prev => {
            let next = prev
            for (const key of toReveal) {
              if (!next[key]) {
                next = { ...next, [key]: true }
              }
            }
            return next
          })
        }

        let bestSection: WelcomeSection | null = null
        let bestRatio = 0

        for (const [key, ratio] of Object.entries(ratios) as Array<[WelcomeSection, number]>) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestSection = key
          }
        }

        if (bestSection && bestRatio >= 0.12) {
          setActiveWelcomeSection(bestSection)
        }
      },
      {
        root: scrollRootRef.current,
        threshold: [0.12, 0.22, 0.35, 0.5, 0.65],
        rootMargin: '-35% 0px -55% 0px',
      }
    )

    for (const section of observedSections) {
      observer.observe(section.element)
    }

    return () => observer.disconnect()
  }, [conversationStarters.length, hasMessages, shouldReduceMotion])

  // ============================================================================
  // Render: Welcome Screen (No Messages)
  // ============================================================================

  if (!hasMessages) {
    return (
      <div className="relative min-h-dvh overflow-x-hidden bg-surface dark:bg-zinc-950">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_72%)] bg-[linear-gradient(to_right,rgba(24,24,27,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.07)_1px,transparent_1px)] bg-[length:56px_56px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
          style={{
            y: shouldReduceMotion ? 0 : backgroundGridY,
            opacity: shouldReduceMotion ? 0.22 : backgroundGridOpacity,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_55%)]"
        />

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2"
          style={{ y: shouldReduceMotion ? 0 : heroOrbTopParallaxY }}
        >
          <motion.div
            className="h-full w-full rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/15"
            animate={{ y: [0, 18, 0], opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-56 left-8 h-[520px] w-[520px]"
          style={{ y: shouldReduceMotion ? 0 : heroOrbBottomParallaxY }}
        >
          <motion.div
            className="h-full w-full rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10"
            animate={{ y: [0, -12, 0], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        <div className="sticky top-0 z-40">
          <div className="border-b border-border bg-surface-elevated/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/55">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative flex max-w-full items-center gap-1 rounded-full border border-border bg-surface-elevated/70 p-1 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  <motion.button
                    type="button"
                    onClick={() => scrollToWelcomeSection('hero')}
                    whileHover={{ y: -1, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    aria-current={activeWelcomeSection === 'hero' ? 'page' : undefined}
                    className="relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary dark:text-zinc-200 dark:hover:text-zinc-50"
                  >
                    {activeWelcomeSection === 'hero' && (
                      <motion.span
                        layoutId="welcomeNavActive"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute inset-0 rounded-full bg-surface-elevated/90 shadow-sm dark:bg-zinc-950/60"
                      />
                    )}
                    <span className="relative">{t('Overview')}</span>
                  </motion.button>

                  {conversationStarters.length > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => scrollToWelcomeSection('starters')}
                      whileHover={{ y: -1, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      aria-current={activeWelcomeSection === 'starters' ? 'page' : undefined}
                      className="relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary dark:text-zinc-200 dark:hover:text-zinc-50"
                    >
                      {activeWelcomeSection === 'starters' && (
                        <motion.span
                          layoutId="welcomeNavActive"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          className="absolute inset-0 rounded-full bg-surface-elevated/90 shadow-sm dark:bg-zinc-950/60"
                        />
                      )}
                      <span className="relative">{t('Conversation Starters')}</span>
                    </motion.button>
                  )}

                  <motion.button
                    type="button"
                    onClick={() => scrollToWelcomeSection('modules')}
                    whileHover={{ y: -1, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    aria-current={activeWelcomeSection === 'modules' ? 'page' : undefined}
                    className="relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary dark:text-zinc-200 dark:hover:text-zinc-50"
                  >
                    {activeWelcomeSection === 'modules' && (
                      <motion.span
                        layoutId="welcomeNavActive"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        className="absolute inset-0 rounded-full bg-surface-elevated/90 shadow-sm dark:bg-zinc-950/60"
                      />
                    )}
                    <span className="relative">{t('Explore modules')}</span>
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-text-tertiary sm:inline dark:text-zinc-400">
                  {t('Scroll')}
                </span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border dark:bg-white/10">
                  <motion.div
                    className="h-full origin-left bg-gradient-to-r from-accent-primary to-accent-primary"
                    style={{ scaleX: pageScrollProgressSpring }}
                  />
                </div>
              </div>
            </div>

            <motion.div
              className="h-[2px] origin-left bg-gradient-to-r from-accent-primary via-accent-primary to-accent-primary"
              style={{ scaleX: pageScrollProgressSpring }}
            />
          </div>
        </div>

        <PageWrapper maxWidth="full" showPattern={false} className="min-h-dvh px-0 py-0">
          <motion.main
            className="relative mx-auto max-w-6xl px-6 pb-22 pt-14 sm:px-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.section
              ref={heroSectionRef}
              data-welcome-section="hero"
              className="relative min-h-[110vh] scroll-mt-28"
            >
              <motion.div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
                {/* Hero */}
                <motion.div
                  className="pt-4 lg:pt-10"
                  style={{
                    y: shouldReduceMotion ? 0 : heroCopyY,
                    opacity: shouldReduceMotion ? 1 : heroCopyOpacity,
                    scale: shouldReduceMotion ? 1 : heroCopyScale,
                  }}
                >
                  <motion.div
                    variants={fadeInUp}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/70 px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                    <span>{t('Your personal research + tutoring workspace')}</span>
                  </motion.div>

                  <motion.h1
                    variants={headlineVariants}
                    className="mt-6 font-display text-display text-text-primary dark:text-zinc-50"
                  >
                    <motion.span
                      variants={headlineLineVariants}
                      className="block font-headline tracking-headline-tight"
                    >
                      {t('Think deeper.')}
                    </motion.span>
                    <motion.span
                      variants={headlineLineVariants}
                      className="block font-hero tracking-headline"
                    >
                      <span className="bg-gradient-to-r from-accent-primary via-accent-primary to-accent-primary bg-clip-text text-transparent bg-[length:200%_200%] motion-safe:hover:animate-type-shimmer dark:from-accent-primary dark:via-accent-primary dark:to-accent-primary">
                        {t('Learn faster.')}
                      </span>
                    </motion.span>
                  </motion.h1>

                  <motion.p variants={fadeInUp} className="mt-5 max-w-xl type-lede">
                    {t(
                      'Chat with grounded context (RAG), pull web sources when needed, and jump into focused modules for solving, research, and guided learning.'
                    )}
                  </motion.p>

                  <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={focusChat}
                      iconRight={<ArrowRight className="h-5 w-5" />}
                    >
                      {t('Start chatting')}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={scrollToModules}
                      className="dark:text-zinc-100 dark:border-white/20 dark:hover:bg-white/10 dark:active:bg-white/10"
                    >
                      {t('Explore modules')}
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={fadeInUp}
                    className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <Card
                      variant="glass"
                      padding="sm"
                      interactive={false}
                      className="flex items-center gap-3 border-border bg-surface-elevated/50 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-accent-primary dark:bg-blue-500/15 dark:text-blue-300">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary dark:text-zinc-50">
                          {t('Grounded')}
                        </div>
                        <div className="text-xs text-text-tertiary dark:text-zinc-400">
                          {t('Use your knowledge base')}
                        </div>
                      </div>
                    </Card>
                    <Card
                      variant="glass"
                      padding="sm"
                      interactive={false}
                      className="flex items-center gap-3 border-border bg-surface-elevated/50 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-accent-primary dark:bg-blue-500/15 dark:text-blue-300">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary dark:text-zinc-50">
                          {t('Connected')}
                        </div>
                        <div className="text-xs text-text-tertiary dark:text-zinc-400">
                          {t('Optional web search')}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Chat Panel */}
                <motion.div
                  variants={itemVariants}
                  ref={chatPanelRef}
                  className="lg:pt-6"
                  style={{ y: shouldReduceMotion ? 0 : heroPanelY }}
                >
                  <Card
                    variant="glass"
                    padding="lg"
                    interactive={false}
                    className="relative overflow-hidden border-border bg-surface-elevated/40 dark:border-white/10 dark:bg-white/5"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]"
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-text-primary dark:text-zinc-50">
                            {t('Chat with praDeep')}
                          </div>
                          <div className="mt-1 text-xs text-text-tertiary dark:text-zinc-400">
                            {t('RAG + web search, with math rendering.')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04, y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() =>
                              setChatState(prev => ({
                                ...prev,
                                enableRag: !prev.enableRag,
                              }))
                            }
                            aria-pressed={chatState.enableRag}
                            className={`
                            inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium
                            transition-all duration-300 ease-out will-change-transform
                            ${
                              chatState.enableRag
                                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/20 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                                : 'border-border bg-surface-elevated/70 text-text-secondary hover:bg-surface-elevated/90 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10'
                            }
	                          `}
                          >
                            <motion.div
                              animate={
                                chatState.enableRag ? { rotate: 360, scale: [1, 1.1, 1] } : {}
                              }
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            >
                              <Database className="h-3.5 w-3.5" />
                            </motion.div>
                            {t('RAG')}
                          </motion.button>

                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04, y: -1 }}
                            whileTap={{ scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() =>
                              setChatState(prev => ({
                                ...prev,
                                enableWebSearch: !prev.enableWebSearch,
                              }))
                            }
                            aria-pressed={chatState.enableWebSearch}
                            className={`
                            inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium
                            transition-all duration-300 ease-out will-change-transform
                            ${
                              chatState.enableWebSearch
                                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/20 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                                : 'border-border bg-surface-elevated/70 text-text-secondary hover:bg-surface-elevated/90 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10'
                            }
	                          `}
                          >
                            <motion.div
                              animate={
                                chatState.enableWebSearch ? { rotate: 360, scale: [1, 1.1, 1] } : {}
                              }
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </motion.div>
                            {t('Web')}
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
                                aria-label={t('Knowledge base')}
                                className="h-8 rounded-lg border border-border bg-surface-elevated/70 px-3 text-xs text-text-primary outline-none backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100"
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
                      </div>

                      <div className="mt-5">
                        <div className="relative">
                          <motion.div
                            animate={
                              isFocused
                                ? {
                                    boxShadow:
                                      '0 0 0 4px rgba(59, 130, 246, 0.12), 0 8px 16px -4px rgba(59, 130, 246, 0.1)',
                                  }
                                : { boxShadow: '0 0 0 0px rgba(59, 130, 246, 0)' }
                            }
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="rounded-2xl"
                          >
                            <input
                              ref={inputRef}
                              type="text"
                              className={`
	                            w-full rounded-2xl border px-5 py-4 pr-14 text-base
	                            bg-surface-elevated/70 backdrop-blur-md
	                            placeholder:text-text-tertiary text-text-primary
	                            dark:bg-zinc-950/50 dark:placeholder:text-text-tertiary dark:text-zinc-100
	                            ${
                                isFocused
                                  ? 'border-blue-400/70 dark:border-blue-400/60'
                                  : 'border-border hover:border-border-hover dark:border-white/10 dark:hover:border-white/20'
                              }
	                            focus:outline-none
	                            shadow-glass-sm
	                            transition-colors duration-250
	                          `}
                              aria-label={t('Message')}
                              placeholder={t('Ask anything...')}
                              value={inputMessage}
                              onChange={e => setInputMessage(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => setIsFocused(false)}
                              disabled={chatState.isLoading}
                              autoComplete="off"
                            />
                          </motion.div>

                          <motion.button
                            type="button"
                            whileHover={
                              inputMessage.trim()
                                ? { scale: 1.05, rotate: [0, -5, 5, 0] }
                                : { scale: 1.02 }
                            }
                            whileTap={{ scale: 0.95 }}
                            animate={
                              inputMessage.trim() && !chatState.isLoading
                                ? {
                                    boxShadow: [
                                      '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
                                      '0 12px 24px -4px rgba(59, 130, 246, 0.4)',
                                      '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
                                    ],
                                  }
                                : { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
                            }
                            transition={{
                              boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                            }}
                            onClick={handleSend}
                            disabled={chatState.isLoading || !inputMessage.trim()}
                            aria-label={t('Send message')}
                            className={`
	                            absolute right-2.5 top-1/2 -translate-y-1/2
	                            flex h-11 w-11 items-center justify-center rounded-xl
	                            transition-all duration-300 ease-out will-change-transform
	                            ${
                                inputMessage.trim()
                                  ? 'bg-accent-primary text-white'
                                  : 'bg-surface-elevated/70 text-text-tertiary dark:bg-white/5 dark:text-text-tertiary'
                              }
	                            disabled:opacity-50 disabled:cursor-not-allowed
	                          `}
                          >
                            {chatState.isLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <motion.div
                                animate={inputMessage.trim() ? { x: [0, 2, 0] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              >
                                <Send className="h-5 w-5" />
                              </motion.div>
                            )}
                          </motion.button>
                        </div>

                        {conversationStarters.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {conversationStarters.slice(0, 3).map(starter => (
                              <motion.button
                                key={starter.id}
                                type="button"
                                whileHover={{
                                  y: -2,
                                  scale: 1.02,
                                  boxShadow: '0 4px 12px -2px rgba(59, 130, 246, 0.2)',
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                onClick={() => {
                                  setInputMessage(starter.prompt)
                                  inputRef.current?.focus()
                                }}
                                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/60 px-3 py-1.5 text-xs text-text-secondary backdrop-blur-md transition-colors duration-200 hover:bg-surface-elevated/80 hover:text-text-primary will-change-transform dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-zinc-50"
                              >
                                <motion.span
                                  className="text-accent-primary"
                                  whileHover={{ rotate: [0, -10, 10, 0] }}
                                  transition={{ duration: 0.4 }}
                                >
                                  {starter.icon}
                                </motion.span>
                                <span className="max-w-[220px] truncate">{starter.title}</span>
                              </motion.button>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary dark:text-zinc-400">
                          <span>{t('Press Enter to send')}</span>
                          <span className="hidden sm:inline">{t('Private by default')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </motion.section>

            {/* Conversation Starters */}
            {conversationStarters.length > 0 && (
              <motion.section
                variants={containerVariants}
                ref={startersSectionRef}
                data-welcome-section="starters"
                initial={shouldReduceMotion ? 'visible' : 'hidden'}
                animate={
                  shouldReduceMotion || revealedWelcomeSections.starters ? 'visible' : 'hidden'
                }
                className="mt-16 scroll-mt-28"
                data-testid="conversation-starters"
              >
                <motion.div variants={itemVariants} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary dark:text-zinc-400">
                    {t('Conversation Starters')}
                  </h2>
                </motion.div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {conversationStarters.map((starter, index) => (
                    <motion.button
                      key={starter.id}
                      variants={itemVariants}
                      custom={index}
                      whileHover={{
                        y: -4,
                        scale: 1.01,
                        transition: { type: 'spring', stiffness: 400, damping: 25 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      data-testid={`conversation-starter-${starter.id}`}
                      onClick={() => {
                        setInputMessage(starter.prompt)
                        focusChat()
                      }}
                      className="group text-left will-change-transform"
                    >
                      <Card
                        variant="glass"
                        padding="md"
                        className="h-full border-border bg-surface-elevated/40 transition-all duration-300 ease-out group-hover:border-blue-200/50 group-hover:bg-surface-elevated/60 group-hover:shadow-lg group-hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-blue-400/30 dark:group-hover:bg-white/8"
                      >
                        <div className="flex items-start gap-3">
                          <motion.div
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-accent-primary transition-all duration-300 ease-out group-hover:bg-blue-100 group-hover:shadow-md group-hover:shadow-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:group-hover:bg-blue-500/25"
                            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                            transition={{ duration: 0.4 }}
                          >
                            {starter.icon}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-text-primary transition-colors duration-200 group-hover:text-accent-primary dark:text-zinc-50 dark:group-hover:text-blue-300">
                              {starter.title}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs text-text-tertiary dark:text-zinc-400">
                              {starter.prompt}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.button>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Modules / Feature Cards */}
            <motion.section
              ref={modulesRef}
              variants={containerVariants}
              data-welcome-section="modules"
              initial={shouldReduceMotion ? 'visible' : 'hidden'}
              animate={shouldReduceMotion || revealedWelcomeSections.modules ? 'visible' : 'hidden'}
              className="mt-16 scroll-mt-28"
            >
              <motion.div variants={itemVariants} className="flex items-end justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-text-primary dark:text-zinc-50">
                    {t('Explore modules')}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary dark:text-zinc-300">
                    {t('Purpose-built tools for solving, research, and learning workflows.')}
                  </p>
                </div>
              </motion.div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    whileHover={{
                      y: -4,
                      scale: 1.01,
                      transition: { type: 'spring', stiffness: 400, damping: 25 },
                    }}
                    className="will-change-transform"
                  >
                    <Link href={action.href} prefetch={true} className="group block h-full">
                      <Card
                        variant="glass"
                        padding="md"
                        className="h-full border-border bg-surface-elevated/40 transition-all duration-300 ease-out group-hover:border-blue-200/50 group-hover:bg-surface-elevated/60 group-hover:shadow-lg group-hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-blue-400/30 dark:group-hover:bg-white/8"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <motion.div
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-accent-primary transition-all duration-300 ease-out group-hover:bg-blue-100 group-hover:shadow-md group-hover:shadow-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:group-hover:bg-blue-500/25"
                            whileHover={{
                              rotate: [0, -8, 8, 0],
                              scale: 1.1,
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          >
                            <action.icon className="h-5 w-5" />
                          </motion.div>
                          <motion.div
                            className="mt-1"
                            whileHover={{ x: 3, scale: 1.15 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          >
                            <ArrowRight className="h-4 w-4 text-text-tertiary transition-colors duration-300 ease-out group-hover:text-accent-primary dark:text-text-tertiary dark:group-hover:text-accent-primary" />
                          </motion.div>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-text-primary transition-colors duration-200 group-hover:text-accent-primary dark:text-zinc-50 dark:group-hover:text-blue-300">
                            {action.label}
                          </h3>
                          <p className="mt-1 text-xs text-text-secondary dark:text-zinc-300">
                            {action.description}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </motion.main>
        </PageWrapper>
      </div>
    )
  }

  // ============================================================================
  // Render: Chat Interface (Has Messages)
  // ============================================================================

  return (
    <div className="relative h-dvh overflow-hidden bg-surface dark:bg-zinc-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)] bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[length:56px_56px] dark:opacity-20 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.06),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_55%)]"
      />
      <PageWrapper maxWidth="full" showPattern={false} className="h-dvh px-0 py-0">
        <div className="relative flex h-dvh flex-col">
          {/* Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative border-b border-border bg-surface-elevated/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60"
          >
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-6 py-3">
              <div className="flex items-center gap-3">
                {/* Mode Toggles */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() =>
                    setChatState(prev => ({
                      ...prev,
                      enableRag: !prev.enableRag,
                    }))
                  }
                  aria-pressed={chatState.enableRag}
                  className={`
	                    flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-out will-change-transform
	                    ${
                        chatState.enableRag
                          ? 'bg-blue-50 text-accent-primary border-blue-200 shadow-sm shadow-blue-500/20 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                          : 'bg-surface-elevated/70 text-text-secondary border-border hover:bg-surface-elevated/90 dark:bg-white/5 dark:text-zinc-200 dark:border-white/10 dark:hover:bg-white/10'
                      }
	                  `}
                >
                  <motion.div
                    animate={chatState.enableRag ? { rotate: 360, scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    <Database className="h-3.5 w-3.5" />
                  </motion.div>
                  {t('RAG')}
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() =>
                    setChatState(prev => ({
                      ...prev,
                      enableWebSearch: !prev.enableWebSearch,
                    }))
                  }
                  aria-pressed={chatState.enableWebSearch}
                  className={`
	                    flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-out will-change-transform
	                    ${
                        chatState.enableWebSearch
                          ? 'bg-blue-50 text-accent-primary border-blue-200 shadow-sm shadow-blue-500/20 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                          : 'bg-surface-elevated/70 text-text-secondary border-border hover:bg-surface-elevated/90 dark:bg-white/5 dark:text-zinc-200 dark:border-white/10 dark:hover:bg-white/10'
                      }
	                  `}
                >
                  <motion.div
                    animate={chatState.enableWebSearch ? { rotate: 360, scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    <Globe className="h-3.5 w-3.5" />
                  </motion.div>
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
                      aria-label={t('Knowledge base')}
                      className="h-8 rounded-lg border border-border bg-surface-elevated/70 px-3 text-xs text-text-primary outline-none backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100"
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
                iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                className="text-text-secondary hover:text-red-600 hover:bg-red-50 dark:text-zinc-300 dark:hover:text-red-300 dark:hover:bg-red-500/10"
              >
                {t('New Chat')}
              </Button>
            </div>
          </motion.div>

          {/* Messages Area */}
          <div className="relative flex-1 overflow-y-auto px-6 py-7 sm:px-8">
            <div className="mx-auto max-w-4xl space-y-7">
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
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated dark:bg-zinc-800">
                          <User className="h-5 w-5 text-text-secondary dark:text-zinc-200" />
                        </div>

                        {/* User Message Bubble */}
                        <Card
                          variant="glass"
                          padding="none"
                          interactive={false}
                          className="flex-1 !rounded-2xl !rounded-tl-md border-border bg-surface-elevated/60 px-5 py-4 text-text-primary shadow-glass-sm dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100"
                        >
                          {msg.content}
                        </Card>
                      </>
                    ) : (
                      <>
                        {/* Bot Avatar */}
                        <motion.div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/25"
                          animate={msg.isStreaming ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 1, repeat: msg.isStreaming ? Infinity : 0 }}
                        >
                          <Bot className="h-5 w-5 text-white" />
                        </motion.div>

                        {/* Bot Message Bubble */}
                        <div className="flex-1 space-y-3">
                          <Card
                            variant="glass"
                            padding="none"
                            interactive={false}
                            className="!rounded-2xl !rounded-tl-md border-border bg-surface-elevated/55 px-5 py-4 shadow-glass-sm dark:border-white/10 dark:bg-zinc-950/55"
                          >
                            <div className="prose prose-zinc prose-sm max-w-none text-text-primary dark:text-zinc-100">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {processLatexContent(msg.content)}
                              </ReactMarkdown>
                            </div>

                            {/* Streaming Indicator */}
                            {msg.isStreaming && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 flex items-center gap-2 text-sm text-accent-primary dark:text-blue-300"
                              >
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t('Generating response...')}</span>
                              </motion.div>
                            )}
                          </Card>

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
                                    className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-accent-primary dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200"
                                  >
                                    <BookOpen className="h-3 w-3" />
                                    <span>{source.kb_name}</span>
                                  </div>
                                ))}
                                {msg.sources.web?.slice(0, 3).map((source, i) => (
                                  <a
                                    key={`web-${i}`}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated/60 px-3 py-1.5 text-xs text-text-secondary backdrop-blur-md transition-colors duration-300 ease-out hover:bg-surface-elevated/80 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                                  >
                                    <Globe className="h-3 w-3" />
                                    <span className="max-w-[150px] truncate">
                                      {source.title || source.url}
                                    </span>
                                    <ExternalLink className="h-3 w-3" />
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/25"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </motion.div>
                    <Card
                      variant="glass"
                      padding="none"
                      interactive={false}
                      className="flex-1 !rounded-2xl !rounded-tl-md border-border bg-surface-elevated/55 px-5 py-4 shadow-glass-sm dark:border-white/10 dark:bg-zinc-950/55"
                    >
                      <div className="flex items-center gap-3 text-sm text-text-secondary dark:text-zinc-300">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                        </span>
                        {chatState.currentStage === 'rag' && t('Searching knowledge base...')}
                        {chatState.currentStage === 'web' && t('Searching the web...')}
                        {chatState.currentStage === 'generating' && t('Generating response...')}
                        {!['rag', 'web', 'generating'].includes(chatState.currentStage) &&
                          chatState.currentStage}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative border-t border-border bg-surface-elevated/75 px-6 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60"
          >
            <div className="relative mx-auto max-w-4xl">
              <motion.div
                animate={
                  isFocused
                    ? {
                        boxShadow:
                          '0 0 0 4px rgba(59, 130, 246, 0.12), 0 8px 16px -4px rgba(59, 130, 246, 0.1)',
                      }
                    : { boxShadow: '0 0 0 0px rgba(59, 130, 246, 0)' }
                }
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="rounded-2xl"
              >
                <input
                  ref={inputRef}
                  type="text"
                  className={`
	                  w-full rounded-2xl border px-5 py-4 pr-14
	                  bg-surface-elevated/70 backdrop-blur-md
	                  placeholder:text-text-tertiary text-text-primary
	                  dark:bg-zinc-950/50 dark:placeholder:text-text-tertiary dark:text-zinc-100
	                  ${
                      isFocused
                        ? 'border-blue-400/70 dark:border-blue-400/60'
                        : 'border-border hover:border-border-hover dark:border-white/10 dark:hover:border-white/20'
                    }
	                  focus:outline-none
	                  transition-colors duration-250
	                `}
                  aria-label={t('Message')}
                  placeholder={t('Type your message...')}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={chatState.isLoading}
                  autoComplete="off"
                />
              </motion.div>

              <motion.button
                type="button"
                whileHover={
                  inputMessage.trim() ? { scale: 1.05, rotate: [0, -5, 5, 0] } : { scale: 1.02 }
                }
                whileTap={{ scale: 0.95 }}
                animate={
                  inputMessage.trim() && !chatState.isLoading
                    ? {
                        boxShadow: [
                          '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
                          '0 12px 24px -4px rgba(59, 130, 246, 0.4)',
                          '0 8px 16px -4px rgba(59, 130, 246, 0.3)',
                        ],
                      }
                    : { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
                }
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                }}
                onClick={handleSend}
                disabled={chatState.isLoading || !inputMessage.trim()}
                aria-label={t('Send message')}
                className={`
	                  absolute right-2 top-1/2 -translate-y-1/2
	                  flex h-10 w-10 items-center justify-center rounded-xl
	                  transition-all duration-300 ease-out will-change-transform
	                  ${
                      inputMessage.trim()
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-elevated/70 text-text-tertiary dark:bg-white/5 dark:text-text-tertiary'
                    }
	                  disabled:cursor-not-allowed disabled:opacity-50
	                `}
              >
                {chatState.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <motion.div
                    animate={inputMessage.trim() ? { x: [0, 2, 0] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Send className="h-5 w-5" />
                  </motion.div>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    </div>
  )
}
