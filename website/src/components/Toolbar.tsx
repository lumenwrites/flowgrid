'use client'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBook, faGraduationCap } from '@fortawesome/free-solid-svg-icons'
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
  return (
    <div className="flex items-center gap-3 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] bg-surface border-b border-border">
      <HamburgerButton onClick={onOpenSettings} />
      <Link
        href="/learn"
        className="p-1.5 rounded hover:bg-surface-light transition-colors text-foreground-muted hover:text-foreground"
        aria-label="Academy"
      >
        <FontAwesomeIcon icon={faGraduationCap} />
      </Link>
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
  )
}
