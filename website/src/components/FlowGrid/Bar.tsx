'use client'

import { BEATS_PER_BAR } from '@/lib/constants'
import type { BarData } from '@/lib/rhymes'
import BeatCell from './BeatCell'

type BarProps = {
  bar: BarData
  currentBeat: number | null
}

export default function Bar({ bar, currentBeat }: BarProps) {
  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
      {Array.from({ length: BEATS_PER_BAR }).map((_, beatIdx) => {
        const isLastBeat = beatIdx === BEATS_PER_BAR - 1
        return (
          <BeatCell
            key={beatIdx}
            beatIndex={beatIdx}
            isActive={currentBeat === beatIdx}
            rhymeWord={isLastBeat ? bar.rhymeWord : undefined}
            rhymeColor={isLastBeat ? bar.rhymeColor : undefined}
          />
        )
      })}
    </div>
  )
}
