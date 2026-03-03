'use client'

import { cn } from '@/lib/utils'
import type { RhymeColor } from '@/lib/rhymes'

type BeatCellProps = {
  beatIndex: number
  isActive: boolean
  rhymeWord?: string
  rhymeColor?: RhymeColor
}

export default function BeatCell({
  isActive,
  rhymeWord,
  rhymeColor,
}: BeatCellProps) {
  const hasRhyme = rhymeWord && rhymeColor

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md border transition-colors duration-75',
        'h-12 sm:h-14',
        isActive
          ? 'border-accent bg-accent/20'
          : hasRhyme
            ? ''
            : 'border-beat-cell-border bg-beat-cell'
      )}
      style={
        hasRhyme && !isActive
          ? {
              backgroundColor: rhymeColor.bg,
              borderColor: rhymeColor.border,
            }
          : undefined
      }
    >
      {rhymeWord && (
        <span className="text-sm sm:text-base font-semibold text-white">
          {rhymeWord}
        </span>
      )}
    </div>
  )
}
