'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, HelpCircle, Search, Clock, Database } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { processLatexContent } from '@/lib/latex'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Button, { IconButton } from '@/components/ui/Button'

interface ActivityDetailProps {
  activity: any
  onClose: () => void
}

// Animation variants for the modal
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
}

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
}

export default function ActivityDetail({ activity, onClose }: ActivityDetailProps) {
  const [mounted, setMounted] = useState(false)

  // Ensure we're on the client before rendering portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!activity || !mounted) return null

  // Get icon color based on activity type - using teal accents
  const getIconStyles = () => {
    switch (activity.type) {
      case 'solve':
        return 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
      case 'question':
        return 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
      case 'research':
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
      default:
        return 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
    }
  }

  const modalContent = (
    <AnimatePresence mode="wait">
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* Backdrop with blur */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal - Glass Card */}
        <motion.div
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col"
          onClick={e => e.stopPropagation()}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Card
            variant="glass"
            hoverEffect={false}
            className="w-full max-h-[85vh] flex flex-col overflow-hidden !bg-white/70 dark:!bg-slate-900/70 !backdrop-blur-2xl !border-white/40 dark:!border-slate-700/40"
          >
            {/* Header */}
            <CardHeader className="flex flex-row justify-between items-center shrink-0 !border-b !border-[#E8E2D0]/50 dark:!border-slate-700/50">
              <div className="flex items-center gap-4">
                <motion.div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconStyles()}`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 17 }}
                >
                  {activity.type === 'solve' && <HelpCircle className="w-5 h-5" />}
                  {activity.type === 'question' && <FileText className="w-5 h-5" />}
                  {activity.type === 'research' && <Search className="w-5 h-5" />}
                </motion.div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    Activity Details
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {new Date(activity.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
              <IconButton
                variant="ghost"
                size="sm"
                icon={<X className="w-4 h-4" />}
                onClick={onClose}
                aria-label="Close modal"
              />
            </CardHeader>

            {/* Scrollable Content */}
            <CardBody className="flex-1 overflow-y-auto !py-6 space-y-6">
              {/* Meta Info */}
              <motion.div
                className="grid grid-cols-2 gap-4"
                custom={0}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="p-4 bg-[#F7F4EC]/60 dark:bg-slate-800/50 rounded-xl border border-[#E8E2D0]/50 dark:border-slate-700/50 backdrop-blur-sm">
                  <div className="text-xs font-bold uppercase tracking-wide text-teal-600 dark:text-teal-400 mb-1">
                    Type
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                    {activity.type}
                  </div>
                </div>
                <div className="p-4 bg-[#F7F4EC]/60 dark:bg-slate-800/50 rounded-xl border border-[#E8E2D0]/50 dark:border-slate-700/50 backdrop-blur-sm">
                  <div className="text-xs font-bold uppercase tracking-wide text-teal-600 dark:text-teal-400 mb-1">
                    Knowledge Base
                  </div>
                  <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                    {activity.content?.kb_name || 'Unknown'}
                  </div>
                </div>
              </motion.div>

              {/* Activity Specific Content */}

              {/* 1. SOLVE */}
              {activity.type === 'solve' && (
                <>
                  <motion.div
                    className="space-y-2"
                    custom={1}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Question
                    </h3>
                    <div className="p-4 bg-[#F7F4EC]/60 dark:bg-slate-800/50 rounded-xl border border-[#E8E2D0]/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 leading-relaxed backdrop-blur-sm">
                      {activity.content.question}
                    </div>
                  </motion.div>
                  <motion.div
                    className="space-y-2"
                    custom={2}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Final Answer
                    </h3>
                    <div className="p-6 bg-white/60 dark:bg-slate-800/50 rounded-xl border border-[#E8E2D0]/50 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                      <div className="prose prose-slate dark:prose-invert max-w-none prose-sm prose-headings:text-teal-700 dark:prose-headings:text-teal-400">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {processLatexContent(activity.content.answer)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}

              {/* 2. QUESTION */}
              {activity.type === 'question' && (
                <>
                  <motion.div
                    className="space-y-2"
                    custom={1}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      Parameters
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="px-3 py-2 border border-[#E8E2D0]/50 dark:border-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-[#F7F4EC]/60 dark:bg-slate-800/50 backdrop-blur-sm">
                        <span className="font-bold text-teal-600 dark:text-teal-400">Topic:</span>{' '}
                        {activity.content?.requirement?.knowledge_point || 'N/A'}
                      </div>
                      <div className="px-3 py-2 border border-[#E8E2D0]/50 dark:border-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-[#F7F4EC]/60 dark:bg-slate-800/50 backdrop-blur-sm">
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          Difficulty:
                        </span>{' '}
                        {activity.content?.requirement?.difficulty || 'N/A'}
                      </div>
                      <div className="px-3 py-2 border border-[#E8E2D0]/50 dark:border-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-[#F7F4EC]/60 dark:bg-slate-800/50 backdrop-blur-sm">
                        <span className="font-bold text-teal-600 dark:text-teal-400">Type:</span>{' '}
                        {activity.content?.requirement?.question_type ||
                          activity.content?.question?.question_type ||
                          'N/A'}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    custom={2}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      Generated Question
                    </h3>
                    <div className="p-6 bg-white/60 dark:bg-slate-800/50 rounded-xl border border-[#E8E2D0]/50 dark:border-slate-700/50 shadow-sm space-y-4 backdrop-blur-sm">
                      <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        {activity.content?.question?.content ||
                          activity.content?.question?.question ||
                          'No question content'}
                      </p>

                      {/* Handle options as object (A, B, C, D format) or array */}
                      {activity.content?.question?.options && (
                        <div className="space-y-2">
                          {Array.isArray(activity.content.question.options)
                            ? // Array format
                              activity.content.question.options.map((opt: string, i: number) => (
                                <motion.div
                                  key={i}
                                  className="p-3 border border-[#E8E2D0]/50 dark:border-slate-700/50 rounded-lg bg-[#F7F4EC]/40 dark:bg-slate-800/40 text-sm text-slate-700 dark:text-slate-300 backdrop-blur-sm"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + i * 0.05 }}
                                >
                                  <span className="font-bold text-cyan-600 dark:text-cyan-400 mr-2">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  {opt}
                                </motion.div>
                              ))
                            : // Object format { "A": "...", "B": "..." }
                              Object.entries(activity.content.question.options).map(
                                ([key, value], i) => (
                                  <motion.div
                                    key={key}
                                    className="p-3 border border-[#E8E2D0]/50 dark:border-slate-700/50 rounded-lg bg-[#F7F4EC]/40 dark:bg-slate-800/40 text-sm text-slate-700 dark:text-slate-300 backdrop-blur-sm"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                  >
                                    <span className="font-bold text-cyan-600 dark:text-cyan-400 mr-2">
                                      {key}.
                                    </span>
                                    {value as string}
                                  </motion.div>
                                )
                              )}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    custom={3}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Correct Answer & Explanation
                    </h3>
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 space-y-2 backdrop-blur-sm">
                      <p className="font-bold">
                        Answer:{' '}
                        {activity.content?.question?.answer ||
                          activity.content?.question?.correct_answer ||
                          'N/A'}
                      </p>
                      <p className="text-sm leading-relaxed">
                        {activity.content?.question?.explanation || 'No explanation provided'}
                      </p>
                    </div>
                  </motion.div>
                </>
              )}

              {/* 3. RESEARCH */}
              {activity.type === 'research' && (
                <>
                  <motion.div
                    className="space-y-2"
                    custom={1}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Topic
                    </h3>
                    <div className="text-lg font-medium text-slate-800 dark:text-slate-200">
                      {activity.content.topic}
                    </div>
                  </motion.div>
                  <motion.div
                    className="space-y-2"
                    custom={2}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Report Preview
                    </h3>
                    <div className="p-6 bg-white/60 dark:bg-slate-800/50 rounded-xl border border-[#E8E2D0]/50 dark:border-slate-700/50 shadow-sm max-h-96 overflow-y-auto font-mono text-xs text-slate-600 dark:text-slate-300 backdrop-blur-sm">
                      {activity.content.report}
                    </div>
                  </motion.div>
                </>
              )}
            </CardBody>

            {/* Footer */}
            <CardFooter className="flex justify-end shrink-0 !bg-[#F7F4EC]/40 dark:!bg-slate-800/40 !border-t !border-[#E8E2D0]/50 dark:!border-slate-700/50">
              <Button variant="primary" onClick={onClose}>
                Close
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
