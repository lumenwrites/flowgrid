'use client'

type SidebarProps = {
  open: boolean
  onClose: () => void
  audioOffset: number
  onAudioOffsetChange: (offset: number) => void
}

export default function Sidebar({
  open,
  onClose,
  audioOffset,
  onAudioOffsetChange,
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
        className={`fixed top-0 left-0 h-full w-72 bg-surface border-r border-border z-50 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-border">
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

        <div className="p-4 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Bar count */}
          {/* Always keep it infinite? */}
          {/* <div className="space-y-1.5">
            <label className="text-sm text-foreground">Bars</label>
            <select
              value={barCount}
              onChange={(e) => onBarCountChange(Number(e.target.value))}
              className={selectClass}
            >
              {BAR_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'Infinite' : `${n} bars`}
                </option>
              ))}
            </select>
          </div> */}

          {/* Audio offset */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Latency compensation — {audioOffset}ms</label>
            <input
              type="range"
              min={0}
              max={200}
              step={10}
              value={audioOffset}
              onChange={(e) => onAudioOffsetChange(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-xs text-foreground-muted">Delay visuals to match Bluetooth/wireless audio</p>
          </div>
        </div>
      </div>
    </>
  )
}
