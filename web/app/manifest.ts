import type { MetadataRoute } from 'next'
import {
  APP_DESCRIPTION,
  APP_NAME,
  PWA_BACKGROUND_COLOR,
  PWA_THEME_COLOR,
} from '@/lib/app-meta'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ['education', 'productivity'],
    // Icon files are intentionally not created here; add these files under `web/public/icons/`.
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'New Chat',
        short_name: 'Chat',
        description: 'Start a new chat/question session',
        url: '/question',
        icons: [{ src: '/icons/shortcut-chat.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Knowledge Base',
        short_name: 'Knowledge',
        description: 'Browse and manage knowledge bases',
        url: '/knowledge',
        icons: [{ src: '/icons/shortcut-knowledge.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Research',
        short_name: 'Research',
        description: 'Run deep research workflows',
        url: '/research',
        icons: [{ src: '/icons/shortcut-research.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Solver',
        short_name: 'Solver',
        description: 'Open the smart solver',
        url: '/solver',
        icons: [{ src: '/icons/shortcut-solver.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}

