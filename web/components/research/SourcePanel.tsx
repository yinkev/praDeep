'use client'

import React from 'react'
import { BookOpen } from 'lucide-react'
import { Citations, type Citation } from './Citations'
import { RelatedQuestions } from './RelatedQuestions'

interface SourcePanelProps {
  citations?: Citation[]
  relatedQuestions?: string[]
  onCitationClick?: (citation: Citation) => void
  onQuestionClick?: (question: string) => void
}

export function SourcePanel({
  citations = [],
  relatedQuestions = [],
  onCitationClick,
  onQuestionClick,
}: SourcePanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/55 bg-white/80 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80">
      {/* Header */}
      <div className="shrink-0 border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated shadow-sm ring-1 ring-border">
            <BookOpen className="h-4 w-4 text-accent-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Sources & Citations</h3>
            <p className="text-xs text-text-secondary">
              {citations.length > 0 ? `${citations.length} sources` : 'No sources yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-6">
          {/* Citations Section */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Citations
            </h4>
            <Citations citations={citations} onCitationClick={onCitationClick} />
          </div>

          {/* Related Questions Section */}
          {relatedQuestions.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Related Questions
              </h4>
              <RelatedQuestions questions={relatedQuestions} onQuestionClick={onQuestionClick} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
