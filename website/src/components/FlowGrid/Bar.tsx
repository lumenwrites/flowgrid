'use client'

import { BEATS_PER_BAR } from '@/lib/constants'
import type { BarData } from '@/lib/rhymes'
import BeatCell from './BeatCell'

type BarProps = {
  bar: BarData
  currentBeat: number | null
  isLastInLine?: boolean
}

export default function Bar({ bar, currentBeat, isLastInLine = true }: BarProps) {
  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
      {Array.from({ length: BEATS_PER_BAR }).map((_, beatIdx) => {
        const showRhyme = isLastInLine && beatIdx === BEATS_PER_BAR - 1
        return (
          <BeatCell
            key={beatIdx}
            beatIndex={beatIdx}
            isActive={currentBeat === beatIdx}
            rhymeWord={showRhyme ? bar.rhymeWord : undefined}
            rhymeColor={showRhyme ? bar.rhymeColor : undefined}
          />
        )
      })}
    </div>
  )
}
