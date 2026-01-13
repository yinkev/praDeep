'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Sparkles } from 'lucide-react'

interface RelatedQuestionsProps {
  questions: string[]
  onQuestionClick?: (question: string) => void
}

const fastEasing = [0.2, 0.8, 0.2, 1] as const

export function RelatedQuestions({ questions, onQuestionClick }: RelatedQuestionsProps) {
  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated/50 px-4 py-8 text-center backdrop-blur-sm">
        <MessageSquare className="mx-auto h-8 w-8 text-text-tertiary opacity-40" />
        <p className="mt-2 text-sm text-text-secondary">No related questions yet</p>
        <p className="mt-1 text-xs text-text-tertiary">
          Suggested follow-ups will appear after research
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {questions.map((question, index) => (
        <motion.button
          key={`${question}-${index}`}
          type="button"
          onClick={() => onQuestionClick?.(question)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.15,
            delay: index * 0.03,
            ease: fastEasing,
          }}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          className="group relative flex w-full items-start gap-3 rounded-xl border border-border bg-surface-elevated/70 p-3 text-left backdrop-blur-md transition-all hover:border-accent-primary/30 hover:bg-surface-elevated hover:shadow-md"
        >
          {/* Icon */}
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500/40 transition-all dark:text-emerald-400 dark:group-hover:text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>

          {/* Question Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary group-hover:text-emerald-600 transition-colors dark:group-hover:text-emerald-400">
              {question}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
