'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, Circle, AlertCircle, Star } from 'lucide-react'
import Link from 'next/link'

import { BlockRenderer } from '@/components/guide2/BlockRenderer'
import { MasteryIndicator } from '@/components/guide2/MasteryIndicator'

type SessionData = {
  session_id: string
  status: string
  topic: string
  plan_graph: {
    nodes: Array<{ objective_id: string; title: string; status: string }>
    edges: Array<{ source: string; target: string }>
  }
  current_objective_id: string | null
  progress_summary: {
    completed_objectives: number
    total_objectives: number
    current_stage: string
    estimated_time_remaining: number
  }
}

type ActivityData = {
  activity_id: string
  objective_id: string
  stage: string
  block: Record<string, unknown>
  hints_available: number
  attempt_number: number
}

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<SessionData | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<'LOW' | 'MED' | 'HIGH'>('MED')
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string; mastery_change: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/v2/guide/sessions/${sessionId}`)
      if (!res.ok) throw new Error('Session not found')
      const data = await res.json()
      setSession(data)
      
      if (data.status === 'ACTIVE') {
        fetchActivity()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/v2/guide/sessions/${sessionId}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivity(data)
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err)
    }
  }

  const startSession = async () => {
    try {
      const res = await fetch(`/api/v2/guide/sessions/${sessionId}/start`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setSession(data)
        fetchActivity()
      }
    } catch (err) {
      console.error('Failed to start session:', err)
    }
  }

  const submitAnswer = async () => {
    if (selectedAnswer === null) return
    
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v2/guide/sessions/${sessionId}/submit?answer=${selectedAnswer}&confidence=${confidence}&time_taken_seconds=30`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setFeedback(data)
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const continueToNext = () => {
    setFeedback(null)
    setSelectedAnswer(null)
    fetchActivity()
    fetchSession()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">{error || 'Session not found'}</p>
          <Link href="/guide2" className="text-blue-500 hover:underline mt-2 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/guide2" className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{session.topic}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {session.progress_summary.completed_objectives} / {session.progress_summary.total_objectives} objectives
            </p>
          </div>
          <MasteryIndicator state="NOVICE" />
        </div>

        <div className="flex gap-6">
          <div className="w-48 shrink-0">
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Objectives</h3>
              <div className="space-y-2">
                {session.plan_graph.nodes.map((node) => (
                  <div key={node.objective_id} className="flex items-start gap-2">
                    {node.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    ) : node.objective_id === session.current_objective_id ? (
                      <Circle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0 fill-blue-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-0.5 shrink-0" />
                    )}
                    <span className={`text-xs ${
                      node.objective_id === session.current_objective_id
                        ? 'text-slate-900 dark:text-white font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {node.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            {session.status === 'PLANNING' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700/50 text-center"
              >
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Ready to Begin?</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Start your learning session to begin practicing.
                </p>
                <button
                  onClick={startSession}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
                >
                  Start Session
                </button>
              </motion.div>
            ) : feedback ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl p-6 border ${
                  feedback.correct
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  {feedback.correct ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                  <h3 className={`font-medium ${
                    feedback.correct
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {feedback.correct ? 'Correct!' : 'Not quite right'}
                  </h3>
                </div>
                <p className={`mb-4 ${
                  feedback.correct
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {feedback.explanation}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Mastery: {feedback.mastery_change}
                </p>
                <button
                  onClick={continueToNext}
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Continue
                </button>
              </motion.div>
            ) : activity ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {activity.stage} Stage
                  </span>
                  <span className="text-xs text-slate-400">
                    Attempt {activity.attempt_number + 1}
                  </span>
                </div>

                <BlockRenderer
                  block={activity.block}
                  selectedAnswer={selectedAnswer}
                  onSelectAnswer={setSelectedAnswer}
                />

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Confidence</span>
                    <div className="flex gap-2">
                      {(['LOW', 'MED', 'HIGH'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setConfidence(level)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            confidence === level
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null || submitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-medium transition-all disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700/50 text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Session Complete!</h2>
                <p className="text-slate-500 dark:text-slate-400">
                  You&apos;ve completed all activities in this session.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
