'use client'

import { AVAILABLE_BEATS } from '@/lib/constants'
import type { WordList } from '@/lib/rhymes'

type ToolbarProps = {
  selectedBeatIndex: number
  onBeatChange: (index: number) => void
  wordLists: WordList[]
  selectedListId: string
  onWordListChange: (id: string) => void
}

export default function Toolbar({
  selectedBeatIndex,
  onBeatChange,
  wordLists,
  selectedListId,
  onWordListChange,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface border-b border-border">
      <span className="text-sm font-bold text-accent tracking-wider hidden sm:block">
        FLOWGRID
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <label className="text-xs text-foreground-muted">BPM</label>
        <select
          value={selectedBeatIndex}
          onChange={(e) => onBeatChange(Number(e.target.value))}
          className="bg-surface-light text-foreground text-sm rounded px-2 py-1 border border-border focus:outline-none focus:border-accent"
        >
          {AVAILABLE_BEATS.map((beat, i) => (
            <option key={beat.bpm} value={i}>
              {beat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-foreground-muted">Words</label>
        <select
          value={selectedListId}
          onChange={(e) => onWordListChange(e.target.value)}
          className="bg-surface-light text-foreground text-sm rounded px-2 py-1 border border-border focus:outline-none focus:border-accent"
        >
          {wordLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
