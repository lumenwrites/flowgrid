'use client'

import { BEATS_PER_BAR } from '@/lib/constants'
import type { BarData } from '@/lib/rhymes'
import BeatCell from './BeatCell'

type BarProps = {
  bar: BarData
  currentBeat: number | null
  isLastInLine?: boolean
  isIntro?: boolean
}

export default function Bar({ bar, currentBeat, isLastInLine = true, isIntro = false }: BarProps) {
  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
      {Array.from({ length: BEATS_PER_BAR }).map((_, beatIdx) => {
        const showRhyme = !isIntro && !bar.instrumental && isLastInLine && beatIdx === BEATS_PER_BAR - 1
        return (
          <BeatCell
            key={beatIdx}
            isActive={currentBeat === beatIdx}
            rhymeWord={showRhyme ? bar.rhymeWord : undefined}
            rhymeColor={showRhyme ? bar.rhymeColor : undefined}
            rhymeHidden={showRhyme ? bar.rhymeHidden : undefined}
          />
        )
      })}
    </div>
  )
}
