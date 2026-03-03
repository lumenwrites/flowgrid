'use client'

import HamburgerButton from './HamburgerButton'

type ToolbarProps = {
  metronomeEnabled: boolean
  onMetronomeChange: (enabled: boolean) => void
  onOpenSettings: () => void
  onRandomizeSeed: () => void
}

export default function Toolbar({
  metronomeEnabled,
  onMetronomeChange,
  onOpenSettings,
  onRandomizeSeed,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface border-b border-border">
      <HamburgerButton onClick={onOpenSettings} />

      <span className="text-sm font-bold text-accent tracking-wider hidden sm:block">
        FLOWGRID
      </span>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onRandomizeSeed}
          className="p-1.5 rounded hover:bg-surface-light transition-colors"
          aria-label="Randomize seed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-foreground-muted">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
            <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </button>
        <label className="text-xs text-foreground-muted">Metronome</label>
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
    </div>
  )
}
