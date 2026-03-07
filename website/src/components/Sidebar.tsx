'use client'

import { NONE_TRACK_INDEX, BARS_PER_LINE_OPTIONS, INTRO_BAR_OPTIONS, METRONOME_BPM_OPTIONS, BPM_MIN, BPM_MAX, type BarsPerLine } from '@/lib/constants'
const selectClass = 'w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent'

type SidebarProps = {
  open: boolean
  onClose: () => void
  selectedTrackIndex: number
  barsPerLine: BarsPerLine
  onBarsPerLineChange: (value: BarsPerLine) => void
  introBars: number
  onIntroBarsChange: (count: number) => void
  trackBpm: number
  nativeBpm: number
  bpmVariants?: number[]
  onTrackBpmChange: (bpm: number) => void
  metronomeBpm: number
  onMetronomeBpmChange: (bpm: number) => void
  trackVolume: number
  onTrackVolumeChange: (volume: number) => void
  metronomeVolume: number
  onMetronomeVolumeChange: (volume: number) => void
  audioOffset: number
  onAudioOffsetChange: (offset: number) => void
}

export default function Sidebar({
  open,
  onClose,
  selectedTrackIndex,
  barsPerLine,
  onBarsPerLineChange,
  introBars,
  onIntroBarsChange,
  trackBpm,
  nativeBpm,
  bpmVariants,
  onTrackBpmChange,
  metronomeBpm,
  onMetronomeBpmChange,
  trackVolume,
  onTrackVolumeChange,
  metronomeVolume,
  onMetronomeVolumeChange,
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
          {/* Metronome BPM — only when no track selected */}
          {selectedTrackIndex === NONE_TRACK_INDEX && (
            <div className="space-y-1.5">
              <label className="text-sm text-foreground">Metronome BPM</label>
              <select
                value={metronomeBpm}
                onChange={(e) => onMetronomeBpmChange(Number(e.target.value))}
                className={selectClass}
              >
                {METRONOME_BPM_OPTIONS.map((bpm) => (
                  <option key={bpm} value={bpm}>
                    {bpm} BPM
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BPM — only when a track is selected */}
          {selectedTrackIndex !== NONE_TRACK_INDEX && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground">BPM{!bpmVariants && ` — ${trackBpm}`}</label>
                {!bpmVariants && trackBpm !== nativeBpm && (
                  <button
                    onClick={() => onTrackBpmChange(nativeBpm)}
                    className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                  >
                    Reset ({nativeBpm})
                  </button>
                )}
              </div>
              {bpmVariants ? (
                <select
                  value={trackBpm}
                  onChange={(e) => onTrackBpmChange(Number(e.target.value))}
                  className={selectClass}
                >
                  {bpmVariants.map((bpm) => (
                    <option key={bpm} value={bpm}>{bpm} BPM</option>
                  ))}
                </select>
              ) : (
                <input
                  type="range"
                  min={BPM_MIN}
                  max={BPM_MAX}
                  step={10}
                  value={trackBpm}
                  onChange={(e) => onTrackBpmChange(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              )}
            </div>
          )}

          {/* Track volume — only when a track is selected */}
          {selectedTrackIndex !== NONE_TRACK_INDEX && (
            <div className="space-y-1.5">
              <label className="text-sm text-foreground">Track volume — {trackVolume}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={trackVolume}
                onChange={(e) => onTrackVolumeChange(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>
          )}

          {/* Metronome volume */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Metronome volume — {metronomeVolume}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={metronomeVolume}
              onChange={(e) => onMetronomeVolumeChange(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Bars per line */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Bars per line</label>
            <select
              value={barsPerLine}
              onChange={(e) => onBarsPerLineChange(Number(e.target.value) as BarsPerLine)}
              className={selectClass}
            >
              {BARS_PER_LINE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

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

          {/* Intro bars */}
          <div className="space-y-1.5">
            <label className="text-sm text-foreground">Intro bars</label>
            <select
              value={introBars}
              onChange={(e) => onIntroBarsChange(Number(e.target.value))}
              className={selectClass}
            >
              {INTRO_BAR_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'None' : n === 1 ? '1 bar' : `${n} bars`}
                </option>
              ))}
            </select>
          </div>

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
