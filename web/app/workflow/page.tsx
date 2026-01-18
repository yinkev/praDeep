'use client'

import type { ComponentType } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Database,
  FolderOpen,
  Lightbulb,
  Microscope,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import { getTranslation } from '@/lib/i18n'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

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
  hidden: { opacity: 0, y: 18, scale: 0.98 },
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
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 340,
      damping: 26,
    },
  },
}

const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.15, 1],
    opacity: [0.3, 0.6, 0.3],
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
      className="group relative block overflow-hidden rounded-xl border border-border bg-surface-base/50 shadow-glass-sm transition-all duration-300 hover:border-accent-primary/30 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-between gap-3 px-4 py-4 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised border border-border text-text-tertiary group-hover:text-accent-primary group-hover:border-accent-primary/20 transition-all duration-300"
            animate={isHovered ? { scale: 1.05, rotate: [0, -5, 5, 0] } : { scale: 1, rotate: 0 }}
          >
            <node.icon className="h-4 w-4" />
          </motion.div>

          <div className="min-w-0">
            <div className="truncate text-[11px] font-bold uppercase tracking-widest text-text-primary group-hover:text-accent-primary transition-colors">
              {node.title}
            </div>
            <div className="mt-0.5 text-[10px] font-mono text-text-quaternary uppercase tracking-tighter">
              STEP {node.step}
            </div>
          </div>
        </div>

        <motion.div
          className="shrink-0 text-text-quaternary group-hover:text-accent-primary"
          animate={isHovered ? { x: 3 } : { x: 0 }}
        >
          <ArrowRight className="h-4 w-4" />
        </motion.div>
      </div>
    </Link>
  )
}

function TimelineNode({ node, isLast }: { node: WorkflowNode; isLast: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      variants={timelineNodeVariants}
      className="relative flex gap-6"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-base ring-1 ring-border shadow-sm transition-all duration-300"
          animate={
            isHovered
              ? {
                  scale: 1.1,
                  boxShadow: '0 0 20px rgba(var(--color-accent-primary), 0.15)',
                  borderColor: 'rgba(var(--color-accent-primary), 0.3)',
                }
              : {
                  scale: 1,
                  boxShadow: '0 0 0 rgba(var(--color-accent-primary), 0)',
                  borderColor: 'rgb(var(--border))',
                }
          }
        >
          <motion.div
            className="absolute inset-0 rounded-xl bg-accent-primary"
            variants={pulseVariants}
            animate={isHovered ? 'pulse' : 'rest'}
          />
          <node.icon className={cn(
            "relative h-4 w-4 transition-colors duration-300",
            isHovered ? "text-accent-primary" : "text-text-tertiary"
          )} />
        </motion.div>

        {!isLast && (
          <div className="relative mt-2 w-px flex-1">
            <div className="absolute inset-0 bg-border-subtle" />
            <motion.div
              className="absolute inset-0 bg-accent-primary/30"
              initial={{ scaleY: 0 }}
              animate={isHovered ? { scaleY: 1 } : { scaleY: 0 }}
              style={{ transformOrigin: 'top' }}
            />
          </div>
        )}
      </div>

      <Link
        href={node.href}
        className="group block flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Card
          interactive={false}
          className="relative overflow-hidden border-border transition-all duration-300 group-hover:border-accent-primary/20 group-hover:bg-surface-secondary/40 group-hover:shadow-glass-sm"
        >
          <div className="relative flex items-start justify-between gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-border bg-surface-base text-[9px] font-mono font-bold uppercase tracking-widest text-text-quaternary group-hover:text-accent-primary group-hover:border-accent-primary/20 transition-colors">
                  #{node.step}
                </Badge>
              </div>

              <h3 className="mt-3 truncate text-xs font-bold uppercase tracking-widest text-text-primary transition-colors group-hover:text-accent-primary">
                {node.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary opacity-80 group-hover:opacity-100 transition-opacity">
                {node.description}
              </p>
            </div>

            <motion.div
              className="mt-1 shrink-0 text-text-quaternary group-hover:text-accent-primary"
              animate={isHovered ? { x: 3 } : { x: 0 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}

function MiniActivityChart() {
  const data = [
    { value: 10 },
    { value: 15 },
    { value: 12 },
    { value: 20 },
    { value: 25 },
    { value: 18 },
    { value: 30 },
  ]

  return (
    <div className="h-12 w-24">
      <ChartContainer config={{ value: { color: "rgb(var(--color-accent-primary))" } }} className="h-full w-full">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
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
        icon={<Workflow className="h-5 w-5 text-accent-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/guide')} className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
              {t('View guide')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/knowledge')}
              className="text-[10px] font-mono uppercase tracking-widest"
            >
              {t('Start with KB')}
              <ArrowRight className="h-3 w-3 ml-2" />
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <Card
              interactive={false}
              className="relative h-full overflow-hidden border-border bg-surface-base"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--color-accent-primary),0.08),transparent_55%)]"
              />

              <div className="relative p-8">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary border-accent-primary/20 text-[9px] font-bold uppercase tracking-widest">
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    {t('Flow at a glance')}
                  </Badge>
                  <MiniActivityChart />
                </div>

                <h2 className="mt-6 text-xl font-bold text-text-primary uppercase tracking-tight">
                  {t('Four modules. One clean loop.')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary opacity-80 mb-8">
                  {t(
                    'Start by grounding the system in your sources, then solve, research, and review outputs — repeat as you learn.'
                  )}
                </p>

                <BentoGrid className="grid-cols-1 md:grid-cols-2">
                  {nodes.map((node) => (
                    <BentoGridItem
                      key={node.id}
                      title={node.title}
                      description={node.description}
                      header={
                        <div className="flex w-full flex-1 items-center justify-center rounded-xl bg-surface-raised/50 min-h-[6rem]">
                          <node.icon className="h-8 w-8 text-accent-primary opacity-80" />
                        </div>
                      }
                      icon={<div className="text-[10px] font-mono text-text-quaternary uppercase tracking-tighter mb-1">STEP {node.step}</div>}
                      className={cn("cursor-pointer bg-surface-base border-border hover:border-accent-primary/30", "transition-all duration-300")}
                    />
                  ))}
                </BentoGrid>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card
              interactive={false}
              className="relative h-full border-border bg-surface-base"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                   <div>
                     <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-primary">
                       {t('Timeline')}
                     </div>
                     <p className="mt-1 text-[10px] font-mono text-text-tertiary uppercase tracking-tight">
                       {t('Sequential module dependency path')}
                     </p>
                   </div>
                </div>

                <div className="space-y-6">
                  {nodes.map((node, idx) => (
                    <TimelineNode key={node.id} node={node} isLast={idx === nodes.length - 1} />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card
            interactive={false}
            className="border-border bg-surface-secondary/30 backdrop-blur-sm"
          >
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised border border-border text-accent-primary">
                   <Lightbulb size={20} />
                 </div>
                 <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary">
                    {t('Tip')}
                  </div>
                  <div className="mt-1 text-sm text-text-secondary opacity-80">
                    {t(
                      'If you are unsure where to start, begin with the Knowledge Base — it improves everything else downstream.'
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/history')}
                className="text-[10px] font-mono uppercase tracking-widest border-border hover:border-accent-primary/30"
              >
                {t('Go to history')}
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageWrapper>
  )
}
