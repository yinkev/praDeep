'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Book, Brain, FileText, Search, Send, Trash2, X, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import Button, { IconButton } from '@/components/ui/Button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/LoadingState'
import MediaUpload from '@/components/ui/MediaUpload'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { useGlobal, type MediaItem } from '@/context/GlobalContext'
import { API_BASE_URL, apiUrl } from '@/lib/api'
import { parseKnowledgeBaseList } from '@/lib/knowledge'
import { processLatexContent } from '@/lib/latex'
import { cn } from '@/lib/utils'

// ============================================================================
// Helpers
// ============================================================================

const defaultAgentStatus = {
  InvestigateAgent: 'pending',
  NoteAgent: 'pending',
  ManagerAgent: 'pending',
  SolveAgent: 'pending',
  ToolAgent: 'pending',
  ResponseAgent: 'pending',
  PrecisionAnswerAgent: 'pending',
} as const

const defaultTokenStats = {
  model: 'Unknown',
  calls: 0,
  tokens: 0,
  input_tokens: 0,
  output_tokens: 0,
  cost: 0,
}

const resolveArtifactUrl = (url?: string | null, outputDir?: string) => {
  if (!url) return ''

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const normalized = url.replace(/^\.\//, '')

  if (normalized.startsWith('/api/outputs/')) {
    return `${API_BASE_URL}${normalized}`
  }

  if (normalized.startsWith('api/outputs/')) {
    return `${API_BASE_URL}/${normalized}`
  }

  if (normalized.startsWith('artifacts/') && outputDir) {
    return `${API_BASE_URL}/api/outputs/solve/${outputDir}/${normalized}`
  }

  return url
}

const selectClassName = cn(
  'h-10 rounded-lg px-3 text-sm',
  'border border-border bg-surface-elevated shadow-sm backdrop-blur-md',
  'text-text-primary',
  'hover:bg-white/70 hover:border-white/70',
  'focus:outline-none focus:ring-2 focus:ring-accent-primary/20',
  'disabled:opacity-60 disabled:cursor-not-allowed',
  'dark:border-border dark:bg-surface-elevated dark:text-text-primary dark:hover:bg-white/10'
)

const glassCardClassName = cn(
  'border-border bg-surface-elevated shadow-glass-sm',
  'dark:border-border dark:bg-surface-elevated'
)

function StageBadge({
  stage,
  isSolving,
}: {
  stage: 'investigate' | 'solve' | 'response' | null
  isSolving: boolean
}) {
  if (!isSolving) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium text-text-secondary shadow-sm backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent-primary/40 opacity-35" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-primary" />
        </span>
        Ready
      </span>
    )
  }

  const config =
    stage === 'investigate'
      ? { label: 'Investigating', icon: Search, className: 'text-accent-primary' }
      : stage === 'solve'
        ? { label: 'Solving', icon: Brain, className: 'text-accent-primary' }
        : stage === 'response'
          ? { label: 'Responding', icon: FileText, className: 'text-accent-primary' }
          : { label: 'Running', icon: Zap, className: 'text-accent-primary' }

  const Icon = config.icon

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/10 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md">
      <Spinner size="sm" className="text-accent-primary" />
      <Icon className={cn('h-3.5 w-3.5', config.className)} />
      <span className={cn(config.className)}>{config.label}</span>
    </span>
  )
}

function TraceLine({ content, level }: { content: string; level?: string }) {
  let cleanContent = content
  cleanContent = cleanContent.replace(/^INFO:[^:]+:/, '')
  cleanContent = cleanContent.replace(/^ERROR:[^:]+:INFO:/, 'INFO:')

  const stageMatch = cleanContent.match(
    /^([>...V~X*])\s*\[Stage:([^\]]+)\]\s*(\w+)(?:\s*\|\s*(.+))?/
  )
  const isSeparator = /^={20,}$/.test(cleanContent.trim())
  const isError =
    (level === 'ERROR' && !cleanContent.includes('INFO:')) ||
    (cleanContent.includes('ERROR') && !cleanContent.includes('INFO:')) ||
    cleanContent.includes('X')

  if (isSeparator) return null

  let chrome = 'border-border bg-surface-elevated text-text-secondary'
  let accent = 'border-l-border'

  if (stageMatch) {
    const [, , , status] = stageMatch
    if (status === 'start' || status === 'running') {
      chrome = 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary'
      accent = 'border-l-accent-primary/60'
    } else if (status === 'complete') {
      chrome = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      accent = 'border-l-emerald-500/60'
    } else if (status === 'error') {
      chrome = 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
      accent = 'border-l-red-500/60'
    }
  } else if (isError) {
    chrome = 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
    accent = 'border-l-red-500/60'
  }

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-[11px] font-mono leading-relaxed backdrop-blur-sm',
        'border-l-2',
        chrome,
        accent
      )}
    >
      {cleanContent}
    </div>
  )
}

function MarkdownAnswer({ content, outputDir }: { content: string; outputDir?: string }) {
  const markdownComponents = useMemo(
    () => ({
      img: ({ src, alt, ...props }: React.ComponentProps<'img'>) => {
        const resolvedSrc =
          resolveArtifactUrl(typeof src === 'string' ? src : '', outputDir) || undefined
        return (
          // Rendering markdown images via <img> is intentional (unknown dimensions / external URLs).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            {...props}
            src={resolvedSrc}
            alt={alt ?? ''}
            loading="lazy"
            className="max-w-full rounded-lg border border-border bg-surface-elevated shadow-sm"
          />
        )
      },
      a: ({ href, ...props }: React.ComponentProps<'a'>) => (
        <a
          {...props}
          href={resolveArtifactUrl(typeof href === 'string' ? href : '', outputDir) || undefined}
          target="_blank"
          rel="noreferrer"
          className="text-accent-primary hover:underline"
        />
      ),
      pre: (props: React.ComponentProps<'pre'>) => (
        <pre
          {...props}
          className="overflow-x-auto rounded-lg border border-zinc-900/10 bg-zinc-950 p-4 text-zinc-100 shadow-inner dark:border-white/10"
        />
      ),
      code: ({ className, children, ...props }: React.ComponentProps<'code'>) => {
        const isInline = !className
        return (
          <code
            {...props}
            className={cn(isInline && 'rounded bg-surface-elevated px-1.5 py-0.5 text-[0.92em]')}
          >
            {children}
          </code>
        )
      },
    }),
    [outputDir]
  )

  return (
    <div className="prose prose-zinc prose-sm max-w-none text-text-primary dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        urlTransform={url => resolveArtifactUrl(url, outputDir)}
        components={markdownComponents}
      >
        {processLatexContent(content)}
      </ReactMarkdown>
    </div>
  )
}

// ============================================================================
// Page
// ============================================================================

type SolverRun = {
  id: string
  user: { content: string; media?: MediaItem[] }
  assistant?: { content: string; outputDir?: string }
}

export default function SolverPage() {
  const { solverState, setSolverState, startSolver, stopSolver } = useGlobal()

  const [draft, setDraft] = useState('')
  const [draftMedia, setDraftMedia] = useState<MediaItem[]>([])
  const [kbs, setKbs] = useState<string[]>([])
  const [isTraceOpen, setIsTraceOpen] = useState(false)

  const runsEndRef = useRef<HTMLDivElement>(null)
  const traceContainerRef = useRef<HTMLDivElement>(null)

  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [notebookRecord, setNotebookRecord] = useState<{
    title: string
    userQuery: string
    output: string
  } | null>(null)

  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        const kbsList = parseKnowledgeBaseList(data)
        const names = kbsList.map(kb => kb.name)
        setKbs(names)

        setSolverState(prev => {
          if (prev.selectedKb) return prev
          const defaultKb = kbsList.find(kb => kb.is_default)?.name
          return { ...prev, selectedKb: defaultKb ?? names[0] ?? '' }
        })
      })
      .catch(err => console.error('Failed to fetch KBs:', err))
  }, [setSolverState])

  const runs: SolverRun[] = useMemo(() => {
    const built: SolverRun[] = []
    const messages = solverState.messages

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (msg.role !== 'user') continue

      const next = messages[i + 1]
      const assistant = next?.role === 'assistant' ? next : undefined

      built.push({
        id: `${i}-${msg.content.slice(0, 24)}`,
        user: { content: msg.content, media: msg.media },
        assistant: assistant
          ? { content: assistant.content, outputDir: assistant.outputDir }
          : undefined,
      })

      if (assistant) i++
    }

    return built
  }, [solverState.messages])

  const filteredLogs = useMemo(() => {
    const out = []
    const recent: string[] = []

    for (const log of solverState.logs) {
      const content = (log.content || '').trim()
      if (!content) continue

      const normalized = content.replace(/\s+/g, ' ')
      if (recent.includes(normalized)) continue
      recent.push(normalized)
      if (recent.length > 12) recent.shift()

      if (
        normalized.includes('Provider List:') ||
        (normalized.includes('INFO:') &&
          !normalized.includes('[Stage:') &&
          !normalized.includes('[Tool')) ||
        (normalized.match(/^\d{4}-\d{2}-\d{2}/) && !normalized.includes('[Stage:')) ||
        (normalized.includes('INFO:MainSolver:') && !normalized.includes('[Stage:')) ||
        (normalized.includes('INFO:investigate_agent:') &&
          !normalized.includes('[Tool') &&
          !normalized.includes('[Stage:'))
      ) {
        continue
      }

      out.push({ ...log, content: normalized })
    }

    return out
  }, [solverState.logs])

  useEffect(() => {
    runsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [solverState.messages.length, solverState.isSolving])

  useEffect(() => {
    if (!solverState.isSolving) return
    if (!traceContainerRef.current) return
    if (solverState.logs.length === 0) return

    traceContainerRef.current.scrollTo({
      top: traceContainerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [solverState.logs.length, solverState.isSolving])

  const canSolve =
    Boolean(solverState.selectedKb) &&
    !solverState.isSolving &&
    (draft.trim().length > 0 || draftMedia.length > 0)

  const handleSolve = () => {
    if (!draft.trim() && draftMedia.length === 0) return
    if (!solverState.selectedKb) return
    if (solverState.isSolving) return

    startSolver(draft, solverState.selectedKb, draftMedia.length > 0 ? draftMedia : undefined)
    setDraft('')
    setDraftMedia([])
  }

  const handleReset = () => {
    if (solverState.isSolving) stopSolver()

    setSolverState(prev => ({
      ...prev,
      isSolving: false,
      logs: [],
      messages: [],
      question: '',
      agentStatus: { ...defaultAgentStatus },
      tokenStats: { ...defaultTokenStats },
      progress: { stage: null, progress: {} },
    }))
  }

  const openNotebook = (userQuery: string, output: string) => {
    setNotebookRecord({
      title: userQuery.slice(0, 100) + (userQuery.length > 100 ? '…' : ''),
      userQuery,
      output,
    })
    setShowNotebookModal(true)
  }

  const sidebar = (
    <div className="space-y-6">
      <Card variant="glass" interactive={false} padding="none" className={glassCardClassName}>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">Run</div>
              <div className="text-xs text-text-tertiary">Live progress + stats</div>
            </div>
          </div>

          {solverState.isSolving && (
            <Button
              variant="destructive"
              size="sm"
              iconLeft={<X className="h-3.5 w-3.5" />}
              onClick={stopSolver}
            >
              Stop
            </Button>
          )}
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StageBadge stage={solverState.progress.stage} isSolving={solverState.isSolving} />
            {solverState.selectedKb && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-text-secondary shadow-sm backdrop-blur-md">
                <Book className="h-3.5 w-3.5 text-accent-primary" />
                <span className="max-w-[160px] truncate">{solverState.selectedKb}</span>
              </span>
            )}
          </div>

          {solverState.tokenStats.calls > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-sm backdrop-blur-md">
                <div className="text-text-tertiary">Model</div>
                <div className="mt-0.5 truncate font-medium text-text-primary">
                  {solverState.tokenStats.model}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-sm backdrop-blur-md">
                <div className="text-text-tertiary">Calls</div>
                <div className="mt-0.5 font-medium text-text-primary">
                  {solverState.tokenStats.calls}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-sm backdrop-blur-md">
                <div className="text-text-tertiary">Tokens</div>
                <div className="mt-0.5 font-medium text-text-primary">
                  {solverState.tokenStats.tokens.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs shadow-sm backdrop-blur-md">
                <div className="text-text-tertiary">Cost</div>
                <div className="mt-0.5 font-medium text-accent-primary">
                  ${solverState.tokenStats.cost.toFixed(4)}
                </div>
              </div>
            </div>
          )}

          {solverState.isSolving && solverState.progress.stage === 'investigate' && (
            <>
              {solverState.progress.progress.queries &&
                solverState.progress.progress.queries.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-text-secondary">Queries</div>
                    <div className="space-y-1">
                      {solverState.progress.progress.queries.slice(0, 4).map((query, idx) => (
                        <div
                          key={idx}
                          className="truncate rounded-lg border border-accent-primary/20 bg-accent-primary/10 px-3 py-1.5 text-[11px] text-accent-primary"
                        >
                          {query}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}

          {solverState.isSolving &&
            (solverState.progress.stage === 'solve' ||
              solverState.progress.stage === 'response') && (
              <>
                {solverState.progress.progress.step_id && (
                  <div className="rounded-lg border border-accent-primary/20 bg-accent-primary/10 px-3 py-2 text-xs text-accent-primary shadow-sm backdrop-blur-md">
                    <div className="font-semibold">Current step</div>
                    <div className="mt-0.5 text-[11px]">
                      Step {solverState.progress.progress.step_index || '?'}:{' '}
                      {solverState.progress.progress.step_target || 'Processing…'}
                    </div>
                  </div>
                )}
              </>
            )}
        </CardBody>
      </Card>

      <Card variant="glass" interactive={false} padding="none" className={glassCardClassName}>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated text-text-secondary shadow-sm backdrop-blur-md">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">Trace</div>
              <div className="text-xs text-text-tertiary">{filteredLogs.length} entries</div>
            </div>
          </div>
        </CardHeader>

        <CardBody padding="none" className="max-h-[540px] overflow-hidden">
          <div ref={traceContainerRef} className="max-h-[540px] overflow-y-auto p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-text-tertiary">
                <Activity className="h-10 w-10 opacity-20" />
                <div className="mt-3">No trace yet.</div>
                <div className="mt-1 text-xs">Start a run to see the live execution stream.</div>
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <TraceLine key={idx} content={log.content || ''} level={log.level} />
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )

  return (
    <PageWrapper maxWidth="full" showPattern={false} className="min-h-dvh px-0 py-0">
      <div className="relative min-h-dvh overflow-x-hidden bg-cloud dark:bg-zinc-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_35%,transparent_72%)] bg-[linear-gradient(to_right,rgba(24,24,27,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.07)_1px,transparent_1px)] bg-[length:56px_56px] dark:opacity-20 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
        />

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-accent-primary/20 blur-3xl dark:bg-accent-primary/15"
          animate={{ y: [0, 18, 0], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-56 left-8 h-[520px] w-[520px] rounded-full bg-accent-primary/10 blur-3xl dark:bg-accent-primary/10"
          animate={{ y: [0, -12, 0], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 12, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10">
          <PageHeader
            title="Solver"
            description="A clean, premium workspace for step-by-step problem solving with a transparent trace."
            icon={<Zap className="h-5 w-5 text-accent-primary" />}
            actions={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <StageBadge stage={solverState.progress.stage} isSolving={solverState.isSolving} />

                <IconButton
                  aria-label="Open trace panel"
                  variant="secondary"
                  size="md"
                  icon={<Activity className="h-full w-full" />}
                  onClick={() => setIsTraceOpen(true)}
                  className="lg:hidden"
                />

                <IconButton
                  aria-label="Clear solver history"
                  variant="ghost"
                  size="md"
                  icon={<Trash2 className="h-full w-full" />}
                  onClick={handleReset}
                  disabled={solverState.isSolving || solverState.messages.length === 0}
                />

                <select
                  value={solverState.selectedKb}
                  onChange={e => setSolverState(prev => ({ ...prev, selectedKb: e.target.value }))}
                  className={cn(selectClassName, 'w-44 sm:w-56')}
                  disabled={kbs.length === 0}
                >
                  {kbs.length === 0 ? (
                    <option value="">Loading knowledge bases…</option>
                  ) : (
                    kbs.map(kb => (
                      <option key={kb} value={kb}>
                        {kb}
                      </option>
                    ))
                  )}
                </select>
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <Card
                variant="glass"
                interactive={false}
                padding="none"
                className={glassCardClassName}
              >
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">Problem</div>
                    <div className="mt-1 text-xs text-text-tertiary">
                      Paste the question, context, and constraints. Attach images if needed.
                    </div>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    {solverState.isSolving ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        iconLeft={<X className="h-3.5 w-3.5" />}
                        onClick={stopSolver}
                      >
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        iconRight={<Send className="h-3.5 w-3.5" />}
                        onClick={handleSolve}
                        disabled={!canSolve}
                      >
                        Solve
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardBody className="space-y-4">
                  <Textarea
                    label="Describe the problem"
                    floatingLabel
                    minRows={6}
                    maxRows={14}
                    placeholder="e.g. Solve the equation…, prove…, derive…, optimize…, explain the concept…, etc."
                    value={draft}
                    disabled={solverState.isSolving}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault()
                        handleSolve()
                      }
                    }}
                    className="bg-white/70 backdrop-blur-md dark:bg-white/5"
                  />

                  <MediaUpload
                    media={draftMedia}
                    onMediaChange={setDraftMedia}
                    disabled={solverState.isSolving}
                    maxFiles={5}
                  />
                </CardBody>

                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-text-tertiary">
                    Tip: Use{' '}
                    <span className="font-semibold text-text-secondary">Cmd/Ctrl + Enter</span> to
                    solve.
                  </div>

                  <div className="flex w-full gap-2 sm:hidden">
                    {solverState.isSolving ? (
                      <Button
                        variant="destructive"
                        size="md"
                        iconLeft={<X className="h-4 w-4" />}
                        className="flex-1"
                        onClick={stopSolver}
                      >
                        Stop
                      </Button>
                    ) : (
                      <Button
                        size="md"
                        iconRight={<Send className="h-4 w-4" />}
                        className="flex-1"
                        onClick={handleSolve}
                        disabled={!canSolve}
                      >
                        Solve
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>

              <div className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">Runs</h2>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Each run stores your prompt + the solver's final answer.
                    </p>
                  </div>
                </div>

                {runs.length === 0 ? (
                  <Card
                    variant="glass"
                    interactive={false}
                    padding="lg"
                    className={glassCardClassName}
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div className="mt-4 text-base font-semibold text-text-primary">
                        Ready when you are.
                      </div>
                      <div className="mt-1 text-sm text-text-secondary">
                        Add a problem above, then hit Solve.
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {runs.map((run, idx) => (
                      <Card
                        key={run.id}
                        variant="glass"
                        interactive={false}
                        padding="none"
                        className={glassCardClassName}
                      >
                        <CardHeader className="flex-row items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                              Run {idx + 1}
                            </div>
                            <div className="mt-1 line-clamp-2 text-sm font-semibold text-text-primary">
                              {run.user.content || 'Untitled prompt'}
                            </div>
                          </div>

                          {run.assistant && (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconLeft={<Book className="h-3.5 w-3.5" />}
                              onClick={() => openNotebook(run.user.content, run.assistant!.content)}
                              className="text-accent-primary"
                            >
                              Notebook
                            </Button>
                          )}
                        </CardHeader>

                        <CardBody className="space-y-4">
                          {run.user.media && run.user.media.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {run.user.media.map((item, mediaIdx) => (
                                <div
                                  key={mediaIdx}
                                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-sm"
                                >
                                  {item.type === 'image' ? (
                                    <Image
                                      src={`data:${item.mimeType};base64,${item.data}`}
                                      alt={item.name || `Image ${mediaIdx + 1}`}
                                      width={80}
                                      height={80}
                                      className="h-full w-full object-cover"
                                      sizes="80px"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-text-tertiary">
                                      Video
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {run.assistant ? (
                            <MarkdownAnswer
                              content={run.assistant.content}
                              outputDir={run.assistant.outputDir}
                            />
                          ) : (
                            <div className="flex items-center gap-3 rounded-xl border border-accent-primary/20 bg-accent-primary/10 px-4 py-3 text-sm text-accent-primary shadow-sm backdrop-blur-md">
                              <Spinner size="md" className="text-accent-primary" />
                              <div>
                                <div className="font-semibold">Solving…</div>
                                <div className="text-xs opacity-80">
                                  {solverState.progress.stage
                                    ? `Stage: ${solverState.progress.stage}`
                                    : 'Working'}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardBody>

                        {run.assistant && (
                          <CardFooter className="flex items-center justify-between">
                            <div className="text-xs text-text-tertiary">
                              praDeep can make mistakes. Verify important information.
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              iconLeft={<Book className="h-3.5 w-3.5" />}
                              onClick={() => openNotebook(run.user.content, run.assistant!.content)}
                            >
                              Save
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                    <div ref={runsEndRef} />
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:block">{sidebar}</div>
          </div>
        </div>

        {/* Mobile Trace Panel */}
        <AnimatePresence>
          {isTraceOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div
                className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
                onClick={() => setIsTraceOpen(false)}
              />
              <motion.div
                initial={{ y: 24, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute inset-x-0 bottom-0 p-4"
              >
                <div className="mx-auto max-h-[85vh] max-w-xl overflow-y-auto rounded-2xl">
                  <div className="flex items-center justify-end pb-3">
                    <IconButton
                      aria-label="Close trace panel"
                      variant="secondary"
                      size="md"
                      icon={<X className="h-full w-full" />}
                      onClick={() => setIsTraceOpen(false)}
                    />
                  </div>
                  {sidebar}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {notebookRecord && (
          <AddToNotebookModal
            isOpen={showNotebookModal}
            onClose={() => {
              setShowNotebookModal(false)
              setNotebookRecord(null)
            }}
            recordType="solve"
            title={notebookRecord.title}
            userQuery={notebookRecord.userQuery}
            output={notebookRecord.output}
            kbName={solverState.selectedKb}
          />
        )}
      </div>
    </PageWrapper>
  )
}
