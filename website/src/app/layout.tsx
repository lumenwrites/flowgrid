import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'

import '../styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'FlowGrid',
  description: 'Freestyle rap & improv musical practice app',
}

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={cn(inter.variable, 'font-sans')}>
      <body className="flex h-screen flex-col overflow-hidden">
        {children}
      </body>
    </html>
  )
}
