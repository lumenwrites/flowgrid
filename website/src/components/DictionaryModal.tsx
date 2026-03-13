'use client'

import { RHYME_PATTERNS, FILL_MODES, type RhymePattern, type FillMode } from '@/lib/constants'
import { randomSeed } from '@/lib/utils'
import type { WordList } from '@/lib/rhymes'
import Modal, { ModalHeader } from '@/components/ui/Modal'

const selectClass = 'w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent'

type DictionaryModalProps = {
  open: boolean
  onClose: () => void
  wordLists: WordList[]
  selectedListId: string
  onWordListChange: (id: string) => void
  rhymePattern: RhymePattern
  onRhymePatternChange: (pattern: RhymePattern) => void
  fillMode: FillMode
  onFillModeChange: (mode: FillMode) => void
  seed: number
  onSeedChange: (seed: number) => void
}

export default function DictionaryModal({
  open,
  onClose,
  wordLists,
  selectedListId,
  onWordListChange,
  rhymePattern,
  onRhymePatternChange,
  fillMode,
  onFillModeChange,
  seed,
  onSeedChange,
}: DictionaryModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="w-80">
      <ModalHeader onClose={onClose}>
        <h3 className="text-sm font-bold text-foreground tracking-wider">RHYMES</h3>
      </ModalHeader>
      <div className="p-4 overflow-y-auto flex-1 min-h-0">
        <div className="flex flex-col">
          <div>
            <label className="text-sm text-foreground">Words</label>
            <select
              value={selectedListId}
              onChange={(e) => onWordListChange(e.target.value)}
              className={`${selectClass} mt-1.5`}
            >
              {wordLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm text-foreground">Rhyme pattern</label>
            <select
              value={rhymePattern}
              onChange={(e) => onRhymePatternChange(e.target.value as RhymePattern)}
              className={`${selectClass} mt-1.5`}
            >
              {RHYME_PATTERNS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm text-foreground">Fill mode</label>
            <select
              value={fillMode}
              onChange={(e) => onFillModeChange(e.target.value as FillMode)}
              className={`${selectClass} mt-1.5`}
            >
              {FILL_MODES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm text-foreground">Seed</label>
            <div className="flex gap-2 mt-1.5">
              <input
                type="text"
                value={seed}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (!isNaN(n)) onSeedChange(n)
                }}
                className="flex-1 min-w-0 bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border font-mono"
              />
              <button
                onClick={() => onSeedChange(randomSeed())}
                className="px-3 py-1.5 bg-surface-light text-foreground-muted text-sm rounded border border-border hover:bg-accent/20 hover:text-foreground transition-colors"
              >
                Shuffle
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
