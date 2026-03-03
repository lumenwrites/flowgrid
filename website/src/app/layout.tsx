import type { Metadata } from 'next'
import { Inter, Roboto_Slab } from 'next/font/google'
import localFont from 'next/font/local'
import { cn } from '@/lib/utils'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'

import '../styles/globals.css'

config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  variable: '--font-roboto-slab',
})

const georgia = localFont({
  src: [
    { path: '../styles/fonts/Georgia/Georgia.ttf', weight: '400', style: 'normal' },
    { path: '../styles/fonts/Georgia/Georgia-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../styles/fonts/Georgia/Georgia-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../styles/fonts/Georgia/Georgia-BoldItalic.ttf', weight: '700', style: 'italic' },
  ],
  variable: '--font-georgia',
})

export const metadata: Metadata = {
  title: 'Project Title',
  description: 'Project description',
}

type RootLayoutProps = {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const fontVariables = `${inter.variable} ${robotoSlab.variable} ${georgia.variable}`
  return (
    <html lang="en" className={cn(fontVariables, 'font-georgia')}>
      <body className="flex min-h-screen flex-col">
        {children}
      </body>
    </html>
  )
}
