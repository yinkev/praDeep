'use client'

import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, type Variants, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  type LucideIcon,
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
  ChevronLeft,
  ChevronRight,
  Brain,
  Activity,
  User,
  MessageCircle,
} from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import { getTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { DynamicIsland, DynamicContainer, DynamicTitle, DynamicDescription, DynamicDiv, DynamicIslandProvider } from "@/components/ui/dynamic-island";

// ============================================================================
// Types
// ============================================================================

type SidebarProps = {
  collapsible?: boolean
}

type NavItemDefinition = {
  nameKey: string
  href: string
  icon: LucideIcon
}

type NavGroupDefinition = {
  id: string
  labelKey?: string
  items: NavItemDefinition[]
}

type NavItem = Omit<NavItemDefinition, 'nameKey'> & { name: string }

type NavGroup = {
  id: string
  label?: string
  items: NavItem[]
}

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_EXPANDED_WIDTH = 260
const SIDEBAR_COLLAPSED_WIDTH = 72

// Animation variants - clean, subtle transitions
const sidebarVariants = {
  expanded: {
    width: SIDEBAR_EXPANDED_WIDTH,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  collapsed: {
    width: SIDEBAR_COLLAPSED_WIDTH,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
} satisfies Variants

const textVariants = {
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  hidden: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
} satisfies Variants

const tooltipVariants = {
  hidden: { opacity: 0, x: -4, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
} satisfies Variants

// ============================================================================
// Component
// ============================================================================

const NAV_GROUP_DEFINITIONS: readonly NavGroupDefinition[] = [
  {
    id: 'main',
    items: [
      { nameKey: 'Home', href: '/', icon: Home },
      { nameKey: 'Dashboard', href: '/chat', icon: MessageCircle },
      { nameKey: 'History', href: '/history', icon: History },
      { nameKey: 'Analytics', href: '/analytics', icon: BarChart3 },
      { nameKey: 'Workflow Insights', href: '/workflow', icon: Sparkles },
      { nameKey: 'Metrics', href: '/metrics', icon: Activity },
      { nameKey: 'Memory', href: '/memory', icon: Brain },
      { nameKey: 'Knowledge Bases', href: '/knowledge', icon: BookOpen },
      { nameKey: 'Notebooks', href: '/notebook', icon: Book },
    ],
  },
  {
    id: 'learn',
    labelKey: 'Learn',
    items: [
      { nameKey: 'Question Generator', href: '/question', icon: PenTool },
      { nameKey: 'Smart Solver', href: '/solver', icon: Calculator },
      { nameKey: 'Guided Learning', href: '/guide', icon: GraduationCap },
    ],
  },
  {
    id: 'research',
    labelKey: 'Research',
    items: [
      { nameKey: 'IdeaGen', href: '/ideagen', icon: Lightbulb },
      { nameKey: 'Deep Research', href: '/research', icon: Microscope },
      { nameKey: 'Paper Recommendations', href: '/recommendation', icon: BookOpen },
      { nameKey: 'Co-Writer', href: '/co_writer', icon: Edit3 },
    ],
  },
]

export default function Sidebar({ collapsible = true }: SidebarProps) {
  const pathname = usePathname()

  const { uiSettings, sidebarCollapsed, toggleSidebar } = useGlobal()
  const lang = uiSettings.language
  const isCollapsed = collapsible ? sidebarCollapsed : false

  const t = useCallback((key: string) => getTranslation(lang, key), [lang])

  const isRouteActive = useCallback(
    (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)),
    [pathname]
  )

  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Scroll tracking for the tracing beam
  const scrollProgress = useMotionValue(0)
  const beamTop = useTransform(scrollProgress, [0, 1], ["2%", "92%"]) // Keep within vertical bounds
  const springBeamTop = useSpring(beamTop, { stiffness: 200, damping: 25 })

  useEffect(() => {
    const scrollContainer = document.getElementById("app-scroll")
    if (!scrollContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const maxScroll = scrollHeight - clientHeight
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0
      scrollProgress.set(progress)
    }

    // Initial calculation
    handleScroll()

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [scrollProgress])

  const navGroups = useMemo<NavGroup[]>(
    () =>
      NAV_GROUP_DEFINITIONS.map(group => ({
        id: group.id,
        label: group.labelKey ? t(group.labelKey) : undefined,
        items: group.items.map(item => ({
          name: t(item.nameKey),
          href: item.href,
          icon: item.icon,
        })),
      })),
    [t]
  )

  return (
    <motion.aside
      className={cn(
        'relative flex h-full flex-shrink-0 flex-col',
        'border-r border-border bg-surface-base text-text-primary',
        'shadow-[20px_0_40px_-10px_rgba(0,0,0,0.02)]' // Subtle depth
      )}
      variants={sidebarVariants}
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
    >
      {/* Tech vibe vertical tracing beam */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] overflow-hidden pointer-events-none z-50">
        <motion.div
          className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-accent-primary to-transparent"
          style={{ top: springBeamTop, opacity: 0.8 }}
        />
        <motion.div
          className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-blue-400 to-transparent"
          style={{ top: springBeamTop, opacity: 0.5, y: 10 }} // Slight offset for layering
        />
      </div>

      {/* Logo Area */}
      <div className="px-4 py-5 flex items-center justify-between">
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center border border-border shadow-sm">
            <span className="text-text-primary text-sm font-bold font-serif italic">P</span>
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="text-[17px] font-semibold text-text-primary tracking-tight font-serif italic"
              >
                praDeep
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Toggle */}
        {collapsible && (
          <motion.button
            onClick={toggleSidebar}
            className={cn(
              'h-8 w-8 grid place-items-center rounded-md',
              'text-text-tertiary hover:text-text-primary',
              'hover:bg-surface-secondary',
              'transition-colors duration-150 ease-out'
            )}
            whileTap={{ scale: 0.95 }}
            title={isCollapsed ? t('Expand sidebar') : t('Collapse sidebar')}
            aria-label={isCollapsed ? t('Expand sidebar') : t('Collapse sidebar')}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
            )}
          </motion.button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        <div className="space-y-6">
          {navGroups.map(group => (
            <div key={group.id}>
              {/* Section Label */}
              <AnimatePresence>
                {group.label && !isCollapsed && (
                  <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="text-[10px] font-bold font-mono text-text-tertiary uppercase tracking-widest px-3 mb-2 mt-6 first:mt-0 opacity-80"
                  >
                    {group.label}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed divider */}
              {group.label && isCollapsed && (
                <div className="mx-3 mb-2 mt-6 border-t border-border" />
              )}

              {/* Nav Items */}
              <div className="space-y-1">
                {group.items.map(item => {
                  const isActive = isRouteActive(item.href)
                  const isHovered = hoveredItem === item.href

                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        prefetch={true}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'relative flex h-10 w-full items-center rounded-md py-2 text-[13px] font-medium',
                          'transition-colors duration-150 ease-out',
                          'active:translate-y-px',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base',
                          isCollapsed ? 'justify-center px-2.5' : 'gap-3 px-3',
                          isActive
                            ? 'bg-surface-secondary text-text-primary font-semibold'
                            : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                        )}
                        onMouseEnter={() => setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {/* Active indicator - left bar */}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={cn(
                              'absolute left-0 top-1/2 -translate-y-1/2',
                              'h-5 w-0.5 rounded-r-full bg-accent-primary shadow-[0_0_8px_rgba(var(--primary)/0.5)]'
                            )}
                            transition={{ duration: 0.3, ease: 'easeOut' as const }}
                          />
                        )}

                        {/* Icon */}
                        <item.icon
                          className={cn(
                            'w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ease-out',
                            isActive ? 'text-accent-primary' : 'text-text-tertiary'
                          )}
                          strokeWidth={1.75}
                        />

                        {/* Label */}
                        <AnimatePresence>
                          {!isCollapsed && (
                            <motion.span
                              variants={textVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              className="truncate"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>

                      {/* Tooltip for collapsed state */}
                      <AnimatePresence>
                        {isCollapsed && isHovered && (
                          <motion.div
                            variants={tooltipVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50"
                          >
                            <div className="ui-frame relative px-3 py-2 rounded-md border border-border bg-surface-elevated text-text-primary text-xs font-semibold shadow-sm whitespace-nowrap">
                              {item.name}
                              <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-border bg-surface-elevated" />
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

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border">
        {/* Settings */}
        <div className="relative mb-2">
          <Link
            href="/settings"
            aria-current={isRouteActive('/settings') ? 'page' : undefined}
            className={cn(
              'relative flex h-10 w-full items-center rounded-md py-2 text-[13px] font-medium',
              'transition-colors duration-150 ease-out',
              'active:translate-y-px',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base',
              isCollapsed ? 'justify-center px-2.5' : 'gap-3 px-3',
              isRouteActive('/settings')
                ? 'bg-surface-secondary text-text-primary font-semibold'
                : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
            )}
            onMouseEnter={() => setHoveredItem('/settings')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {isRouteActive('/settings') && (
              <motion.div
                layoutId="activeIndicator"
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2',
                  'h-4 w-0 border-l-2 border-accent-primary'
                )}
                transition={{ duration: 0.3, ease: 'easeOut' as const }}
              />
            )}

            <Settings
              className={cn(
                'w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ease-out',
                isRouteActive('/settings') ? 'text-accent-primary' : 'text-text-tertiary'
              )}
              strokeWidth={1.75}
            />

            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {t('Settings')}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Settings tooltip */}
          <AnimatePresence>
            {isCollapsed && hoveredItem === '/settings' && (
              <motion.div
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50"
              >
                <div className="ui-frame relative px-3 py-2 rounded-md border border-border bg-surface-elevated text-text-primary text-xs font-semibold shadow-sm whitespace-nowrap">
                  {t('Settings')}
                  <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-border bg-surface-elevated" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      {/* User Profile - Dynamic Island */}
      <div className="absolute bottom-4 left-4 right-4 z-50">
        <DynamicIslandProvider>
          <DynamicIsland id="user-profile-island">
            <DynamicContainer className="flex items-center justify-between px-4 py-2 bg-neutral-900/90 text-white rounded-full">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs">
                  U
                </div>
                <div className="flex flex-col">
                  <DynamicTitle className="text-sm font-medium text-white">Researcher</DynamicTitle>
                  <DynamicDescription className="text-xs text-neutral-400">PRO MEMBER</DynamicDescription>
                </div>
              </div>
              <button className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                Settings
              </button>
            </DynamicContainer>
          </DynamicIsland>
        </DynamicIslandProvider>
      </div>
      </div>
    </motion.aside>
  )
}
