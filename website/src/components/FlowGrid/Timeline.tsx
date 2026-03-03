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
  const progressBarRef = useRef<HTMLDivElement | null>(null)
  const tickRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastActiveRef = useRef(-1)
  const rafRef = useRef<number | null>(null)

  // RAF loop to update progress bar + highlight passed ticks
  useEffect(() => {
    const clearAll = () => {
      for (let i = 0; i <= totalSubs; i++) {
        const tick = tickRefs.current[i]
        if (tick) tick.style.backgroundColor = ''
      }
      if (progressBarRef.current) progressBarRef.current.style.width = '0%'
    }

    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const update = () => {
      const p = progressRef.current
      const activeSub = Math.min(Math.floor(p * totalSubs), totalSubs - 1)

      // Update progress bar width every frame
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${p * 100}%`
      }

      if (activeSub !== lastActiveRef.current) {
        if (activeSub < lastActiveRef.current) {
          // Wrapped to new row — clear all, light up from 0
          for (let i = 0; i <= totalSubs; i++) {
            const tick = tickRefs.current[i]
            if (tick) tick.style.backgroundColor = ''
          }
          for (let i = 0; i <= activeSub; i++) {
            const tick = tickRefs.current[i]
            if (tick) tick.style.backgroundColor = 'var(--color-accent)'
          }
        } else {
          const from = lastActiveRef.current < 0 ? 0 : lastActiveRef.current + 1
          for (let i = from; i <= activeSub; i++) {
            const tick = tickRefs.current[i]
            if (tick) tick.style.backgroundColor = 'var(--color-accent)'
          }
        }
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

      {/* Subdivision ticks, progress bar, and playhead */}
      <div className="h-3 relative">
        {/* Progress fill — stretches from left to playhead position */}
        <div
          ref={progressBarRef}
          className="absolute bottom-0 left-0 h-3 bg-accent/0"
          style={{ width: '0%' }}
        />

        {/* Tick marks */}
        {Array.from({ length: totalSubs + 1 }).map((_, i) => {
          const isBeat = i % 4 === 0
          return (
            <div
              key={i}
              ref={(el) => { tickRefs.current[i] = el }}
              className={cn(
                'absolute bottom-0',
                isBeat ? 'h-3 w-px bg-accent/40' : 'h-1.5 w-px bg-foreground-muted/20'
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
