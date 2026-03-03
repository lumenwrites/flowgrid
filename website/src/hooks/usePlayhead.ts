'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as Tone from 'tone'
import { BEATS_PER_BAR } from '@/lib/constants'

export type PlayheadPosition = {
  bar: number
  beat: number
  globalBeat: number
}

export function usePlayhead(isPlaying: boolean) {
  const [position, setPosition] = useState<PlayheadPosition>({
    bar: 0,
    beat: 0,
    globalBeat: 0,
  })
  const progressRef = useRef(0)
  const playheadLineRef = useRef<HTMLDivElement | null>(null)
  const timelineLineRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

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
  useEffect(() => {
    const loop = new Tone.Loop((time) => {
      const transport = Tone.getTransport()
      const parts = transport.position.toString().split(':')
      const bars = parseInt(parts[0], 10)
      const beats = parseInt(parts[1], 10)
      const globalBeat = bars * BEATS_PER_BAR + beats

      Tone.getDraw().schedule(() => {
        setPosition({ bar: bars, beat: beats, globalBeat })
      }, time)
    }, '4n')

    loop.start(0)

    return () => {
      loop.stop()
      loop.dispose()
    }
  }, [])

  // Smooth playhead line via RAF — directly mutates DOM for performance
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
        const parts = transport.position.toString().split(':')
        const beats = parseInt(parts[1], 10)
        const sixteenths = parseFloat(parts[2])
        const p = (beats + sixteenths / 4) / BEATS_PER_BAR
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
  }, [isPlaying])

  return { position, progressRef, playheadLineRef, timelineLineRef, resetPosition }
}
