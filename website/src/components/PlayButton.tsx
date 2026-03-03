'use client'

import { cn } from '@/lib/utils'

type PlayButtonProps = {
  isPlaying: boolean
  onToggle: () => void
  onStop: () => void
}

export default function PlayButton({
  isPlaying,
  onToggle,
  onStop,
}: PlayButtonProps) {
  return (
    <div className="flex items-center justify-center gap-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-surface border-t border-border">
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
        className={cn(
          'w-14 h-14 flex items-center justify-center rounded-full transition-colors',
          isPlaying
            ? 'bg-accent text-white hover:bg-accent-hover'
            : 'bg-accent text-white hover:bg-accent-hover'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="4" y="3" width="4" height="14" rx="1" />
            <rect x="12" y="3" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M5 3.5L17 10L5 16.5V3.5Z" />
          </svg>
        )}
      </button>
    </div>
  )
}
