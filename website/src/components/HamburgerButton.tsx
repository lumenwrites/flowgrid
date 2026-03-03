'use client'

type HamburgerButtonProps = {
  onClick: () => void
}

export default function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded hover:bg-surface-light transition-colors"
      aria-label="Open settings"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-foreground-muted"
      >
        <rect x="3" y="4" width="14" height="2" rx="1" fill="currentColor" />
        <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor" />
        <rect x="3" y="14" width="14" height="2" rx="1" fill="currentColor" />
      </svg>
    </button>
  )
}
