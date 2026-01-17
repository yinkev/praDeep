'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Clock, Target } from 'lucide-react'

export default function Guide2Home() {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [objectives, setObjectives] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateSession = async () => {
    if (!topic.trim() || !objectives.trim()) return
    
    setIsCreating(true)
    try {
      const res = await fetch('/api/v2/guide/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'default_user',
          topic: topic.trim(),
          learning_objectives: objectives.split('\n').filter(o => o.trim()),
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        router.push(`/guide2/session/${data.session_id}`)
      }
    } catch (err) {
      console.error('Failed to create session:', err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Guided Learning
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Mastery-based learning with adaptive practice
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              Start a New Session
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Cardiovascular Physiology"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Learning Objectives (one per line)
                </label>
                <textarea
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Understand cardiac output regulation&#10;Explain Starling's Law&#10;Describe baroreceptor reflex"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                />
              </div>
              
              <button
                onClick={handleCreateSession}
                disabled={isCreating || !topic.trim() || !objectives.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-medium transition-all disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Session
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Mastery States</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                NOVICE → SHAKY → COMPETENT → AUTOMATIC
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Spaced Repetition</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Automatic review scheduling
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
