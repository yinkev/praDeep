'use client'

import { useState } from 'react'
import {
  PenTool,
  Settings,
  History,
  Sparkles,
} from 'lucide-react'
import PageWrapper from '@/components/ui/PageWrapper'
import { Button, IconButton } from '@/components/ui/Button'
import CoWriterEditor from '@/components/CoWriterEditor'
import { cn } from '@/lib/utils'

export default function CoWriterPage() {
  const [sessionKey, setSessionKey] = useState(0)

  const handleNewSession = () => {
    if (confirm('Start new session? Current work will be lost if not saved.')) {
      setSessionKey(prev => prev + 1)
    }
  }

  return (
    <PageWrapper maxWidth="full" showPattern={false} className="h-screen overflow-hidden px-0 py-0">
       <div className="h-full flex flex-col bg-surface-base">
          <header className="shrink-0 h-14 border-b border-border bg-surface-base/80 backdrop-blur-md px-6 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shadow-sm border border-accent-primary/20">
                    <PenTool size={16} />
                  </div>
                  <h1 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">Co_Writer</h1>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-secondary/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">STANDBY</span>
                </div>
             </div>

             <div className="flex items-center gap-3">
                <IconButton 
                  aria-label="History"
                  icon={<History size={16} />} 
                  variant="ghost" 
                  size="sm" 
                  className="text-text-tertiary" 
                />
                <IconButton 
                  aria-label="Settings"
                  icon={<Settings size={16} />} 
                  variant="ghost" 
                  size="sm" 
                  className="text-text-tertiary" 
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleNewSession}
                  className="text-[10px] font-mono uppercase tracking-widest h-8"
                >
                  New Session
                </Button>
             </div>
          </header>

          <div className="flex-1 min-h-0 p-6 bg-surface-secondary/10">
             <div className="h-full max-w-6xl mx-auto">
                <CoWriterEditor key={sessionKey} />
             </div>
          </div>
       </div>
    </PageWrapper>
  )
}
