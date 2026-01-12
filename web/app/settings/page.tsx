'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Globe,
  Save,
  RotateCcw,
  Check,
  Server,
  AlertCircle,
  Database,
  Search,
  Volume2,
  Cpu,
  Key,
  Brain,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  Zap,
} from 'lucide-react'
import { apiUrl } from '@/lib/api'
import { getTranslation } from '@/lib/i18n'
import { setTheme } from '@/lib/theme'
import { debounce } from '@/lib/debounce'
import { cn } from '@/lib/utils'

import { useGlobal } from '@/context/GlobalContext'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Spinner, FullPageLoading } from '@/components/ui/LoadingState'
import { useToast } from '@/components/ui/Toast'

// --- Types matching backend ---

interface UISettings {
  theme: 'light' | 'dark'
  language: 'zh' | 'en'
  output_language: 'zh' | 'en'
}

interface EnvInfo {
  model: string
  [key: string]: string
}

interface ConfigData {
  system?: {
    language?: string
    [key: string]: unknown
  }
  tools?: {
    rag_tool?: {
      kb_base_dir?: string
      default_kb?: string
      [key: string]: unknown
    }
    run_code?: {
      workspace?: string
      allowed_roots?: string[]
      language?: string
      timeout?: number
      sandbox?: boolean
      [key: string]: unknown
    }
    web_search?: {
      enabled?: boolean
      max_results?: number
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  logging?: {
    level?: string
    [key: string]: unknown
  }
  tts?: {
    default_voice?: string
    default_language?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface FullSettingsResponse {
  ui: UISettings
  config: ConfigData
  env: EnvInfo
}

interface EnvVarInfo {
  key: string
  value: string
  description: string
  category: string
  required: boolean
  default: string
  sensitive: boolean
  is_set: boolean
}

interface EnvCategoryInfo {
  id: string
  name: string
  description: string
  icon: string
}

interface EnvConfigResponse {
  variables: EnvVarInfo[]
  categories: EnvCategoryInfo[]
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

interface TestResults {
  llm: { status: string; model: string | null; error: string | null }
  embedding: { status: string; model: string | null; error: string | null }
  tts: { status: string; model: string | null; error: string | null }
}

interface LLMProvider {
  name: string
  binding: string
  base_url: string
  api_key: string
  model: string
  is_active: boolean
  provider_type: 'api' | 'local'
  requires_key: boolean
}

interface LLMModeInfo {
  mode: 'api' | 'local' | 'hybrid'
  active_provider: {
    name: string
    model: string
    provider_type: 'api' | 'local'
    binding: string
  } | null
  env_configured: boolean
  effective_source: 'env' | 'provider'
}

type SettingsTab = 'general' | 'environment' | 'local_models'

// --- Toggle Switch Component (2026 Modern Theme) ---
interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300',
        'ring-1 ring-black/5 dark:ring-white/10',
        checked
          ? 'bg-gradient-to-b from-blue-500 to-blue-600 shadow-sm shadow-blue-600/10'
          : 'bg-zinc-200/80 dark:bg-white/10',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
      )}
    >
      <motion.span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-50 dark:ring-white/10"
        initial={false}
        animate={{
          x: checked ? 24 : 4,
        }}
        transition={{
          type: 'spring' as const,
          stiffness: 500,
          damping: 30,
        }}
      />
    </button>
  )
}

// --- Tab Navigation with Animated Indicator (2026 Modern Theme) ---
interface TabItem {
  id: SettingsTab
  label: string
  icon: React.ReactNode
  badge?: React.ReactNode
}

interface TabNavigationProps {
  tabs: TabItem[]
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const activeIndex = tabs.findIndex(t => t.id === activeTab)
    const activeRef = tabRefs.current[activeIndex]
    if (activeRef) {
      setIndicatorStyle({
        left: activeRef.offsetLeft,
        width: activeRef.offsetWidth,
      })
    }
  }, [activeTab, tabs])

  return (
    <Card variant="glass" padding="none" interactive={false} className="p-1">
      <div
        role="tablist"
        aria-label="Settings navigation"
        className="relative flex items-center gap-1"
      >
        <motion.div
          aria-hidden="true"
          className={cn(
            'absolute top-0 bottom-0 rounded-xl shadow-sm border',
            'bg-white/80 border-zinc-200/70',
            'dark:bg-zinc-950/60 dark:border-white/10'
          )}
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring' as const,
            stiffness: 420,
            damping: 34,
          }}
        />

        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => {
              tabRefs.current[index] = el
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-2',
              'px-4 py-3 rounded-xl text-sm font-medium tracking-tight',
              'transition-colors duration-200',
              activeTab === tab.id
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge}
          </button>
        ))}
      </div>
    </Card>
  )
}

// --- Status Card Component (2026 Modern Theme) ---
interface StatusCardProps {
  title: string
  icon: React.ReactNode
  status: 'success' | 'error' | 'pending' | 'unknown'
  model?: string | null
  endpoint?: string | null
  message?: string | null
  error?: string | null
  responseTime?: number | null
  onTest: () => void
  testing: boolean
  accentColor: string
}

function StatusCard({
  title,
  icon,
  status,
  model,
  endpoint,
  message,
  error,
  responseTime,
  onTest,
  testing,
  accentColor,
}: StatusCardProps) {
  const statusColors = {
    success:
      'border-emerald-200/70 hover:border-emerald-300/80 dark:border-emerald-500/20 dark:hover:border-emerald-500/30 ring-1 ring-emerald-500/10',
    error:
      'border-red-200/70 hover:border-red-300/80 dark:border-red-500/20 dark:hover:border-red-500/30 ring-1 ring-red-500/10',
    pending:
      'border-blue-200/70 hover:border-blue-300/80 dark:border-blue-500/20 dark:hover:border-blue-500/30 ring-1 ring-blue-500/10',
    unknown:
      'border-zinc-200/70 hover:border-zinc-300/80 dark:border-white/10 dark:hover:border-white/15',
  }

  return (
    <motion.div
      className="h-full"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
    >
      <Card
        variant="glass"
        padding="none"
        interactive={false}
        className={cn('h-full border', statusColors[status])}
      >
        <CardBody padding="sm" className="h-full flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn('shrink-0', accentColor)}>{icon}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                  {title}
                </div>
                <div className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {endpoint || 'No endpoint'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {responseTime && <span className="text-[10px] text-zinc-400">{responseTime}ms</span>}
              {status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
              {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
              {status === 'pending' && <AlertCircle className="w-4 h-4 text-blue-500" />}
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs text-zinc-700 dark:text-zinc-200 font-mono truncate">
              {model || 'Not configured'}
            </div>
            {message && <div className="mt-1 text-[10px] text-emerald-600 truncate">{message}</div>}
            {error && <div className="mt-1 text-[10px] text-red-600 truncate">{error}</div>}
          </div>

          <div className="mt-auto">
            <Button
              onClick={onTest}
              loading={testing}
              variant="secondary"
              size="sm"
              className="w-full"
              iconLeft={testing ? undefined : <RefreshCw className="w-3.5 h-3.5" />}
            >
              {testing ? 'Testing…' : `Test ${title}`}
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

// --- Provider Card Component (2026 Modern Theme) ---
interface ProviderCardProps {
  provider: LLMProvider
  onActivate: () => void
  onEdit: () => void
  onDelete: () => void
  onTest: () => void
}

function ProviderCard({ provider, onActivate, onEdit, onDelete, onTest }: ProviderCardProps) {
  return (
    <Card
      variant="glass"
      padding="none"
      interactive
      className={cn(
        'overflow-hidden',
        provider.is_active
          ? 'ring-2 ring-blue-500/35 border-blue-200/70 hover:border-blue-300/80 dark:border-blue-500/20 dark:hover:border-blue-500/30'
          : 'border-white/55 hover:border-white/70 dark:border-white/10 dark:hover:border-white/15'
      )}
    >
      <CardBody padding="sm" className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
              provider.is_active
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300'
                : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
            )}
          >
            <Server className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {provider.name}
              </h3>
              {provider.is_active && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200 text-[10px] rounded-full font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Active
                </span>
              )}
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium',
                  provider.provider_type === 'api'
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                )}
              >
                {provider.provider_type === 'api' ? 'Cloud' : 'Local'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {provider.model}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="font-mono truncate text-[10px]">{provider.base_url}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!provider.is_active && (
            <motion.button
              onClick={onActivate}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-500 dark:hover:text-blue-300 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Set as Active"
            >
              <CheckCircle className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            onClick={onTest}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-zinc-500 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
            title="Test Connection"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onEdit}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-500 dark:hover:text-blue-300 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onDelete}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-500 dark:hover:text-red-300 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </CardBody>
    </Card>
  )
}

// --- Main Settings Page (2026 Modern Theme) ---
export default function SettingsPage() {
  const { uiSettings, refreshSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [data, setData] = useState<FullSettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  const [editedConfig, setEditedConfig] = useState<ConfigData | null>(null)
  const [editedUI, setEditedUI] = useState<UISettings | null>(null)

  interface ProviderPreset {
    id: string
    name: string
    binding: 'openai' | 'azure_openai' | 'ollama' | 'anthropic' | 'gemini' | 'groq' | 'openrouter'
    base_url?: string
    default_model: string
    models: string[]
    requires_key: boolean
    help_text?: string
  }

  const PROVIDER_PRESETS: ProviderPreset[] = [
    {
      id: 'ollama',
      name: 'Ollama',
      binding: 'openai',
      base_url: 'http://localhost:11434/v1',
      default_model: 'llama3.2',
      models: [
        'llama3.2',
        'llama3.3',
        'qwen2.5',
        'qwen3',
        'mistral-nemo',
        'deepseek-r1',
        'gemma2',
        'phi3',
      ],
      requires_key: false,
      help_text:
        "Ollama runs models locally. Default: http://localhost:11434/v1. Run 'ollama serve' first.",
    },
    {
      id: 'lmstudio',
      name: 'LM Studio',
      binding: 'openai',
      base_url: 'http://127.0.0.1:1234',
      default_model: 'local-model',
      models: [],
      requires_key: false,
      help_text:
        "LM Studio provides a local OpenAI-compatible API. Default port: 1234. Use 'Refresh Models' to auto-detect loaded models.",
    },
    {
      id: 'llamacpp',
      name: 'llama.cpp Server',
      binding: 'openai',
      base_url: 'http://localhost:8080/v1',
      default_model: 'local-model',
      models: [],
      requires_key: false,
      help_text: 'llama.cpp server with OpenAI-compatible API. Default port: 8080.',
    },
    {
      id: 'vllm',
      name: 'vLLM',
      binding: 'openai',
      base_url: 'http://localhost:8000/v1',
      default_model: 'local-model',
      models: [],
      requires_key: false,
      help_text: 'vLLM high-throughput inference server. Default port: 8000.',
    },
    {
      id: 'custom',
      name: 'Custom Local Server',
      binding: 'openai',
      base_url: 'http://localhost:8000/v1',
      default_model: '',
      models: [],
      requires_key: false,
      help_text: 'Any OpenAI-compatible local server. Configure the URL and model manually.',
    },
  ]

  const [envConfig, setEnvConfig] = useState<EnvConfigResponse | null>(null)
  const [editedEnvVars, setEditedEnvVars] = useState<Record<string, string>>({})
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})
  const [envSaving, setEnvSaving] = useState(false)
  const [envSaveSuccess, setEnvSaveSuccess] = useState(false)
  const [envError, setEnvError] = useState('')
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [testing, setTesting] = useState(false)
  const [testingService, setTestingService] = useState<Record<string, boolean>>({})
  const [serviceTestResults, setServiceTestResults] = useState<
    Record<
      string,
      {
        status: string
        model: string | null
        error: string | null
        response_time_ms: number | null
        message: string | null
      }
    >
  >({})

  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ollama')
  const [customModelInput, setCustomModelInput] = useState(true)
  const [showProviderForm, setShowProviderForm] = useState(false)
  const [testProviderResult, setTestProviderResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [testingProvider, setTestingProvider] = useState(false)
  const [fetchedModels, setFetchedModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [savingProvider, setSavingProvider] = useState(false)
  const [providerError, setProviderError] = useState<string | null>(null)
  const [originalProviderName, setOriginalProviderName] = useState<string | null>(null)

  const [llmModeInfo, setLlmModeInfo] = useState<LLMModeInfo | null>(null)
  const [providerTypeFilter, setProviderTypeFilter] = useState<'all' | 'api' | 'local'>('all')

  const debouncedSaveTheme = useRef(
    debounce(async (themeValue: 'light' | 'dark', uiSettings: UISettings) => {
      try {
        await fetch(apiUrl('/api/v1/settings/ui'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...uiSettings, theme: themeValue }),
        })
      } catch (err) {
        // Silently fail - theme is still saved to localStorage
      }
    }, 500)
  ).current

  const [loadingRagProviders, setLoadingRagProviders] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchEnvConfig()
    fetchRagProviders()
    fetchLLMMode()
    if (activeTab === 'local_models') {
      fetchProviders()
    }
    // The fetch* functions are intentionally not included as deps to avoid refetch loops from unstable identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiSettings, activeTab])

  const fetchLLMMode = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/config/llm/mode/'))
      if (res.ok) {
        const data = await res.json()
        setLlmModeInfo(data)
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch LLM mode:', err)
      }
    }
  }

  const fetchProviders = async () => {
    setLoadingProviders(true)
    try {
      const res = await fetch(apiUrl('/api/v1/config/llm/'))
      if (res.ok) {
        const data = await res.json()
        setProviders(data)
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch providers:', err)
      }
    } finally {
      setLoadingProviders(false)
    }
  }

  const fetchRagProviders = async () => {
    setLoadingRagProviders(true)
    try {
      const res = await fetch(apiUrl('/api/v1/settings/rag/providers'))
      if (res.ok) {
        // Just fetch - we don't need to store as it's read-only display
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch RAG providers:', err)
      }
    } finally {
      setLoadingRagProviders(false)
    }
  }

  const fetchModels = async () => {
    if (!editingProvider || !editingProvider.base_url) return
    setFetchingModels(true)
    setFetchedModels([])

    try {
      const preset = PROVIDER_PRESETS.find(p => p.id === selectedPresetId)
      const requiresKey = preset ? preset.requires_key : true

      const res = await fetch(apiUrl('/api/v1/config/llm/models/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingProvider, requires_key: requiresKey }),
      })

      const data = await res.json()
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setFetchedModels(data.models)
        setCustomModelInput(false)
      } else {
        if (preset && preset.models.length > 0) {
          setFetchedModels(preset.models)
          if (!data.success) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Backend model fetch failed, using presets:', data.message)
            }
          }
        } else {
          toast.warning(`No models found. ${data.message || ''}`)
        }
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }
      const preset = PROVIDER_PRESETS.find(p => p.id === selectedPresetId)
      if (preset && preset.models.length > 0) {
        setFetchedModels(preset.models)
      } else {
        toast.error('Failed to connect to backend for model fetching.')
      }
    } finally {
      setFetchingModels(false)
    }
  }

  const handleProviderSave = async (provider: LLMProvider) => {
    setSavingProvider(true)
    setProviderError(null)
    try {
      setProviderError('Validating model...')

      const preset = PROVIDER_PRESETS.find(p => p.id === selectedPresetId)
      const requiresKey = preset ? preset.requires_key : true

      let isModelValid = false
      try {
        const modelCheckRes = await fetch(apiUrl('/api/v1/config/llm/models/'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...provider, requires_key: requiresKey }),
        })

        const modelData = await modelCheckRes.json()
        if (modelData.success && Array.isArray(modelData.models)) {
          const normalizeModel = (m: string) => m.split(':')[0].toLowerCase()
          const enteredModel = provider.model
          const normalizedEntered = normalizeModel(enteredModel)

          const isMatch = modelData.models.some(
            (m: string) => m === enteredModel || normalizeModel(m) === normalizedEntered
          )

          if (!isMatch) {
            const availableModels = modelData.models.slice(0, 5).join(', ')
            const warning = `Model "${enteredModel}" not found at provider. Available: ${availableModels}${modelData.models.length > 5 ? '...' : ''}. Continue anyway?`
            if (!confirm(warning)) {
              setSavingProvider(false)
              setProviderError(null)
              return
            }
          } else {
            isModelValid = true
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Model validation failed:', modelData.message)
          }
        }
      } catch (validationErr: unknown) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Model validation error:', validationErr)
        }
      }

      setProviderError(isModelValid ? 'Model verified. Saving...' : 'Saving...')

      const isUpdate = originalProviderName !== null && originalProviderName !== ''
      const method = isUpdate ? 'PUT' : 'POST'
      const url = isUpdate
        ? apiUrl(`/api/v1/config/llm/${encodeURIComponent(originalProviderName!)}`)
        : apiUrl('/api/v1/config/llm/')

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider),
      })

      if (res.ok) {
        fetchProviders()
        setShowProviderForm(false)
        setEditingProvider(null)
        setOriginalProviderName(null)
      } else {
        const err = await res.json()
        setProviderError(err.detail || 'Failed to save provider')
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }
      setProviderError('An error occurred: ' + getErrorMessage(err))
    } finally {
      setSavingProvider(false)
    }
  }

  const handleDeleteProvider = async (name: string) => {
    if (!confirm(`Delete provider ${name}?`)) return
    try {
      let url
      if (!name) {
        url = apiUrl('/api/v1/config/llm/?name=')
      } else {
        url = apiUrl(`/api/v1/config/llm/${encodeURIComponent(name)}`)
      }

      const res = await fetch(url, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchProviders()
      } else {
        const err = await res.json()
        toast.error(`Failed to delete provider: ${err.detail || res.statusText}`)
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }
      toast.error('Failed to delete provider: ' + getErrorMessage(err))
    }
  }

  const handleActivateProvider = async (name: string) => {
    try {
      const res = await fetch(apiUrl('/api/v1/config/llm/active/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) fetchProviders()
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }
    }
  }

  const handleTestProvider = async (provider: LLMProvider) => {
    setTestingProvider(true)
    setTestProviderResult(null)
    try {
      const preset = PROVIDER_PRESETS.find(p => p.id === selectedPresetId)
      const requiresKey = preset ? preset.requires_key : true

      const res = await fetch(apiUrl('/api/v1/config/llm/test/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...provider, requires_key: requiresKey }),
      })
      const data = await res.json()
      setTestProviderResult(data)
    } catch (err) {
      setTestProviderResult({ success: false, message: 'Connection failed' })
    } finally {
      setTestingProvider(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/settings/'))
      if (res.ok) {
        const responseData = await res.json()
        setData(responseData)
        setEditedConfig(JSON.parse(JSON.stringify(responseData.config)))
        if (!editedUI) {
          const uiData = JSON.parse(JSON.stringify(responseData.ui))
          const storedTheme = localStorage.getItem('deeptutor-theme')
          if (storedTheme === 'light' || storedTheme === 'dark') {
            uiData.theme = storedTheme
          }
          setEditedUI(uiData)
          if (uiData.theme) {
            applyTheme(uiData.theme)
          }
        }
      } else {
        setError('Failed to load settings')
      }
    } catch (err) {
      setError('Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  const fetchEnvConfig = async () => {
    try {
      const res = await fetch(apiUrl('/api/v1/settings/env/'))
      if (res.ok) {
        const responseData: EnvConfigResponse = await res.json()
        setEnvConfig(responseData)
        const initialValues: Record<string, string> = {}
        responseData.variables.forEach(v => {
          initialValues[v.key] = v.value
        })
        setEditedEnvVars(initialValues)
        testEnvConfig()
      }
    } catch (err) {
      console.error('Failed to fetch env config:', err)
    }
  }

  const handleEnvVarChange = (key: string, value: string) => {
    setEditedEnvVars(prev => ({ ...prev, [key]: value }))
  }

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleEnvSave = async () => {
    setEnvSaving(true)
    setEnvSaveSuccess(false)
    setEnvError('')

    try {
      const updates = Object.entries(editedEnvVars)
        .filter(([key, value]) => {
          const original = envConfig?.variables.find(v => v.key === key)
          if (original?.sensitive && value.includes('*') && value === original.value) {
            return false
          }
          return true
        })
        .map(([key, value]) => ({ key, value }))

      const res = await fetch(apiUrl('/api/v1/settings/env/'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables: updates }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail?.errors?.join(', ') || 'Failed to save')
      }

      setEnvSaveSuccess(true)
      setTimeout(() => setEnvSaveSuccess(false), 2000)

      await fetchEnvConfig()
      await testEnvConfig()
    } catch (err: unknown) {
      setEnvError(getErrorMessage(err) || 'Failed to save environment variables')
    } finally {
      setEnvSaving(false)
    }
  }

  const testEnvConfig = async () => {
    setTesting(true)
    try {
      const res = await fetch(apiUrl('/api/v1/settings/env/test/'), {
        method: 'POST',
      })
      if (res.ok) {
        const results = await res.json()
        setTestResults(results)
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to test env config:', err)
      }
    } finally {
      setTesting(false)
    }
  }

  const testSingleService = async (service: 'llm' | 'embedding' | 'tts') => {
    setTestingService(prev => ({ ...prev, [service]: true }))
    try {
      const res = await fetch(apiUrl(`/api/v1/settings/env/test/${service}`), {
        method: 'POST',
      })
      if (res.ok) {
        const result = await res.json()
        setServiceTestResults(prev => ({ ...prev, [service]: result }))
        setTestResults(prev =>
          prev
            ? {
                ...prev,
                [service]: {
                  status: result.status === 'success' ? 'configured' : result.status,
                  model: result.model,
                  error: result.error,
                },
              }
            : null
        )
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to test ${service}:`, err)
      }
      setServiceTestResults(prev => ({
        ...prev,
        [service]: {
          status: 'error',
          model: null,
          error: 'Connection failed',
          response_time_ms: null,
          message: null,
        },
      }))
    } finally {
      setTestingService(prev => ({ ...prev, [service]: false }))
    }
  }

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'brain':
        return <Brain className="w-4 h-4" />
      case 'database':
        return <Database className="w-4 h-4" />
      case 'volume':
        return <Volume2 className="w-4 h-4" />
      case 'search':
        return <Search className="w-4 h-4" />
      case 'settings':
        return <SettingsIcon className="w-4 h-4" />
      default:
        return <Key className="w-4 h-4" />
    }
  }

  const applyTheme = (theme: 'light' | 'dark') => {
    setTheme(theme)
  }

  const handleSave = async () => {
    if (!editedConfig || !editedUI) return
    setSaving(true)
    setSaveSuccess(false)
    setError('')

    try {
      if (Object.keys(editedEnvVars).length > 0) {
        const envUpdates = Object.entries(editedEnvVars)
          .filter(([key, value]) => {
            const original = envConfig?.variables.find(v => v.key === key)
            if (original?.sensitive && value.includes('*') && value === original.value) {
              return false
            }
            return true
          })
          .map(([key, value]) => ({ key, value }))

        if (envUpdates.length > 0) {
          const envRes = await fetch(apiUrl('/api/v1/settings/env'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables: envUpdates }),
          })
          if (!envRes.ok) {
            const errorData = await envRes.json()
            throw new Error(
              errorData.detail?.errors?.join(', ') || 'Failed to save environment variables'
            )
          }
          await fetchEnvConfig()
        }
      }

      const configRes = await fetch(apiUrl('/api/v1/settings/config'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: editedConfig }),
      })

      if (!configRes.ok) throw new Error('Failed to save configuration')

      const uiRes = await fetch(apiUrl('/api/v1/settings/ui'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedUI),
      })

      if (!uiRes.ok) throw new Error('Failed to save UI settings')

      const newConfig = await configRes.json()
      const newUI = await uiRes.json()

      setData(prev => (prev ? { ...prev, config: newConfig, ui: newUI } : null))

      if (editedUI.theme) {
        setTheme(editedUI.theme)
      }

      await refreshSettings()

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const ensureRecord = (value: unknown): Record<string, unknown> => {
    if (typeof value !== 'object' || value == null || Array.isArray(value)) return {}
    return value as Record<string, unknown>
  }

  const handleConfigChange = (
    section: string,
    key: string,
    value: unknown,
    subSection?: string
  ) => {
    setEditedConfig(prev => {
      if (!prev) return null

      const config = prev as Record<string, unknown>
      const sectionValue = ensureRecord(config[section])

      if (subSection) {
        const subSectionValue = ensureRecord(sectionValue[subSection])
        const nextSubSectionValue = { ...subSectionValue, [key]: value }
        const nextSectionValue = { ...sectionValue, [subSection]: nextSubSectionValue }
        return { ...config, [section]: nextSectionValue } as ConfigData
      }

      const nextSectionValue = { ...sectionValue, [key]: value }
      return { ...config, [section]: nextSectionValue } as ConfigData
    })
  }

  const handleUIChange = <K extends keyof UISettings>(key: K, value: UISettings[K]) => {
    setEditedUI(prev => {
      if (!prev) return null
      const newUI = { ...prev, [key]: value }
      if (key === 'theme') {
        const theme = value as UISettings['theme']
        applyTheme(theme)
        debouncedSaveTheme(theme, newUI)
      }
      return newUI
    })
  }

  const getServiceStatus = (
    service: 'llm' | 'embedding' | 'tts'
  ): 'success' | 'error' | 'pending' | 'unknown' => {
    const result = serviceTestResults[service] || testResults?.[service]
    if (!result) return 'unknown'
    if (result.status === 'success' || result.status === 'configured') return 'success'
    if (result.status === 'error') return 'error'
    if (result.status === 'not_configured') return 'pending'
    return 'unknown'
  }

  const tabs: TabItem[] = [
    {
      id: 'general',
      label: t('General Settings'),
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      id: 'environment',
      label: t('Environment Variables'),
      icon: <Key className="w-4 h-4" />,
      badge: (testing || testResults) && (
        <span
          className={`ml-1 w-2 h-2 rounded-full ${
            testing
              ? 'bg-blue-500 animate-pulse'
              : testResults && Object.values(testResults).every(r => r.status === 'configured')
                ? 'bg-emerald-500'
                : testResults && Object.values(testResults).some(r => r.status === 'error')
                  ? 'bg-red-500'
                  : 'bg-blue-500'
          }`}
        />
      ),
    },
    {
      id: 'local_models',
      label: t('LLM Providers'),
      icon: <Server className="w-4 h-4" />,
      badge: llmModeInfo && (
        <span
          className={`ml-1 px-1.5 py-0.5 text-[9px] rounded font-medium ${
            llmModeInfo.mode === 'hybrid'
              ? 'bg-violet-100 text-violet-600'
              : llmModeInfo.mode === 'api'
                ? 'bg-sky-100 text-sky-600'
                : 'bg-emerald-100 text-emerald-600'
          }`}
        >
          {llmModeInfo.mode.toUpperCase()}
        </span>
      ),
    },
  ]

  if (loading) {
    return <FullPageLoading message={t('Loading settings...')} />
  }

  if (!editedConfig || !editedUI) {
    return (
      <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Settings') }]}>
        <Card variant="glass" padding="none" interactive={false}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950/60 dark:ring-white/10">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {t('System Settings')}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t('Error loading data')}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-red-600">{t('Error loading data')}</p>
          </CardBody>
        </Card>
      </PageWrapper>
    )
  }

  const selectClassName = cn(
    'w-full h-10 px-3 text-sm',
    'bg-white dark:bg-zinc-950/40',
    'border border-zinc-200 dark:border-white/10',
    'rounded-lg',
    'text-zinc-900 dark:text-zinc-50',
    'outline-none',
    'hover:border-zinc-300 dark:hover:border-white/20',
    'focus:border-zinc-400 focus:ring-2 focus:ring-blue-500/20'
  )

  const resetEdits = () => {
    if (data) {
      setEditedConfig(JSON.parse(JSON.stringify(data.config)))

      const uiData = JSON.parse(JSON.stringify(data.ui))
      const storedTheme = localStorage.getItem('deeptutor-theme')
      if (storedTheme === 'light' || storedTheme === 'dark') {
        uiData.theme = storedTheme
      }

      setEditedUI(uiData)
      applyTheme(uiData.theme)
    }

    if (envConfig) {
      const initialValues: Record<string, string> = {}
      envConfig.variables.forEach(v => {
        initialValues[v.key] = v.value
      })
      setEditedEnvVars(initialValues)
    }

    setShowSensitive({})
    setError('')
    setEnvError('')
    setProviderError(null)
  }

  return (
    <PageWrapper maxWidth="wide" showPattern breadcrumbs={[{ label: t('Settings') }]}>
      <PageHeader
        title={
          <span className="block">
            <span className="block text-xs font-semibold uppercase tracking-[0.34em] text-zinc-500 dark:text-zinc-400">
              {t('Settings')}
            </span>
            <motion.span
              initial={{ opacity: 0, y: 10, clipPath: 'inset(0 0 100% 0)' }}
              animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-1 block text-[clamp(1.75rem,2.6vw,2.25rem)] font-black tracking-[-0.045em] bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-fuchsia-400"
            >
              {t('System Settings')}
            </motion.span>
          </span>
        }
        titleClassName="leading-[1.05]"
        description={
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="inline-block"
          >
            {t('Manage system configuration and preferences')}
          </motion.span>
        }
        descriptionClassName="tracking-[-0.01em]"
        icon={<SettingsIcon className="w-5 h-5 text-blue-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={resetEdits}
              disabled={saving}
              iconLeft={<RotateCcw className="w-4 h-4" />}
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              variant={saveSuccess ? 'secondary' : 'primary'}
              iconLeft={saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {saving ? t('Saving...') : saveSuccess ? t('Saved!') : t('Save')}
            </Button>
          </div>
        }
      />

      <div className="space-y-8">
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <Card variant="glass" padding="none" interactive={false}>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {t('Configuration Status')}
              </h2>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('Click each card to test')}
            </span>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard
                title="LLM"
                icon={<Brain className="w-4 h-4" />}
                status={getServiceStatus('llm')}
                model={
                  serviceTestResults.llm?.model ||
                  testResults?.llm?.model ||
                  editedEnvVars['LLM_MODEL']
                }
                endpoint={editedEnvVars['LLM_HOST']}
                message={serviceTestResults.llm?.message}
                error={serviceTestResults.llm?.error || testResults?.llm?.error}
                responseTime={serviceTestResults.llm?.response_time_ms}
                onTest={() => testSingleService('llm')}
                testing={testingService.llm || false}
                accentColor="text-violet-500"
              />
              <StatusCard
                title="Embedding"
                icon={<Database className="w-4 h-4" />}
                status={getServiceStatus('embedding')}
                model={
                  serviceTestResults.embedding?.model ||
                  testResults?.embedding?.model ||
                  editedEnvVars['EMBEDDING_MODEL']
                }
                endpoint={editedEnvVars['EMBEDDING_HOST']}
                message={serviceTestResults.embedding?.message}
                error={serviceTestResults.embedding?.error || testResults?.embedding?.error}
                responseTime={serviceTestResults.embedding?.response_time_ms}
                onTest={() => testSingleService('embedding')}
                testing={testingService.embedding || false}
                accentColor="text-sky-500"
              />
              <StatusCard
                title="TTS"
                icon={<Volume2 className="w-4 h-4" />}
                status={getServiceStatus('tts')}
                model={
                  serviceTestResults.tts?.model ||
                  testResults?.tts?.model ||
                  editedEnvVars['TTS_MODEL']
                }
                endpoint={editedEnvVars['TTS_URL']}
                message={serviceTestResults.tts?.message}
                error={serviceTestResults.tts?.error || testResults?.tts?.error}
                responseTime={serviceTestResults.tts?.response_time_ms}
                onTest={() => testSingleService('tts')}
                testing={testingService.tts || false}
                accentColor="text-rose-500"
              />
            </div>
          </CardBody>
        </Card>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card
              variant="glass"
              padding="none"
              interactive={false}
              className="border-red-200/70 dark:border-red-500/20 ring-1 ring-red-500/10"
            >
              <CardBody
                padding="sm"
                className="flex items-center gap-3 text-red-700 dark:text-red-200 font-medium"
              >
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </CardBody>
            </Card>
          </motion.div>
        )}

        {/* Tab Content with AnimatePresence */}
        <AnimatePresence mode="wait">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Row 1: Interface + System Language + Active Model */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Interface Settings */}
                <Card variant="glass" padding="none" interactive={false}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('Interface Preferences')}
                      </h2>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {/* Theme Mode */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                        {t('Theme')}
                      </label>
                      <div className="flex bg-zinc-100/80 dark:bg-white/10 p-1 rounded-lg">
                        {(['light', 'dark'] as const).map(themeOption => (
                          <motion.button
                            key={themeOption}
                            onClick={() => handleUIChange('theme', themeOption)}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                              editedUI.theme === themeOption
                                ? 'bg-white/90 dark:bg-zinc-950/60 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {themeOption === 'light' ? (
                              <Sun className="w-4 h-4" />
                            ) : (
                              <Moon className="w-4 h-4" />
                            )}
                            <span>{themeOption === 'light' ? t('Light') : t('Dark')}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    {/* Interface Language */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                        {t('Language')}
                      </label>
                      <select
                        value={editedUI.language}
                        onChange={e =>
                          handleUIChange(
                            'language',
                            e.target.value === 'en' || e.target.value === 'zh'
                              ? e.target.value
                              : 'en'
                          )
                        }
                        className={selectClassName}
                      >
                        <option value="en">{t('English')}</option>
                        <option value="zh">{t('Chinese')}</option>
                      </select>
                    </div>
                  </CardBody>
                </Card>

                {/* System Language */}
                <Card variant="glass" padding="none" interactive={false}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-violet-500" />
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('System Configuration')}
                      </h2>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      {t('System Language')}
                    </label>
                    <p className="text-xs text-zinc-500 mb-3">
                      {t('Default language for system operations')}
                    </p>
                    <select
                      value={editedConfig.system?.language || 'en'}
                      onChange={e => handleConfigChange('system', 'language', e.target.value)}
                      className={selectClassName}
                    >
                      <option value="en">English</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </CardBody>
                </Card>

                {/* Active Models Status */}
                {data?.env && (
                  <Card variant="glass" padding="none" interactive={false}>
                    <CardHeader>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-emerald-500" />
                          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                            {t('Active Models')}
                          </h2>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                          {t('Status')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <Card
                        variant="glass"
                        padding="sm"
                        interactive={false}
                        className="rounded-xl border-emerald-200/70 dark:border-emerald-500/20 ring-1 ring-emerald-500/10 flex items-center gap-3"
                      >
                        <div className="p-2 bg-white dark:bg-zinc-950/60 rounded-lg shadow-sm ring-1 ring-zinc-200/60 dark:ring-white/10">
                          <Server className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-emerald-600 font-medium">
                            {t('Active LLM Model')}
                          </p>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 font-mono truncate">
                            {data.env.model || t('Not configured')}
                          </p>
                        </div>
                      </Card>
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* RAG Provider */}
              <Card variant="glass" padding="none" interactive={false}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-500" />
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {t('RAG Provider')}
                    </h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        {t('Active RAG System')}
                      </label>
                      <p className="text-xs text-zinc-500 mb-3">
                        {t(
                          'RAG-Anything provides end-to-end academic document processing with MinerU and LightRAG'
                        )}
                      </p>
                      {loadingRagProviders ? (
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <Spinner size="sm" />
                          <span>Loading providers...</span>
                        </div>
                      ) : (
                        <Card
                          variant="glass"
                          padding="sm"
                          interactive={false}
                          className="rounded-xl border-white/55 dark:border-white/10 flex items-center justify-between gap-3"
                        >
                          <span className="text-sm text-zinc-600 dark:text-zinc-300">
                            RAG-Anything - End-to-end academic document processing (MinerU +
                            LightRAG)
                          </span>
                          <span className="shrink-0 text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200 rounded-full font-medium">
                            Default
                          </span>
                        </Card>
                      )}
                    </div>
                    <Card
                      variant="glass"
                      padding="sm"
                      interactive={false}
                      className="lg:w-1/2 rounded-xl border-white/55 dark:border-white/10"
                    >
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        <p>
                          RAG-Anything combines MinerU for multimodal PDF parsing (images, tables,
                          equations) with LightRAG for knowledge graph construction.
                        </p>
                        <p className="mt-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            Supported modes:
                          </span>{' '}
                          hybrid, local, global, naive
                        </p>
                      </div>
                    </Card>
                  </div>
                </CardBody>
              </Card>

              {/* Research Tools & TTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Research Tools */}
                <Card variant="glass" padding="none" interactive={false}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('Research Tools')}
                      </h2>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Web Search */}
                      <Card
                        variant="glass"
                        padding="sm"
                        interactive={false}
                        className="rounded-xl border-white/55 dark:border-white/10"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-sky-500" />
                            {t('Web Search')}
                          </span>
                          <ToggleSwitch
                            checked={editedConfig.tools?.web_search?.enabled ?? true}
                            onChange={checked =>
                              handleConfigChange('tools', 'enabled', checked, 'web_search')
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                            {t('Max Results')}
                          </label>
                          <Input
                            type="number"
                            value={editedConfig.tools?.web_search?.max_results || 5}
                            onChange={e =>
                              handleConfigChange(
                                'tools',
                                'max_results',
                                parseInt(e.target.value),
                                'web_search'
                              )
                            }
                          />
                        </div>
                      </Card>

                      {/* Knowledge Base */}
                      <Card
                        variant="glass"
                        padding="sm"
                        interactive={false}
                        className="rounded-xl border-white/55 dark:border-white/10"
                      >
                        <div className="flex items-center mb-4">
                          <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                            <Database className="w-4 h-4 text-violet-500" />
                            {t('Knowledge Base')}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                              {t('Default KB')}
                            </label>
                            <Input
                              type="text"
                              value={editedConfig.tools?.rag_tool?.default_kb || ''}
                              onChange={e =>
                                handleConfigChange(
                                  'tools',
                                  'default_kb',
                                  e.target.value,
                                  'rag_tool'
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                              {t('Base Directory')}
                            </label>
                            <Input
                              type="text"
                              value={editedConfig.tools?.rag_tool?.kb_base_dir || ''}
                              onChange={e =>
                                handleConfigChange(
                                  'tools',
                                  'kb_base_dir',
                                  e.target.value,
                                  'rag_tool'
                                )
                              }
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </Card>
                    </div>
                  </CardBody>
                </Card>

                {/* TTS Settings */}
                <Card variant="glass" padding="none" interactive={false}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-rose-500" />
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {t('Text-to-Speech')}
                      </h2>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label={t('Default Voice')}
                        value={editedConfig.tts?.default_voice || 'Cherry'}
                        onChange={e => handleConfigChange('tts', 'default_voice', e.target.value)}
                      />
                      <Input
                        label={t('Default Language')}
                        value={editedConfig.tts?.default_language || 'English'}
                        onChange={e =>
                          handleConfigChange('tts', 'default_language', e.target.value)
                        }
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Environment Variables Tab */}
          {activeTab === 'environment' && envConfig && (
            <motion.div
              key="environment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {envConfig.categories.map(category => {
                  const categoryVars = envConfig.variables.filter(v => v.category === category.id)
                  if (categoryVars.length === 0) return null

                  return (
                    <Card key={category.id} variant="glass" padding="none" interactive={false}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <div className="text-blue-500">{getCategoryIcon(category.icon)}</div>
                          <div>
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                              {category.name}
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {category.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        {categoryVars.map(envVar => (
                          <div key={envVar.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                                <code className="bg-zinc-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-zinc-900 dark:text-zinc-50 text-[10px]">
                                  {envVar.key}
                                </code>
                                {envVar.required && (
                                  <span className="text-red-500 text-[9px] font-semibold">
                                    REQUIRED
                                  </span>
                                )}
                                {envVar.is_set && (
                                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                                )}
                              </label>
                              {envVar.sensitive && (
                                <button
                                  onClick={() => toggleSensitiveVisibility(envVar.key)}
                                  className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-0.5"
                                >
                                  {showSensitive[envVar.key] ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-1">
                              {envVar.description}
                            </p>
                            <Input
                              type={
                                envVar.sensitive && !showSensitive[envVar.key] ? 'password' : 'text'
                              }
                              value={editedEnvVars[envVar.key] || ''}
                              onChange={e => handleEnvVarChange(envVar.key, e.target.value)}
                              placeholder={envVar.default || `Enter ${envVar.key}`}
                              className="font-mono"
                            />
                          </div>
                        ))}
                      </CardBody>
                    </Card>
                  )
                })}
              </div>

              {/* Save Environment Variables */}
              <Card variant="glass" padding="none" interactive={false}>
                <CardBody padding="sm" className="space-y-3">
                  {envError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card
                        variant="glass"
                        padding="none"
                        interactive={false}
                        className="border-red-200/70 dark:border-red-500/20 ring-1 ring-red-500/10"
                      >
                        <CardBody
                          padding="sm"
                          className="flex items-center gap-2 text-red-700 dark:text-red-200 text-sm"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>{envError}</span>
                        </CardBody>
                      </Card>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleEnvSave}
                    loading={envSaving}
                    variant={envSaveSuccess ? 'secondary' : 'primary'}
                    className="w-full"
                    iconLeft={
                      envSaveSuccess ? <Check className="w-5 h-5" /> : <Key className="w-5 h-5" />
                    }
                  >
                    {envSaveSuccess ? t('Environment Updated!') : t('Apply Environment Changes')}
                  </Button>
                </CardBody>
              </Card>
            </motion.div>
          )}

          {/* LLM Providers Tab */}
          {activeTab === 'local_models' && (
            <motion.div
              key="local_models"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* LLM Mode Status Banner */}
              {llmModeInfo && (
                <Card
                  variant="glass"
                  padding="none"
                  interactive={false}
                  className={cn(
                    llmModeInfo.mode === 'hybrid'
                      ? 'border-violet-200/70 hover:border-violet-300/80 dark:border-violet-500/20 dark:hover:border-violet-500/30 ring-1 ring-violet-500/10'
                      : llmModeInfo.mode === 'api'
                        ? 'border-sky-200/70 hover:border-sky-300/80 dark:border-sky-500/20 dark:hover:border-sky-500/30 ring-1 ring-sky-500/10'
                        : 'border-emerald-200/70 hover:border-emerald-300/80 dark:border-emerald-500/20 dark:hover:border-emerald-500/30 ring-1 ring-emerald-500/10'
                  )}
                >
                  <CardBody padding="md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            llmModeInfo.mode === 'hybrid'
                              ? 'bg-violet-50 dark:bg-violet-500/10'
                              : llmModeInfo.mode === 'api'
                                ? 'bg-sky-50 dark:bg-sky-500/10'
                                : 'bg-emerald-50 dark:bg-emerald-500/10'
                          }`}
                        >
                          <Cpu
                            className={`w-5 h-5 ${
                              llmModeInfo.mode === 'hybrid'
                                ? 'text-violet-500'
                                : llmModeInfo.mode === 'api'
                                  ? 'text-sky-500'
                                  : 'text-emerald-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                              {t('LLM Mode')}: <span className="uppercase">{llmModeInfo.mode}</span>
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                                llmModeInfo.effective_source === 'provider'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                                  : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
                              }`}
                            >
                              {llmModeInfo.effective_source === 'provider'
                                ? t('Using Provider')
                                : t('Using ENV')}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {llmModeInfo.mode === 'hybrid'
                              ? t(
                                  'Both API and Local providers available. Active provider takes priority.'
                                )
                              : llmModeInfo.mode === 'api'
                                ? t('Only API (cloud) providers are used.')
                                : t('Only Local (self-hosted) providers are used.')}
                          </p>
                        </div>
                      </div>
                      {llmModeInfo.active_provider && (
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            {t('Active')}
                          </p>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {llmModeInfo.active_provider.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                            {llmModeInfo.active_provider.model}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Header & Add Button */}
              <Card variant="glass" padding="none" interactive={false}>
                <CardBody className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {t('LLM Providers')}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {t(
                        'Manage both API and Local LLM providers. Set LLM_MODE in Environment Variables to control which type is used.'
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const defaultPreset = PROVIDER_PRESETS[0]
                      setEditingProvider({
                        name: '',
                        binding: defaultPreset.binding,
                        base_url: defaultPreset.base_url || '',
                        api_key: '',
                        model: defaultPreset.default_model,
                        is_active: false,
                        provider_type: 'local',
                        requires_key: defaultPreset.requires_key,
                      })
                      setOriginalProviderName(null)
                      setSelectedPresetId(defaultPreset.id)
                      setFetchedModels([])
                      setShowProviderForm(true)
                      setTestProviderResult(null)
                    }}
                    iconLeft={<Plus className="w-4 h-4" />}
                  >
                    {t('Add Provider')}
                  </Button>
                </CardBody>
              </Card>

              {/* Provider Type Filter */}
              <Card variant="glass" padding="none" interactive={false}>
                <CardBody padding="sm" className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('Filter')}:</span>
                  <div className="flex bg-zinc-100/80 dark:bg-white/10 p-0.5 rounded-xl">
                    {(['all', 'api', 'local'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setProviderTypeFilter(filter)}
                        className={cn(
                          'px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                          providerTypeFilter === filter
                            ? 'bg-white/90 dark:bg-zinc-950/60 text-blue-600 dark:text-blue-300 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                        )}
                      >
                        {filter === 'all'
                          ? t('All')
                          : filter === 'api'
                            ? t('API (Cloud)')
                            : t('Local')}
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Provider List */}
              {loadingProviders ? (
                <div className="flex justify-center p-8">
                  <Spinner size="lg" label={t('Loading providers...')} />
                </div>
              ) : providers.filter(
                  p => providerTypeFilter === 'all' || p.provider_type === providerTypeFilter
                ).length === 0 ? (
                <Card
                  variant="glass"
                  padding="none"
                  interactive={false}
                  className="border-dashed border-zinc-300/70 dark:border-white/10"
                >
                  <CardBody padding="lg" className="text-center">
                    <Server className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {providerTypeFilter === 'all'
                        ? t('No providers configured yet.')
                        : providerTypeFilter === 'api'
                          ? t('No API providers configured.')
                          : t('No local providers configured.')}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      {t('Add providers to manage your LLM configurations.')}
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {providers
                    .filter(
                      p => providerTypeFilter === 'all' || p.provider_type === providerTypeFilter
                    )
                    .map(provider => (
                      <ProviderCard
                        key={provider.name}
                        provider={provider}
                        onActivate={() => handleActivateProvider(provider.name)}
                        onEdit={() => {
                          setEditingProvider({ ...provider })
                          setOriginalProviderName(provider.name)
                          const preset =
                            PROVIDER_PRESETS.find(
                              p => p.base_url && provider.base_url.includes(p.base_url)
                            ) || PROVIDER_PRESETS.find(p => p.id === 'custom')
                          if (preset) setSelectedPresetId(preset.id)
                          setFetchedModels([])
                          setShowProviderForm(true)
                          setTestProviderResult(null)
                        }}
                        onDelete={() => handleDeleteProvider(provider.name)}
                        onTest={() => handleTestProvider(provider)}
                      />
                    ))}
                </div>
              )}

              {/* Edit/Add Provider Modal */}
              <Modal
                isOpen={showProviderForm && editingProvider !== null}
                onClose={() => setShowProviderForm(false)}
                title={editingProvider?.name ? t('Edit Provider') : t('Add Provider')}
                size="lg"
              >
                <Modal.Body className="space-y-4">
                  {/* Provider Type Selection */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                      {t('Provider Type')}
                    </label>
                    <div className="flex bg-zinc-100 dark:bg-white/10 p-1 rounded-lg">
                      <motion.button
                        type="button"
                        onClick={() =>
                          setEditingProvider(prev =>
                            prev
                              ? {
                                  ...prev,
                                  provider_type: 'local',
                                  requires_key: false,
                                }
                              : null
                          )
                        }
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          editingProvider?.provider_type === 'local'
                            ? 'bg-white dark:bg-zinc-950/60 text-emerald-600 dark:text-emerald-300 shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Server className="w-4 h-4" />
                        {t('Local')}
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() =>
                          setEditingProvider(prev =>
                            prev
                              ? {
                                  ...prev,
                                  provider_type: 'api',
                                  requires_key: true,
                                }
                              : null
                          )
                        }
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          editingProvider?.provider_type === 'api'
                            ? 'bg-white dark:bg-zinc-950/60 text-sky-600 dark:text-sky-300 shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Globe className="w-4 h-4" />
                        {t('API (Cloud)')}
                      </motion.button>
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {editingProvider?.provider_type === 'local'
                        ? t('Local servers (Ollama, LM Studio, vLLM) running on your machine.')
                        : t('Cloud API providers (OpenAI, Anthropic, DeepSeek, etc.).')}
                    </p>
                  </div>

                  {/* Server Preset */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-200 mb-2">
                      {t('Server Preset')}
                    </label>
                    <select
                      value={selectedPresetId}
                      onChange={e => {
                        const newId = e.target.value
                        setSelectedPresetId(newId)
                        const preset = PROVIDER_PRESETS.find(p => p.id === newId)
                        if (preset && editingProvider) {
                          setEditingProvider({
                            ...editingProvider,
                            binding: preset.binding,
                            base_url: preset.base_url || editingProvider.base_url,
                            model: preset.default_model || editingProvider.model,
                            requires_key: preset.requires_key,
                          })
                          setCustomModelInput(preset.models.length === 0)
                          setFetchedModels([])
                        }
                      }}
                      className={selectClassName}
                    >
                      {PROVIDER_PRESETS.map(preset => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                    {PROVIDER_PRESETS.find(p => p.id === selectedPresetId)?.help_text && (
                      <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {PROVIDER_PRESETS.find(p => p.id === selectedPresetId)?.help_text}
                      </p>
                    )}
                  </div>

                  {/* Name & Binding */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      value={editingProvider?.name || ''}
                      onChange={e =>
                        setEditingProvider(prev =>
                          prev ? { ...prev, name: e.target.value } : null
                        )
                      }
                      placeholder="My Provider"
                      disabled={
                        !!providers.find(p => p.name === editingProvider?.name && p.name !== '')
                      }
                    />
                    <Input label="Binding" value={editingProvider?.binding || ''} disabled />
                  </div>

                  {/* Base URL */}
                  <Input
                    label="Base URL"
                    value={editingProvider?.base_url || ''}
                    onChange={e =>
                      setEditingProvider(prev =>
                        prev ? { ...prev, base_url: e.target.value } : null
                      )
                    }
                    placeholder="http://localhost:11434/v1"
                    error={
                      editingProvider?.base_url?.includes('/chat/completions') ||
                      editingProvider?.base_url?.includes('/models/')
                        ? "Base URL should NOT include '/chat/completions' or '/models/'"
                        : undefined
                    }
                    helperText={
                      !editingProvider?.base_url?.includes('/chat/completions') &&
                      !editingProvider?.base_url?.includes('/models/')
                        ? "Only enter the base URL. '/chat/completions' will be appended automatically."
                        : undefined
                    }
                    className="font-mono"
                  />

                  {/* API Key */}
                  {PROVIDER_PRESETS.find(p => p.id === selectedPresetId)?.requires_key && (
                    <Input
                      type="password"
                      label={`${t('API Key')} (${t('optional for local')})`}
                      value={editingProvider?.api_key || ''}
                      onChange={e =>
                        setEditingProvider(prev =>
                          prev ? { ...prev, api_key: e.target.value } : null
                        )
                      }
                      placeholder={t('Usually not required for local servers')}
                      className="font-mono"
                    />
                  )}

                  {/* Model */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-zinc-700">Model</label>
                      {(PROVIDER_PRESETS.find(p => p.id === selectedPresetId)?.models.length ?? 0) >
                        0 && (
                        <button
                          onClick={() => setCustomModelInput(!customModelInput)}
                          className="text-[10px] text-blue-500 hover:underline"
                        >
                          {customModelInput ? 'Select from list' : 'Enter custom'}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!customModelInput &&
                      (fetchedModels.length > 0 ||
                        (PROVIDER_PRESETS.find(p => p.id === selectedPresetId)?.models.length ??
                          0) > 0) ? (
                        <select
                          value={editingProvider?.model || ''}
                          onChange={e =>
                            setEditingProvider(prev =>
                              prev ? { ...prev, model: e.target.value } : null
                            )
                          }
                          className={cn(selectClassName, 'flex-1')}
                        >
                          {fetchedModels.length > 0 ? (
                            <>
                              <option value="" disabled>
                                Select a fetched model
                              </option>
                              {fetchedModels.map(m => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </>
                          ) : (
                            PROVIDER_PRESETS.find(p => p.id === selectedPresetId)?.models.map(m => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))
                          )}
                        </select>
                      ) : (
                        <Input
                          value={editingProvider?.model || ''}
                          onChange={e =>
                            setEditingProvider(prev =>
                              prev ? { ...prev, model: e.target.value } : null
                            )
                          }
                          placeholder="gpt-4o-mini"
                          wrapperClassName="flex-1"
                        />
                      )}
                      <button
                        onClick={fetchModels}
                        disabled={fetchingModels || !editingProvider?.base_url}
                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {fetchingModels ? <Spinner size="sm" /> : <RotateCcw className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => editingProvider && handleTestProvider(editingProvider)}
                      disabled={testingProvider}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
                    >
                      {testingProvider ? <Spinner size="sm" /> : <RefreshCw className="w-3 h-3" />}
                      Test Connection
                    </button>
                    {testProviderResult && (
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full ${
                          testProviderResult.success
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300'
                        }`}
                      >
                        {testProviderResult.success
                          ? 'Success!'
                          : `Failed: ${testProviderResult.message}`}
                      </span>
                    )}
                  </div>
                </Modal.Body>

                <Modal.Footer>
                  {providerError && (
                    <div className="flex-1 p-2 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-200 text-xs mr-4">
                      {providerError}
                    </div>
                  )}
                  <Button variant="secondary" onClick={() => setShowProviderForm(false)}>
                    {t('Cancel')}
                  </Button>
                  <Button
                    onClick={() => editingProvider && handleProviderSave(editingProvider)}
                    loading={savingProvider}
                    iconLeft={<Save className="w-4 h-4" />}
                  >
                    {t('Save Provider')}
                  </Button>
                </Modal.Footer>
              </Modal>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
