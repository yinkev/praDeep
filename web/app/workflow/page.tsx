'use client'

import type { ComponentType } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, type Variants, useMotionValue, useSpring } from 'framer-motion'
import {
  ArrowRight,
  Database,
  FolderOpen,
  Microscope,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import { getTranslation } from '@/lib/i18n'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

// ============================================================================
// Types
// ============================================================================

type WorkflowNode = {
  id: string
  title: string
  description: string
  href: string
  step: number
  icon: ComponentType<{ className?: string }>
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.12,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 28,
      mass: 0.8,
    },
  },
}

const timelineNodeVariants: Variants = {
  hidden: { opacity: 0, x: -12, scale: 0.94 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 340,
      damping: 26,
      mass: 0.9,
    },
  },
}

const iconHoverVariants: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.12,
    rotate: [0, -8, 8, 0],
    transition: {
      duration: 0.5,
      rotate: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  },
}

const stepBadgeVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.08,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 15,
    },
  },
}

const arrowVariants: Variants = {
  rest: { x: 0, opacity: 0.6 },
  hover: {
    x: 3,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
}

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.15, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================================================
// Components
// ============================================================================

function QuickAccessCard({ node }: { node: WorkflowNode }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={node.href}
      className="group relative block overflow-hidden rounded-xl border border-white/60 bg-white/60 shadow-sm shadow-blue-600/5 transition-all duration-300 hover:shadow-md hover:shadow-blue-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:hover:shadow-blue-400/8 dark:focus-visible:ring-offset-zinc-950"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-blue-100/30 dark:from-blue-500/5 dark:via-transparent dark:to-blue-600/10"
        animate={
          isHovered
            ? {
                opacity: 1,
                scale: 1.05,
                transition: { duration: 0.4, ease: 'easeOut' },
              }
            : {
                opacity: 0,
                scale: 1,
                transition: { duration: 0.3 },
              }
        }
      />

      {/* Content */}
      <motion.div
        className="relative flex items-center justify-between gap-3 px-4 py-3 text-left"
        animate={
          isHovered
            ? {
                x: 2,
                transition: {
                  type: 'spring',
                  stiffness: 350,
                  damping: 25,
                },
              }
            : {
                x: 0,
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                },
              }
        }
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Icon container with magnetic effect */}
          <motion.div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition-all duration-300 group-hover:bg-blue-100 group-hover:shadow-md group-hover:shadow-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300 dark:group-hover:bg-blue-500/25"
            animate={
              isHovered
                ? {
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    transition: {
                      scale: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                      },
                      rotate: {
                        duration: 0.5,
                        ease: [0.34, 1.56, 0.64, 1],
                      },
                    },
                  }
                : {
                    scale: 1,
                    rotate: 0,
                  }
            }
          >
            <node.icon className="h-4 w-4" />
          </motion.div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-900 transition-colors duration-300 group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-300">
              {node.title}
            </div>
            <motion.div
              className="mt-0.5 text-xs text-zinc-500 transition-colors duration-300 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300"
              animate={
                isHovered
                  ? {
                      x: 2,
                      transition: { delay: 0.05, duration: 0.2 },
                    }
                  : {
                      x: 0,
                    }
              }
            >
              #{node.step}
            </motion.div>
          </div>
        </div>

        {/* Arrow with spring animation */}
        <motion.div
          className="shrink-0 text-zinc-400 dark:text-zinc-500"
          animate={
            isHovered
              ? {
                  x: 4,
                  scale: 1.1,
                  color: 'rgb(37, 99, 235)',
                  transition: {
                    type: 'spring',
                    stiffness: 350,
                    damping: 18,
                  },
                }
              : {
                  x: 0,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  },
                }
          }
        >
          <ArrowRight className="h-4 w-4" />
        </motion.div>
      </motion.div>

      {/* Bottom border highlight */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={
          isHovered
            ? {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.3, ease: 'easeOut' },
              }
            : {
                scaleX: 0,
                opacity: 0,
                transition: { duration: 0.2 },
              }
        }
        style={{ transformOrigin: 'left' }}
      />
    </Link>
  )
}

function TimelineNode({ node, isLast }: { node: WorkflowNode; isLast: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      variants={timelineNodeVariants}
      className="relative flex gap-4"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Timeline connector with gradient */}
      <div className="relative flex flex-col items-center">
        <motion.div
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5 backdrop-blur-sm transition-all duration-300 dark:bg-white/5 dark:ring-white/10"
          animate={
            isHovered
              ? {
                  scale: 1.1,
                  boxShadow:
                    '0 8px 24px -8px rgba(59, 130, 246, 0.35), 0 0 0 3px rgba(59, 130, 246, 0.08)',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }
              : {
                  scale: 1,
                  boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                }
          }
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {/* Pulsing background effect */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-600/20"
            variants={pulseVariants}
            animate={isHovered ? 'pulse' : 'rest'}
          />

          <motion.div
            animate={
              isHovered
                ? {
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: 1.15,
                  }
                : {
                    rotate: 0,
                    scale: 1,
                  }
            }
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <node.icon className="relative h-5 w-5 text-blue-600 transition-colors duration-300 dark:text-blue-300" />
          </motion.div>
        </motion.div>

        {!isLast && (
          <div className="relative mt-2 w-px flex-1">
            {/* Base connector */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-200/70 via-zinc-200/50 to-zinc-200/30 dark:from-white/10 dark:via-white/6 dark:to-white/3" />

            {/* Animated gradient on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-blue-400/40 via-blue-500/30 to-blue-600/20"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={
                isHovered
                  ? {
                      opacity: 1,
                      scaleY: 1,
                      transition: {
                        duration: 0.4,
                        ease: 'easeOut',
                      },
                    }
                  : {
                      opacity: 0,
                      scaleY: 0,
                      transition: {
                        duration: 0.3,
                      },
                    }
              }
              style={{ transformOrigin: 'top' }}
            />
          </div>
        )}
      </div>

      <Link
        href={node.href}
        className="group block flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
      >
        <motion.div
          animate={
            isHovered
              ? {
                  y: -2,
                  transition: {
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  },
                }
              : {
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  },
                }
          }
        >
          <Card
            variant="glass"
            interactive={false}
            className="relative overflow-hidden border-white/55 transition-all duration-300 group-hover:border-blue-200/60 group-hover:bg-white/80 group-hover:shadow-lg group-hover:shadow-blue-600/8 dark:border-white/10 dark:group-hover:border-white/20 dark:group-hover:bg-white/8"
          >
            {/* Gradient glow effect on hover */}
            <motion.div
              className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-blue-500/0 via-blue-400/0 to-blue-600/0"
              animate={
                isHovered
                  ? {
                      opacity: [0, 0.15, 0.12],
                      transition: { duration: 0.5 },
                    }
                  : {
                      opacity: 0,
                      transition: { duration: 0.3 },
                    }
              }
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <motion.span
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 transition-all duration-300 group-hover:bg-blue-100 group-hover:shadow-sm dark:bg-blue-500/10 dark:text-blue-200 dark:group-hover:bg-blue-500/20"
                    animate={
                      isHovered
                        ? {
                            scale: 1.05,
                            transition: {
                              type: 'spring',
                              stiffness: 500,
                              damping: 20,
                            },
                          }
                        : {
                            scale: 1,
                          }
                    }
                  >
                    #{node.step}
                  </motion.span>
                </div>

                <h3 className="mt-2 truncate text-sm font-semibold text-zinc-900 transition-all duration-300 group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-300">
                  {node.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500 transition-colors duration-300 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300">
                  {node.description}
                </p>
              </div>

              <motion.div
                className="mt-1 shrink-0 text-zinc-400 dark:text-zinc-500"
                animate={
                  isHovered
                    ? {
                        x: 3,
                        color: 'rgb(37, 99, 235)',
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 20,
                        },
                      }
                    : {
                        x: 0,
                        transition: {
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        },
                      }
                }
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </Link>
    </motion.div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function WorkflowInsightsPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)
  const router = useRouter()

  const nodes: WorkflowNode[] = [
    {
      id: 'knowledge',
      title: t('Knowledge Base Setup'),
      description: t('Capture sources once so every module can reuse them.'),
      href: '/knowledge',
      icon: Database,
      step: 1,
    },
    {
      id: 'solver',
      title: t('Solve Configuration'),
      description: t('Tune the solver once, then iterate fast with consistent settings.'),
      href: '/solver',
      icon: SlidersHorizontal,
      step: 2,
    },
    {
      id: 'research',
      title: t('Research Pipeline'),
      description: t('Queue topics, track progress, and keep the thread organized.'),
      href: '/research',
      icon: Microscope,
      step: 3,
    },
    {
      id: 'history',
      title: t('History & Outputs'),
      description: t('Review, compare, and reuse results across sessions.'),
      href: '/history',
      icon: FolderOpen,
      step: 4,
    },
  ]

  return (
    <PageWrapper maxWidth="wide" showPattern>
      <PageHeader
        title={t('Workflow')}
        description={t(
          'A clean, end-to-end flow through praDeep — jump into each module in the order that compounds the most value.'
        )}
        icon={<Workflow className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/guide')}>
              {t('View guide')}
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/knowledge')}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              {t('Start with KB')}
            </Button>
          </div>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            variant="glass"
            padding="lg"
            interactive={false}
            className="relative overflow-hidden border-white/55 dark:border-white/10"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]"
            />

            <div className="relative">
              <motion.div
                className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm shadow-blue-600/5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 24,
                  delay: 0.1,
                }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: 'easeInOut',
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                </motion.div>
                {t('Flow at a glance')}
              </motion.div>

              <h2 className="mt-4 text-lg font-semibold text-zinc-900 tracking-tight dark:text-zinc-50">
                {t('Four modules. One clean loop.')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(
                  'Start by grounding the system in your sources, then solve, research, and review outputs — repeat as you learn.'
                )}
              </p>

              <motion.div
                className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {nodes.map((node, idx) => (
                  <motion.div
                    key={node.id}
                    variants={itemVariants}
                    custom={idx}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <QuickAccessCard node={node} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </Card>

          <Card
            variant="glass"
            padding="lg"
            interactive={false}
            className="relative overflow-hidden border-white/55 dark:border-white/10"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_60%)]"
            />

            <div className="relative">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {t('Timeline')}
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t('Follow the path top-to-bottom — each step links to the module.')}
              </p>

              <motion.div variants={containerVariants} className="mt-6 space-y-5">
                {nodes.map((node, idx) => (
                  <TimelineNode key={node.id} node={node} isLast={idx === nodes.length - 1} />
                ))}
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card
            variant="glass"
            padding="lg"
            interactive={false}
            className="border-white/55 dark:border-white/10"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {t('Tip')}
                </div>
                <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {t(
                    'If you are unsure where to start, begin with the Knowledge Base — it improves everything else downstream.'
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/history')}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                {t('Go to history')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageWrapper>
  )
}
