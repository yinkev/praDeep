'use client'

import { motion } from 'framer-motion'

type BlockProps = {
  block: Record<string, unknown>
  selectedAnswer: number | null
  onSelectAnswer: (index: number) => void
}

export function BlockRenderer({ block, selectedAnswer, onSelectAnswer }: BlockProps) {
  const blockType = block.block_type as string

  if (blockType === 'MCQ' || block.question) {
    return (
      <MCQBlock
        block={block}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={onSelectAnswer}
      />
    )
  }

  if (blockType === 'DISCRIMINATOR_CARD' || block.concept_a) {
    return <DiscriminatorCardBlock block={block} />
  }

  if (blockType === 'MECHANISM_GRAPH' || block.mermaid_code) {
    return <MechanismGraphBlock block={block} />
  }

  return (
    <div className="text-slate-500 dark:text-slate-400 text-center py-8">
      Unknown block type: {blockType || 'undefined'}
    </div>
  )
}

function MCQBlock({ block, selectedAnswer, onSelectAnswer }: BlockProps) {
  const question = (block.question || block.stem) as string
  const options = (block.options || []) as Array<{ text?: string; id?: string } | string>

  return (
    <div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
        {question}
      </h3>
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionText = typeof option === 'string' ? option : option.text || ''
          const isSelected = selectedAnswer === index
          
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectAnswer(index)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-slate-300 dark:border-slate-500 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{optionText}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function DiscriminatorCardBlock({ block }: { block: Record<string, unknown> }) {
  const conceptA = block.concept_a as string
  const conceptB = block.concept_b as string
  const differences = (block.differences || block.key_differences || []) as string[]

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">{conceptA}</h4>
        </div>
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <h4 className="font-medium text-purple-900 dark:text-purple-100">{conceptB}</h4>
        </div>
      </div>
      
      {differences.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Key Differences</h4>
          <ul className="space-y-1">
            {differences.map((diff, i) => (
              <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <span className="text-slate-400">•</span>
                {diff}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MechanismGraphBlock({ block }: { block: Record<string, unknown> }) {
  const title = block.title as string
  const mermaidCode = block.mermaid_code as string

  return (
    <div>
      {title && (
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">{title}</h3>
      )}
      {mermaidCode && (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-700/50 overflow-x-auto">
          <pre className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap">
            {mermaidCode}
          </pre>
        </div>
      )}
    </div>
  )
}
