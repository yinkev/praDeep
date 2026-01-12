'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenTool,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  BrainCircuit,
  Sparkles,
  RefreshCw,
  FileText,
  Book,
  Upload,
  Database,
  FileQuestion,
  Activity,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Target,
  Trophy,
  Clock,
} from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import { QuestionDashboard } from '@/components/question/QuestionDashboard'
import { useQuestionReducer } from '@/hooks/useQuestionReducer'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
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
      stiffness: 300,
      damping: 24,
    },
  },
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  }),
}

const optionVariants = {
  idle: {
    scale: 1,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 17,
    },
  },
  tap: {
    scale: 0.98,
  },
  selected: {
    scale: 1,
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
  },
}

const progressPillVariants = {
  inactive: {
    scale: 1,
    backgroundColor: 'rgb(226 232 240)',
  },
  active: {
    scale: 1.15,
    backgroundColor: 'rgb(20 184 166)',
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 17,
    },
  },
  completed: {
    scale: 1,
    backgroundColor: 'rgb(16 185 129)',
  },
}

// ============================================================================
// Component
// ============================================================================

export default function QuestionPage() {
  const {
    questionState,
    setQuestionState,
    startQuestionGen,
    startMimicQuestionGen,
    resetQuestionGen,
  } = useGlobal()

  // Dashboard state for parallel generation
  const [dashboardState, dispatchDashboard] = useQuestionReducer()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Tab state: "questions" shows the quiz, "process" shows the dashboard
  const [activeTab, setActiveTab] = useState<'questions' | 'process'>('questions')

  // Local interaction state
  const [kbs, setKbs] = useState<string[]>([])

  // Answering state
  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [submittedMap, setSubmittedMap] = useState<Record<number, boolean>>({})
  const [showValidation, setShowValidation] = useState(false)

  // Notebook modal state
  const [showNotebookModal, setShowNotebookModal] = useState(false)

  // Check if generation is in progress
  const isGenerating = questionState.step === 'generating' || questionState.step === 'result'
  const isConfigMode = questionState.step === 'config'

  // Fetch KBs on mount only
  useEffect(() => {
    fetch(apiUrl('/api/v1/knowledge/list'))
      .then(res => res.json())
      .then(data => {
        const names = data.map((kb: any) => kb.name)
        setKbs(names)
        if (!questionState.selectedKb && names.length > 0) {
          setQuestionState(prev => ({ ...prev, selectedKb: names[0] }))
        }
      })
      .catch(err => console.error('Failed to fetch KBs:', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStart = () => {
    if (questionState.mode === 'knowledge') {
      startQuestionGen(
        questionState.topic,
        questionState.difficulty,
        questionState.type,
        questionState.count,
        questionState.selectedKb
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

  const handleAnswer = (val: string) => {
    if (submittedMap[activeIdx]) return
    setUserAnswers(prev => ({ ...prev, [activeIdx]: val }))
  }

  const handleSubmit = () => {
    setSubmittedMap(prev => ({ ...prev, [activeIdx]: true }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && file.type !== 'application/pdf') {
      alert('Please upload a PDF exam paper')
      return
    }
    setQuestionState(prev => ({
      ...prev,
      uploadedFile: file,
      paperPath: file ? '' : prev.paperPath,
    }))
  }

  const navigateQuestion = (newIdx: number) => {
    setDirection(newIdx > activeIdx ? 1 : -1)
    setActiveIdx(newIdx)
    setShowValidation(false)
  }

  const currentQuestion = questionState.results[activeIdx]
  const totalQuestions = questionState.results.length
  const extendedCount = questionState.results.filter((r: any) => r.extended).length
  const completedCount = Object.keys(submittedMap).filter(k => submittedMap[parseInt(k)]).length

  // Auto-switch to questions tab when generation completes
  useEffect(() => {
    if (questionState.step === 'result' && totalQuestions > 0) {
      setActiveTab('questions')
    }
  }, [questionState.step, totalQuestions])

  return (
    <PageWrapper maxWidth="2xl" showPattern={true}>
      {/* Header */}
      <PageHeader
        title="Question Generator"
        description="Generate practice questions from your knowledge base or mimic exam papers"
        icon={<PenTool className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-3">
            {/* Knowledge Base Selector */}
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <select
                value={questionState.selectedKb}
                onChange={e =>
                  setQuestionState(prev => ({
                    ...prev,
                    selectedKb: e.target.value,
                  }))
                }
                disabled={isGenerating}
                className="text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/50 dark:text-slate-200 transition-all disabled:opacity-50"
              >
                {kbs.map(kb => (
                  <option key={kb} value={kb}>
                    {kb}
                  </option>
                ))}
              </select>
            </div>

            {!isConfigMode && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<RefreshCw className="w-4 h-4" />}
                onClick={resetQuestionGen}
              >
                New Session
              </Button>
            )}
          </div>
        }
      />

      {/* Mode and Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        {/* Mode Switching */}
        <Card variant="glass" hoverEffect={false} className="p-1">
          <div className="flex gap-1">
            <motion.button
              onClick={() =>
                !isGenerating && setQuestionState(prev => ({ ...prev, mode: 'knowledge' }))
              }
              disabled={isGenerating}
              whileHover={!isGenerating ? { scale: 1.02 } : undefined}
              whileTap={!isGenerating ? { scale: 0.98 } : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                questionState.mode === 'knowledge'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
              } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <BrainCircuit className="w-4 h-4" />
              Custom Mode
            </motion.button>
            <motion.button
              onClick={() =>
                !isGenerating && setQuestionState(prev => ({ ...prev, mode: 'mimic' }))
              }
              disabled={isGenerating}
              whileHover={!isGenerating ? { scale: 1.02 } : undefined}
              whileTap={!isGenerating ? { scale: 0.98 } : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                questionState.mode === 'mimic'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
              } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <FileText className="w-4 h-4" />
              Mimic Exam
            </motion.button>
          </div>
        </Card>

        {/* Tab Switcher */}
        {!isConfigMode && (
          <Card variant="glass" hoverEffect={false} className="p-1">
            <div className="flex gap-1">
              <motion.button
                onClick={() => setActiveTab('questions')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'questions'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                Questions
                {totalQuestions > 0 && (
                  <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs rounded-full font-semibold">
                    {totalQuestions}
                  </span>
                )}
              </motion.button>
              <motion.button
                onClick={() => setActiveTab('process')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'process'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Activity className="w-4 h-4" />
                Process
                {questionState.step === 'generating' && (
                  <Loader2 className="w-3 h-3 animate-spin text-teal-500" />
                )}
              </motion.button>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Config Mode */}
      <AnimatePresence mode="wait">
        {isConfigMode && (
          <motion.div
            key="config"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Mode Info Banner */}
            <motion.div variants={itemVariants}>
              <Card
                variant="glass"
                className={`border-l-4 ${
                  questionState.mode === 'knowledge' ? 'border-l-teal-500' : 'border-l-blue-500'
                }`}
              >
                <CardBody>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        questionState.mode === 'knowledge'
                          ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {questionState.mode === 'knowledge' ? (
                        <BrainCircuit className="w-6 h-6" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        {questionState.mode === 'knowledge'
                          ? 'Custom Mode'
                          : 'Mimic Exam Paper Mode'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {questionState.mode === 'knowledge'
                          ? 'Generate questions based on knowledge base content'
                          : 'Generate similar questions based on an exam paper'}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Knowledge Base Mode Config */}
            {questionState.mode === 'knowledge' && (
              <>
                {/* Question Count */}
                <motion.div variants={itemVariants}>
                  <Card variant="glass">
                    <CardBody className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Question Count
                      </label>
                      <div className="flex items-center gap-6">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          value={Math.min(questionState.count, 10)}
                          onChange={e =>
                            setQuestionState(prev => ({
                              ...prev,
                              count: parseInt(e.target.value),
                            }))
                          }
                          className="flex-1 accent-teal-500 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <motion.div
                          key={questionState.count}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="w-16 h-12 flex items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold text-xl rounded-xl shadow-lg shadow-teal-500/25"
                        >
                          {questionState.count}
                        </motion.div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Topic Input */}
                <motion.div variants={itemVariants}>
                  <Card variant="glass">
                    <CardBody className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Knowledge Point / Topic
                      </label>
                      <input
                        type="text"
                        value={questionState.topic}
                        onChange={e =>
                          setQuestionState(prev => ({
                            ...prev,
                            topic: e.target.value,
                          }))
                        }
                        placeholder="e.g. Gradient Descent Optimization"
                        className="w-full p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/50 transition-all text-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Difficulty and Type */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <Card variant="glass">
                    <CardBody className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Difficulty
                      </label>
                      <div className="flex bg-white/30 dark:bg-slate-800/30 p-1 rounded-xl">
                        {['easy', 'medium', 'hard'].map(lvl => (
                          <motion.button
                            key={lvl}
                            onClick={() =>
                              setQuestionState(prev => ({
                                ...prev,
                                difficulty: lvl,
                              }))
                            }
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                              questionState.difficulty === lvl
                                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          >
                            {lvl}
                          </motion.button>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  <Card variant="glass">
                    <CardBody className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Type
                      </label>
                      <div className="flex bg-white/30 dark:bg-slate-800/30 p-1 rounded-xl">
                        {[
                          { id: 'choice', label: 'Multiple Choice' },
                          { id: 'written', label: 'Written' },
                        ].map(t => (
                          <motion.button
                            key={t.id}
                            onClick={() =>
                              setQuestionState(prev => ({
                                ...prev,
                                type: t.id,
                              }))
                            }
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              questionState.type === t.id
                                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-400 shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          >
                            {t.label}
                          </motion.button>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              </>
            )}

            {/* Mimic Mode Config */}
            {questionState.mode === 'mimic' && (
              <>
                {/* PDF Upload */}
                <motion.div variants={itemVariants}>
                  <Card variant="glass">
                    <CardBody className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Upload Exam Paper (PDF)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="pdf-upload"
                      />
                      <motion.label
                        htmlFor="pdf-upload"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex items-center justify-center gap-3 w-full p-8 border-2 border-dashed border-slate-300/50 dark:border-slate-600/50 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/20 dark:hover:bg-teal-900/10 transition-all"
                      >
                        {questionState.uploadedFile ? (
                          <div className="flex items-center gap-4 text-teal-700 dark:text-teal-400">
                            <div className="w-14 h-14 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                              <FileText className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="font-semibold">{questionState.uploadedFile.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {(questionState.uploadedFile.size / 1024 / 1024).toFixed(2)} MB -
                                Click to change
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 dark:text-slate-400">
                            <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Click to upload PDF exam paper</p>
                            <p className="text-sm">
                              The system will parse and generate similar questions
                            </p>
                          </div>
                        )}
                      </motion.label>
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-700/50" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Or
                  </span>
                  <div className="flex-1 h-px bg-slate-200/50 dark:bg-slate-700/50" />
                </div>

                {/* Pre-parsed Directory */}
                <motion.div variants={itemVariants}>
                  <Card variant="glass">
                    <CardBody className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Pre-parsed Directory (Optional)
                      </label>
                      <input
                        type="text"
                        value={questionState.paperPath}
                        onChange={e =>
                          setQuestionState(prev => ({
                            ...prev,
                            paperPath: e.target.value,
                            uploadedFile: null,
                          }))
                        }
                        placeholder="e.g. 2211asm1"
                        className="w-full p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/50 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                      />
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Max Questions */}
                <motion.div variants={itemVariants}>
                  <Card variant="glass">
                    <CardBody className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Max Questions (Optional)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          placeholder="All"
                          value={questionState.count || ''}
                          onChange={e => {
                            const val = e.target.value ? parseInt(e.target.value) : 0
                            setQuestionState(prev => ({
                              ...prev,
                              count: val > 0 ? Math.min(20, val) : 0,
                            }))
                          }}
                          className="w-24 p-3 text-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-xl outline-none focus:ring-2 focus:ring-teal-400/50 text-slate-800 dark:text-slate-200"
                        />
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Leave empty to generate all questions
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              </>
            )}

            {/* Generate Button */}
            <motion.div variants={itemVariants}>
              <Button
                variant="primary"
                size="lg"
                iconLeft={<Sparkles className="w-5 h-5" />}
                onClick={handleStart}
                disabled={
                  questionState.mode === 'knowledge'
                    ? !questionState.topic.trim()
                    : !questionState.uploadedFile && !questionState.paperPath.trim()
                }
                className="w-full py-4 text-lg"
              >
                Generate Questions
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Questions Tab */}
        {!isConfigMode && activeTab === 'questions' && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Progress Overview */}
            {totalQuestions > 0 && (
              <Card variant="glass" hoverEffect={false}>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          Progress
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {completedCount} of {totalQuestions} completed
                          {extendedCount > 0 && (
                            <span className="ml-2 text-amber-600 dark:text-amber-400">
                              ({extendedCount} extended)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {Math.round((completedCount / totalQuestions) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Pills */}
                  <div className="flex flex-wrap gap-2">
                    {questionState.results.map((result: any, idx: number) => (
                      <motion.button
                        key={idx}
                        onClick={() => navigateQuestion(idx)}
                        variants={progressPillVariants}
                        initial="inactive"
                        animate={
                          activeIdx === idx
                            ? 'active'
                            : submittedMap[idx]
                              ? 'completed'
                              : 'inactive'
                        }
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                          activeIdx === idx
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                            : result.extended
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-600'
                              : submittedMap[idx]
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {submittedMap[idx] && activeIdx !== idx ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : result.extended && activeIdx !== idx ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          idx + 1
                        )}
                      </motion.button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Loading State */}
            {totalQuestions === 0 && questionState.step === 'generating' && (
              <Card variant="glass" className="py-16">
                <CardBody className="flex flex-col items-center justify-center text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear' as const,
                    }}
                    className="w-16 h-16 rounded-full border-4 border-teal-200 border-t-teal-500 mb-6"
                  />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Generating Questions
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Switch to the Process tab to see detailed progress
                  </p>
                </CardBody>
              </Card>
            )}

            {/* Question Display */}
            {totalQuestions > 0 && currentQuestion && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Question Card */}
                <div className="lg:col-span-3">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={activeIdx}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <Card variant="glass" hoverEffect={false}>
                        <CardHeader className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase rounded-full">
                              {currentQuestion.question.type ||
                                currentQuestion.question.question_type}
                            </span>
                            {currentQuestion.extended && (
                              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Extended
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setShowNotebookModal(true)}
                            className="text-xs font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 flex items-center gap-1 px-2 py-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          >
                            <Book className="w-3 h-3" />
                            Add to Notebook
                          </button>
                        </CardHeader>

                        <CardBody className="space-y-6">
                          {/* Question Text */}
                          <div className="prose prose-slate dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {processLatexContent(currentQuestion.question.question)}
                            </ReactMarkdown>
                          </div>

                          {/* Options */}
                          {(currentQuestion.question.question_type === 'choice' ||
                            currentQuestion.question.type === 'choice') &&
                          currentQuestion.question.options ? (
                            <div className="space-y-3">
                              {Object.entries(currentQuestion.question.options).map(
                                ([key, val]) => (
                                  <motion.button
                                    key={key}
                                    onClick={() => handleAnswer(key)}
                                    disabled={submittedMap[activeIdx]}
                                    variants={optionVariants}
                                    initial="idle"
                                    whileHover={!submittedMap[activeIdx] ? 'hover' : undefined}
                                    whileTap={!submittedMap[activeIdx] ? 'tap' : undefined}
                                    animate={userAnswers[activeIdx] === key ? 'selected' : 'idle'}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                                      userAnswers[activeIdx] === key
                                        ? submittedMap[activeIdx]
                                          ? key === currentQuestion.question.correct_answer
                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                                            : 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200'
                                          : 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-900 dark:text-teal-200'
                                        : submittedMap[activeIdx] &&
                                            key === currentQuestion.question.correct_answer
                                          ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200'
                                          : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:border-teal-300 dark:hover:border-teal-600'
                                    }`}
                                  >
                                    <span className="font-bold shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                      {key}
                                    </span>
                                    <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                                      <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                      >
                                        {processLatexContent(String(val))}
                                      </ReactMarkdown>
                                    </div>
                                    {submittedMap[activeIdx] &&
                                      key === currentQuestion.question.correct_answer && (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      )}
                                  </motion.button>
                                )
                              )}
                            </div>
                          ) : (
                            <textarea
                              value={userAnswers[activeIdx] || ''}
                              onChange={e => handleAnswer(e.target.value)}
                              disabled={submittedMap[activeIdx]}
                              placeholder="Type your answer here..."
                              className="w-full h-48 p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 rounded-xl focus:ring-2 focus:ring-teal-400/50 outline-none resize-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                            />
                          )}
                        </CardBody>

                        <CardFooter className="flex gap-3">
                          <Button
                            variant="ghost"
                            size="md"
                            iconLeft={<ChevronLeft className="w-4 h-4" />}
                            onClick={() => activeIdx > 0 && navigateQuestion(activeIdx - 1)}
                            disabled={activeIdx === 0}
                          >
                            Previous
                          </Button>
                          <div className="flex-1" />
                          {!submittedMap[activeIdx] ? (
                            <Button
                              variant="primary"
                              size="md"
                              onClick={handleSubmit}
                              disabled={!userAnswers[activeIdx]}
                            >
                              Submit Answer
                            </Button>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="font-medium">Submitted</span>
                              </div>
                              {activeIdx < questionState.results.length - 1 && (
                                <Button
                                  variant="primary"
                                  size="md"
                                  iconRight={<ChevronRight className="w-4 h-4" />}
                                  onClick={() => navigateQuestion(activeIdx + 1)}
                                >
                                  Next
                                </Button>
                              )}
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Answer & Validation Panel */}
                <div className="lg:col-span-2 space-y-4">
                  <AnimatePresence mode="wait">
                    {submittedMap[activeIdx] ? (
                      <motion.div
                        key="answer"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        {/* Validation Report */}
                        <Card
                          variant="glass"
                          hoverEffect={false}
                          className={`border-l-4 ${
                            currentQuestion.extended ? 'border-l-amber-500' : 'border-l-emerald-500'
                          }`}
                        >
                          <motion.button
                            onClick={() => setShowValidation(!showValidation)}
                            className="w-full px-4 py-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-slate-500" />
                              <span className="font-medium text-slate-700 dark:text-slate-200">
                                Validation Report
                              </span>
                              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {currentQuestion.rounds || 1} round
                                {(currentQuestion.rounds || 1) > 1 ? 's' : ''}
                              </span>
                            </div>
                            <motion.div animate={{ rotate: showValidation ? 180 : 0 }}>
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            </motion.div>
                          </motion.button>

                          <AnimatePresence>
                            {showValidation && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <CardBody className="pt-0 text-sm space-y-3">
                                  {currentQuestion.validation?.kb_coverage && (
                                    <div>
                                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                        KB Coverage
                                      </p>
                                      <div className="prose prose-xs dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkMath]}
                                          rehypePlugins={[rehypeKatex]}
                                        >
                                          {processLatexContent(
                                            currentQuestion.validation.kb_coverage
                                          )}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {currentQuestion.validation?.extension_points && (
                                    <div>
                                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                                        Extension Points
                                      </p>
                                      <div className="prose prose-xs dark:prose-invert max-w-none">
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

                        {/* Answer & Explanation */}
                        <Card variant="glass" hoverEffect={false}>
                          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/20">
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                              <BookOpen className="w-4 h-4" />
                              Answer & Explanation
                            </div>
                          </CardHeader>
                          <CardBody className="space-y-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-800">
                              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                                Correct Answer
                              </p>
                              <div className="prose prose-emerald dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {processLatexContent(
                                    String(currentQuestion.question.correct_answer || '')
                                  )}
                                </ReactMarkdown>
                              </div>
                            </div>

                            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
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
                        <Card variant="glass" hoverEffect={false}>
                          <CardBody className="py-16 text-center">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <p className="font-medium text-slate-500 dark:text-slate-400">
                              Answer Hidden
                            </p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                              Submit your answer to reveal
                            </p>
                          </CardBody>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Process Tab */}
        {!isConfigMode && activeTab === 'process' && (
          <motion.div
            key="process"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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

      {/* Add to Notebook Modal */}
      {currentQuestion && (
        <AddToNotebookModal
          isOpen={showNotebookModal}
          onClose={() => setShowNotebookModal(false)}
          recordType="question"
          title={`${questionState.topic} - ${currentQuestion.question.type || currentQuestion.question.question_type}`}
          userQuery={`Topic: ${questionState.topic}\nDifficulty: ${questionState.difficulty}\nType: ${questionState.type}`}
          output={`**Question:**\n${currentQuestion.question.question}\n\n**Options:**\n${
            currentQuestion.question.options
              ? Object.entries(currentQuestion.question.options)
                  .map(([k, v]) => `${k}. ${v}`)
                  .join('\n')
              : 'N/A'
          }\n\n**Correct Answer:** ${currentQuestion.question.correct_answer}\n\n**Explanation:**\n${currentQuestion.question.explanation}`}
          metadata={{
            difficulty: questionState.difficulty,
            question_type: questionState.type,
            validation_rounds: currentQuestion.rounds,
            extended: currentQuestion.extended,
          }}
          kbName={questionState.selectedKb}
        />
      )}
    </PageWrapper>
  )
}
