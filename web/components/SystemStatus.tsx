'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi,
  WifiOff,
  Server,
  Brain,
  Database,
  Volume2,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SystemStatusData {
  backend: {
    status: string
    timestamp: string
  }
  llm: {
    status: string
    model: string | null
    testable: boolean
    error?: string
  }
  embeddings: {
    status: string
    model: string | null
    testable: boolean
    error?: string
  }
  tts: {
    status: string
    model: string | null
    testable: boolean
    error?: string
  }
}

interface TestResult {
  success: boolean
  message: string
  model?: string
  response_time_ms?: number
  error?: string
}

type ModelType = 'llm' | 'embeddings' | 'tts'

// MICRO-INDUSTRIALISM palette (neutral panels + functional status colors)
const cloudDancer = {
  // Base panel
  glass: 'bg-white dark:bg-zinc-950/40',
  glassBorder: 'border border-border/80 dark:border-white/10',
  glassHover: 'hover:bg-zinc-50 dark:hover:bg-white/5',

  // Status colors - teal for healthy, red for errors
  healthy: {
    bg: 'bg-teal-500/10 dark:bg-teal-400/10',
    border: 'border-teal-500/30 dark:border-teal-400/30',
    text: 'text-teal-600 dark:text-teal-400',
    glow: '',
  },
  error: {
    bg: 'bg-red-500/10 dark:bg-red-400/10',
    border: 'border-red-500/30 dark:border-red-400/30',
    text: 'text-red-600 dark:text-red-400',
    glow: '',
  },
  pending: {
    bg: 'bg-zinc-500/10 dark:bg-zinc-400/10',
    border: 'border-zinc-500/30 dark:border-zinc-400/30',
    text: 'text-zinc-500 dark:text-zinc-400',
    glow: '',
  },

  // Accent colors for icons
  iconBlue: 'text-sky-500 dark:text-sky-400',
  iconPurple: 'text-violet-500 dark:text-violet-400',
  iconTeal: 'text-teal-500 dark:text-teal-400',
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
}

export default function SystemStatus() {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [testing, setTesting] = useState<Record<ModelType, boolean>>({
    llm: false,
    embeddings: false,
    tts: false,
  })
  const [testResults, setTestResults] = useState<Record<ModelType, TestResult | null>>({
    llm: null,
    embeddings: null,
    tts: null,
  })

  // Check backend connection status (auto-update every 30 seconds)
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const response = await fetch(apiUrl('/api/v1/knowledge/health'), {
          method: 'GET',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setBackendConnected(response.ok)

        // If backend is connected, fetch system status
        if (response.ok) {
          fetchSystemStatus()
        }
      } catch (error) {
        setBackendConnected(false)
      }
    }

    // Initial check
    checkBackendConnection()

    // Check every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/system/status'))
      if (response.ok) {
        const data = await response.json()
        setStatusData(data)
      }
    } catch (error) {
      // Silently fail - backend connection check will handle this
    }
  }

  const testModelConnection = async (modelType: ModelType) => {
    setTesting(prev => ({ ...prev, [modelType]: true }))
    setTestResults(prev => ({ ...prev, [modelType]: null }))

    try {
      const response = await fetch(apiUrl(`/api/v1/system/test/${modelType}`), {
        method: 'POST',
      })

      const result: TestResult = await response.json()
      setTestResults(prev => ({ ...prev, [modelType]: result }))

      // Refresh system status after test
      if (result.success) {
        fetchSystemStatus()
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [modelType]: {
          success: false,
          message: 'Test failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }))
    } finally {
      setTesting(prev => ({ ...prev, [modelType]: false }))
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'online':
      case 'configured':
        return cloudDancer.healthy
      case 'offline':
      case 'not_configured':
      case 'error':
        return cloudDancer.error
      default:
        return cloudDancer.pending
    }
  }

  const getStatusIcon = (status: string, isBackend: boolean = false) => {
    if (isBackend) {
      return backendConnected ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )
    }

    switch (status) {
      case 'online':
      case 'configured':
        return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'offline':
      case 'not_configured':
      case 'error':
        return <XCircle className="w-3.5 h-3.5" />
      default:
        return <div className="w-3 h-3 rounded-full bg-zinc-400/50" />
    }
  }

  const getStatusText = (status: string, isBackend: boolean = false) => {
    if (isBackend) {
      if (backendConnected === null) return 'Checking...'
      return backendConnected ? 'Online' : 'Offline'
    }

    switch (status) {
      case 'online':
        return 'Online'
      case 'configured':
        return 'Configured'
      case 'offline':
        return 'Offline'
      case 'not_configured':
        return 'Not Configured'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const getBackendStyle = () => {
    if (backendConnected === null) return cloudDancer.pending
    return backendConnected ? cloudDancer.healthy : cloudDancer.error
  }

  const renderStatusCard = (
    modelType: ModelType,
    icon: React.ReactNode,
    label: string,
    data: { status: string; model: string | null; testable: boolean; error?: string }
  ) => {
    const style = getStatusStyle(data.status)

    return (
      <motion.div
        variants={itemVariants}
        className={cn(
          'ui-frame px-4 py-3 rounded-lg text-sm transition-colors duration-150',
          cloudDancer.glass,
          cloudDancer.glassBorder,
          style.glow || ''
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            {icon}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
          </div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {data.status === 'configured' && testResults[modelType] && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`text-xs font-medium ${testResults[modelType]?.success ? cloudDancer.healthy.text : cloudDancer.error.text}`}
              >
                {testResults[modelType]?.success ? '✓' : '✗'}
              </motion.span>
            )}
            <span className={style.text}>{getStatusIcon(data.status)}</span>
            <span className={cn('text-xs font-medium ui-mono', style.text)}>
              {getStatusText(data.status)}
            </span>
          </motion.div>
        </div>

        {data.model && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs ui-mono text-zinc-500 dark:text-zinc-400 truncate mb-2 pl-7"
          >
            {data.model}
          </motion.div>
        )}

        {data.testable && (
          <motion.button
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            onClick={() => testModelConnection(modelType)}
            disabled={testing[modelType] || !backendConnected}
            className={cn(
              'ui-frame w-full mt-2 px-3 py-2 text-xs font-medium rounded-md',
              cloudDancer.glass,
              cloudDancer.glassBorder,
              cloudDancer.glassHover,
              'text-zinc-800 dark:text-zinc-200',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {testing[modelType] ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-3.5 h-3.5" />
                </motion.div>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Connection</span>
              </>
            )}
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {testResults[modelType] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'mt-2 text-xs ui-mono',
                testResults[modelType]?.success ? cloudDancer.healthy.text : cloudDancer.error.text
              )}
            >
              {testResults[modelType]?.message}
              {testResults[modelType]?.response_time_ms && (
                <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                  ({testResults[modelType]?.response_time_ms}ms)
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* Backend Status */}
      <motion.div
        variants={itemVariants}
        className={cn(
          'ui-frame px-4 py-3 rounded-lg flex items-center justify-between text-sm',
          cloudDancer.glass,
          cloudDancer.glassBorder,
          getBackendStyle().glow || ''
        )}
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            variants={backendConnected ? pulseVariants : undefined}
            animate={backendConnected ? 'pulse' : undefined}
            className={getBackendStyle().text}
          >
            {getStatusIcon('', true)}
          </motion.div>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Backend Service</span>
        </div>
        <motion.span
          key={backendConnected?.toString()}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn('text-xs font-medium ui-mono', getBackendStyle().text)}
        >
          {getStatusText('', true)}
        </motion.span>
      </motion.div>

      {/* Model Statuses */}
      <AnimatePresence mode="wait">
        {statusData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* LLM Status */}
            {renderStatusCard(
              'llm',
              <Brain className={`w-4 h-4 ${cloudDancer.iconBlue}`} />,
              'LLM Model',
              statusData.llm
            )}

            {/* Embeddings Status */}
            {renderStatusCard(
              'embeddings',
              <Database className={`w-4 h-4 ${cloudDancer.iconPurple}`} />,
              'Embeddings',
              statusData.embeddings
            )}

            {/* TTS Status */}
            {renderStatusCard(
              'tts',
              <Volume2 className={`w-4 h-4 ${cloudDancer.iconTeal}`} />,
              'TTS Model',
              statusData.tts
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
