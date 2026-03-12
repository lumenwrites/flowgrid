'use client'

import { BEATS_PER_BAR } from '@/lib/constants'
import type { BarData } from '@/lib/rhymes'
import BeatCell from './BeatCell'

type BarProps = {
  bar: BarData
  currentBeat: number | null
  isLastInLine?: boolean
  onBeatClick?: (beat: number) => void
}

export default function Bar({ bar, currentBeat, isLastInLine = true, onBeatClick }: BarProps) {
  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
      {Array.from({ length: BEATS_PER_BAR }).map((_, beatIdx) => {
        const beatWord = bar.beatWords?.[beatIdx]
        const showRhyme = !bar.instrumental && isLastInLine && beatIdx === BEATS_PER_BAR - 1
        const word = beatWord ? beatWord.word : showRhyme ? bar.rhymeWord : undefined
        const color = beatWord ? (beatWord.rhymeColor ?? undefined) : showRhyme ? bar.rhymeColor : undefined
        const hidden = beatWord ? bar.rhymeHidden : showRhyme ? bar.rhymeHidden : undefined
        return (
          <BeatCell
            key={beatIdx}
            isActive={currentBeat === beatIdx}
            rhymeWord={word}
            rhymeColor={color}
            rhymeHidden={hidden}
            onClick={onBeatClick ? () => onBeatClick(beatIdx) : undefined}
          />
        )
      })}
    </div>
  )
}
