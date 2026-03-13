'use client'

import { useEffect, type ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  /** Position the modal near the top instead of centered */
  topAligned?: boolean
}

export default function Modal({ open, onClose, children, className = '', topAligned }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`fixed inset-0 z-50 flex justify-center ${topAligned ? 'pt-[50px]' : 'items-center'}`}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative bg-surface border border-border rounded-lg max-h-[70vh] flex flex-col shadow-xl ${className}`}>
        {children}
      </div>
    </div>
  )
}

type ModalHeaderProps = {
  onClose: () => void
  children: ReactNode
}

export function ModalHeader({ onClose, children }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      {children}
      <button
        onClick={onClose}
        className="p-1 rounded hover:bg-surface-light transition-colors"
        aria-label="Close"
      >
        <FontAwesomeIcon icon={faXmark} className="text-lg text-foreground-muted" />
      </button>
    </div>
  )
}
