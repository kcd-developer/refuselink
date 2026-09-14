import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import { Providers } from './providers'
import { Suspense } from 'react'
import { NavigationLoadingOverlay } from '@/components/navigation-loading-overlay'
import { PwaRegistration } from '@/components/pwa-registration'
import type { Viewport } from 'next'

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'RefuseLink — Your Community’s Waste Service, Connected',
  description: 'Schedules, announcements, service requests, and HOA communication—all in one convenient place for residents and community leaders.',
  icons: {
    icon: [
      { url: '/favicon-32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png?v=3', sizes: '64x64', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png?v=3',
  },
  openGraph: {
    title: 'RefuseLink — Your Community’s Waste Service, Connected',
    description: 'Schedules, announcements, service requests, and HOA communication for residents and community leaders.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Suspense fallback={null}>
            <NavigationLoadingOverlay />
          </Suspense>
          <Toaster />
          <ChunkLoadErrorHandler />
          <PwaRegistration />
        </Providers>
      </body>
    </html>
  )
}
