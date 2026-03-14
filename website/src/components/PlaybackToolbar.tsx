'use client'

import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faStop, faMusic, faVolumeHigh, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX, BPM_MIN, BPM_MAX, METRONOME_BPM_OPTIONS, COUNTDOWN_LINE_OPTIONS, type TrackCategory } from '@/lib/constants'
import TrackPickerModal from '@/components/TrackPickerModal'

type PlaybackToolbarProps = {
  isPlaying: boolean
  isLoading: boolean
  onToggle: () => void
  onStop: () => void
  selectedTrackIndex: number
  onTrackChange: (index: number) => void
  isAdmin?: boolean
  metronomeEnabled: boolean
  metronomeTicking: boolean
  beat: number
  onMetronomeChange: (enabled: boolean) => void
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
  countdownLines: number
  onCountdownLinesChange: (lines: number) => void
  trackModalTab: TrackCategory
  onTrackModalTabChange: (tab: TrackCategory) => void
}

export default function PlaybackToolbar({
  isPlaying,
  isLoading,
  onToggle,
  onStop,
  selectedTrackIndex,
  onTrackChange,
  isAdmin,
  metronomeEnabled,
  metronomeTicking,
  beat,
  onMetronomeChange,
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
  countdownLines,
  onCountdownLinesChange,
  trackModalTab,
  onTrackModalTabChange,
}: PlaybackToolbarProps) {
  const [trackModalOpen, setTrackModalOpen] = useState(false)
  const [audioPopupOpen, setAudioPopupOpen] = useState(false)
  const [metronomePopupOpen, setMetronomePopupOpen] = useState(false)
  const playGroupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!audioPopupOpen && !metronomePopupOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setAudioPopupOpen(false); setMetronomePopupOpen(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [audioPopupOpen, metronomePopupOpen])

  const trackLabel = selectedTrackIndex === NONE_TRACK_INDEX
    ? 'No track'
    : AVAILABLE_TRACKS[selectedTrackIndex]?.label ?? 'No track'

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-surface border-t border-border">
        <div ref={playGroupRef} className="relative flex items-center gap-2">
          <button
            onClick={onStop}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light border border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
            aria-label="Stop"
          >
            <FontAwesomeIcon icon={faStop} className="text-sm" />
          </button>

          <button
            onClick={onToggle}
            disabled={isLoading}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
              isLoading ? 'bg-accent/60 text-white/60 cursor-wait' : 'bg-accent text-white hover:bg-accent-hover'
            }`}
            aria-label={isLoading ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
          >
            <FontAwesomeIcon
              icon={isLoading ? faSpinner : isPlaying ? faPause : faPlay}
              className={`text-lg ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>

          {selectedTrackIndex !== NONE_TRACK_INDEX && (
            <button
              onClick={() => { setAudioPopupOpen((v) => !v); setMetronomePopupOpen(false) }}
              className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${
                audioPopupOpen
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-surface-light border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted'
              }`}
              aria-label="Audio settings"
            >
              <FontAwesomeIcon icon={faVolumeHigh} className="text-sm" />
            </button>
          )}

          <button
            onClick={() => { setMetronomePopupOpen((v) => !v); setAudioPopupOpen(false) }}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${
              metronomePopupOpen
                ? 'bg-accent/20 border-accent'
                : 'bg-surface-light border-border hover:border-foreground-muted'
            }`}
            aria-label="Metronome settings"
          >
            <div
              className={`w-5 h-5 transition-colors ${
                metronomePopupOpen ? 'bg-accent' : metronomeEnabled ? 'bg-accent' : 'bg-foreground-muted'
              }`}
              style={{
                maskImage: 'url(/metronome.png)',
                WebkitMaskImage: 'url(/metronome.png)',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                transform: metronomeTicking && beat % 2 === 1 ? 'scaleX(-1)' : undefined,
              }}
            />
          </button>

          {/* Audio popup */}
          {audioPopupOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAudioPopupOpen(false)} aria-hidden="true" />
              <div className="absolute bottom-full left-0 mb-2 z-50 w-64 p-3 bg-surface border border-border rounded-lg shadow-xl">
                <div>
                  <label className="text-sm text-foreground">Track volume — {trackVolume}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={trackVolume}
                    onChange={(e) => onTrackVolumeChange(Number(e.target.value))}
                    className="w-full mt-1.5 accent-accent"
                  />
                </div>
                <div className="mt-4">
                  <label className="text-sm text-foreground">Metronome volume — {metronomeVolume}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={metronomeVolume}
                    onChange={(e) => onMetronomeVolumeChange(Number(e.target.value))}
                    className="w-full mt-1.5 accent-accent"
                  />
                </div>
              </div>
            </>
          )}

          {/* Metronome popup */}
          {metronomePopupOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMetronomePopupOpen(false)} aria-hidden="true" />
              <div className="absolute bottom-full left-0 mb-2 z-50 w-64 p-3 bg-surface border border-border rounded-lg shadow-xl">
                <div>
                  <label className="text-sm text-foreground">Metronome</label>
                  <div className="flex gap-1.5 mt-1.5">
                    {['Off', 'On'].map((label, i) => (
                      <button
                        key={label}
                        onClick={() => onMetronomeChange(i === 1)}
                        className={`flex-1 text-sm py-1 rounded border transition-colors ${
                          metronomeEnabled === (i === 1)
                            ? 'bg-accent text-white border-accent'
                            : 'bg-surface-light text-foreground-muted border-border hover:text-foreground'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm text-foreground">Count-in</label>
                  <div className="flex gap-1.5 mt-1.5">
                    {COUNTDOWN_LINE_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => onCountdownLinesChange(n)}
                        className={`flex-1 text-sm py-1 rounded border transition-colors ${
                          countdownLines === n
                            ? 'bg-accent text-white border-accent'
                            : 'bg-surface-light text-foreground-muted border-border hover:text-foreground'
                        }`}
                      >
                        {n === 0 ? 'Off' : n === 1 ? '1 line' : `${n} lines`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">BPM{selectedTrackIndex !== NONE_TRACK_INDEX && !bpmVariants ? ` — ${trackBpm}` : ''}</label>
                    {selectedTrackIndex !== NONE_TRACK_INDEX && !bpmVariants && trackBpm !== nativeBpm && (
                      <button
                        onClick={() => onTrackBpmChange(nativeBpm)}
                        className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                      >
                        Reset ({nativeBpm})
                      </button>
                    )}
                  </div>
                  {selectedTrackIndex === NONE_TRACK_INDEX ? (
                    <div className="flex gap-1.5 mt-1.5">
                      {METRONOME_BPM_OPTIONS.map((bpm) => (
                        <button
                          key={bpm}
                          onClick={() => onMetronomeBpmChange(bpm)}
                          className={`flex-1 text-sm py-1 rounded border transition-colors ${
                            metronomeBpm === bpm
                              ? 'bg-accent text-white border-accent'
                              : 'bg-surface-light text-foreground-muted border-border hover:text-foreground'
                          }`}
                        >
                          {bpm}
                        </button>
                      ))}
                    </div>
                  ) : bpmVariants ? (
                    <div className="flex gap-1.5 mt-1.5">
                      {bpmVariants.map((bpm) => (
                        <button
                          key={bpm}
                          onClick={() => onTrackBpmChange(bpm)}
                          className={`flex-1 text-sm py-1 rounded border transition-colors ${
                            trackBpm === bpm
                              ? 'bg-accent text-white border-accent'
                              : 'bg-surface-light text-foreground-muted border-border hover:text-foreground'
                          }`}
                        >
                          {bpm}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="range"
                      min={BPM_MIN}
                      max={BPM_MAX}
                      step={10}
                      value={trackBpm}
                      onChange={(e) => onTrackBpmChange(Number(e.target.value))}
                      className="w-full mt-1.5 accent-accent"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setTrackModalOpen(true)}
          className="flex items-center gap-1.5 bg-surface-light text-foreground text-sm rounded px-3 py-1.5 border border-border hover:border-foreground-muted transition-colors max-w-[200px] truncate"
        >
          <FontAwesomeIcon icon={faMusic} className="text-xs text-foreground-muted shrink-0" />
          <span className="truncate">{trackLabel}</span>
        </button>
      </div>

      <TrackPickerModal
        open={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        selectedTrackIndex={selectedTrackIndex}
        onTrackChange={onTrackChange}
        isAdmin={isAdmin}
        activeTab={trackModalTab}
        onTabChange={onTrackModalTabChange}
      />
    </>
  )
}
