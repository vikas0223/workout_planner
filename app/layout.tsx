import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PersistenceProvider } from '@/components/providers/persistence-provider'
import { PWAProvider } from '@/components/providers/pwa-provider'
import { AuthGuardProvider } from '@/contexts/auth-guard-context'

export const metadata: Metadata = {
  title: 'replyf',
  description: 'replyf — Personalized Workout Planner & Fitness Platform',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'replyf',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#4338ca',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <PersistenceProvider>
          <PWAProvider>
            <AuthGuardProvider>{children}</AuthGuardProvider>
          </PWAProvider>
        </PersistenceProvider>
      </body>
    </html>
  )
}
