'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Home,
  Search,
  Menu,
  X,
  ExternalLink,
  ArrowUp,
  Clock,
  Folder,
} from 'lucide-react'
import 'katex/dist/katex.min.css'

import PageWrapper from '@/components/ui/PageWrapper'
import { Card, CardBody } from '@/components/ui/Card'
import { apiUrl } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

interface DocNavItem {
  title: string
  slug: string
  children?: DocNavItem[]
}

interface DocSection {
  name: string
  items: DocNavItem[]
}

interface TableOfContentsItem {
  id: string
  text: string
  level: number
}

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: 0.2, ease: 'easeOut' },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

const expandVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

// ============================================================================
// Static Navigation Structure
// ============================================================================

const docSections: DocSection[] = [
  {
    name: 'Getting Started',
    items: [
      { title: 'Introduction', slug: '' },
      { title: 'Quick Start', slug: 'getting-started/quickstart' },
      { title: 'Installation', slug: 'getting-started/installation' },
      { title: 'First Steps', slug: 'getting-started/first-steps' },
    ],
  },
  {
    name: 'Guide',
    items: [
      { title: 'Getting Started', slug: 'guide/getting-started' },
      { title: 'Configuration', slug: 'guide/configuration' },
      { title: 'Troubleshooting', slug: 'guide/troubleshooting' },
    ],
  },
  {
    name: 'Configuration',
    items: [
      { title: 'Overview', slug: 'configuration' },
      { title: 'Environment', slug: 'configuration/environment' },
      { title: 'Models', slug: 'configuration/models' },
      { title: 'Storage', slug: 'configuration/storage' },
      { title: 'Advanced', slug: 'configuration/advanced' },
    ],
  },
  {
    name: 'Features',
    items: [{ title: 'Overview', slug: 'features/overview' }],
  },
  {
    name: 'Architecture',
    items: [
      { title: 'Overview', slug: 'architecture' },
      { title: 'Components', slug: 'architecture/components' },
      { title: 'Data Flow', slug: 'architecture/data-flow' },
      { title: 'Memory Systems', slug: 'architecture/memory-systems' },
    ],
  },
  {
    name: 'API Reference',
    items: [
      { title: 'REST API', slug: 'api/rest' },
      { title: 'WebSocket', slug: 'api/websocket' },
      { title: 'Events', slug: 'api/events' },
    ],
  },
  {
    name: 'Research',
    items: [
      { title: 'Overview', slug: 'research' },
      { title: 'Embedding Models', slug: 'research/embedding-models' },
      { title: 'Cost Analysis', slug: 'research/cost-analysis' },
      { title: 'Decisions', slug: 'research/decisions' },
    ],
  },
  {
    name: 'Resources',
    items: [
      { title: 'Changelog', slug: 'changelog' },
      { title: 'Roadmap', slug: 'roadmap' },
    ],
  },
]

// ============================================================================
// Navigation Item Component
// ============================================================================

interface NavItemComponentProps {
  item: DocNavItem
  currentSlug: string
  depth?: number
}

function NavItemComponent({ item, currentSlug, depth = 0 }: NavItemComponentProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = currentSlug === item.slug

  // Auto-expand if any child is active
  useEffect(() => {
    if (hasChildren && item.children?.some(child => currentSlug === child.slug)) {
      setExpanded(true)
    }
  }, [currentSlug, hasChildren, item.children])

  return (
    <motion.div variants={navItemVariants}>
      <div className="relative">
        <Link
          href={`/docs/${item.slug}`}
          className={`
            group flex items-center gap-2 px-3 py-2 rounded-xl text-sm
            transition-all duration-200
            ${depth > 0 ? 'ml-4' : ''}
            ${
              isActive
                ? 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-700 dark:text-teal-300 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
            }
          `}
          onClick={
            hasChildren
              ? e => {
                  e.preventDefault()
                  setExpanded(!expanded)
                }
              : undefined
          }
        >
          {/* Active indicator */}
          {isActive && (
            <motion.div
              layoutId="activeDocIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500"
              transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
            />
          )}

          <span className="flex-1 truncate">{item.title}</span>

          {hasChildren && (
            <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </motion.div>
          )}
        </Link>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && expanded && (
            <motion.div
              variants={expandVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <div className="py-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700 ml-4">
                {item.children!.map(child => (
                  <NavItemComponent
                    key={child.slug}
                    item={child}
                    currentSlug={currentSlug}
                    depth={depth + 1}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Table of Contents Component
// ============================================================================

interface TableOfContentsProps {
  items: TableOfContentsItem[]
  activeId: string
}

function TableOfContents({ items, activeId }: TableOfContentsProps) {
  if (items.length === 0) return null

  return (
    <motion.div
      variants={slideInRight}
      initial="hidden"
      animate="visible"
      className="hidden xl:block"
    >
      <Card variant="glass" hoverEffect={false} className="sticky top-24">
        <CardBody className="py-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            On this page
          </h4>
          <nav className="space-y-1">
            {items.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`
                  block py-1.5 text-sm transition-colors duration-200
                  ${item.level === 2 ? 'pl-0' : item.level === 3 ? 'pl-3' : 'pl-6'}
                  ${
                    activeId === item.id
                      ? 'text-teal-600 dark:text-teal-400 font-medium'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// Markdown Components for Styling
// ============================================================================

const markdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => {
    const id = typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : ''
    return (
      <h2
        id={id}
        className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-8 mb-4 scroll-mt-20"
        {...props}
      >
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }: any) => {
    const id = typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : ''
    return (
      <h3
        id={id}
        className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-6 mb-3 scroll-mt-20"
        {...props}
      >
        {children}
      </h3>
    )
  },
  h4: ({ children, ...props }: any) => (
    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),
  a: ({ href, children, ...props }: any) => {
    const isExternal = href?.startsWith('http')
    return (
      <a
        href={href}
        className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline decoration-teal-500/30 hover:decoration-teal-500/60 transition-colors inline-flex items-center gap-1"
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
        {isExternal && <ExternalLink className="w-3 h-3" />}
      </a>
    )
  },
  ul: ({ children, ...props }: any) => (
    <ul
      className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4 ml-2"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-4 ml-2"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-slate-600 dark:text-slate-300 leading-relaxed" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-teal-500 pl-4 py-2 my-4 bg-teal-50/50 dark:bg-teal-900/20 rounded-r-lg italic text-slate-600 dark:text-slate-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={`${className} block p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 text-sm font-mono overflow-x-auto`}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }: any) => (
    <pre className="my-4 rounded-xl overflow-hidden shadow-lg" {...props}>
      {children}
    </pre>
  ),
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <table
        className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-slate-50 dark:bg-slate-800" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
      {...props}
    >
      {children}
    </th>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody
      className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900"
      {...props}
    >
      {children}
    </tbody>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-slate-600 dark:text-slate-400" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  hr: (props: any) => <hr className="my-8 border-slate-200 dark:border-slate-700" {...props} />,
  img: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} className="rounded-xl shadow-lg my-4 max-w-full" {...props} />
  ),
}

// ============================================================================
// Main Docs Page Component
// ============================================================================

interface DocsPageProps {
  params: {
    slug?: string[]
  }
}

export default function DocsPage({ params }: DocsPageProps) {
  const pathname = usePathname()
  const [content, setContent] = useState<string>('')
  const [title, setTitle] = useState<string>('Documentation')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toc, setToc] = useState<TableOfContentsItem[]>([])
  const [activeTocId, setActiveTocId] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)

  const currentSlug = params.slug?.join('/') || ''

  // Fetch document content
  useEffect(() => {
    async function fetchDoc() {
      setLoading(true)
      setError(null)

      try {
        const slugPath = currentSlug || 'index'
        const res = await fetch(apiUrl(`/api/v1/docs/${slugPath}`))

        if (!res.ok) {
          if (res.status === 404) {
            setError('Document not found')
          } else {
            setError('Failed to load document')
          }
          setLoading(false)
          return
        }

        const data = await res.json()
        setContent(data.content || '')
        setTitle(data.title || 'Documentation')

        // Extract table of contents from content
        const headings: TableOfContentsItem[] = []
        const headingRegex = /^#{2,4}\s+(.+)$/gm
        let match
        while ((match = headingRegex.exec(data.content || '')) !== null) {
          const level = match[0].indexOf(' ')
          const text = match[1].trim()
          const id = text.toLowerCase().replace(/\s+/g, '-')
          headings.push({ id, text, level })
        }
        setToc(headings)
      } catch (err) {
        console.error('Failed to fetch doc:', err)
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchDoc()
  }, [currentSlug])

  // Track scroll position for TOC highlighting and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)

      // Update active TOC item
      const headings = document.querySelectorAll('h2[id], h3[id], h4[id]')
      let currentId = ''

      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100) {
          currentId = heading.id
        }
      })

      setActiveTocId(currentId)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Filter navigation based on search
  const filteredSections = docSections
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(section => section.items.length > 0)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageWrapper maxWidth="full" showPattern={false} className="!p-0">
      <div className="min-h-screen flex">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          variants={slideInLeft}
          initial="hidden"
          animate="visible"
          className={`
            fixed lg:sticky top-0 left-0 z-50 lg:z-auto
            w-72 h-screen lg:h-auto
            transform transition-transform duration-300 lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-slate-50/90 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 backdrop-blur-xl" />

            {/* Teal Accent Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5 dark:from-teal-400/10 dark:via-transparent dark:to-cyan-400/10 pointer-events-none" />

            {/* Glass Border */}
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-slate-200/50 via-slate-300/30 to-slate-200/50 dark:from-slate-700/50 dark:via-slate-600/30 dark:to-slate-700/50" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-4 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/docs" className="flex items-center gap-2">
                    <motion.div
                      className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-teal-500/20"
                      whileHover={{ scale: 1.05, rotate: 2 }}
                    >
                      <div className="w-full h-full rounded-[10px] bg-white dark:bg-slate-900 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                    </motion.div>
                    <div>
                      <h1 className="font-bold text-slate-900 dark:text-slate-100">
                        Documentation
                      </h1>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        praDeep Docs
                      </span>
                    </div>
                  </Link>

                  {/* Mobile close button */}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {filteredSections.map((section, sectionIdx) => (
                    <div key={sectionIdx}>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
                        {section.name}
                      </h3>
                      <div className="space-y-0.5">
                        {section.items.map(item => (
                          <NavItemComponent key={item.slug} item={item} currentSlug={currentSlug} />
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </nav>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-t from-slate-100/50 to-transparent dark:from-slate-800/50">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to App</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="sticky top-0 z-30 lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <h1 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h1>
            </div>
          </div>

          {/* Content Area */}
          <div className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
                <Link
                  href="/docs"
                  className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  Docs
                </Link>
                {params.slug?.map((segment, index) => (
                  <span key={index} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    <span
                      className={
                        index === (params.slug?.length || 0) - 1
                          ? 'text-slate-700 dark:text-slate-300'
                          : ''
                      }
                    >
                      {segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </span>
                ))}
              </nav>

              {/* Document Content */}
              <Card variant="glass" hoverEffect={false} className="overflow-hidden">
                <CardBody className="p-8 lg:p-12">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <motion.div
                        className="w-12 h-12 rounded-full border-2 border-teal-500 border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <p className="mt-4 text-slate-500 dark:text-slate-400">
                        Loading documentation...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-red-500" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {error}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">
                        The document you are looking for might have been moved or does not exist.
                      </p>
                      <Link
                        href="/docs"
                        className="px-4 py-2 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors"
                      >
                        Back to Documentation
                      </Link>
                    </div>
                  ) : (
                    <article className="prose prose-slate dark:prose-invert prose-lg max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents as any}
                      >
                        {content}
                      </ReactMarkdown>
                    </article>
                  )}
                </CardBody>
              </Card>

              {/* Page Footer */}
              {!loading && !error && (
                <motion.div
                  variants={fadeInUp}
                  className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Last updated recently</span>
                    </div>
                    <a
                      href={`https://github.com/HKUDS/praDeep/edit/main/docs/${currentSlug || 'index'}.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Edit this page
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </main>

        {/* Table of Contents (Desktop) */}
        <div className="hidden xl:block w-64 shrink-0 px-4 py-12">
          <TableOfContents items={toc} activeId={activeTocId} />
        </div>

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center hover:bg-teal-600 transition-colors"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
