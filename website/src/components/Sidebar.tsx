'use client'

import { RHYME_PATTERNS, BARS_PER_LINE_OPTIONS, type RhymePattern, type BarsPerLine } from '@/lib/constants'

type SidebarProps = {
  open: boolean
  onClose: () => void
  metronomeEnabled: boolean
  onMetronomeChange: (enabled: boolean) => void
  barsPerLine: BarsPerLine
  onBarsPerLineChange: (value: BarsPerLine) => void
  rhymePattern: RhymePattern
  onRhymePatternChange: (pattern: RhymePattern) => void
}

export default function Sidebar({
  open,
  onClose,
  metronomeEnabled,
  onMetronomeChange,
  barsPerLine,
  onBarsPerLineChange,
  rhymePattern,
  onRhymePatternChange,
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
        className={`fixed top-0 right-0 h-full w-72 bg-surface border-l border-border z-50 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
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
          {/* Metronome toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-foreground">Metronome</label>
            <button
              onClick={() => onMetronomeChange(!metronomeEnabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                metronomeEnabled ? 'bg-accent' : 'bg-surface-light'
              }`}
              aria-label="Toggle metronome"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  metronomeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
        </div>
      </div>
    </>
  )
}
