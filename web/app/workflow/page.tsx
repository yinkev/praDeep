'use client'

import type { ComponentType } from 'react'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useInView, type Variants } from 'framer-motion'
import {
  ArrowRight,
  Database,
  FolderOpen,
  Microscope,
  SlidersHorizontal,
  Workflow,
  Zap,
} from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import { getTranslation } from '@/lib/i18n'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

// ============================================================================
// Types
// ============================================================================

type InsightItem = {
  id: string
  title: string
  description: string
  href: string
  icon: ComponentType<{ className?: string }>
  accentColor: string
  glowColor: string
  step: number
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const nodeVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
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

const connectionVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.8,
        ease: 'easeInOut' as const,
      },
      opacity: {
        duration: 0.3,
      },
    },
  },
}

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

const floatVariants: Variants = {
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

// ============================================================================
// Flow Connection Component
// ============================================================================

interface FlowConnectionProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  delay?: number
  color?: string
}

function FlowConnection({ from, to, delay = 0, color = 'teal' }: FlowConnectionProps) {
  // Calculate control points for a smooth curve
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  const controlOffset = Math.abs(to.y - from.y) * 0.3

  const path = `M ${from.x} ${from.y} Q ${midX} ${midY - controlOffset} ${to.x} ${to.y}`

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ zIndex: 0 }}
    >
      <defs>
        <linearGradient id={`flow-gradient-${from.x}-${to.x}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={`var(--color-${color}-400)`} stopOpacity="0.2" />
          <stop offset="50%" stopColor={`var(--color-${color}-500)`} stopOpacity="0.6" />
          <stop offset="100%" stopColor={`var(--color-${color}-400)`} stopOpacity="0.2" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow path */}
      <motion.path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="text-teal-500/20 dark:text-teal-400/20"
        filter="url(#glow)"
        variants={connectionVariants}
        initial="hidden"
        animate="visible"
        style={{ transition: `all 0.8s ease-in-out ${delay}s` }}
      />

      {/* Main path */}
      <motion.path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 4"
        className="text-teal-500/60 dark:text-teal-400/60"
        variants={connectionVariants}
        initial="hidden"
        animate="visible"
        style={{ transition: `all 0.8s ease-in-out ${delay}s` }}
      />

      {/* Animated flow particle */}
      <motion.circle
        r="4"
        fill="currentColor"
        className="text-teal-500 dark:text-teal-400"
        filter="url(#glow)"
        initial={{ offsetDistance: '0%' }}
        animate={{ offsetDistance: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear' as const,
          delay: delay + 0.5,
        }}
        style={{
          offsetPath: `path('${path}')`,
        }}
      />
    </svg>
  )
}

// ============================================================================
// Workflow Node Card Component
// ============================================================================

interface WorkflowNodeProps {
  item: InsightItem
  index: number
  t: (key: string) => string
}

function WorkflowNode({ item, index, t }: WorkflowNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(nodeRef, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={nodeRef}
      variants={nodeVariants}
      className="relative"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
    >
      {/* Step indicator */}
      <motion.div
        className="absolute -top-3 -left-3 z-10"
        variants={pulseVariants}
        animate="animate"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${item.accentColor}`}
          style={{
            boxShadow: `0 0 20px ${item.glowColor}`,
          }}
        >
          {item.step}
        </div>
      </motion.div>

      <Link href={item.href} className="block">
        <Card
          variant="glass"
          className={`
            relative overflow-hidden group cursor-pointer
            hover:border-teal-300/50 dark:hover:border-teal-600/50
            transition-all duration-300
          `}
          hoverEffect={false}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent dark:from-slate-800/50 dark:via-slate-800/30 dark:to-transparent" />

          {/* Animated glow effect on hover */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${item.glowColor}20, transparent 70%)`,
            }}
          />

          <div className="relative p-6">
            <div className="flex items-start gap-4">
              {/* Icon container with floating animation */}
              <motion.div
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                  bg-white/70 dark:bg-slate-900/50
                  backdrop-blur-xl
                  border border-white/50 dark:border-slate-700/50
                  shadow-lg
                  ${item.accentColor.replace('bg-', 'shadow-')}/20
                `}
                variants={floatVariants}
                animate="animate"
              >
                <item.icon
                  className={`w-7 h-7 ${item.accentColor.replace('bg-', 'text-').replace('-500', '-600')} dark:${item.accentColor.replace('bg-', 'text-').replace('-500', '-400')}`}
                />
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <motion.div
                className="shrink-0 mt-1"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
              >
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors" />
              </motion.div>
            </div>
          </div>

          {/* Bottom accent line */}
          <motion.div
            className={`h-1 ${item.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        </Card>
      </Link>
    </motion.div>
  )
}

// ============================================================================
// Central Hub Component
// ============================================================================

function CentralHub() {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      variants={nodeVariants}
      whileHover={{ scale: 1.05 }}
    >
      {/* Outer pulsing ring */}
      <motion.div
        className="absolute w-32 h-32 rounded-full border-2 border-teal-500/30 dark:border-teal-400/30"
        variants={pulseVariants}
        animate="animate"
      />

      {/* Middle ring */}
      <motion.div
        className="absolute w-24 h-24 rounded-full border border-teal-500/50 dark:border-teal-400/50"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut' as const,
          delay: 0.3,
        }}
      />

      {/* Central hub */}
      <div
        className={`
          w-20 h-20 rounded-full
          bg-gradient-to-br from-teal-400 to-teal-600
          dark:from-teal-500 dark:to-teal-700
          flex items-center justify-center
          shadow-xl shadow-teal-500/30
          backdrop-blur-xl
          border border-teal-300/50 dark:border-teal-500/50
        `}
      >
        <Workflow className="w-10 h-10 text-white" />
      </div>

      {/* Decorative particles */}
      {[0, 1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-teal-500/60 dark:bg-teal-400/60"
          style={{
            top: `${20 + Math.sin((i * Math.PI) / 2) * 35}%`,
            left: `${50 + Math.cos((i * Math.PI) / 2) * 35}%`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.25,
          }}
        />
      ))}
    </motion.div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function WorkflowInsightsPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showConnections, setShowConnections] = useState(false)

  useEffect(() => {
    // Delay showing connections for smoother load
    const timer = setTimeout(() => setShowConnections(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const insights: InsightItem[] = [
    {
      id: 'knowledge',
      title: t('Multi-Step Knowledge Base Setup'),
      description: t('KB setup requires repeated, manual steps for related materials.'),
      href: '/knowledge',
      icon: Database,
      accentColor: 'bg-blue-500',
      glowColor: '#3b82f6',
      step: 1,
    },
    {
      id: 'solver',
      title: t('Solve Agent Configuration Overhead'),
      description: t('Solving similar problems often means re-selecting the same settings.'),
      href: '/solver',
      icon: SlidersHorizontal,
      accentColor: 'bg-purple-500',
      glowColor: '#a855f7',
      step: 2,
    },
    {
      id: 'research',
      title: t('Research Pipeline Manual Topic Management'),
      description: t('Users spend time babysitting the research queue instead of learning.'),
      href: '/research',
      icon: Microscope,
      accentColor: 'bg-emerald-500',
      glowColor: '#10b981',
      step: 3,
    },
    {
      id: 'history',
      title: t('Fragmented Output Management'),
      description: t(
        'Outputs are spread across modules, making past work hard to find and compare.'
      ),
      href: '/history',
      icon: FolderOpen,
      accentColor: 'bg-amber-500',
      glowColor: '#f59e0b',
      step: 4,
    },
  ]

  return (
    <PageWrapper maxWidth="2xl" showPattern={true}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring' as const, stiffness: 200, damping: 15 }}
            >
              <Zap className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <motion.h1
                className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {t('Key Workflow Inefficiencies Identified')}
              </motion.h1>
              <motion.p
                className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {t(
                  'A quick map of the highest-friction workflows in praDeep, with shortcuts to where you can address them.'
                )}
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button variant="secondary" iconRight={<ArrowRight className="w-4 h-4" />}>
              {t('View All Workflows')}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Workflow Visualization */}
      <div ref={containerRef} className="relative">
        {/* Main grid layout with central hub */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left column - nodes 1 & 3 */}
          <div className="space-y-6">
            <WorkflowNode item={insights[0]} index={0} t={t} />
            <WorkflowNode item={insights[2]} index={2} t={t} />
          </div>

          {/* Center column - hub */}
          <div className="flex items-center justify-center py-8 lg:py-16">
            <CentralHub />
          </div>

          {/* Right column - nodes 2 & 4 */}
          <div className="space-y-6">
            <WorkflowNode item={insights[1]} index={1} t={t} />
            <WorkflowNode item={insights[3]} index={3} t={t} />
          </div>
        </motion.div>

        {/* SVG Connection Lines (visible on larger screens) */}
        {showConnections && (
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" style={{ minHeight: '400px' }}>
              <defs>
                <linearGradient id="teal-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(20 184 166 / 0.3)" />
                  <stop offset="50%" stopColor="rgb(20 184 166 / 0.6)" />
                  <stop offset="100%" stopColor="rgb(20 184 166 / 0.3)" />
                </linearGradient>
                <filter id="connection-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connection from node 1 to center */}
              <motion.path
                d="M 28% 15% Q 40% 40% 50% 50%"
                fill="none"
                stroke="url(#teal-gradient)"
                strokeWidth="2"
                strokeDasharray="6 4"
                filter="url(#connection-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />

              {/* Connection from node 2 to center */}
              <motion.path
                d="M 72% 15% Q 60% 40% 50% 50%"
                fill="none"
                stroke="url(#teal-gradient)"
                strokeWidth="2"
                strokeDasharray="6 4"
                filter="url(#connection-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
              />

              {/* Connection from node 3 to center */}
              <motion.path
                d="M 28% 85% Q 40% 60% 50% 50%"
                fill="none"
                stroke="url(#teal-gradient)"
                strokeWidth="2"
                strokeDasharray="6 4"
                filter="url(#connection-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.9 }}
              />

              {/* Connection from node 4 to center */}
              <motion.path
                d="M 72% 85% Q 60% 60% 50% 50%"
                fill="none"
                stroke="url(#teal-gradient)"
                strokeWidth="2"
                strokeDasharray="6 4"
                filter="url(#connection-glow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 1.1 }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Bottom Summary Card */}
      <motion.div
        className="mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card variant="glass" hoverEffect={false}>
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 dark:from-teal-400/10 dark:to-teal-600/10 flex items-center justify-center backdrop-blur-xl border border-teal-300/30 dark:border-teal-500/30">
                <Workflow className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t('Workflow Optimization')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('Click any node above to address that specific workflow bottleneck.')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </PageWrapper>
  )
}
