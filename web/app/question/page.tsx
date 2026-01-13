'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  Book,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileQuestion,
  FileText,
  Loader2,
  PenTool,
  RefreshCw,
  Upload,
  Zap,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

import { useGlobal } from '@/context/GlobalContext'
import { apiUrl } from '@/lib/api'
import { parseKnowledgeBaseList } from '@/lib/knowledge'
import { processLatexContent } from '@/lib/latex'
import { cn } from '@/lib/utils'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import { QuestionDashboard } from '@/components/question/QuestionDashboard'
import { useQuestionReducer } from '@/hooks/useQuestionReducer'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import type { GeneratedQuestion } from '@/types/question'

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 340, damping: 32 },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -24 : 24,
    transition: { duration: 0.15 },
  }),
}

const selectClassName = cn(
  'h-10 px-3 text-sm',
  'bg-white/70 dark:bg-white/5 backdrop-blur-md',
  'border border-zinc-200/70 dark:border-white/10',
  'rounded-lg',
  'text-zinc-900 dark:text-zinc-50',
  'outline-none',
  'hover:border-zinc-300 dark:hover:border-white/20',
  'focus:border-zinc-400 focus:ring-2 focus:ring-blue-500/20',
  'disabled:opacity-50 disabled:cursor-not-allowed'
)

type QuestionKindSource = Pick<GeneratedQuestion, 'question_type' | 'type'> | null | undefined

function getQuestionKind(question: QuestionKindSource) {
  return (question?.question_type ?? question?.type ?? '').toString()
}

function formatQuestionTypeLabel(question: QuestionKindSource) {
  const kind = getQuestionKind(question)
  if (!kind) return 'Question'
  if (kind === 'choice') return 'Multiple Choice'
  if (kind === 'written') return 'Written'
  return kind
}

export default function QuestionPage() {
  const {
    questionState,
    setQuestionState,
    startQuestionGen,
    startMimicQuestionGen,
    resetQuestionGen,
  } = useGlobal()

  const toast = useToast()

  const [dashboardState] = useQuestionReducer()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'questions' | 'process'>('questions')

  const [kbs, setKbs] = useState<string[]>([])

  const [activeIdx, setActiveIdx] = useState(0)
  const [navDir, setNavDir] = useState(1)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [submittedMap, setSubmittedMap] = useState<Record<number, boolean>>({})
  const [showValidation, setShowValidation] = useState(false)
  const [showNotebookModal, setShowNotebookModal] = useState(false)

  const isConfig = questionState.step === 'config'
  const isGenerating = questionState.step === 'generating'
  const totalQuestions = questionState.results.length
  const currentQuestion = questionState.results[activeIdx]

  const completedCount = useMemo(
    () => Object.keys(submittedMap).filter(k => submittedMap[parseInt(k)]).length,
    [submittedMap]
  )
  const extendedCount = useMemo(
    () => questionState.results.filter((r: { extended?: boolean }) => Boolean(r.extended)).length,
    [questionState.results]
  )

  const progressPct = useMemo(() => {
    if (!totalQuestions) return 0
    return Math.round((completedCount / totalQuestions) * 100)
  }, [completedCount, totalQuestions])

  const currentQuestionTypeLabel = useMemo(
    () => formatQuestionTypeLabel(currentQuestion?.question),
    [currentQuestion?.question]
  )

  const isChoiceQuestion = useMemo(() => {
    const kind = getQuestionKind(currentQuestion?.question)
    return kind === 'choice'
  }, [currentQuestion?.question])

  const correctAnswerKey = useMemo(() => {
    const v = currentQuestion?.question?.correct_answer
    if (v === null || v === undefined) return ''
    return String(v)
  }, [currentQuestion?.question?.correct_answer])

  const selectedAnswerKey = userAnswers[activeIdx] ?? ''
  const hasAnswer = Boolean(selectedAnswerKey.trim())
  const isSubmitted = Boolean(submittedMap[activeIdx])
  const isChoiceCorrect = isChoiceQuestion && isSubmitted ? selectedAnswerKey === correctAnswerKey : null

  const sourceLabel =
    questionState.mode === 'mimic'
      ? questionState.uploadedFile?.name || questionState.paperPath || 'Mimic Exam'
      : questionState.topic || 'Custom Mode'

  // Fetch KBs on mount
  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        const names = parseKnowledgeBaseList(data).map(kb => kb.name)
        setKbs(names)
        if (names.length > 0) {
          setQuestionState(prev => (prev.selectedKb ? prev : { ...prev, selectedKb: names[0] }))
        }
      })
      .catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch KBs:', err)
        }
        toast.error('Failed to load knowledge bases', 'Network error')
      })
  }, [setQuestionState, toast])

  // Keep activeIdx within bounds as results stream in/out
  useEffect(() => {
    if (totalQuestions === 0) return
    if (activeIdx < totalQuestions) return
    const nextIdx = Math.max(0, totalQuestions - 1)
    const raf = requestAnimationFrame(() => setActiveIdx(nextIdx))
    return () => cancelAnimationFrame(raf)
  }, [activeIdx, totalQuestions])

  // Auto-switch to questions when generation completes
  useEffect(() => {
    if (questionState.step === 'result' && totalQuestions > 0) {
      const raf = requestAnimationFrame(() => setActiveTab('questions'))
      return () => cancelAnimationFrame(raf)
    }
  }, [questionState.step, totalQuestions])

  const navigateQuestion = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= totalQuestions) return
    setNavDir(newIdx > activeIdx ? 1 : -1)
    setActiveIdx(newIdx)
    setShowValidation(false)
  }

  const handleAnswer = (value: string) => {
    if (submittedMap[activeIdx]) return
    setUserAnswers(prev => ({ ...prev, [activeIdx]: value }))
  }

  const handleSubmit = () => {
    setSubmittedMap(prev => ({ ...prev, [activeIdx]: true }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && file.type !== 'application/pdf') {
      e.currentTarget.value = ''
      toast.warning('Please upload a PDF exam paper')
      return
    }
    setQuestionState(prev => ({
      ...prev,
      uploadedFile: file,
      paperPath: file ? '' : prev.paperPath,
    }))
  }

  const startGeneration = () => {
    if (questionState.mode === 'knowledge') {
      startQuestionGen(
        questionState.topic,
        questionState.difficulty,
        questionState.type,
        Math.max(1, questionState.count),
        questionState.selectedKb,
        questionState.enableCouncilValidation
      )
    } else {
      startMimicQuestionGen(
        questionState.uploadedFile,
        questionState.paperPath,
        questionState.selectedKb,
        questionState.count > 0 ? questionState.count : undefined
      )
    }

    setUserAnswers({})
    setSubmittedMap({})
    setActiveIdx(0)
    setShowValidation(false)
    setActiveTab('process')
  }

  const canGenerate =
    questionState.mode === 'knowledge'
      ? Boolean(questionState.topic.trim())
      : Boolean(questionState.uploadedFile || questionState.paperPath.trim())

  const headerStatus = isConfig
    ? 'Setup'
    : isGenerating
      ? 'Generating'
      : questionState.step === 'result'
        ? 'Ready'
        : 'Session'

  const headerStatusTone = isGenerating
    ? 'border-blue-200/70 bg-blue-50/70 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200'
    : 'border-white/60 bg-white/60 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'

  return (
    <PageWrapper maxWidth="wide" showPattern>
      <PageHeader
        title="Question Generator"
        description="Generate premium practice questions and take a clean, focused quiz."
        icon={<PenTool className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span
              className={cn(
                'hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-xs backdrop-blur-md',
                headerStatusTone
              )}
            >
              {isGenerating ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-35" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              )}
              {headerStatus}
            </span>

            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <select
                value={questionState.selectedKb}
                onChange={e => setQuestionState(prev => ({ ...prev, selectedKb: e.target.value }))}
                disabled={!isConfig || isGenerating}
                aria-label="Knowledge base"
                className={cn(selectClassName, 'w-44 sm:w-56')}
              >
                {kbs.map(kb => (
                  <option key={kb} value={kb}>
                    {kb}
                  </option>
                ))}
              </select>
            </div>

            {!isConfig && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<RefreshCw className="h-4 w-4" />}
                onClick={resetQuestionGen}
              >
                New session
              </Button>
            )}
          </div>
        }
      />

      {/* Mode + Tabs */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs text-zinc-700 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
            {questionState.mode === 'knowledge' ? (
              <BrainCircuit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            )}
            <span className="font-medium">
              {questionState.mode === 'knowledge' ? 'Custom' : 'Mimic'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">•</span>
            <span className="max-w-[260px] truncate text-zinc-600 dark:text-zinc-300">
              {sourceLabel}
            </span>
          </span>

          {!isConfig && questionState.mode === 'knowledge' && (
            <>
              <span className="hidden sm:inline-flex items-center rounded-full border border-white/55 bg-white/55 px-3 py-1 text-xs text-zinc-600 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                {questionState.difficulty}
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-white/55 bg-white/55 px-3 py-1 text-xs text-zinc-600 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                {formatQuestionTypeLabel({ question_type: questionState.type })}
              </span>
            </>
          )}
        </div>

        {!isConfig && (
          <Card
            variant="glass"
            interactive={false}
            padding="none"
            className="rounded-2xl p-1 border-white/55 bg-white/55 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex gap-1">
              <Button
                onClick={() => setActiveTab('questions')}
                variant={activeTab === 'questions' ? 'secondary' : 'ghost'}
                size="sm"
                iconLeft={<FileQuestion className="h-4 w-4" />}
                className="!rounded-xl"
              >
                Quiz
              </Button>
              <Button
                onClick={() => setActiveTab('process')}
                variant={activeTab === 'process' ? 'secondary' : 'ghost'}
                size="sm"
                iconLeft={<Activity className="h-4 w-4" />}
                iconRight={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                className="!rounded-xl"
              >
                Process
              </Button>
            </div>
          </Card>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isConfig ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto"
          >
            <Card
              variant="glass"
              interactive={false}
              padding="none"
              className="rounded-2xl overflow-hidden"
            >
              <CardHeader className="bg-white/50 dark:bg-white/5 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Setup
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Choose a mode, tune the settings, then generate.
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardBody padding="lg" className="space-y-7">
                {/* Mode Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        id: 'knowledge',
                        title: 'Custom Mode',
                        description: 'Generate from your knowledge base.',
                        icon: BrainCircuit,
                      },
                      {
                        id: 'mimic',
                        title: 'Mimic Exam',
                        description: 'Generate similar questions from a paper.',
                        icon: FileText,
                      },
                    ] as const
                  ).map(mode => {
                    const isActive = questionState.mode === mode.id
                    const Icon = mode.icon
                    return (
                      <motion.button
                        key={mode.id}
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          if (isGenerating) return
                          setQuestionState(prev => ({
                            ...prev,
                            mode: mode.id,
                            count: mode.id === 'knowledge' ? Math.max(1, prev.count) : prev.count,
                          }))
                        }}
                        className={cn(
                          'group rounded-2xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] shadow-xs',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
                          isActive
                            ? 'border-blue-300/70 bg-blue-50/70 dark:border-blue-400/25 dark:bg-blue-500/10'
                            : 'border-white/55 bg-white/55 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs',
                              isActive
                                ? 'border-blue-200/70 bg-white/70 text-blue-700 dark:border-blue-400/20 dark:bg-white/5 dark:text-blue-200'
                                : 'border-white/60 bg-white/70 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                              {mode.title}
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                              {mode.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Custom Mode */}
                {questionState.mode === 'knowledge' && (
                  <div className="space-y-5">
                    <Input
                      label="Topic"
                      floatingLabel
                      size="lg"
                      value={questionState.topic}
                      onChange={e => setQuestionState(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="e.g. Gradient Descent Optimization"
                      className="rounded-2xl"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Difficulty
                        </p>
                        <div className="flex gap-1 rounded-2xl border border-white/55 bg-white/55 p-1 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                          {(['easy', 'medium', 'hard'] as const).map(lvl => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setQuestionState(prev => ({ ...prev, difficulty: lvl }))}
                              className={cn(
                                'flex-1 rounded-xl px-3 py-2 text-sm font-medium capitalize transition-colors',
                                questionState.difficulty === lvl
                                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950/50 dark:text-zinc-50'
                                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50'
                              )}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Type
                        </p>
                        <div className="flex gap-1 rounded-2xl border border-white/55 bg-white/55 p-1 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                          {(
                            [
                              { id: 'choice', label: 'Multiple Choice' },
                              { id: 'written', label: 'Written' },
                            ] as const
                          ).map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setQuestionState(prev => ({ ...prev, type: t.id }))}
                              className={cn(
                                'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                                questionState.type === t.id
                                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950/50 dark:text-zinc-50'
                                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50'
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Question Count
                        </p>
                        <span className="inline-flex items-center rounded-full border border-white/55 bg-white/55 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                          {Math.max(1, Math.min(10, questionState.count))}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={Math.max(1, Math.min(10, questionState.count))}
                        onChange={e =>
                          setQuestionState(prev => ({ ...prev, count: parseInt(e.target.value) }))
                        }
                        className="w-full accent-blue-600 h-2 bg-zinc-200/70 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setQuestionState(prev => ({
                          ...prev,
                          enableCouncilValidation: !prev.enableCouncilValidation,
                        }))
                      }
                      aria-pressed={questionState.enableCouncilValidation}
                      className={cn(
                        'flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition-colors shadow-xs backdrop-blur-md',
                        questionState.enableCouncilValidation
                          ? 'border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-400/25 dark:bg-emerald-500/10'
                          : 'border-white/55 bg-white/55 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                          High accuracy validation (Council)
                        </p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          Uses multiple models to cross-check and synthesize the validation decision (slower).
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                          questionState.enableCouncilValidation
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-200 text-zinc-700 dark:bg-white/10 dark:text-zinc-200'
                        )}
                      >
                        {questionState.enableCouncilValidation ? 'On' : 'Off'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Mimic Mode */}
                {questionState.mode === 'mimic' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Upload Exam Paper (PDF)
                      </p>

                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      <label
                        htmlFor="pdf-upload"
                        className={cn(
                          'group flex items-center justify-between gap-4 rounded-2xl border border-dashed p-5 cursor-pointer',
                          'bg-white/55 hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10',
                          'border-zinc-300/60 hover:border-blue-300/70 dark:border-white/15 dark:hover:border-blue-400/30',
                          'transition-[background-color,border-color] shadow-xs backdrop-blur-md'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/55 bg-white/60 text-blue-700 shadow-xs dark:border-white/10 dark:bg-white/5 dark:text-blue-200">
                            {questionState.uploadedFile ? (
                              <FileText className="h-5 w-5" />
                            ) : (
                              <Upload className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                              {questionState.uploadedFile
                                ? questionState.uploadedFile.name
                                : 'Choose a PDF file'}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {questionState.uploadedFile
                                ? `${(questionState.uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Click to change`
                                : 'We will parse it and generate similar questions.'}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-zinc-300 group-hover:text-blue-500 dark:text-zinc-700 dark:group-hover:text-blue-300" />
                      </label>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-zinc-200/70 dark:bg-white/10" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Or
                      </span>
                      <div className="h-px flex-1 bg-zinc-200/70 dark:bg-white/10" />
                    </div>

                    <Input
                      label="Pre-parsed Directory (optional)"
                      floatingLabel
                      value={questionState.paperPath}
                      onChange={e =>
                        setQuestionState(prev => ({
                          ...prev,
                          paperPath: e.target.value,
                          uploadedFile: null,
                        }))
                      }
                      placeholder="e.g. 2211asm1"
                      className="rounded-2xl"
                    />

                    <Input
                      label="Max Questions (optional)"
                      floatingLabel
                      type="number"
                      min="1"
                      max="20"
                      value={questionState.count || ''}
                      onChange={e => {
                        const val = e.target.value ? parseInt(e.target.value) : 0
                        setQuestionState(prev => ({ ...prev, count: val > 0 ? Math.min(20, val) : 0 }))
                      }}
                      helperText="Leave empty to generate all questions."
                      className="rounded-2xl"
                    />
                  </div>
                )}
              </CardBody>

              <CardFooter className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white/40 dark:bg-white/5">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tip: For the cleanest quiz, use 5–10 questions.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  iconLeft={<Zap className="h-5 w-5" />}
                  onClick={startGeneration}
                  disabled={!canGenerate}
                  className="sm:w-auto w-full"
                >
                  Generate Questions
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ) : activeTab === 'questions' ? (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="space-y-6"
          >
            {totalQuestions > 0 && (
              <Card
                variant="glass"
                interactive={false}
                padding="none"
                className="rounded-2xl border-white/55 bg-white/55 dark:border-white/10 dark:bg-white/5"
              >
                <CardBody padding="md" className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Progress
                      </p>
                      <p className="mt-1 flex items-baseline gap-2">
                        <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {completedCount}/{totalQuestions}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          answered ({progressPct}%)
                        </span>
                        {extendedCount > 0 && (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            • {extendedCount} extended
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Jump to</span>
                      <select
                        value={String(activeIdx)}
                        onChange={e => navigateQuestion(parseInt(e.target.value))}
                        className={cn(selectClassName, 'w-40')}
                        aria-label="Jump to question"
                      >
                        {questionState.results.map((r: { extended?: boolean }, idx: number) => {
                          const flags = [
                            submittedMap[idx] ? 'done' : null,
                            r.extended ? 'extended' : null,
                          ].filter(Boolean)
                          return (
                            <option key={idx} value={idx}>
                              Q{idx + 1}
                              {flags.length ? ` (${flags.join(', ')})` : ''}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </CardBody>
              </Card>
            )}

            {totalQuestions === 0 && isGenerating && (
              <Card variant="glass" interactive={false} className="rounded-2xl" padding="lg">
                <div className="flex flex-col items-center text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-400" />
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Generating questions…
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Open the Process tab for detailed progress.
                  </p>
                </div>
              </Card>
            )}

            {totalQuestions === 0 && !isGenerating && (
              <Card variant="glass" interactive={false} className="rounded-2xl" padding="lg">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/55 bg-white/60 text-blue-700 shadow-xs dark:border-white/10 dark:bg-white/5 dark:text-blue-200">
                    <FileQuestion className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    No questions yet
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Start a new session to generate questions.
                  </p>
                  <div className="mt-5">
                    <Button
                      variant="primary"
                      size="md"
                      iconLeft={<RefreshCw className="h-4 w-4" />}
                      onClick={resetQuestionGen}
                    >
                      New session
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {totalQuestions > 0 && currentQuestion && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <AnimatePresence mode="wait" custom={navDir}>
                    <motion.div
                      key={activeIdx}
                      custom={navDir}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <Card
                        variant="glass"
                        interactive={false}
                        padding="none"
                        className="rounded-2xl overflow-hidden"
                      >
                        <CardHeader className="flex-row items-center justify-between gap-3 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200">
                              {currentQuestionTypeLabel}
                            </span>
                            {currentQuestion.extended && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
                                <Zap className="h-3 w-3" />
                                Extended
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-full border border-white/55 bg-white/55 px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                              Q{activeIdx + 1} / {totalQuestions}
                            </span>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            iconLeft={<Book className="h-4 w-4" />}
                            onClick={() => setShowNotebookModal(true)}
                          >
                            Save
                          </Button>
                        </CardHeader>

                        <CardBody padding="lg" className="space-y-6">
                          <div className="prose prose-zinc dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {processLatexContent(currentQuestion.question.question)}
                            </ReactMarkdown>
                          </div>

                          {isChoiceQuestion && currentQuestion.question.options ? (
                            <div className="space-y-3" role="radiogroup" aria-label="Answer choices">
                              {Object.entries(currentQuestion.question.options).map(([key, val]) => {
                                const isSelected = selectedAnswerKey === key
                                const isCorrect = isSubmitted && key === correctAnswerKey
                                const isWrong = isSubmitted && isSelected && key !== correctAnswerKey
                                const optionTone = isCorrect
                                  ? 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-500/10'
                                  : isWrong
                                    ? 'border-red-200/80 bg-red-50/70 dark:border-red-400/20 dark:bg-red-500/10'
                                    : isSelected
                                      ? 'border-blue-300/70 bg-blue-50/70 dark:border-blue-400/25 dark:bg-blue-500/10'
                                      : 'border-white/55 bg-white/55 hover:bg-white/70 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'

                                return (
                                  <motion.button
                                    key={key}
                                    type="button"
                                    whileHover={!isSubmitted ? { y: -1 } : undefined}
                                    whileTap={!isSubmitted ? { scale: 0.99 } : undefined}
                                    onClick={() => handleAnswer(key)}
                                    disabled={isSubmitted}
                                    role="radio"
                                    aria-checked={isSelected}
                                    className={cn(
                                      'group w-full rounded-2xl border p-4 text-left shadow-xs backdrop-blur-md',
                                      'transition-[background-color,border-color,transform] disabled:opacity-80 disabled:cursor-not-allowed',
                                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
                                      optionTone
                                    )}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span
                                        className={cn(
                                          'mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-semibold',
                                          'bg-white/70 border-white/60 text-zinc-700 dark:bg-white/5 dark:border-white/10 dark:text-zinc-200',
                                          isCorrect && 'text-emerald-700 dark:text-emerald-200',
                                          isWrong && 'text-red-700 dark:text-red-200',
                                          !isSubmitted && isSelected && 'text-blue-700 dark:text-blue-200'
                                        )}
                                      >
                                        {key}
                                      </span>

                                      <div className="flex-1 min-w-0">
                                        <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                                          <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                          >
                                            {processLatexContent(String(val))}
                                          </ReactMarkdown>
                                        </div>
                                      </div>

                                      {isCorrect && (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                      )}
                                    </div>
                                  </motion.button>
                                )
                              })}
                            </div>
                          ) : (
                            <Textarea
                              label="Your answer"
                              floatingLabel
                              size="lg"
                              value={selectedAnswerKey}
                              onChange={e => handleAnswer(e.target.value)}
                              disabled={isSubmitted}
                              placeholder="Type your answer here…"
                              minRows={10}
                              className="resize-none rounded-2xl"
                            />
                          )}
                        </CardBody>

                        <CardFooter className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="md"
                              iconLeft={<ChevronLeft className="h-4 w-4" />}
                              onClick={() => navigateQuestion(activeIdx - 1)}
                              disabled={activeIdx === 0}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="secondary"
                              size="md"
                              iconRight={<ChevronRight className="h-4 w-4" />}
                              onClick={() => navigateQuestion(activeIdx + 1)}
                              disabled={activeIdx >= totalQuestions - 1}
                            >
                              Next
                            </Button>
                          </div>

                          <div className="flex-1" />

                          {!isSubmitted ? (
                            <Button
                              variant="primary"
                              size="md"
                              onClick={handleSubmit}
                              disabled={!hasAnswer}
                            >
                              Submit
                            </Button>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-2 text-sm font-medium text-emerald-800 shadow-xs backdrop-blur-md dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                              <CheckCircle2 className="h-4 w-4" />
                              Submitted
                            </span>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="answer"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        className="space-y-4"
                      >
                        <Card
                          variant="glass"
                          interactive={false}
                          padding="none"
                          className="rounded-2xl overflow-hidden"
                        >
                          <CardHeader className="flex-row items-center justify-between gap-3 bg-white/50 dark:bg-white/5 backdrop-blur-xl">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                Validation
                              </span>
                              <span className="inline-flex items-center rounded-full border border-white/55 bg-white/55 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                                {currentQuestion.rounds || 1} round
                                {(currentQuestion.rounds || 1) > 1 ? 's' : ''}
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowValidation(v => !v)}
                              iconRight={
                                <motion.div animate={{ rotate: showValidation ? 180 : 0 }}>
                                  <ChevronDown className="h-4 w-4" />
                                </motion.div>
                              }
                            >
                              {showValidation ? 'Hide' : 'Show'}
                            </Button>
                          </CardHeader>

                          <AnimatePresence>
                            {showValidation && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <CardBody padding="md" className="space-y-4">
                                  {currentQuestion.validation?.kb_coverage && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        KB coverage
                                      </p>
                                      <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkMath]}
                                          rehypePlugins={[rehypeKatex]}
                                        >
                                          {processLatexContent(currentQuestion.validation.kb_coverage)}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}

                                  {currentQuestion.validation?.extension_points && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Extension points
                                      </p>
                                      <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkMath]}
                                          rehypePlugins={[rehypeKatex]}
                                        >
                                          {processLatexContent(
                                            currentQuestion.validation.extension_points
                                          )}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                </CardBody>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>

                        <Card
                          variant="glass"
                          interactive={false}
                          padding="none"
                          className="rounded-2xl overflow-hidden"
                        >
                          <CardHeader className="bg-emerald-50/60 dark:bg-emerald-500/10">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold">
                                <BookOpen className="h-4 w-4" />
                                Answer & Explanation
                              </div>

                              {isChoiceCorrect !== null && (
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                                    isChoiceCorrect
                                      ? 'border-emerald-200/70 bg-emerald-50/70 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200'
                                      : 'border-amber-200/70 bg-amber-100/70 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200'
                                  )}
                                >
                                  {isChoiceCorrect ? 'Correct' : 'Review'}
                                </span>
                              )}
                            </div>
                          </CardHeader>

                          <CardBody padding="lg" className="space-y-5">
                            {isChoiceQuestion && (
                              <div className="rounded-2xl border border-white/55 bg-white/55 p-4 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                  Your answer
                                </p>
                                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                  {selectedAnswerKey || '—'}
                                </p>
                              </div>
                            )}

                            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 shadow-xs backdrop-blur-md dark:border-emerald-400/20 dark:bg-emerald-500/10">
                              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
                                Correct answer
                              </p>
                              <div className="mt-2 prose prose-sm prose-zinc dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {processLatexContent(String(currentQuestion.question.correct_answer || ''))}
                                </ReactMarkdown>
                              </div>
                            </div>

                            <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {processLatexContent(currentQuestion.question.explanation)}
                              </ReactMarkdown>
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Card variant="glass" interactive={false} className="rounded-2xl" padding="lg">
                          <div className="flex flex-col items-center text-center">
                            <BookOpen className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                            <p className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                              Answer hidden
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              Submit to reveal the solution and explanation.
                            </p>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="process"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <QuestionDashboard
              state={dashboardState}
              globalProgress={questionState.progress}
              globalLogs={questionState.logs}
              globalResults={questionState.results}
              globalTopic={questionState.topic}
              globalDifficulty={questionState.difficulty}
              globalType={questionState.type}
              globalCount={questionState.count}
              globalStep={questionState.step}
              globalMode={questionState.mode === 'knowledge' ? 'custom' : 'mimic'}
              selectedTaskId={selectedTaskId}
              onTaskSelect={setSelectedTaskId}
              tokenStats={questionState.tokenStats}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {currentQuestion && (
        <AddToNotebookModal
          isOpen={showNotebookModal}
          onClose={() => setShowNotebookModal(false)}
          recordType="question"
          title={`${sourceLabel} - ${currentQuestionTypeLabel}`}
          userQuery={
            questionState.mode === 'knowledge'
              ? `Topic: ${questionState.topic}\nDifficulty: ${questionState.difficulty}\nType: ${questionState.type}`
              : `Source: ${sourceLabel}\nMode: mimic`
          }
          output={`**Question:**\n${currentQuestion.question.question}\n\n**Options:**\n${
            currentQuestion.question.options
              ? Object.entries(currentQuestion.question.options)
                  .map(([k, v]) => `${k}. ${v}`)
                  .join('\n')
              : 'N/A'
          }\n\n**Correct Answer:** ${currentQuestion.question.correct_answer}\n\n**Explanation:**\n${currentQuestion.question.explanation}`}
          metadata={{
            mode: questionState.mode,
            difficulty: questionState.difficulty,
            question_type: getQuestionKind(currentQuestion.question),
            validation_rounds: currentQuestion.rounds,
            extended: currentQuestion.extended,
          }}
          kbName={questionState.selectedKb}
        />
      )}
    </PageWrapper>
  )
}
