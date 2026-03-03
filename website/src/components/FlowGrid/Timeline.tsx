'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { BEATS_PER_BAR } from '@/lib/constants'
import { cn } from '@/lib/utils'

type TimelineProps = {
  currentBeat: number
  currentBar: number
  barsPerLine: number
  lineRef: RefObject<HTMLDivElement | null>
  progressRef: RefObject<number>
  isPlaying: boolean
}

export default function Timeline({ currentBeat, currentBar, barsPerLine, lineRef, progressRef, isPlaying }: TimelineProps) {
  const totalBeats = BEATS_PER_BAR * barsPerLine
  const totalSubs = totalBeats * 4
  const barInRow = currentBar % barsPerLine
  const activeBeatIndex = barInRow * BEATS_PER_BAR + currentBeat
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastActiveRef = useRef(-1)
  const rafRef = useRef<number | null>(null)

  // RAF loop to highlight the active sub-beat segment based on playhead progress
  useEffect(() => {
    if (!isPlaying) {
      // Clear highlight when stopped
      if (lastActiveRef.current >= 0) {
        const el = segmentRefs.current[lastActiveRef.current]
        if (el) el.style.opacity = '0'
        lastActiveRef.current = -1
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const update = () => {
      const p = progressRef.current
      const activeSub = Math.min(Math.floor(p * totalSubs), totalSubs - 1)

      if (activeSub !== lastActiveRef.current) {
        // Clear previous
        if (lastActiveRef.current >= 0) {
          const prev = segmentRefs.current[lastActiveRef.current]
          if (prev) prev.style.opacity = '0'
        }
        // Highlight current
        const curr = segmentRefs.current[activeSub]
        if (curr) curr.style.opacity = '1'
        lastActiveRef.current = activeSub
      }

      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlaying, totalSubs, progressRef])

  return (
    <div className="relative px-2 sm:px-3 pb-1">
      <div className={cn('grid gap-1 sm:gap-1.5', barsPerLine === 2 ? 'grid-cols-8' : 'grid-cols-4')}>
        {Array.from({ length: totalBeats }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center h-7 text-xs font-mono rounded transition-colors',
              i === activeBeatIndex
                ? 'text-accent font-bold'
                : 'text-foreground-muted'
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Subdivision ticks, highlight segments, and playhead */}
      <div className="h-3 relative">
        {/* Highlight segments — one per sub-beat, shown/hidden via RAF */}
        {Array.from({ length: totalSubs }).map((_, i) => (
          <div
            key={`seg-${i}`}
            ref={(el) => { segmentRefs.current[i] = el }}
            className="absolute bottom-0 h-3 bg-accent/25"
            style={{
              left: `${(i / totalSubs) * 100}%`,
              width: `${(1 / totalSubs) * 100}%`,
              opacity: 0,
            }}
          />
        ))}

        {/* Tick marks */}
        {Array.from({ length: totalSubs + 1 }).map((_, i) => {
          const isBeat = i % 4 === 0
          return (
            <div
              key={i}
              className={cn(
                'absolute bottom-0',
                isBeat ? 'h-3 w-px bg-foreground-muted/40' : 'h-1.5 w-px bg-foreground-muted/20'
              )}
              style={{ left: `${(i / totalSubs) * 100}%` }}
            />
          )
        })}

        {/* Playhead line */}
        <div
          ref={lineRef}
          className="absolute bottom-0 h-3 w-0.5 bg-accent rounded-full"
          style={{ left: '0%', boxShadow: '0 0 4px var(--color-accent)' }}
        />
      </div>
    </div>
  )
}
