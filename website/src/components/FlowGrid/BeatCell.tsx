'use client'

import { cn } from '@/lib/utils'
import type { RhymeColor } from '@/lib/rhymes'

type BeatCellProps = {
  isActive: boolean
  rhymeWord?: string
  rhymeColor?: RhymeColor
  rhymeHidden?: boolean
  onClick?: () => void
}

export default function BeatCell({
  isActive,
  rhymeWord,
  rhymeColor,
  rhymeHidden,
  onClick,
}: BeatCellProps) {
  const hasRhyme = rhymeWord && rhymeColor
  const hasWord = !!rhymeWord

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-md border cursor-pointer',
        'h-12 sm:h-14',
        hasRhyme
          ? ''
          : isActive
            ? 'border-accent bg-accent/20'
            : 'border-beat-cell-border bg-beat-cell'
      )}
      style={
        hasRhyme
          ? isActive
            ? {
                backgroundColor: rhymeColor.activeBg,
                borderColor: rhymeColor.activeBorder,
              }
            : {
                backgroundColor: rhymeColor.bg,
                borderColor: rhymeColor.border,
              }
          : undefined
      }
    >
      {hasRhyme ? (
        <span className="text-md sm:text-md font-semibold text-white">
          {rhymeHidden ? '????' : rhymeWord}
        </span>
      ) : hasWord ? (
        <span className="text-md sm:text-md text-white/70">
          {rhymeHidden ? '????' : rhymeWord}
        </span>
      ) : null}
    </div>
  )
}
