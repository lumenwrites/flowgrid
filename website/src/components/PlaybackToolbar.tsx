'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPause, faStop, faMusic, faXmark, faVolumeHigh } from '@fortawesome/free-solid-svg-icons'
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX, BPM_MIN, BPM_MAX, METRONOME_BPM_OPTIONS, type Track, getFileForBpm, loopFileUrl, mixFileUrl } from '@/lib/constants'

function getPreviewUrl(track: Track): string | null {
  if (track.mixes) {
    const mix = track.mixes.find(m => m.name === 'Lyrics') ?? track.mixes[0]
    const audioFile = getFileForBpm(mix.files, track.bpm)
    return mixFileUrl(track, audioFile)
  }
  if (!track.loops[0]) return null
  const audioFile = getFileForBpm(track.loops[0].files, track.bpm)
  return loopFileUrl(track, audioFile)
}

const selectClass = 'w-full bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent'

type PlaybackToolbarProps = {
  isPlaying: boolean
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
}

export default function PlaybackToolbar({
  isPlaying,
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
}: PlaybackToolbarProps) {
  const [trackModalOpen, setTrackModalOpen] = useState(false)
  const [audioPopupOpen, setAudioPopupOpen] = useState(false)
  const playGroupRef = useRef<HTMLDivElement>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    setPreviewIndex(null)
  }, [])

  function handlePreview(index: number) {
    if (previewIndex === index) {
      stopPreview()
      return
    }
    stopPreview()
    const url = getPreviewUrl(AVAILABLE_TRACKS[index])
    if (!url) return
    const audio = new Audio(url)
    audio.addEventListener('ended', () => setPreviewIndex(null))
    audio.play()
    previewAudioRef.current = audio
    setPreviewIndex(index)
  }

  useEffect(() => {
    if (!trackModalOpen) stopPreview()
  }, [trackModalOpen, stopPreview])

  useEffect(() => {
    if (!trackModalOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setTrackModalOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [trackModalOpen])

  useEffect(() => {
    if (!audioPopupOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAudioPopupOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [audioPopupOpen])

  const trackLabel = selectedTrackIndex === NONE_TRACK_INDEX
    ? 'No track'
    : AVAILABLE_TRACKS[selectedTrackIndex]?.label ?? 'No track'

  function handleSelectTrack(index: number) {
    onTrackChange(index)
    setTrackModalOpen(false)
  }

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
            className="w-12 h-12 flex items-center justify-center rounded-full transition-colors bg-accent text-white hover:bg-accent-hover"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-lg" />
          </button>

          <button
            onClick={() => setAudioPopupOpen((v) => !v)}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-colors ${
              audioPopupOpen
                ? 'bg-accent/20 border-accent text-accent'
                : 'bg-surface-light border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted'
            }`}
            aria-label="Audio settings"
          >
            <FontAwesomeIcon icon={faVolumeHigh} className="text-sm" />
          </button>

          <button
            onClick={() => onMetronomeChange(!metronomeEnabled)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light border border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
            aria-label="Toggle metronome"
          >
            <div
              className={`w-5 h-5 transition-colors ${
                metronomeEnabled ? 'bg-accent' : 'bg-foreground-muted'
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
                {selectedTrackIndex === NONE_TRACK_INDEX ? (
                  <div>
                    <label className="text-sm text-foreground">Metronome BPM</label>
                    <select
                      value={metronomeBpm}
                      onChange={(e) => onMetronomeBpmChange(Number(e.target.value))}
                      className={`${selectClass} mt-1.5`}
                    >
                      {METRONOME_BPM_OPTIONS.map((bpm) => (
                        <option key={bpm} value={bpm}>{bpm} BPM</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
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
                    <div className="mt-4">
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
                  </>
                )}
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
        </div>

        <button
          onClick={() => setTrackModalOpen(true)}
          className="flex items-center gap-1.5 bg-surface-light text-foreground text-sm rounded px-3 py-1.5 border border-border hover:border-foreground-muted transition-colors max-w-[200px] truncate"
        >
          <FontAwesomeIcon icon={faMusic} className="text-xs text-foreground-muted shrink-0" />
          <span className="truncate">{trackLabel}</span>
        </button>
      </div>

      {/* Track picker modal */}
      {trackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTrackModalOpen(false)} />
          <div className="relative bg-surface border border-border rounded-lg w-80 max-h-[70vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground tracking-wider">SELECT TRACK</h3>
              <button
                onClick={() => setTrackModalOpen(false)}
                className="p-1 rounded hover:bg-surface-light transition-colors"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="text-lg text-foreground-muted" />
              </button>
            </div>
            <div className="overflow-y-auto py-1">
              <button
                onClick={() => handleSelectTrack(NONE_TRACK_INDEX)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  selectedTrackIndex === NONE_TRACK_INDEX
                    ? 'bg-accent/15 text-accent'
                    : 'text-foreground hover:bg-surface-light'
                }`}
              >
                No track
              </button>
              {AVAILABLE_TRACKS.map((track, i) => {
                if (track.public === false && !isAdmin) return null
                return (
                  <div
                    key={i}
                    className={`flex items-center transition-colors ${
                      selectedTrackIndex === i
                        ? 'bg-accent/15'
                        : 'hover:bg-surface-light'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectTrack(i)}
                      className={`flex-1 text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedTrackIndex === i ? 'text-accent' : 'text-foreground'
                      }`}
                    >
                      {track.label}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePreview(i) }}
                      className={`shrink-0 w-8 h-8 mr-2 flex items-center justify-center rounded-full transition-colors ${
                        previewIndex === i
                          ? 'text-accent'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                      aria-label={`Preview ${track.label}`}
                    >
                      <FontAwesomeIcon icon={previewIndex === i ? faVolumeHigh : faPlay} className="text-xs" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
