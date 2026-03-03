'use client'

import HamburgerButton from './HamburgerButton'

type ToolbarProps = {
  metronomeEnabled: boolean
  onMetronomeChange: (enabled: boolean) => void
  onOpenSettings: () => void
}

export default function Toolbar({
  metronomeEnabled,
  onMetronomeChange,
  onOpenSettings,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface border-b border-border">
      <span className="text-sm font-bold text-accent tracking-wider hidden sm:block">
        FLOWGRID
      </span>

      <div className="flex items-center gap-2 ml-auto">
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

      <HamburgerButton onClick={onOpenSettings} />
    </div>
  )
}
