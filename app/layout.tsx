import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import BottomNav from '@/components/layout/BottomNav'
import PWARegister from '@/components/layout/PWARegister'

export const metadata: Metadata = {
  title: 'Future Healthy Self',
  description: 'Wellness meal planner, exercise tracker & health dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FHS',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#A72677',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={"h-full bg-white antialiased"}>
        <AuthProvider>
          <PWARegister />
          <div className="max-w-[390px] mx-auto min-h-full flex flex-col relative">
            <main className="flex-1 pb-20">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
