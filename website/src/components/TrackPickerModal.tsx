'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faVolumeHigh } from '@fortawesome/free-solid-svg-icons'
import { AVAILABLE_TRACKS, NONE_TRACK_INDEX, TRACK_CATEGORIES, type Track, type TrackCategory, getFileForBpm, getBpmVariants, loopFileUrl, mixFileUrl } from '@/lib/constants'
import Modal, { ModalHeader } from '@/components/ui/Modal'

function getPreviewUrl(track: Track): string | null {
  if (track.mixes) {
    const mix = track.mixes.find(m => m.name === 'Lyrics') ?? track.mixes[0]
    const audioFile = getFileForBpm(mix.files, track.bpm)
    return mixFileUrl(track, audioFile)
  }
  if (!track.loops?.[0]) return null
  const audioFile = getFileForBpm(track.loops[0].files, track.bpm)
  return loopFileUrl(track, audioFile)
}

type TrackPickerModalProps = {
  open: boolean
  onClose: () => void
  selectedTrackIndex: number
  onTrackChange: (index: number) => void
  isAdmin?: boolean
  activeTab: TrackCategory
  onTabChange: (tab: TrackCategory) => void
}

export default function TrackPickerModal({
  open,
  onClose,
  selectedTrackIndex,
  onTrackChange,
  isAdmin,
  activeTab,
  onTabChange,
}: TrackPickerModalProps) {
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
    if (!open) stopPreview()
  }, [open, stopPreview])

  function handleSelect(index: number) {
    onTrackChange(index)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} className="w-[28rem]" topAligned>
      <ModalHeader onClose={onClose}>
        <div className="flex gap-1">
          {TRACK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onTabChange(cat.id)}
              className={`text-base font-bold tracking-wider px-3 py-1 rounded transition-colors ${
                activeTab === cat.id
                  ? 'bg-accent/15 text-accent'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-light'
              }`}
            >
              {cat.label.toUpperCase()}
            </button>
          ))}
        </div>
      </ModalHeader>
      <div className="overflow-y-auto py-1">
        <button
          onClick={() => handleSelect(NONE_TRACK_INDEX)}
          className={`w-full text-left px-4 py-2.5 text-base transition-colors ${
            selectedTrackIndex === NONE_TRACK_INDEX
              ? 'bg-accent/15 text-accent'
              : 'text-foreground hover:bg-surface-light'
          }`}
        >
          No track
        </button>
        {AVAILABLE_TRACKS.map((track, i) => {
          if (track.category !== activeTab) return null
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
                onClick={() => handleSelect(i)}
                className={`flex-1 text-left px-4 py-2.5 text-base transition-colors ${
                  selectedTrackIndex === i ? 'text-accent' : 'text-foreground'
                }`}
              >
                <span>{track.label}</span>
                <div className="flex flex-wrap gap-1 mt-1 whitespace-nowrap">
                  {(track.loops?.[0] ? getBpmVariants(track.loops[0]) ?? [track.bpm] : [track.bpm]).map((bpm) => (
                    <span key={bpm} className="inline-block text-xs px-1.5 py-0.5 rounded bg-surface-light border border-border text-foreground-muted">
                      {bpm} BPM
                    </span>
                  ))}
                </div>
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
    </Modal>
  )
}
