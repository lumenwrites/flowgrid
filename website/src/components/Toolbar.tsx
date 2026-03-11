'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook } from '@fortawesome/free-solid-svg-icons'
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons'
import HamburgerButton from './HamburgerButton'

type ToolbarProps = {
  onOpenSettings: () => void
  onOpenDictionary: () => void
  onRandomizeSeed: () => void
}

export default function Toolbar({
  onOpenSettings,
  onOpenDictionary,
  onRandomizeSeed,
}: ToolbarProps) {
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    if (!tutorialOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setTutorialOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [tutorialOpen])

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-surface border-b border-border">
        <HamburgerButton onClick={onOpenSettings} />
        <button
            onClick={() => setTutorialOpen(true)}
            className="p-1.5 rounded hover:bg-surface-light transition-colors text-foreground-muted hover:text-foreground"
            aria-label="Tutorial"
          >
            <FontAwesomeIcon icon={faCircleQuestion} />
          </button>
        <span className="text-sm font-bold text-accent tracking-wider">
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
          <button
            onClick={onOpenDictionary}
            className="p-1.5 rounded hover:bg-surface-light transition-colors text-foreground-muted hover:text-foreground"
            aria-label="Open rhyme settings"
          >
            <FontAwesomeIcon icon={faBook} />
          </button>
        </div>
      </div>

      {tutorialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setTutorialOpen(false)} />
          <div className="relative w-[90vw] max-w-3xl aspect-video">
            <button
              onClick={() => setTutorialOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm"
            >
              Close
            </button>
            <iframe
              className="w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/aHPgwwm23is?autoplay=1"
              title="FlowGrid Tutorial"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  )
}
