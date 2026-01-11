'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { ArrowRight, Database, FolderOpen, Microscope, SlidersHorizontal } from 'lucide-react'
import { useGlobal } from '@/context/GlobalContext'
import { getTranslation } from '@/lib/i18n'

type InsightItem = {
  title: string
  description: string
  href: string
  icon: ComponentType<{ className?: string }>
  colorClass: string
  bgClass: string
}

export default function WorkflowInsightsPage() {
  const { uiSettings } = useGlobal()
  const t = (key: string) => getTranslation(uiSettings.language, key)

  const insights: InsightItem[] = [
    {
      title: t('Multi-Step Knowledge Base Setup'),
      description: t('KB setup requires repeated, manual steps for related materials.'),
      href: '/knowledge',
      icon: Database,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50',
    },
    {
      title: t('Solve Agent Configuration Overhead'),
      description: t('Solving similar problems often means re-selecting the same settings.'),
      href: '/solver',
      icon: SlidersHorizontal,
      colorClass: 'text-purple-600 dark:text-purple-400',
      bgClass: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50',
    },
    {
      title: t('Research Pipeline Manual Topic Management'),
      description: t('Users spend time babysitting the research queue instead of learning.'),
      href: '/research',
      icon: Microscope,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50',
    },
    {
      title: t('Fragmented Output Management'),
      description: t('Outputs are spread across modules, making past work hard to find and compare.'),
      href: '/history',
      icon: FolderOpen,
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50',
    },
  ]

  return (
    <div className="h-screen flex flex-col animate-fade-in p-6">
      <div className="shrink-0 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {t('Key Workflow Inefficiencies Identified')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">
          {t(
            'A quick map of the highest-friction workflows in praDeep, with shortcuts to where you can address them.',
          )}
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
        {insights.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`group rounded-2xl border ${item.bgClass} p-5 hover:shadow-lg transition-all`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-white/70 dark:bg-slate-900/30 border border-white/40 dark:border-slate-700 flex items-center justify-center`}
                >
                  <item.icon className={`w-5 h-5 ${item.colorClass}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
