'use client'

import { useMemo, useState } from 'react'
import { ConfidenceBadge, ConfidenceMeter, ReasoningSteps, type ReasoningStep } from '@/components/ai'

export default function PwaFixesTestClient() {
  const [submitCount, setSubmitCount] = useState(0)

  const steps: ReasoningStep[] = useMemo(
    () => [
      { step: 'Parse the question and extract constraints.', confidence: 0.9, timestamp: Date.now() - 5000 },
      { step: 'Choose the most direct solution path.', confidence: 0.78, timestamp: Date.now() - 2500 },
      { step: 'Validate edge cases and return the result.', confidence: 0.86, timestamp: Date.now() },
    ],
    [],
  )

  return (
    <main className="min-h-screen p-6 flex flex-col gap-8">
      <section className="space-y-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          PWA / UI Fixes Test
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Playwright-only route. Disabled in production.
        </p>
      </section>

      <section className="space-y-4" data-testid="confidence-section">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Confidence</h2>
        <div data-testid="confidence-badge">
          <ConfidenceBadge confidence={0.9} />
        </div>
        <div data-testid="confidence-meter" className="max-w-sm">
          <ConfidenceMeter confidence={0.9} label="Confidence meter" />
        </div>
      </section>

      <section className="space-y-4" data-testid="reasoning-section">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">ReasoningSteps</h2>

        <form
          className="space-y-3"
          onSubmit={event => {
            event.preventDefault()
            setSubmitCount(count => count + 1)
          }}
        >
          <div className="text-xs text-slate-600 dark:text-slate-300">
            submit count: <span data-testid="form-submit-count">{submitCount}</span>
          </div>
          <ReasoningSteps steps={steps} defaultExpanded={false} />
        </form>
      </section>
    </main>
  )
}
