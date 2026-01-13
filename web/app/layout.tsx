import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { GlobalProvider } from '@/context/GlobalContext'
import ThemeScript from '@/components/ThemeScript'
import { ToastProvider } from '@/components/ui/Toast'
import MotionProvider from '@/components/MotionProvider'
import { APP_DESCRIPTION, APP_NAME, APP_TITLE } from '@/lib/app-meta'
import { PWAInit } from './pwa-init'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-cormorant-garamond',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_TITLE,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
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
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${ibmPlexMono.variable} ${cormorantGaramond.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.className} min-h-dvh bg-surface-base antialiased transition-colors duration-200`}
      >
        <MotionProvider>
          <ToastProvider>
            <PWAInit />
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
