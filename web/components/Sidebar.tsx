'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  History,
  Sparkles,
  BarChart3,
  BookOpen,
  PenTool,
  Calculator,
  Microscope,
  Edit3,
  Settings,
  Book,
  GraduationCap,
  Lightbulb,
  Github,
  Globe,
  ChevronLeft,
  ChevronRight,
  Brain,
  Activity,
  User,
  LucideIcon,
} from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import { getTranslation } from '@/lib/i18n'

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface NavGroup {
  name: string
  items: NavItem[]
}

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_EXPANDED_WIDTH = 280
const SIDEBAR_COLLAPSED_WIDTH = 72

// Animation variants
const sidebarVariants = {
  expanded: {
    width: SIDEBAR_EXPANDED_WIDTH,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  collapsed: {
    width: SIDEBAR_COLLAPSED_WIDTH,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
}

const textVariants = {
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.1, duration: 0.2 },
  },
  hidden: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.1 },
  },
}

const tooltipVariants = {
  hidden: {
    opacity: 0,
    x: -8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
}

const navItemVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

const activeIndicatorVariants = {
  initial: { scaleY: 0, opacity: 0 },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    scaleY: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
}

// ============================================================================
// Component
// ============================================================================

export default function Sidebar() {
  const pathname = usePathname()
  const { uiSettings, sidebarCollapsed, toggleSidebar } = useGlobal()
  const lang = uiSettings.language

  const t = (key: string) => getTranslation(lang, key)

  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navGroups: NavGroup[] = [
    {
      name: '',
      items: [
        { name: t('Home'), href: '/', icon: Home },
        { name: t('History'), href: '/history', icon: History },
        { name: t('Analytics'), href: '/analytics', icon: BarChart3 },
        { name: t('Workflow Insights'), href: '/workflow', icon: Sparkles },
        { name: t('Metrics'), href: '/metrics', icon: Activity },
        { name: t('Memory'), href: '/memory', icon: Brain },
        { name: t('Knowledge Bases'), href: '/knowledge', icon: BookOpen },
        { name: t('Notebooks'), href: '/notebook', icon: Book },
      ],
    },
    {
      name: t('Learn'),
      items: [
        { name: t('Question Generator'), href: '/question', icon: PenTool },
        { name: t('Smart Solver'), href: '/solver', icon: Calculator },
        { name: t('Guided Learning'), href: '/guide', icon: GraduationCap },
      ],
    },
    {
      name: t('Research'),
      items: [
        { name: t('IdeaGen'), href: '/ideagen', icon: Lightbulb },
        { name: t('Deep Research'), href: '/research', icon: Microscope },
        { name: t('Paper Recommendations'), href: '/recommendation', icon: BookOpen },
        { name: t('Co-Writer'), href: '/co_writer', icon: Edit3 },
      ],
    },
  ]

  return (
    <motion.div
      className="relative flex-shrink-0 h-full flex flex-col overflow-hidden"
      variants={sidebarVariants}
      initial={false}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
    >
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/90 via-white/80 to-slate-100/90 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 backdrop-blur-xl" />

      {/* Cloud Dancer Accent - Subtle teal gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5 dark:from-teal-400/10 dark:via-transparent dark:to-cyan-400/10 pointer-events-none" />

      {/* Glass Border */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-slate-200/50 via-slate-300/30 to-slate-200/50 dark:from-slate-700/50 dark:via-slate-600/30 dark:to-slate-700/50" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header / Logo Section */}
        <div className="px-4 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo with glow effect */}
              <motion.div
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20 dark:shadow-teal-400/30"
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="praDeep Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                    priority
                  />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-400/50 to-cyan-500/50 blur-md -z-10 opacity-60" />
              </motion.div>

              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="flex flex-col"
                  >
                    <h1 className="font-bold text-lg bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                      praDeep
                    </h1>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Deep Learning Lab
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapse/Expand Toggle */}
            <motion.button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={sidebarCollapsed ? t('Expand sidebar') : t('Collapse sidebar')}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </motion.button>
          </div>

          {/* Tagline - only when expanded */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-100/50 dark:border-teal-800/50"
              >
                <div className="flex items-center gap-2">
                  <a
                    href="https://hkuds.github.io/praDeep/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://github.com/HKUDS/praDeep"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300 ml-1">
                    Data Intelligence Lab @ HKU
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-6">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx}>
                {/* Group Label */}
                <AnimatePresence>
                  {group.name && !sidebarCollapsed && (
                    <motion.div
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2"
                    >
                      {group.name}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Divider for collapsed state */}
                {group.name && sidebarCollapsed && (
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent mx-2 mb-3" />
                )}

                {/* Nav Items */}
                <div className="space-y-1">
                  {group.items.map(item => {
                    const isActive = pathname === item.href
                    const isHovered = hoveredItem === item.href

                    return (
                      <div key={item.href} className="relative">
                        <motion.div
                          variants={navItemVariants}
                          initial="idle"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <Link
                            href={item.href}
                            className={`
                              group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                              transition-colors duration-200
                              ${
                                isActive
                                  ? 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-400/20 dark:to-cyan-400/20 text-teal-700 dark:text-teal-300'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
                              }
                            `}
                            onMouseEnter={() => setHoveredItem(item.href)}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            {/* Active Indicator Bar */}
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  variants={activeIndicatorVariants}
                                  initial="initial"
                                  animate="animate"
                                  exit="exit"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500"
                                  style={{ originY: 0.5 }}
                                />
                              )}
                            </AnimatePresence>

                            {/* Icon */}
                            <motion.div
                              className={`
                                flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                                transition-colors duration-200
                                ${
                                  isActive
                                    ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                                }
                              `}
                              whileHover={{ rotate: isActive ? 0 : 5 }}
                            >
                              <item.icon className="w-4.5 h-4.5" />
                            </motion.div>

                            {/* Label */}
                            <AnimatePresence>
                              {!sidebarCollapsed && (
                                <motion.span
                                  variants={textVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="hidden"
                                  className="text-sm font-medium truncate"
                                >
                                  {item.name}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </Link>
                        </motion.div>

                        {/* Tooltip for collapsed state */}
                        <AnimatePresence>
                          {sidebarCollapsed && isHovered && (
                            <motion.div
                              variants={tooltipVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50"
                            >
                              <div className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium shadow-xl whitespace-nowrap">
                                {item.name}
                                {/* Arrow */}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900 dark:border-r-slate-700" />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer - Settings & User Profile */}
        <div className="px-3 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-t from-slate-100/50 to-transparent dark:from-slate-800/50">
          {/* Settings Link */}
          <div className="relative mb-3">
            <motion.div variants={navItemVariants} initial="idle" whileHover="hover" whileTap="tap">
              <Link
                href="/settings"
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-colors duration-200
                  ${
                    pathname === '/settings'
                      ? 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-400/20 dark:to-cyan-400/20 text-teal-700 dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
                  }
                `}
                onMouseEnter={() => setHoveredItem('/settings')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Active Indicator */}
                <AnimatePresence>
                  {pathname === '/settings' && (
                    <motion.div
                      variants={activeIndicatorVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500"
                      style={{ originY: 0.5 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  className={`
                    flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                    transition-colors duration-200
                    ${
                      pathname === '/settings'
                        ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-teal-600 dark:group-hover:text-teal-400'
                    }
                  `}
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Settings className="w-4.5 h-4.5" />
                </motion.div>

                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="text-sm font-medium"
                    >
                      {t('Settings')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>

            {/* Settings Tooltip */}
            <AnimatePresence>
              {sidebarCollapsed && hoveredItem === '/settings' && (
                <motion.div
                  variants={tooltipVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50"
                >
                  <div className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium shadow-xl whitespace-nowrap">
                    {t('Settings')}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900 dark:border-r-slate-700" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Section */}
          <motion.div
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl
              bg-gradient-to-r from-slate-100/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80
              border border-slate-200/50 dark:border-slate-700/50
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 p-0.5">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
            </div>

            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex-1 min-w-0"
                >
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    Researcher
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Active Session
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
