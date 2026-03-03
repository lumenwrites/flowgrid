import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'

import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'FlowGrid',
  description: 'Freestyle rap & improv musical practice app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlowGrid',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn(inter.variable, 'font-sans')}>
      <body className="flex h-screen flex-col overflow-hidden">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
