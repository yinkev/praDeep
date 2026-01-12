'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  MessageCircle,
  User,
  Bot,
  Clock,
  Loader2,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { apiUrl } from '@/lib/api'
import { processLatexContent } from '@/lib/latex'
import { useGlobal } from '@/context/GlobalContext'
import { getTranslation } from '@/lib/i18n'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
  sources?: {
    rag?: Array<{ kb_name: string; content: string }>
    web?: Array<{ url: string; title?: string }>
  }
}

interface ChatSession {
  session_id: string
  title: string
  messages: ChatMessage[]
  settings?: {
    kb_name?: string
    enable_rag?: boolean
    enable_web_search?: boolean
  }
  created_at: number
  updated_at: number
}

interface ChatSessionDetailProps {
  sessionId: string
  onClose: () => void
  onContinue: () => void
}

export default function ChatSessionDetail({
  sessionId,
  onClose,
  onContinue,
}: ChatSessionDetailProps) {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)

  const [session, setSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure we're on the client before rendering portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(apiUrl(`/api/v1/chat/sessions/${sessionId}`))
        if (!response.ok) {
          throw new Error('Failed to load session')
        }
        const data = await response.json()
        setSession(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

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

  // Don't render until mounted (client-side only)
  if (!mounted) return null

  // Animation variants for messages
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    }),
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.15 },
    },
  }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop with blur */}
        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

        {/* Modal Card with Glass Effect */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col"
        >
          <Card
            variant="glass"
            hoverEffect={false}
            className="w-full max-h-[85vh] flex flex-col bg-[#F7F4EC]/90 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-black/10"
          >
            {/* Header */}
            <CardHeader className="flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                    {session?.title || t('Chat History')}
                  </h2>
                  {session && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(session.created_at * 1000).toLocaleString(
                        uiSettings.language === 'zh' ? 'zh-CN' : 'en-US'
                      )}
                      <span className="mx-1 text-teal-500">|</span>
                      {session.messages.length} {t('messages')}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors backdrop-blur-sm border border-white/30 dark:border-slate-700/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </CardHeader>

            {/* Content */}
            <CardBody className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-8 h-8 text-teal-500" />
                  </motion.div>
                </div>
              ) : error ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-red-500 dark:text-red-400">{error}</p>
                </motion.div>
              ) : session ? (
                <div className="space-y-4">
                  {/* Settings Info */}
                  {session.settings &&
                    (session.settings.kb_name ||
                      session.settings.enable_rag ||
                      session.settings.enable_web_search) && (
                      <motion.div
                        className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-[#E8E2D0]/50 dark:border-slate-700/50"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {session.settings.kb_name && (
                          <span className="px-2.5 py-1 text-xs font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">
                            KB: {session.settings.kb_name}
                          </span>
                        )}
                        {session.settings.enable_rag && (
                          <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                            RAG Enabled
                          </span>
                        )}
                        {session.settings.enable_web_search && (
                          <span className="px-2.5 py-1 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full">
                            Web Search Enabled
                          </span>
                        )}
                      </motion.div>
                    )}

                  {/* Messages with staggered animation */}
                  <AnimatePresence mode="popLayout">
                    {session.messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        custom={idx}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <motion.div
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Bot className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                        <motion.div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-br-none shadow-lg shadow-teal-500/20'
                              : 'bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 rounded-bl-none backdrop-blur-sm border border-white/50 dark:border-slate-700/50'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                        >
                          {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-2">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {processLatexContent(msg.content)}
                              </ReactMarkdown>
                            </div>
                          )}

                          {/* Sources */}
                          {msg.sources && (msg.sources.rag?.length || msg.sources.web?.length) && (
                            <div className="mt-3 pt-3 border-t border-white/20 dark:border-slate-600/50">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                                {t('Sources')}:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {msg.sources.rag?.map((src, i) => (
                                  <span
                                    key={`rag-${i}`}
                                    className="px-2 py-0.5 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded"
                                  >
                                    {src.kb_name}
                                  </span>
                                ))}
                                {msg.sources.web?.map((src, i) => (
                                  <a
                                    key={`web-${i}`}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded hover:bg-cyan-200 dark:hover:bg-cyan-900/50 flex items-center gap-1 transition-colors"
                                  >
                                    {src.title || new URL(src.url).hostname}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Timestamp */}
                          {msg.timestamp && (
                            <p
                              className={`text-xs mt-2 ${
                                msg.role === 'user'
                                  ? 'text-teal-100'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {new Date(msg.timestamp * 1000).toLocaleTimeString(
                                uiSettings.language === 'zh' ? 'zh-CN' : 'en-US',
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                            </p>
                          )}
                        </motion.div>
                        {msg.role === 'user' && (
                          <motion.div
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20"
                            whileHover={{ scale: 1.1 }}
                          >
                            <User className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : null}
            </CardBody>

            {/* Footer */}
            <CardFooter className="flex justify-between items-center shrink-0 bg-[#F0EAD6]/50 dark:bg-slate-800/30">
              <Button variant="secondary" onClick={onClose}>
                {t('Close')}
              </Button>
              <Button
                variant="primary"
                onClick={onContinue}
                iconLeft={<MessageSquare className="w-4 h-4" />}
              >
                {t('Continue')}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
