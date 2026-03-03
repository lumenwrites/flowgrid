'use client'

import { cn } from '@/lib/utils'
import type { RhymeColor } from '@/lib/rhymes'

type BeatCellProps = {
  beatIndex: number
  isActive: boolean
  rhymeWord?: string
  rhymeColor?: RhymeColor
  rhymeHidden?: boolean
}

export default function BeatCell({
  isActive,
  rhymeWord,
  rhymeColor,
  rhymeHidden,
}: BeatCellProps) {
  const hasRhyme = rhymeWord && rhymeColor

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md border transition-colors duration-75',
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
      {hasRhyme && (
        <span className="text-sm sm:text-base font-semibold text-white">
          {rhymeHidden ? '????' : rhymeWord}
        </span>
      )}
    </div>
  )
}
