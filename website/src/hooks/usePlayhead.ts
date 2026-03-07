'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as Tone from 'tone'
import { BEATS_PER_BAR } from '@/lib/constants'

export type PlayheadPosition = {
  bar: number
  beat: number
  globalBeat: number
}

export function usePlayhead(isPlaying: boolean, barsPerLine: number = 1, audioOffsetMs: number = 0) {
  const [position, setPosition] = useState<PlayheadPosition>({
    bar: 0,
    beat: 0,
    globalBeat: 0,
  })
  const progressRef = useRef(0)
  const playheadLineRef = useRef<HTMLDivElement | null>(null)
  const timelineLineRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const audioOffsetRef = useRef(audioOffsetMs)
  audioOffsetRef.current = audioOffsetMs
  // Set to the next row's first bar index when ~300ms remain, used to trigger scroll
  const [scrollToBar, setScrollToBar] = useState(-1)
  const lastScrollRowRef = useRef(-1)
  // After a manual seek, skip RAF position updates briefly so the transport can stabilize
  const seekGuardUntilRef = useRef(0)

  const resetPosition = useCallback(() => {
    setPosition({ bar: 0, beat: 0, globalBeat: 0 })
    progressRef.current = 0
    lastScrollRowRef.current = -1
    setScrollToBar(-1)
    if (playheadLineRef.current) {
      playheadLineRef.current.style.left = '0%'
    }
    if (timelineLineRef.current) {
      timelineLineRef.current.style.left = '0%'
    }
  }, [])

  const seekTo = useCallback((bar: number, beat: number = 0) => {
    seekGuardUntilRef.current = performance.now() + 80
    setPosition({ bar, beat, globalBeat: bar * BEATS_PER_BAR + beat })
    const barInRow = bar % barsPerLine
    const totalBeats = barsPerLine * BEATS_PER_BAR
    const p = (barInRow * BEATS_PER_BAR + beat) / totalBeats
    progressRef.current = p
    lastScrollRowRef.current = Math.floor(bar / barsPerLine) - 1
    setScrollToBar(-1)
    const pct = `${p * 100}%`
    if (playheadLineRef.current) playheadLineRef.current.style.left = pct
    if (timelineLineRef.current) timelineLineRef.current.style.left = pct
  }, [barsPerLine])

  // Unified RAF loop: drives both the smooth playhead line AND beat-level position.
  // Both are derived from the same transport.seconds read on the same frame,
  // so beat cell highlights are perfectly in sync with the playhead.
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    let lastGlobalBeat = -1

    const update = () => {
      const transport = Tone.getTransport()
      if (transport.state === 'started') {
        const offsetSec = audioOffsetRef.current / 1000
        const bpm = transport.bpm.value
        const beatsPerSec = bpm / 60
        const transportSeconds = Math.max(0, transport.seconds - offsetSec)
        const totalBeatsElapsed = transportSeconds * beatsPerSec
        const currentBar = Math.floor(totalBeatsElapsed / BEATS_PER_BAR)
        const beatInBar = totalBeatsElapsed - currentBar * BEATS_PER_BAR

        // Beat cell highlight — only triggers React render when beat changes
        const currentBeat = Math.floor(beatInBar)
        const globalBeat = currentBar * BEATS_PER_BAR + currentBeat
        if (globalBeat !== lastGlobalBeat) {
          lastGlobalBeat = globalBeat
          if (performance.now() >= seekGuardUntilRef.current) {
            setPosition({ bar: currentBar, beat: currentBeat, globalBeat })
          }
        }

        // Smooth playhead line — direct DOM mutation for performance
        const barInRow = currentBar % barsPerLine
        const totalBeats = barsPerLine * BEATS_PER_BAR
        const p = (barInRow * BEATS_PER_BAR + beatInBar) / totalBeats
        const clamped = Math.min(1, Math.max(0, p))
        progressRef.current = clamped

        const pct = `${clamped * 100}%`
        if (playheadLineRef.current) {
          playheadLineRef.current.style.left = pct
        }
        if (timelineLineRef.current) {
          timelineLineRef.current.style.left = pct
        }

        // Fire scroll when playhead reaches ~97% through the row
        const currentRow = Math.floor(currentBar / barsPerLine)
        if (clamped >= 0.97 && currentRow !== lastScrollRowRef.current) {
          lastScrollRowRef.current = currentRow
          setScrollToBar((currentRow + 1) * barsPerLine)
        }
      }
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlaying, barsPerLine])

  return { position, progressRef, playheadLineRef, timelineLineRef, resetPosition, seekTo, scrollToBar }
}
