'use client'

import { useCallback, useState } from 'react'
import { apiUrl } from '@/lib/api'

type CouncilRun = {
  council_id: string
  created_at: number
  task: 'chat_verify' | 'question_validate'
  question: string
  models?: Record<string, any>
  budgets?: Record<string, any>
  status?: 'ok' | 'partial' | 'error' | 'canceled'
  errors?: string[]
  rounds?: Array<{
    round_index: number
    member_answers?: Array<{ model: string; content?: string; error?: string }>
    review?: { model: string; content?: string; error?: string }
    review_parsed?: {
      resolved?: boolean
      issues?: string[]
      disagreements?: string[]
      cross_exam_questions?: string[]
      notes_for_chairman?: string
    }
    cross_exam_questions?: string[]
    cross_exam_answers?: Array<{ model: string; content?: string; error?: string }>
  }>
  final?: {
    model: string
    content: string
    voice?: string
    audio_url?: string
    audio_error?: string
  }
}

export default function CouncilDetails({
  councilId,
  label = 'Council details',
}: {
  councilId: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [run, setRun] = useState<CouncilRun | null>(null)

  const fetchRun = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl(`/api/v1/chat/council/${councilId}`))
      if (!res.ok) throw new Error(`Failed to fetch council log (${res.status})`)
      const data = (await res.json()) as CouncilRun
      setRun(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [councilId])

  return (
    <details
      className="rounded-xl border border-border bg-surface-elevated/40 px-4 py-3 text-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5"
      onToggle={(e) => {
        const isOpen = (e.target as HTMLDetailsElement).open
        setOpen(isOpen)
        if (isOpen && !run && !loading) void fetchRun()
      }}
      open={open}
    >
      <summary className="cursor-pointer select-none text-text-secondary hover:text-text-primary dark:text-zinc-300 dark:hover:text-zinc-100">
        {label}
      </summary>

      <div className="mt-3 space-y-3 text-text-primary dark:text-zinc-100">
        {loading && <div className="text-text-secondary dark:text-zinc-300">Loading…</div>}
        {error && <div className="text-red-600 dark:text-red-300">{error}</div>}

        {run && (
          <>
            <div className="text-xs text-text-secondary dark:text-zinc-300">
              <div>
                <span className="font-medium">Status:</span> {run.status || 'ok'}
              </div>
              <div>
                <span className="font-medium">Models:</span>{' '}
                {run.models?.members?.length ? (
                  <>
                    members={String(run.models.members.join(', '))}; reviewer=
                    {String(run.models.reviewer)}; chairman={String(run.models.chairman)}
                  </>
                ) : (
                  'n/a'
                )}
              </div>
              {run.errors?.length ? (
                <div>
                  <span className="font-medium">Errors:</span> {run.errors.join(' | ')}
                </div>
              ) : null}
            </div>

            {(run.rounds || []).map((r) => (
              <div key={r.round_index} className="space-y-2 rounded-lg border border-border/60 p-3 dark:border-white/10">
                <div className="text-xs font-semibold text-text-secondary dark:text-zinc-300">
                  Round {r.round_index}
                </div>

                {r.member_answers?.length ? (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-text-secondary dark:text-zinc-300">
                      Member answers
                    </div>
                    {r.member_answers.map((m, idx) => (
                      <details key={`${m.model}-${idx}`} className="rounded-md border border-border/60 px-3 py-2 dark:border-white/10">
                        <summary className="cursor-pointer text-xs text-text-secondary dark:text-zinc-300">
                          {m.model}
                          {m.error ? ' (error)' : ''}
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">
                          {m.error ? m.error : m.content || ''}
                        </pre>
                      </details>
                    ))}
                  </div>
                ) : null}

                {r.review ? (
                  <details className="rounded-md border border-border/60 px-3 py-2 dark:border-white/10">
                    <summary className="cursor-pointer text-xs text-text-secondary dark:text-zinc-300">
                      Reviewer ({r.review.model})
                      {r.review.error ? ' (error)' : ''}
                    </summary>
                    {r.review_parsed ? (
                      <div className="mt-2 text-xs text-text-secondary dark:text-zinc-300">
                        <div>
                          <span className="font-medium">Resolved:</span> {String(r.review_parsed.resolved)}
                        </div>
                        {r.review_parsed.issues?.length ? (
                          <div>
                            <span className="font-medium">Issues:</span> {r.review_parsed.issues.join(' | ')}
                          </div>
                        ) : null}
                        {r.review_parsed.cross_exam_questions?.length ? (
                          <div>
                            <span className="font-medium">Cross-exam:</span>{' '}
                            {r.review_parsed.cross_exam_questions.join(' | ')}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">
                      {r.review.error ? r.review.error : r.review.content || ''}
                    </pre>
                  </details>
                ) : null}

                {r.cross_exam_answers?.length ? (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-text-secondary dark:text-zinc-300">
                      Cross-exam answers
                    </div>
                    {r.cross_exam_answers.map((m, idx) => (
                      <details key={`${m.model}-${idx}`} className="rounded-md border border-border/60 px-3 py-2 dark:border-white/10">
                        <summary className="cursor-pointer text-xs text-text-secondary dark:text-zinc-300">
                          {m.model}
                          {m.error ? ' (error)' : ''}
                        </summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">
                          {m.error ? m.error : m.content || ''}
                        </pre>
                      </details>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {run.final ? (
              <details className="rounded-lg border border-border/60 px-3 py-2 dark:border-white/10">
                <summary className="cursor-pointer text-xs text-text-secondary dark:text-zinc-300">
                  Final synthesis ({run.final.model})
                </summary>
                {run.final.audio_url ? (
                  <audio className="mt-2 w-full" controls preload="none" src={apiUrl(run.final.audio_url)} />
                ) : null}
                {run.final.audio_error ? (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-300">{run.final.audio_error}</div>
                ) : null}
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">{run.final.content}</pre>
              </details>
            ) : null}
          </>
        )}
      </div>
    </details>
  )
}
