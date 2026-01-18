'use client'

import { useCallback, useState } from 'react'
import { 
  Settings, 
  Languages, 
  Layout, 
  Cpu, 
  Shield, 
  Save, 
  Sun, 
  Moon, 
  Zap, 
  Terminal, 
  Key 
} from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { useGlobal } from '@/context/GlobalContext'
import { useTheme } from '@/hooks/useTheme'
import { getTranslation } from '@/lib/i18n'
import PageWrapper, { PageHeader } from '@/components/ui/PageWrapper'
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

export default function SettingsPage() {
  const { uiSettings, setUiSettings } = useGlobal()
  const { theme, setTheme, isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('general')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  const t = useCallback((key: string) => getTranslation(uiSettings.language, key), [uiSettings.language])

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
    }, 800)
  }

  return (
    <PageWrapper maxWidth="2xl" showPattern breadcrumbs={[{ label: 'Settings' }]}>
      <PageHeader
        title="System Settings"
        description="Configure interface preferences, engine parameters, and security credentials."
        icon={<Settings className="h-5 w-5 text-accent-primary" />}
        className="mb-10"
      />

      <div className="grid grid-cols-1 gap-8">
        <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-8 overflow-x-auto no-scrollbar pb-1">
             <TabsList className="bg-surface-elevated/50 border border-border rounded-full p-1 h-11 shadow-glass-sm backdrop-blur-md">
                <TabsTrigger value="general" className="rounded-full px-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-accent-primary data-[state=active]:text-white transition-all">
                  General
                </TabsTrigger>
                <TabsTrigger value="interface" className="rounded-full px-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-accent-primary data-[state=active]:text-white transition-all">
                  Interface
                </TabsTrigger>
                <TabsTrigger value="engine" className="rounded-full px-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-accent-primary data-[state=active]:text-white transition-all">
                  Engine
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-full px-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-accent-primary data-[state=active]:text-white transition-all">
                  Security
                </TabsTrigger>
             </TabsList>
             
             <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">Discard</Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleSave} 
                  loading={saving}
                  className="px-6 h-9 uppercase font-bold tracking-widest shadow-lg"
                  iconLeft={<Save size={14} />}
                >
                  Apply Changes
                </Button>
             </div>
          </div>

          <motion.div initial="hidden" animate="visible" variants={fadeInUp} key={activeTab}>
             <TabsContent value="general" className="mt-0 space-y-6">
                <Card interactive={false} className="border-border bg-surface-base">
                   <CardHeader className="p-6 border-b border-border-subtle">
                      <div className="flex items-center gap-4">
                         <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-tertiary">
                            <Languages size={18} />
                         </div>
                         <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Localization</CardTitle>
                            <p className="text-[10px] font-mono text-text-tertiary uppercase">Configure system language</p>
                         </div>
                      </div>
                   </CardHeader>
                   <CardBody className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label htmlFor="language-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-quaternary ml-1">PREFERRED_LANGUAGE</label>
                            <select 
                              id="language-select"
                              value={uiSettings.language}
                              onChange={(e) => {
                                const nextLanguage = e.target.value
                                if (nextLanguage === 'en' || nextLanguage === 'zh') {
                                  setUiSettings({ ...uiSettings, language: nextLanguage as 'en' | 'zh' })
                                }
                              }}
                              className="w-full h-11 rounded-xl border border-border bg-surface-secondary/40 px-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-accent-primary/40"
                            >
                               <option value="en">English (US)</option>
                               <option value="zh">Chinese (Standard)</option>
                            </select>
                         </div>
                         <div className="rounded-xl border border-border-subtle bg-surface-secondary/20 p-4 flex flex-col justify-center">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">SYSTEM_LOCAL_ID</div>
                            <div className="mt-1 text-xs font-mono text-text-tertiary">{uiSettings.language === 'zh' ? 'ZH_CN_UTC+8' : 'EN_US_UTC-5'}</div>
                         </div>
                      </div>
                   </CardBody>
                </Card>
             </TabsContent>

             <TabsContent value="interface" className="mt-0 space-y-6">
                <Card interactive={false} className="border-border bg-surface-base">
                   <CardHeader className="p-6 border-b border-border-subtle">
                      <div className="flex items-center gap-4">
                         <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-tertiary">
                            <Layout size={18} />
                         </div>
                         <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Visual Theme</CardTitle>
                            <p className="text-[10px] font-mono text-text-tertiary uppercase">Interface material and motion behavior</p>
                         </div>
                      </div>
                   </CardHeader>
                   <CardBody className="p-6 space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle bg-surface-secondary/20 transition-all hover:border-accent-primary/20">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-surface-base border border-border flex items-center justify-center shadow-sm text-text-secondary">
                               <Sun size={20} />
                            </div>
                            <div>
                               <div className="text-xs font-bold uppercase tracking-tight">Appearance</div>
                               <div className="text-[10px] font-mono text-text-tertiary uppercase">Toggle between light and dark modes</div>
                            </div>
                         </div>
                        <div className="flex bg-surface-elevated p-1 rounded-full border border-border-subtle">
                           <IconButton 
                             aria-label="Switch to light mode"
                             icon={<Sun size={14} />} 
                             variant={!isDark ? "primary" : "ghost"}
                             size="sm" 
                             className="h-8 w-8 rounded-full" 
                             onClick={() => setTheme('light')}
                           />
                           <IconButton 
                             aria-label="Switch to dark mode"
                             icon={<Moon size={14} />} 
                             variant={isDark ? "primary" : "ghost"} 
                             size="sm" 
                             className="h-8 w-8 rounded-full" 
                             onClick={() => setTheme('dark')}
                           />
                        </div>

                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle bg-surface-secondary/20 transition-all hover:border-accent-primary/20">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-surface-base border border-border flex items-center justify-center shadow-sm text-text-secondary">
                               <Zap size={20} />
                            </div>
                            <div>
                               <div className="text-xs font-bold uppercase tracking-tight">Reduced Motion</div>
                               <div className="text-[10px] font-mono text-text-tertiary uppercase">Minimize animations for performance</div>
                            </div>
                         </div>
                         <Switch checked={false} onCheckedChange={() => {}} />
                      </div>
                   </CardBody>
                </Card>
             </TabsContent>

             <TabsContent value="engine" className="mt-0 space-y-6">
                <Card interactive={false} className="border-border bg-surface-base">
                   <CardHeader className="p-6 border-b border-border-subtle">
                      <div className="flex items-center gap-4">
                         <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-tertiary">
                            <Cpu size={18} />
                         </div>
                         <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Inference Control</CardTitle>
                            <p className="text-[10px] font-mono text-text-tertiary uppercase">LLM and agent behavior tuning</p>
                         </div>
                      </div>
                   </CardHeader>
                   <CardBody className="p-6">
                      <div className="p-8 rounded-2xl border border-dashed border-border text-center">
                         <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-text-quaternary mb-4">
                            <Terminal size={24} />
                         </div>
                         <div className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-1">Coming_Soon</div>
                         <p className="text-[10px] font-mono text-text-tertiary uppercase">Advanced engine parameters are under development.</p>
                      </div>
                   </CardBody>
                </Card>
             </TabsContent>

             <TabsContent value="security" className="mt-0 space-y-6">
                <Card interactive={false} className="border-border bg-surface-base">
                   <CardHeader className="p-6 border-b border-border-subtle">
                      <div className="flex items-center gap-4">
                         <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-text-tertiary">
                            <Shield size={18} />
                         </div>
                         <div>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest">Credentials</CardTitle>
                            <p className="text-[10px] font-mono text-text-tertiary uppercase">Manage API keys and access tokens</p>
                         </div>
                      </div>
                   </CardHeader>
                   <CardBody className="p-6 space-y-6">
                          <div className="space-y-2">
                             <label htmlFor="system-access-key" className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-quaternary ml-1">SYSTEM_ACCESS_KEY</label>
                             <div className="relative">
                                <Input 
                                  id="system-access-key"
                                  type="password"
                                  placeholder="••••••••••••••••"
                                  value={apiKey}
                                  onChange={e => setApiKey(e.target.value)}
                                  className="h-12 bg-surface-secondary/40 border-border text-xs font-mono font-bold pr-12"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-quaternary">
                                   <Key size={16} />
                                </div>
                             </div>
                             <p className="text-[9px] font-mono text-text-quaternary uppercase px-1">Keys are stored locally in the browser's persistent storage.</p>
                          </div>
                   </CardBody>
                   <CardFooter className="p-6 pt-0">
                      <Button variant="outline" className="w-full text-error/60 border-error/20 hover:bg-error-muted/5 font-mono text-[10px] uppercase h-10">Purge_Credentials</Button>
                   </CardFooter>
                </Card>
             </TabsContent>
          </motion.div>
        </Tabs>
      </div>

      <div className="mt-12 sm:hidden">
         <Button variant="primary" className="w-full h-12 uppercase font-bold tracking-widest shadow-lg" onClick={handleSave} loading={saving}>Apply Changes</Button>
      </div>
    </PageWrapper>
  )
}
