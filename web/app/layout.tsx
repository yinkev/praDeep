import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { GlobalProvider } from '@/context/GlobalContext'
import ThemeScript from '@/components/ThemeScript'
import { ToastProvider } from '@/components/ui/Toast'
import MotionProvider from '@/components/MotionProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const appName = 'praDeep'
const appTitle = `${appName} - Multi-Agent Teaching & Research Copilot`
const appDescription =
  'An intelligent multi-agent platform for teaching assistance and research collaboration, powered by advanced AI and knowledge retrieval.'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  applicationName: appName,
  title: {
    default: appTitle,
    template: `%s · ${appName}`,
  },
  description: appDescription,
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    title: appTitle,
    description: appDescription,
    siteName: appName,
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: appTitle,
    description: appDescription,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.className} min-h-dvh bg-surface-base antialiased transition-colors duration-200`}
      >
        <MotionProvider>
          <ToastProvider>
            <GlobalProvider>
              <div className="flex h-dvh w-full overflow-hidden">
                <Sidebar />
                <main
                  id="app-scroll"
                  className="flex-1 overflow-y-auto scroll-smooth bg-[radial-gradient(circle_at_1px_1px,rgb(var(--color-border-subtle))_1px,transparent_0)] [background-size:24px_24px]"
                  style={{ backgroundPosition: 'center center' }}
                >
                  {children}
                </main>
              </div>
            </GlobalProvider>
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  )
}
