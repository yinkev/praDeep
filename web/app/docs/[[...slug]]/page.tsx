'use client'

import {
  isValidElement,
  use,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  BookOpen,
  ChevronRight,
  FileText,
  Home,
  Search,
  Menu,
  X,
  ExternalLink,
  ArrowUp,
  Clock,
  Copy,
  Check,
} from 'lucide-react'
import 'katex/dist/katex.min.css'

import PageWrapper from '@/components/ui/PageWrapper'
import { Card, CardBody } from '@/components/ui/Card'
import { apiUrl } from '@/lib/api'

// ============================================================================
// Helpers
// ============================================================================

function getNodeText(node: ReactNode): string {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children)
  return ''
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getScrollContainer(): HTMLElement | null {
  const container = document.querySelector<HTMLElement>('main.overflow-y-auto')
  if (container) return container

  const scrollingElement = document.scrollingElement
  return scrollingElement instanceof HTMLElement ? scrollingElement : null
}

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
  const isChildActive = Boolean(hasChildren && item.children?.some(child => currentSlug === child.slug))
  const isExpanded = expanded || isChildActive

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
                ? 'bg-white/75 dark:bg-zinc-950/40 border border-white/55 dark:border-white/10 text-blue-600 dark:text-blue-400 font-medium shadow-glass-sm backdrop-blur-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/55 dark:hover:bg-zinc-950/25 hover:text-zinc-900 dark:hover:text-zinc-100'
            }
          `}
          onClick={
            hasChildren
              ? e => {
                  e.preventDefault()
                  setExpanded(prev => !prev)
                }
              : undefined
          }
        >
          {/* Active indicator */}
          {isActive && (
            <motion.div
              layoutId="activeDocIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500"
              transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
            />
          )}

          <span className="flex-1 truncate">{item.title}</span>

          {hasChildren && (
            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </motion.div>
          )}
        </Link>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              variants={expandVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <div className="py-1 pl-2 border-l-2 border-zinc-200/70 dark:border-white/10 ml-4">
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
      <Card variant="glass" interactive={false} className="sticky top-24">
        <CardBody className="py-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            On this page
          </h4>
          <nav className="space-y-1" aria-label="Table of contents">
            {items.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`
                  block py-1.5 text-sm transition-colors duration-200
                  ${item.level === 2 ? 'pl-0' : item.level === 3 ? 'pl-3' : 'pl-6'}
                  ${
                    activeId === item.id
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
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

type CodeElement = ReactElement<{ children?: ReactNode; className?: string }>

const isCodeElement = (value: unknown): value is CodeElement => isValidElement(value) && value.type === 'code'

function CodeBlock({ node, children, ...props }: ComponentPropsWithoutRef<'pre'> & ExtraProps) {
  const [copied, setCopied] = useState(false)

  const codeChild = Array.isArray(children)
    ? children.find(isCodeElement)
    : isCodeElement(children)
      ? children
      : null

  const rawCode =
    codeChild ? getNodeText(codeChild.props.children) : getNodeText(children)

  const languageMatch =
    codeChild ? String(codeChild.props.className ?? '').match(/language-([a-z0-9_-]+)/i) : null

  const language = languageMatch?.[1]?.toLowerCase()

  const { className, ...restPreProps } = props

  const onCopy = async () => {
    const textToCopy = rawCode.replace(/\n$/, '')
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="my-6 rounded-xl border border-white/55 dark:border-white/10 bg-zinc-950 shadow-glass-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 min-w-0">
          {language ? (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300/90 truncate">
              {language}
            </span>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400/80">
              Code
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!rawCode.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        {...restPreProps}
        className={['overflow-x-auto p-4', className].filter(Boolean).join(' ')}
      >
        {children}
      </pre>
    </div>
  )
}

const markdownComponents: Components = {
  h1: ({ node, children, ...props }) => (
    <h1
      id={slugifyHeading(getNodeText(children))}
      className="type-page-title mt-10 mb-5 pb-3 border-b border-zinc-200/70 dark:border-white/10 scroll-mt-24"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }) => {
    const id = slugifyHeading(getNodeText(children))
    return (
      <h2
        id={id}
        className="type-section-title mt-10 mb-4 scroll-mt-24"
        {...props}
      >
        {children}
      </h2>
    )
  },
  h3: ({ node, children, ...props }) => {
    const id = slugifyHeading(getNodeText(children))
    return (
      <h3
        id={id}
        className="mt-8 mb-3 scroll-mt-24"
        {...props}
      >
        {children}
      </h3>
    )
  },
  h4: ({ node, children, ...props }) => {
    const id = slugifyHeading(getNodeText(children))
    return (
      <h4
        id={id}
        className="text-lg font-subhead text-zinc-900 dark:text-zinc-50 mt-6 mb-2 scroll-mt-24"
        {...props}
      >
        {children}
      </h4>
    )
  },
  p: ({ node, children, ...props }) => (
    <p className="type-body mb-4" {...props}>
      {children}
    </p>
  ),
  a: ({ node, href, children, ...props }) => {
    const isExternal = href?.startsWith('http')
    return (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-blue-500/30 hover:decoration-blue-500/60 transition-colors inline-flex items-center gap-1"
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
        {isExternal && <ExternalLink className="w-3 h-3" />}
      </a>
    )
  },
  ul: ({ node, children, ...props }) => (
    <ul
      className="list-disc list-inside space-y-2 mb-4 ml-2 type-body"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ node, children, ...props }) => (
    <ol
      className="list-decimal list-inside space-y-2 mb-4 ml-2 type-body"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ node, children, ...props }) => (
    <li className="type-body" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ node, children, ...props }) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 py-2 my-5 bg-blue-50/60 dark:bg-blue-900/20 rounded-r-xl italic text-zinc-500 dark:text-zinc-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: rawProps => {
    const { node, inline, className, children, ...props } = rawProps as ComponentPropsWithoutRef<'code'> &
      ExtraProps & {
        inline?: boolean
      }
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-zinc-100/80 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className={`${className} block text-sm font-mono text-zinc-50`}
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: CodeBlock,
  table: ({ node, children, ...props }) => (
    <div className="overflow-x-auto my-6 rounded-xl border border-zinc-200/70 dark:border-white/10 shadow-sm">
      <table
        className="min-w-full divide-y divide-zinc-200/70 dark:divide-white/10 text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ node, children, ...props }) => (
    <thead className="bg-zinc-50 dark:bg-white/5" {...props}>
      {children}
    </thead>
  ),
  th: ({ node, children, ...props }) => (
    <th
      className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-200 whitespace-nowrap"
      {...props}
    >
      {children}
    </th>
  ),
  tbody: ({ node, children, ...props }) => (
    <tbody
      className="divide-y divide-zinc-100 dark:divide-white/10 bg-white dark:bg-zinc-950/40"
      {...props}
    >
      {children}
    </tbody>
  ),
  td: ({ node, children, ...props }) => (
    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-300" {...props}>
      {children}
    </td>
  ),
  tr: ({ node, children, ...props }) => (
    <tr className="hover:bg-zinc-50/70 dark:hover:bg-white/5 transition-colors" {...props}>
      {children}
    </tr>
  ),
  hr: ({ node, ...props }) => (
    <hr className="my-10 border-zinc-200/70 dark:border-white/10" {...props} />
  ),
  img: ({ node, src, alt, ...props }) => {
    // Rendering markdown images via <img> is intentional (unknown dimensions / external URLs).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="rounded-xl shadow-lg my-4 max-w-full" {...props} />
  },
}

// ============================================================================
// Main Docs Page Component
// ============================================================================

interface DocsPageProps {
  params: Promise<{
    slug?: string[]
  }>
}

export default function DocsPage({ params }: DocsPageProps) {
  const { slug } = use(params)
  const [content, setContent] = useState<string>('')
  const [title, setTitle] = useState<string>('Documentation')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastModified, setLastModified] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toc, setToc] = useState<TableOfContentsItem[]>([])
  const [activeTocId, setActiveTocId] = useState('')
  const [showScrollTop, setShowScrollTop] = useState(false)

  const currentSlug = slug?.join('/') || ''

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
        setLastModified(res.headers.get('last-modified'))

        // Extract table of contents from content
        const headings: TableOfContentsItem[] = []
        const headingRegex = /^(#{2,4})\s+(.+)$/gm
        let match
        while ((match = headingRegex.exec(data.content || '')) !== null) {
          const level = match[1].length
          const text = match[2].trim()
          const id = slugifyHeading(text)
          headings.push({ id, text, level })
        }
        setToc(headings)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch doc:', err)
        }
        setError('Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchDoc()
  }, [currentSlug])

  // Track scroll position for TOC highlighting and scroll-to-top button
  useEffect(() => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 400)

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

    handleScroll()
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
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

  const lastModifiedLabel =
    lastModified && !Number.isNaN(new Date(lastModified).getTime())
      ? new Date(lastModified).toLocaleDateString()
      : null

  const scrollToTop = () => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatSlugSegment = (segment: string) =>
    segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    ...(slug && slug.length > 0
      ? slug.map((segment, index) => {
          const isLast = index === slug.length - 1
          return {
            label: isLast ? title : formatSlugSegment(segment),
            href: isLast ? undefined : `/docs/${slug.slice(0, index + 1).join('/')}`,
          }
        })
      : [{ label: title }]),
  ]

  return (
    <PageWrapper maxWidth="full" showPattern breadcrumbs={breadcrumbs}>
      <div className="min-h-screen flex gap-6">
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
          <div className="h-full flex flex-col bg-white/70 dark:bg-zinc-950/25 backdrop-blur-xl border-r border-zinc-200/70 dark:border-white/10">
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-4 py-4 border-b border-zinc-200/70 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <Link href="/docs" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 dark:bg-zinc-950/40 shadow-glass-sm ring-1 ring-white/60 dark:ring-white/10 backdrop-blur-md">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h1 className="font-semibold text-zinc-900 dark:text-zinc-100">Docs</h1>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">praDeep</span>
                    </div>
                  </Link>

                  {/* Mobile close button */}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 rounded-lg hover:bg-zinc-100/80 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search docs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/60 dark:bg-zinc-950/40 border border-white/55 dark:border-white/10 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/40 shadow-glass-sm backdrop-blur-md transition-all"
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
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-3 mb-2">
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
              <div className="px-4 py-3 border-t border-zinc-200/70 dark:border-white/10 bg-white/30 dark:bg-zinc-950/10">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-white/55 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to App</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="sticky top-0 z-30 lg:hidden bg-white/70 dark:bg-zinc-950/25 backdrop-blur-xl border-b border-zinc-200/70 dark:border-white/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-zinc-100/80 dark:hover:bg-white/10 transition-colors"
              >
                <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
              </button>
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{title}</h1>
            </div>
          </div>

          {/* Content Area */}
          <div className="max-w-4xl mx-auto px-2 py-6 lg:py-10">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              {/* Document Content */}
              <Card variant="glass" interactive={false} className="overflow-hidden">
                <CardBody className="p-8 lg:p-12">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <motion.div
                        className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <p className="mt-4 text-zinc-500 dark:text-zinc-400">Loading documentation...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-red-500" />
                      </div>
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        {error}
                      </h2>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                        The document you are looking for might have been moved or does not exist.
                      </p>
                      <Link
                        href="/docs"
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                      >
                        Back to Documentation
                      </Link>
                    </div>
                  ) : (
                    <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
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
                  className="mt-8 pt-8 border-t border-zinc-200/70 dark:border-white/10"
                >
                  <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                    {lastModifiedLabel ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Last updated {lastModifiedLabel}</span>
                      </div>
                    ) : (
                      <span />
                    )}
                    <a
                      href={`https://github.com/HKUDS/praDeep/edit/main/docs/${currentSlug || 'index'}.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Edit this page
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

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
              className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
