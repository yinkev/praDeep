import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Newsreader } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { GlobalProvider } from '@/context/GlobalContext'
import ThemeScript from '@/components/ThemeScript'
import { ToastProvider } from '@/components/ui/Toast'
import MotionProvider from '@/components/MotionProvider'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from '@/lib/app-meta'
import { PWAInit } from './pwa-init'
import { AppHeader } from '@/components/AppHeader'
import { AppBackground } from '@/components/AppBackground'

const geistSans = GeistSans
const geistMono = GeistMono
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  style: 'italic',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  title: {
    default: APP_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      <head>
        <ThemeScript />
        <PWAInit />
      </head>
      <body
        className={`${geistSans.className} min-h-dvh bg-surface-base antialiased transition-colors duration-200 selection:bg-accent-primary/20 selection:text-accent-primary`}
      >
        <MotionProvider>
          <ToastProvider>
            <GlobalProvider>
              <div className="flex h-dvh w-full overflow-hidden">
                <Sidebar />
                <main
                  id="app-scroll"
                  className="flex-1 flex flex-col overflow-hidden bg-surface-base"
                >
                  <div className="relative flex-1 overflow-hidden">
                    <AppBackground />
                    <div className="relative z-10 flex h-full flex-col overflow-hidden">
                      <div className="flex-shrink-0 z-50">
                        <AppHeader />
                      </div>
                      <div className="flex-1 overflow-y-auto scroll-smooth relative">
                        {children}
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </GlobalProvider>
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  )
}

