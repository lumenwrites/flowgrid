'use client'

import { AVAILABLE_BEATS, NONE_BEAT_INDEX, RHYME_PATTERNS, BARS_PER_LINE_OPTIONS, BAR_COUNT_OPTIONS, FILL_MODES, INTRO_BAR_OPTIONS, METRONOME_BPM_OPTIONS, type RhymePattern, type BarsPerLine, type FillMode } from '@/lib/constants'
import type { WordList } from '@/lib/rhymes'

type SidebarProps = {
  open: boolean
  onClose: () => void
  selectedBeatIndex: number
  onBeatChange: (index: number) => void
  wordLists: WordList[]
  selectedListId: string
  onWordListChange: (id: string) => void
  barsPerLine: BarsPerLine
  onBarsPerLineChange: (value: BarsPerLine) => void
  rhymePattern: RhymePattern
  onRhymePatternChange: (pattern: RhymePattern) => void
  barCount: number
  onBarCountChange: (count: number) => void
  fillMode: FillMode
  onFillModeChange: (mode: FillMode) => void
  introBars: number
  onIntroBarsChange: (count: number) => void
  metronomeBpm: number
  onMetronomeBpmChange: (bpm: number) => void
  seed: number
  onSeedChange: (seed: number) => void
}

export default function Sidebar({
  open,
  onClose,
  selectedBeatIndex,
  onBeatChange,
  wordLists,
  selectedListId,
  onWordListChange,
  barsPerLine,
  onBarsPerLineChange,
  rhymePattern,
  onRhymePatternChange,
  barCount,
  onBarCountChange,
  fillMode,
  onFillModeChange,
  introBars,
  onIntroBarsChange,
  metronomeBpm,
  onMetronomeBpmChange,
  seed,
  onSeedChange,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-surface border-r border-border z-50 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground tracking-wider">SETTINGS</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-light transition-colors"
            aria-label="Close settings"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-foreground-muted"
            >
              <path
                d="M6 6L14 14M14 6L6 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Beat */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Beat</label>
            <select
              value={selectedBeatIndex}
              onChange={(e) => onBeatChange(Number(e.target.value))}
              className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              <option value={NONE_BEAT_INDEX}>None</option>
              {AVAILABLE_BEATS.map((beat, i) => (
                <option key={i} value={i}>
                  {beat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metronome BPM — only when no beat selected */}
          {selectedBeatIndex === NONE_BEAT_INDEX && (
            <div className="space-y-1.5">
              <label className="text-sm text-foreground">Metronome BPM</label>
              <select
                value={metronomeBpm}
                onChange={(e) => onMetronomeBpmChange(Number(e.target.value))}
                className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
              >
                {METRONOME_BPM_OPTIONS.map((bpm) => (
                  <option key={bpm} value={bpm}>
                    {bpm} BPM
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Word list */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Words</label>
            <select
              value={selectedListId}
              onChange={(e) => onWordListChange(e.target.value)}
              className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {wordLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bars per line */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Bars per line</label>
            <select
              value={barsPerLine}
              onChange={(e) => onBarsPerLineChange(Number(e.target.value) as BarsPerLine)}
              className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {BARS_PER_LINE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bar count */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Bars</label>
            <select
              value={barCount}
              onChange={(e) => onBarCountChange(Number(e.target.value))}
              className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {BAR_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'Infinite' : `${n} bars`}
                </option>
              ))}
            </select>
          </div>

          {/* Intro bars */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Intro bars</label>
            <select
              value={introBars}
              onChange={(e) => onIntroBarsChange(Number(e.target.value))}
              className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {INTRO_BAR_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'None' : `${n} bars`}
                </option>
              ))}
            </select>
          </div>

          {/* Rhyme pattern */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Rhyme pattern</label>
            <select
              value={rhymePattern}
              onChange={(e) => onRhymePatternChange(e.target.value as RhymePattern)}
              className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {RHYME_PATTERNS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fill mode */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Fill mode</label>
            <select
              value={fillMode}
              onChange={(e) => onFillModeChange(e.target.value as FillMode)}
              className="w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent"
            >
              {FILL_MODES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Seed */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Seed</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={seed}
                readOnly
                className="flex-1 bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border font-mono"
              />
              <button
                onClick={() => onSeedChange(Math.floor(Math.random() * 2 ** 31))}
                className="px-3 py-1.5 bg-surface-light text-foreground-muted text-sm rounded border border-border hover:bg-accent/20 hover:text-foreground transition-colors"
              >
                Shuffle
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
