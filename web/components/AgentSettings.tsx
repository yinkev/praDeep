'use client'

import { useState } from 'react'
import { ProgressiveDisclosure } from './ui/ProgressiveDisclosure'
import { motion } from 'framer-motion'

interface AgentSettingsProps {
  onSettingsChange?: (settings: AgentConfig) => void
  initialSettings?: Partial<AgentConfig>
}

interface AgentConfig {
  temperature: number
  maxTokens: number
  systemPrompt: string
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

const DEFAULT_SETTINGS: AgentConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '',
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
}

export function AgentSettings({ onSettingsChange, initialSettings }: AgentSettingsProps) {
  const [settings, setSettings] = useState<AgentConfig>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  })

  const updateSetting = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Layer 1: Basic Settings - Temperature & Max Tokens */}
      <ProgressiveDisclosure title="Basic Settings" defaultExpanded={false} level={1}>
        <div className="space-y-6">
          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="temperature"
                className="text-sm font-medium text-slate-700 font-['IBM_Plex_Mono',monospace]"
              >
                TEMPERATURE
              </label>
              <motion.span
                key={settings.temperature}
                initial={{ scale: 1.2, color: '#3b82f6' }}
                animate={{ scale: 1, color: '#475569' }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold font-['Cormorant_Garamond',serif] tabular-nums"
              >
                {settings.temperature.toFixed(2)}
              </motion.span>
            </div>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={settings.temperature}
              onChange={e => updateSetting('temperature', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200/60 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-blue-400
                [&::-webkit-slider-thumb]:to-blue-600
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:bg-gradient-to-br
                [&::-moz-range-thumb]:from-blue-400
                [&::-moz-range-thumb]:to-blue-600
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <p className="text-xs text-slate-500 font-['Cormorant_Garamond',serif] leading-relaxed">
              Controls randomness. Lower values make output more focused and deterministic, higher
              values increase creativity and variety.
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="maxTokens"
                className="text-sm font-medium text-slate-700 font-['IBM_Plex_Mono',monospace]"
              >
                MAX TOKENS
              </label>
              <motion.span
                key={settings.maxTokens}
                initial={{ scale: 1.2, color: '#3b82f6' }}
                animate={{ scale: 1, color: '#475569' }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold font-['Cormorant_Garamond',serif] tabular-nums"
              >
                {settings.maxTokens.toLocaleString()}
              </motion.span>
            </div>
            <input
              id="maxTokens"
              type="range"
              min="256"
              max="8192"
              step="256"
              value={settings.maxTokens}
              onChange={e => updateSetting('maxTokens', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200/60 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-violet-400
                [&::-webkit-slider-thumb]:to-violet-600
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:bg-gradient-to-br
                [&::-moz-range-thumb]:from-violet-400
                [&::-moz-range-thumb]:to-violet-600
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <p className="text-xs text-slate-500 font-['Cormorant_Garamond',serif] leading-relaxed">
              Maximum length of the generated response. Higher values allow longer outputs but may
              increase latency and cost.
            </p>
          </div>
        </div>
      </ProgressiveDisclosure>

      {/* Layer 2: Advanced Settings - System Prompt & Fine-tuning */}
      <ProgressiveDisclosure title="Advanced Settings" defaultExpanded={false} level={2}>
        <div className="space-y-6">
          {/* System Prompt */}
          <div className="space-y-3">
            <label
              htmlFor="systemPrompt"
              className="text-sm font-medium text-slate-700 font-['IBM_Plex_Mono',monospace] block"
            >
              SYSTEM PROMPT
            </label>
            <textarea
              id="systemPrompt"
              value={settings.systemPrompt}
              onChange={e => updateSetting('systemPrompt', e.target.value)}
              placeholder="Enter custom instructions for the agent..."
              rows={4}
              className="w-full px-4 py-3 text-sm
                bg-white/60 backdrop-blur-sm
                border border-slate-200/60 rounded-xl
                font-['Cormorant_Garamond',serif]
                text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent
                transition-all duration-150
                resize-none"
            />
            <p className="text-xs text-slate-500 font-['Cormorant_Garamond',serif] leading-relaxed">
              Custom instructions that define the agent's behavior, role, and constraints. Leave
              empty for default behavior.
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="topP"
                className="text-sm font-medium text-slate-700 font-['IBM_Plex_Mono',monospace]"
              >
                TOP P
              </label>
              <motion.span
                key={settings.topP}
                initial={{ scale: 1.2, color: '#3b82f6' }}
                animate={{ scale: 1, color: '#475569' }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold font-['Cormorant_Garamond',serif] tabular-nums"
              >
                {settings.topP.toFixed(2)}
              </motion.span>
            </div>
            <input
              id="topP"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.topP}
              onChange={e => updateSetting('topP', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200/60 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-emerald-400
                [&::-webkit-slider-thumb]:to-emerald-600
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:bg-gradient-to-br
                [&::-moz-range-thumb]:from-emerald-400
                [&::-moz-range-thumb]:to-emerald-600
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <p className="text-xs text-slate-500 font-['Cormorant_Garamond',serif] leading-relaxed">
              Nucleus sampling threshold. Controls diversity by considering only tokens with
              cumulative probability above this value.
            </p>
          </div>

          {/* Frequency Penalty */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="frequencyPenalty"
                className="text-sm font-medium text-slate-700 font-['IBM_Plex_Mono',monospace]"
              >
                FREQUENCY PENALTY
              </label>
              <motion.span
                key={settings.frequencyPenalty}
                initial={{ scale: 1.2, color: '#3b82f6' }}
                animate={{ scale: 1, color: '#475569' }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold font-['Cormorant_Garamond',serif] tabular-nums"
              >
                {settings.frequencyPenalty.toFixed(2)}
              </motion.span>
            </div>
            <input
              id="frequencyPenalty"
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={settings.frequencyPenalty}
              onChange={e => updateSetting('frequencyPenalty', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200/60 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-amber-400
                [&::-webkit-slider-thumb]:to-amber-600
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:bg-gradient-to-br
                [&::-moz-range-thumb]:from-amber-400
                [&::-moz-range-thumb]:to-amber-600
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <p className="text-xs text-slate-500 font-['Cormorant_Garamond',serif] leading-relaxed">
              Reduces repetition of frequently occurring tokens. Positive values discourage
              repetition, negative values encourage it.
            </p>
          </div>

          {/* Presence Penalty */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="presencePenalty"
                className="text-sm font-medium text-slate-700 font-['IBM_Plex_Mono',monospace]"
              >
                PRESENCE PENALTY
              </label>
              <motion.span
                key={settings.presencePenalty}
                initial={{ scale: 1.2, color: '#3b82f6' }}
                animate={{ scale: 1, color: '#475569' }}
                transition={{ duration: 0.15 }}
                className="text-sm font-semibold font-['Cormorant_Garamond',serif] tabular-nums"
              >
                {settings.presencePenalty.toFixed(2)}
              </motion.span>
            </div>
            <input
              id="presencePenalty"
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={settings.presencePenalty}
              onChange={e => updateSetting('presencePenalty', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200/60 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-rose-400
                [&::-webkit-slider-thumb]:to-rose-600
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:bg-gradient-to-br
                [&::-moz-range-thumb]:from-rose-400
                [&::-moz-range-thumb]:to-rose-600
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:shadow-lg
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <p className="text-xs text-slate-500 font-['Cormorant_Garamond',serif] leading-relaxed">
              Encourages discussing new topics. Positive values discourage repeating any tokens that
              have appeared, regardless of frequency.
            </p>
          </div>
        </div>
      </ProgressiveDisclosure>
    </div>
  )
}
