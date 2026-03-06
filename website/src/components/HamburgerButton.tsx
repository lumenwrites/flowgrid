'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faCog } from '@fortawesome/free-solid-svg-icons'

type HamburgerButtonProps = {
  onClick: () => void
}

export default function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded hover:bg-surface-light text-foreground-muted"
      aria-label="Open settings"
    >
      <FontAwesomeIcon icon={faCog} />
    </button>
  )
}
