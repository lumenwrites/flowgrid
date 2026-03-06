'use client'

import { cn } from '@/lib/utils'
import type { Loop } from '@/lib/constants'

type LoopSelectorProps = {
  loops: Loop[]
  currentLoopIndex: number
  queuedLoopIndex: number | null
  onSelectLoop: (index: number) => void
}

export default function LoopSelector({ loops, currentLoopIndex, queuedLoopIndex, onSelectLoop }: LoopSelectorProps) {
  if (loops.length <= 1) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface border-t border-border overflow-x-auto">
      {loops.map((loop, i) => {
        const isCurrent = i === currentLoopIndex
        const isQueued = i === queuedLoopIndex
        return (
          <button
            key={i}
            onClick={() => onSelectLoop(i)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-full border whitespace-nowrap transition-all',
              isCurrent
                ? 'bg-accent text-white border-accent'
                : isQueued
                  ? 'bg-surface-light text-accent border-accent animate-pulse'
                  : 'bg-surface-light text-foreground-muted border-border hover:text-foreground hover:border-foreground-muted'
            )}
          >
            {loop.name}
          </button>
        )
      })}
    </div>
  )
}
