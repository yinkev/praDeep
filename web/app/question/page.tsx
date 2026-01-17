'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PenTool,
  Loader2,
  RefreshCw,
  Database,
  Activity,
  CheckCircle2,
  BrainCircuit,
  FileText,
  Upload,
  Sparkles,
  Book,
  Zap,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Target,
  Settings,
  X,
  MessageSquare,
  History,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlobal } from '@/context/GlobalContext'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import AddToNotebookModal from '@/components/AddToNotebookModal'
import { LogDrawer } from '@/components/question'
import { useQuestionReducer } from '@/hooks/useQuestionReducer'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
}

// ============================================================================
// Components
// ============================================================================

function QuestionListItem({ 
  idx, 
  result, 
  activeIdx, 
  submitted, 
  onClick 
}: { 
  idx: number; 
  result: any; 
  activeIdx: number; 
  submitted: boolean; 
  onClick: () => void 
}) {
  const isActive = activeIdx === idx

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl transition-all duration-300 border mb-1.5 group',
        isActive
          ? 'bg-surface-secondary border-accent-primary/30 shadow-glass-sm ring-1 ring-accent-primary/10'
          : 'bg-transparent border-transparent hover:bg-surface-secondary/40'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border transition-all duration-300',
            result.extended
              ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30'
              : submitted
                ? 'bg-success-muted/20 text-success border-success/30'
                : isActive
                  ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                  : 'bg-surface-elevated text-text-tertiary border-border-subtle'
          )}
        >
          {result.extended ? <Zap size={14} /> : submitted ? <CheckCircle2 size={14} /> : idx + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-sm line-clamp-2 transition-colors',
            isActive ? 'text-text-primary font-bold' : 'text-text-secondary'
          )}>
            {result.question.question}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[9px] font-mono text-text-quaternary uppercase tracking-widest">
              {result.question.type || result.question.question_type || 'CHOICE'}
            </span>
            {result.extended && (
              <Badge variant="outline" className="text-[8px] font-bold text-accent-primary border-accent-primary/20 px-1 py-0 uppercase">Extended</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function QuestionPage() {
  const {
    questionState,
    setQuestionState,
    startQuestionGen,
    startMimicQuestionGen,
    resetQuestionGen,
  } = useGlobal()

  const [activeIdx, setActiveIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [submittedMap, setSubmittedMap] = useState<Record<number, boolean>>({})
  const [kbs, setKbs] = useState<string[]>([])
  const [showLogDrawer, setShowLogDrawer] = useState(false)
  const [showNotebookModal, setShowNotebookModal] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const isGenerating = questionState.step === 'generating'
  const isComplete = questionState.step === 'result'
  const isConfigMode = questionState.step === 'config'
  const totalQuestions = questionState.results.length
  const currentQuestion = questionState.results[activeIdx]

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
      .catch(err => console.error(err))
  }, [setQuestionState, questionState.selectedKb])

  useEffect(() => {
    if (totalQuestions > 0 && activeIdx >= totalQuestions) {
      setActiveIdx(0)
    }
  }, [totalQuestions, activeIdx])

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
        questionState.selectedKb
      )
    }
    setUserAnswers({})
    setSubmittedMap({})
    setActiveIdx(0)
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

  const canStart =
    questionState.mode === 'knowledge'
      ? questionState.topic.trim().length > 0
      : questionState.uploadedFile !== null || questionState.paperPath.trim().length > 0

  return (
    <PageWrapper maxWidth="full" showPattern={false} className="h-screen overflow-hidden px-0 py-0">
      <div className="h-full flex flex-col bg-surface-base">
        {/* Toolbar Header */}
        <header className="shrink-0 h-14 border-b border-border bg-surface-base/80 backdrop-blur-md px-6 flex items-center justify-between">
           <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-sm border border-accent-primary/20">
                 <PenTool size={16} />
               </div>
               <h1 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">Question_Gen</h1>
             </div>

             {isConfigMode && (
               <div className="flex bg-surface-secondary p-1 rounded-full border border-border-subtle" role="group" aria-label="Generation mode">
                 <button
                   type="button"
                   onClick={() => setQuestionState(prev => ({ ...prev, mode: 'knowledge' }))}
                   className={cn(
                     'flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all',
                     questionState.mode === 'knowledge'
                       ? 'bg-accent-primary text-white shadow-sm'
                       : 'text-text-tertiary hover:text-text-secondary'
                   )}
                 >
                   <BrainCircuit size={12} />
                   Custom
                 </button>
                 <button
                   type="button"
                   onClick={() => setQuestionState(prev => ({ ...prev, mode: 'mimic' }))}
                   className={cn(
                     'flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all',
                     questionState.mode === 'mimic'
                       ? 'bg-accent-primary text-white shadow-sm'
                       : 'text-text-tertiary hover:text-text-secondary'
                   )}
                 >
                   <FileText size={12} />
                   Mimic
                 </button>
               </div>
             )}
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-surface-elevated border border-border-subtle px-3 py-1.5 rounded-xl shadow-sm">
                <Database size={12} className="text-text-quaternary" />
                <label htmlFor="kb-select" className="sr-only">Knowledge Base</label>
                <select
                  id="kb-select"
                  value={questionState.selectedKb}
                  onChange={e => setQuestionState(prev => ({ ...prev, selectedKb: e.target.value }))}
                  disabled={isGenerating}
                  className="bg-transparent text-[10px] font-mono font-bold uppercase text-text-secondary outline-none appearance-none cursor-pointer pr-1"
                >
                  {kbs.map(kb => (
                    <option key={kb} value={kb}>{kb}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="text-text-quaternary" />
              </div>

              {!isConfigMode && (
                <div className="flex items-center gap-2">
                   <IconButton
                     aria-label="View logs"
                     icon={<Activity size={16} />}
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowLogDrawer(true)}
                     className="text-text-tertiary hover:text-accent-primary"
                   />
                   <Button
                     variant="secondary"
                     size="sm"
                     iconLeft={<Plus size={14} />}
                     onClick={resetQuestionGen}
                     className="text-[10px] font-mono uppercase tracking-widest h-8"
                   >
                     New
                   </Button>
                </div>
              )}
           </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {isConfigMode ? (
            <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(var(--color-accent-primary),0.03),transparent_50%)]">
              <div className="max-w-xl mx-auto py-24 space-y-12">
                 <div className="text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised border border-border shadow-sm text-accent-primary mb-6">
                       {questionState.mode === 'knowledge' ? <BrainCircuit size={32} /> : <FileText size={32} />}
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight mb-3">
                      {questionState.mode === 'knowledge' ? 'Initialize Knowledge Point' : 'Clone Exam Structure'}
                    </h2>
                    <p className="text-sm text-text-tertiary uppercase tracking-wider font-mono">
                      {questionState.mode === 'knowledge' 
                        ? 'GEN_SYSTEM_READY :: TARGET_IDENTIFIED'
                        : 'MIMIC_ENGINE_ONLINE :: PAPER_PENDING'}
                    </p>
                 </div>

                 <Card interactive={false} className="border-border bg-surface-base/80 backdrop-blur-md shadow-glass-sm overflow-visible">
                    <div className="p-8 space-y-8">
                       {questionState.mode === 'knowledge' ? (
                         <div className="space-y-6">
                            <div className="space-y-3">
                              <label htmlFor="q-topic" className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] ml-1">Concept_Vector</label>
                              <Input
                                id="q-topic"
                                type="text"
                                placeholder="e.g. LAGRANGIAN_MECHANICS"
                                value={questionState.topic}
                                onChange={e => setQuestionState(p => ({...p, topic: e.target.value}))}
                                className="h-14 text-lg font-bold uppercase border-border focus:border-accent-primary/40 bg-surface-secondary/30 tracking-tight"
                              />

                            </div>
                            <div className="grid grid-cols-3 gap-4">
                               <div className="space-y-2">
                                 <label htmlFor="q-count" className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Count</label>
                                 <Input id="q-count" type="number" value={questionState.count} onChange={e => setQuestionState(p => ({...p, count: Number(e.target.value)}))} className="text-center font-mono" />
                               </div>
                               <div className="space-y-2">
                                 <label htmlFor="q-difficulty" className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Difficulty</label>
                                 <select
                                    id="q-difficulty"
                                    value={questionState.difficulty}
                                    onChange={e => setQuestionState(p => ({...p, difficulty: e.target.value}))}
                                    className="w-full h-10 rounded-xl border border-border bg-surface-secondary/30 px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-accent-primary/40"
                                 >
                                   <option value="easy">Easy</option>
                                   <option value="medium">Medium</option>
                                   <option value="hard">Hard</option>
                                 </select>
                               </div>
                               <div className="space-y-2">
                                 <label htmlFor="q-type" className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Logic_Type</label>
                                 <select
                                    id="q-type"
                                    value={questionState.type}
                                    onChange={e => setQuestionState(p => ({...p, type: e.target.value}))}
                                    className="w-full h-10 rounded-xl border border-border bg-surface-secondary/30 px-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-accent-primary/40"
                                 >
                                   <option value="choice">Choice</option>
                                   <option value="written">Written</option>
                                 </select>
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            <div className="space-y-3">
                               <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] ml-1">Reference_Paper (PDF)</label>
                               <div className="relative">
                                 <input type="file" id="q-upload" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                 <label htmlFor="q-upload" className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl bg-surface-secondary/30 hover:border-accent-primary/40 hover:bg-surface-secondary/60 cursor-pointer transition-all">
                                    {questionState.uploadedFile ? (
                                      <>
                                        <FileText size={48} className="text-accent-primary mb-4" />
                                        <div className="text-sm font-bold uppercase tracking-tight text-text-primary">{questionState.uploadedFile.name}</div>
                                        <div className="text-[10px] font-mono text-text-tertiary uppercase mt-1">Ready for analysis</div>
                                      </>
                                    ) : (
                                      <>
                                        <Upload size={48} className="text-text-quaternary mb-4" />
                                        <div className="text-sm font-bold uppercase tracking-tight text-text-secondary">Attach exam document</div>
                                        <div className="text-[10px] font-mono text-text-tertiary uppercase mt-1">PDF_FORMAT_ONLY</div>
                                      </>
                                    )}
                                 </label>
                               </div>
                            </div>
                         </div>
                       )}

                       <Button
                         variant="primary"
                         size="lg"
                         className="w-full h-14 text-base font-bold uppercase tracking-[0.2em] shadow-xl"
                         iconLeft={<Sparkles size={20} />}
                         onClick={handleStart}
                         disabled={!canStart}
                       >
                         Execute Generation
                       </Button>
                    </div>
                 </Card>
              </div>
            </div>
          ) : (
            <>
              {/* Question Sidebar */}
              <aside className="w-[320px] flex-shrink-0 border-r border-border bg-surface-secondary/20 flex flex-col min-h-0">
                <div className="p-4 border-b border-border bg-surface-base">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Question_Stack</span>
                      <Badge variant="outline" className="font-mono text-[9px] border-border-subtle bg-surface-elevated">{totalQuestions}/{questionState.count}</Badge>
                   </div>
                   {isGenerating && (
                     <Progress value={(totalQuestions / questionState.count) * 100} className="h-1" />
                   )}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                   {totalQuestions === 0 && isGenerating ? (
                     <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-40">
                        <RefreshCw size={24} className="animate-spin" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">Compiling...</span>
                     </div>
                   ) : (
                     questionState.results.map((r: any, i: number) => (
                       <QuestionListItem
                         key={i}
                         idx={i}
                         result={r}
                         activeIdx={activeIdx}
                         submitted={submittedMap[i]}
                         onClick={() => setActiveIdx(i)}
                       />
                     ))
                   )}
                </div>
              </aside>

              {/* Detail Area */}
              <main className="flex-1 flex flex-col overflow-hidden bg-surface-base">
                 <AnimatePresence mode="wait">
                   {currentQuestion ? (
                     <motion.div
                       key={activeIdx}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="flex-1 flex flex-col min-h-0"
                     >
                        <div className="px-8 py-4 border-b border-border-subtle bg-surface-base/50 backdrop-blur-sm flex items-center justify-between">
                           <div className="flex items-center gap-4">
                             <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-[0.2em]">ITEM_{String(activeIdx + 1).padStart(2, '0')}</span>
                             <Badge variant="secondary" className="bg-surface-elevated border-border text-text-secondary font-mono text-[9px] uppercase">{currentQuestion.question.type || 'CHOICE'}</Badge>
                           </div>
                           <Button variant="ghost" size="sm" iconLeft={<Book size={14} />} onClick={() => setShowNotebookModal(true)} className="text-[10px] font-mono uppercase tracking-widest text-accent-primary">Export</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-12 py-12 space-y-12">
                           <article className="prose prose-slate dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {processLatexContent(currentQuestion.question.question)}
                              </ReactMarkdown>
                           </article>

                           {/* Options */}
                           {currentQuestion.question.options ? (
                             <div className="grid grid-cols-1 gap-4">
                                {Object.entries(currentQuestion.question.options).map(([key, val]) => {
                                  const isSelected = userAnswers[activeIdx] === key
                                  const isCorrect = key === currentQuestion.question.correct_answer
                                  const revealed = submittedMap[activeIdx]

                                  return (
                                    <button
                                      key={key}
                                      onClick={() => handleAnswer(key)}
                                      disabled={revealed}
                                      className={cn(
                                        'w-full text-left p-6 rounded-2xl border transition-all flex items-start gap-6 group',
                                        revealed
                                          ? isCorrect 
                                            ? 'bg-success-muted/10 border-success/30 ring-1 ring-success/20' 
                                            : isSelected 
                                              ? 'bg-error-muted/10 border-error/30 ring-1 ring-error/20'
                                              : 'bg-surface-secondary border-border-subtle opacity-50'
                                          : isSelected
                                            ? 'bg-surface-secondary border-accent-primary/40 shadow-glass-sm ring-1 ring-accent-primary/20'
                                            : 'bg-surface-base border-border hover:border-accent-primary/20 hover:bg-surface-secondary/40'
                                      )}
                                    >
                                      <div className={cn(
                                        'w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                                        revealed && isCorrect ? 'bg-success text-white border-success' :
                                        revealed && isSelected ? 'bg-error text-white border-error' :
                                        isSelected ? 'bg-accent-primary text-white border-accent-primary' :
                                        'bg-surface-elevated text-text-tertiary border-border-subtle group-hover:border-accent-primary/40'
                                      )}>
                                        {key}
                                      </div>
                                      <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                                         <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                           {processLatexContent(String(val))}
                                         </ReactMarkdown>
                                      </div>
                                      {revealed && isCorrect && <CheckCircle2 className="text-success shrink-0 mt-1" size={20} />}
                                    </button>
                                  )
                                })}
                             </div>
                           ) : (
                             <Textarea
                               value={userAnswers[activeIdx] || ''}
                               onChange={e => handleAnswer(e.target.value)}
                               disabled={submittedMap[activeIdx]}
                               placeholder="Input derivation or response here..."
                               className="min-h-[240px] bg-surface-secondary/20 border-border rounded-2xl"
                             />
                           )}

                           {/* Analysis / Feedback */}
                           {submittedMap[activeIdx] && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-8 border-t border-border-subtle">
                                <div className="rounded-2xl border border-success/20 bg-success-muted/5 p-8">
                                   <div className="text-[10px] font-bold text-success uppercase tracking-[0.2em] mb-4">CORRECT_SOLUTION</div>
                                   <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-success">
                                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {processLatexContent(String(currentQuestion.question.correct_answer))}
                                      </ReactMarkdown>
                                   </div>
                                </div>

                                {currentQuestion.question.explanation && (
                                  <div>
                                     <div className="text-[10px] font-bold text-text-quaternary uppercase tracking-[0.2em] mb-4">LOGIC_EXPLANATION</div>
                                     <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                          {processLatexContent(currentQuestion.question.explanation)}
                                        </ReactMarkdown>
                                     </div>
                                  </div>
                                )}
                             </motion.div>
                           )}
                        </div>

                        <footer className="shrink-0 p-6 border-t border-border bg-surface-base">
                           <div className="max-w-4xl mx-auto flex items-center justify-between">
                              <div className="text-[10px] font-mono text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={12} />
                                Verify all generated data
                              </div>
                              
                              {!submittedMap[activeIdx] ? (
                                 <Button
                                   type="button"
                                   variant="primary"
                                   onClick={handleSubmit}
                                   disabled={!userAnswers[activeIdx]}
                                   className="px-10 h-12 uppercase font-bold tracking-[0.2em] shadow-lg"
                                 >

                                  Finalize Answer
                                </Button>
                              ) : (
                                <div className="flex items-center gap-3">
                                   <Badge variant="secondary" className="bg-success-muted/10 text-success border-success/20 px-4 py-2 uppercase font-bold tracking-widest">SUBMITTED_STABLE</Badge>
                                   <Button variant="ghost" onClick={() => setActiveIdx(Math.min(totalQuestions - 1, activeIdx + 1))} iconRight={<ArrowRight size={14} />} className="text-[10px] font-mono uppercase tracking-widest">Next Item</Button>
                                </div>
                              )}
                           </div>
                        </footer>
                     </motion.div>
                   ) : (
                     <div className="flex-1 flex items-center justify-center opacity-20 grayscale">
                        <div className="text-center">
                           <Target size={64} className="mx-auto mb-6" />
                           <h3 className="text-lg font-bold uppercase tracking-widest">System Idle</h3>
                           <p className="text-xs font-mono uppercase mt-2">Awaiting generation stack completion</p>
                        </div>
                     </div>
                   )}
                 </AnimatePresence>
              </main>
            </>
          )}
        </div>

        <LogDrawer
          isOpen={showLogDrawer}
          onClose={() => setShowLogDrawer(false)}
          logs={questionState.logs || []}
          mode={questionState.mode === 'knowledge' ? 'custom' : 'mimic'}
          topic={questionState.topic}
          stage={questionState.progress.stage}
          progress={questionState.progress.progress}
        />

        {currentQuestion && (
          <AddToNotebookModal
            isOpen={showNotebookModal}
            onClose={() => setShowNotebookModal(false)}
            recordType="question"
            title={`${questionState.topic} - ITEM_${activeIdx + 1}`}
            userQuery={questionState.topic}
            output={currentQuestion.question.question}
            kbName={questionState.selectedKb}
          />
        )}
      </div>
    </PageWrapper>
  )
}
