'use client'

import { AgentSettings } from '@/components/AgentSettings'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function AgentSettingsDemoPage() {
  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 font-['Cormorant_Garamond',serif]">
              Agent Configuration
            </h1>
          </div>
          <p className="text-slate-600 font-['Cormorant_Garamond',serif] text-lg leading-relaxed max-w-2xl">
            Progressive disclosure interface for agent settings. Basic controls are immediately
            accessible, while advanced parameters are hidden until needed.
          </p>
        </motion.div>

        {/* Agent Settings Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
        >
          <AgentSettings
            onSettingsChange={settings => {
              console.log('Settings updated:', settings)
            }}
          />
        </motion.div>

        {/* Design Notes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-12 p-6 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl"
        >
          <h2 className="text-sm font-semibold text-slate-700 font-['IBM_Plex_Mono',monospace] uppercase tracking-wider mb-3">
            Design Principles
          </h2>
          <ul className="space-y-2 text-sm text-slate-600 font-['Cormorant_Garamond',serif]">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>
                <strong>Progressive Disclosure:</strong> Two layers maximum. Basic settings
                (temperature, max tokens) in Layer 1, advanced parameters (system prompt, top-p,
                penalties) in Layer 2.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500 mt-1">•</span>
              <span>
                <strong>Liquid Glass Aesthetic:</strong> Translucent surfaces with backdrop blur,
                subtle shadows, and prismatic shimmer effects on hover.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-1">•</span>
              <span>
                <strong>Fast Animations:</strong> 120-200ms transitions with custom easing [0.2,
                0.8, 0.2, 1] for responsive feel.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-1">•</span>
              <span>
                <strong>Distinctive Typography:</strong> IBM Plex Mono for labels (technical
                precision), Cormorant Garamond for body text (editorial elegance).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-1">•</span>
              <span>
                <strong>Micro-interactions:</strong> Value changes animate with color flash and
                scale, slider thumbs scale on hover, glass surfaces shimmer.
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
