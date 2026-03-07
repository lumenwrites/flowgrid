'use client'

import { cn } from '@/lib/utils'
import type { Loop, Example } from '@/lib/constants'

type LoopSelectorProps = {
  loops: Loop[]
  currentLoopIndex: number
  queuedLoopIndex: number | null
  onSelectLoop: (index: number) => void
  examples?: Example[]
  activeExampleIndex?: number | null
  onSelectExample?: (index: number) => void
}

export default function LoopSelector({ loops, currentLoopIndex, queuedLoopIndex, onSelectLoop, examples, activeExampleIndex, onSelectExample }: LoopSelectorProps) {
  const multiLoop = loops.length > 1
  const hasExamples = examples && examples.length > 0

  if (!multiLoop && !hasExamples) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface border-t border-border overflow-x-auto">
      {multiLoop && loops.map((loop, i) => {
        const isCurrent = i === currentLoopIndex && activeExampleIndex === null
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

      {hasExamples && (
        <>
          {multiLoop && <div className="w-px h-6 bg-border mx-1" />}
          {examples.map((example, i) => (
            <button
              key={`ex-${i}`}
              onClick={() => onSelectExample?.(i)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded border whitespace-nowrap transition-all',
                i === activeExampleIndex
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface-light text-foreground-muted border-border hover:text-foreground hover:border-foreground-muted'
              )}
            >
              {example.name}
            </button>
          ))}
        </>
      )}
    </div>
  )
}
