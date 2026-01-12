import type { Metadata } from 'next'
import './globals.css'
import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/500.css'
import '@fontsource/instrument-sans/600.css'
import '@fontsource/instrument-sans/700.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import Sidebar from '@/components/Sidebar'
import { GlobalProvider } from '@/context/GlobalContext'
import ThemeScript from '@/components/ThemeScript'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'praDeep - Multi-Agent Teaching & Research Copilot',
  description:
    'An intelligent multi-agent platform for teaching assistance and research collaboration, powered by advanced AI and knowledge retrieval.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        <ToastProvider>
          <GlobalProvider>
            <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden transition-colors duration-200">
              <Sidebar />
              <main className="flex-1 overflow-y-auto backdrop-blur-sm">{children}</main>
            </div>
          </GlobalProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
