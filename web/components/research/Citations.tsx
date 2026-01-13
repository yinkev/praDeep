'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, FileText } from 'lucide-react'

export interface Citation {
  id: string
  title: string
  url: string
  source: string
}

interface CitationsProps {
  citations: Citation[]
  onCitationClick?: (citation: Citation) => void
}

const fastEasing = [0.2, 0.8, 0.2, 1] as const

export function Citations({ citations, onCitationClick }: CitationsProps) {
  if (citations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated/50 px-4 py-8 text-center backdrop-blur-sm">
        <FileText className="mx-auto h-8 w-8 text-text-tertiary opacity-40" />
        <p className="mt-2 text-sm text-text-secondary">No citations available</p>
        <p className="mt-1 text-xs text-text-tertiary">
          Citations will appear here when research is complete
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {citations.map((citation, index) => (
        <motion.a
          key={citation.id}
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => {
            if (onCitationClick) {
              e.preventDefault()
              onCitationClick(citation)
            }
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.15,
            delay: index * 0.03,
            ease: fastEasing,
          }}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          className="group relative flex items-start gap-3 rounded-xl border border-border bg-surface-elevated/70 p-3 backdrop-blur-md transition-all hover:border-accent-primary/30 hover:bg-surface-elevated hover:shadow-md"
        >
          {/* Citation Number */}
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-xs font-semibold text-accent-primary ring-1 ring-accent-primary/20 group-hover:bg-accent-primary group-hover:text-white group-hover:ring-accent-primary/40 transition-all">
            {index + 1}
          </div>

          {/* Citation Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-accent-primary transition-colors">
                {citation.title}
              </h4>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-1 text-xs text-text-secondary truncate">{citation.source}</p>
          </div>
        </motion.a>
      ))}
    </div>
  )
}
