'use client'

import { useState, useEffect } from 'react'
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX } from '@/lib/constants'

type PlayButtonProps = {
  isPlaying: boolean
  onToggle: () => void
  onStop: () => void
  selectedTrackIndex: number
  onTrackChange: (index: number) => void
}

export default function PlayButton({
  isPlaying,
  onToggle,
  onStop,
  selectedTrackIndex,
  onTrackChange,
}: PlayButtonProps) {
  const [trackModalOpen, setTrackModalOpen] = useState(false)

  useEffect(() => {
    if (!trackModalOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setTrackModalOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [trackModalOpen])

  const trackLabel = selectedTrackIndex === NONE_TRACK_INDEX
    ? 'No track'
    : AVAILABLE_TRACKS[selectedTrackIndex]?.label ?? 'No track'

  function handleSelectTrack(index: number) {
    onTrackChange(index)
    setTrackModalOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-surface border-t border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={onStop}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light border border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
            aria-label="Stop"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="1" width="12" height="12" rx="1" />
            </svg>
          </button>

          <button
            onClick={onToggle}
            className="w-12 h-12 flex items-center justify-center rounded-full transition-colors bg-accent text-white hover:bg-accent-hover"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <rect x="4" y="3" width="4" height="14" rx="1" />
                <rect x="12" y="3" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3.5L17 10L5 16.5V3.5Z" />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={() => setTrackModalOpen(true)}
          className="flex items-center gap-1.5 bg-surface-light text-foreground text-sm rounded px-3 py-1.5 border border-border hover:border-foreground-muted transition-colors max-w-[200px] truncate"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-foreground-muted">
            <circle cx="7" cy="14" r="3" />
            <circle cx="15" cy="12" r="3" />
            <path d="M10 14V4l8-2v10" />
          </svg>
          <span className="truncate">{trackLabel}</span>
        </button>
      </div>

      {/* Track picker modal */}
      {trackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTrackModalOpen(false)} />
          <div className="relative bg-surface border border-border rounded-lg w-72 max-h-[70vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground tracking-wider">SELECT TRACK</h3>
              <button
                onClick={() => setTrackModalOpen(false)}
                className="p-1 rounded hover:bg-surface-light transition-colors"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-foreground-muted">
                  <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
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
              {AVAILABLE_TRACKS.map((track, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectTrack(i)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    selectedTrackIndex === i
                      ? 'bg-accent/15 text-accent'
                      : 'text-foreground hover:bg-surface-light'
                  }`}
                >
                  {track.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
