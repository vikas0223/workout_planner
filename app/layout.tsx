import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PersistenceProvider } from '@/components/providers/persistence-provider'
import { PWAProvider } from '@/components/providers/pwa-provider'
import { AuthGuardProvider } from '@/contexts/auth-guard-context'
import { Toaster } from '@/components/ui/toaster'

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isDevHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
                  if (isDevHost && 'serviceWorker' in navigator) {
                    var hadController = !!navigator.serviceWorker.controller;
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (var i = 0; i < registrations.length; i++) {
                        registrations[i].unregister();
                      }
                    });
                    if ('caches' in window) {
                      caches.keys().then(function(keys) {
                        for (var i = 0; i < keys.length; i++) {
                          if (keys[i].indexOf('workout-planner-') !== -1) {
                            caches.delete(keys[i]);
                          }
                        }
                        if (hadController && !sessionStorage.getItem('sw_purged')) {
                          sessionStorage.setItem('sw_purged', '1');
                          location.reload();
                        }
                      });
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <PersistenceProvider>
          <PWAProvider>
            <AuthGuardProvider>
              {children}
              <Toaster />
            </AuthGuardProvider>
          </PWAProvider>
        </PersistenceProvider>
      </body>
    </html>
  )
}
