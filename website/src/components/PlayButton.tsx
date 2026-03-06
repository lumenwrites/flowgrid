'use client'

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
  return (
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

      <select
        value={selectedTrackIndex}
        onChange={(e) => onTrackChange(Number(e.target.value))}
        className="bg-surface-light text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:border-accent max-w-[200px]"
      >
        <option value={NONE_TRACK_INDEX}>No track</option>
        {AVAILABLE_TRACKS.map((track, i) => (
          <option key={i} value={i}>{track.label}</option>
        ))}
      </select>
    </div>
  )
}
