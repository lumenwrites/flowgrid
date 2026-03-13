'use client'

import dynamic from 'next/dynamic'
import type { PlyrProps } from 'plyr-react'
import 'plyr/dist/plyr.css'

const Plyr = dynamic(
  () => import('plyr-react').then(mod => mod.Plyr),
  { ssr: false }
) as React.ComponentType<PlyrProps>

import React from 'react'

type VideoProps = {
  url: string
  poster?: string
  className?: string
}

export default function Video({ url, poster, className = '' }: VideoProps) {
  return (
    <div className={`overflow-hidden rounded-lg ${className}`}>
      <Plyr
        source={{
          type: 'video' as const,
          sources: [{ src: url, type: 'video/mp4' }],
          ...(poster && { poster }),
        }}
        options={{
          controls: ['play', 'progress', 'current-time', 'duration', 'volume', 'fullscreen'],
          ratio: '16:9',
        }}
      />
    </div>
  )
}
