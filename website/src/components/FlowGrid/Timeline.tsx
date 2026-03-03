'use client'

import { type RefObject } from 'react'
import { BEATS_PER_BAR } from '@/lib/constants'
import { cn } from '@/lib/utils'

type TimelineProps = {
  currentBeat: number
  lineRef: RefObject<HTMLDivElement | null>
}

export default function Timeline({ currentBeat, lineRef }: TimelineProps) {
  return (
    <div className="relative px-2 sm:px-3 pb-1">
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
        {Array.from({ length: BEATS_PER_BAR }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center h-7 text-xs font-mono rounded transition-colors',
              i === currentBeat
                ? 'text-accent font-bold'
                : 'text-foreground-muted'
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Subdivision ticks and playhead */}
      <div className="h-3 relative">
        {Array.from({ length: BEATS_PER_BAR * 4 + 1 }).map((_, i) => {
          const isBeat = i % 4 === 0
          return (
            <div
              key={i}
              className={cn(
                'absolute bottom-0',
                isBeat ? 'h-3 w-px bg-foreground-muted/40' : 'h-1.5 w-px bg-foreground-muted/20'
              )}
              style={{ left: `${(i / (BEATS_PER_BAR * 4)) * 100}%` }}
            />
          )
        })}
        <div
          ref={lineRef}
          className="absolute bottom-0 h-3 w-0.5 bg-accent rounded-full"
          style={{ left: '0%', boxShadow: '0 0 4px var(--color-accent)' }}
        />
      </div>
    </div>
  )
}
