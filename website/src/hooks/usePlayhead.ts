'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as Tone from 'tone'
import { BEATS_PER_BAR } from '@/lib/constants'

function parseTransportPosition(transport: ReturnType<typeof Tone.getTransport>) {
  const parts = transport.position.toString().split(':')
  return {
    bar: parseInt(parts[0], 10),
    beat: parseInt(parts[1], 10),
    sixteenths: parseFloat(parts[2]),
  }
}

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

  const resetPosition = useCallback(() => {
    setPosition({ bar: 0, beat: 0, globalBeat: 0 })
    progressRef.current = 0
    if (playheadLineRef.current) {
      playheadLineRef.current.style.left = '0%'
    }
    if (timelineLineRef.current) {
      timelineLineRef.current.style.left = '0%'
    }
  }, [])

  // Beat-level position updates via Tone.Loop
  // Offset is applied here so bar/beat tracking matches the delayed visuals
  useEffect(() => {
    const loop = new Tone.Loop((time) => {
      const transport = Tone.getTransport()
      const offsetSec = audioOffsetRef.current / 1000
      // Delay the scheduled draw callback by the offset amount
      const drawTime = time + offsetSec

      const { bar, beat } = parseTransportPosition(transport)
      const globalBeat = bar * BEATS_PER_BAR + beat

      Tone.getDraw().schedule(() => {
        setPosition({ bar, beat, globalBeat })
      }, drawTime)
    }, '4n')

    loop.start(0)

    return () => {
      loop.stop()
      loop.dispose()
    }
  }, [])

  // Smooth playhead line via RAF — directly mutates DOM for performance
  // Offset delays the visual position to match late-arriving Bluetooth audio
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const update = () => {
      const transport = Tone.getTransport()
      if (transport.state === 'started') {
        // Subtract offset from transport seconds to get the delayed visual position
        const offsetSec = audioOffsetRef.current / 1000
        const bpm = transport.bpm.value
        const beatsPerSec = bpm / 60
        const transportSeconds = Math.max(0, transport.seconds - offsetSec)
        const totalBeatsElapsed = transportSeconds * beatsPerSec
        const currentBar = Math.floor(totalBeatsElapsed / BEATS_PER_BAR)
        const beatInBar = totalBeatsElapsed - currentBar * BEATS_PER_BAR

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

  return { position, progressRef, playheadLineRef, timelineLineRef, resetPosition }
}
