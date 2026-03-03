'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_BEATS, DEFAULT_BPM } from '@/lib/constants'

const DEFAULT_BEAT_INDEX = AVAILABLE_BEATS.findIndex((b) => b.bpm === DEFAULT_BPM)

export function useAudioEngine(metronomeEnabled: boolean = false) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(DEFAULT_BEAT_INDEX)
  const selectedBeatIndexRef = useRef(DEFAULT_BEAT_INDEX)
  const playerRef = useRef<Tone.Player | null>(null)
  const metronomeRef = useRef<Tone.Player | null>(null)
  const isLoadedRef = useRef(false)
  const metronomeEnabledRef = useRef(metronomeEnabled)
  metronomeEnabledRef.current = metronomeEnabled

  // Sync metronome mute state
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.mute = !metronomeEnabled
    }
  }, [metronomeEnabled])

  const loadBeat = useCallback(async (beatIndex: number) => {
    const beat = AVAILABLE_BEATS[beatIndex]
    if (!beat) return

    if (playerRef.current) {
      playerRef.current.stop()
      playerRef.current.dispose()
      playerRef.current = null
    }
    if (metronomeRef.current) {
      metronomeRef.current.stop()
      metronomeRef.current.dispose()
      metronomeRef.current = null
    }

    const metronomeFile = beat.file.replace('drums-loop', 'metronome-loop')

    const player = new Tone.Player({
      url: beat.file,
      loop: true,
      onload: () => {
        isLoadedRef.current = true
      },
    }).toDestination()

    const metronome = new Tone.Player({
      url: metronomeFile,
      loop: true,
    }).toDestination()
    metronome.mute = !metronomeEnabledRef.current

    player.sync().start(0)
    metronome.sync().start(0)
    playerRef.current = player
    metronomeRef.current = metronome
    Tone.getTransport().bpm.value = beat.bpm
    setBpm(beat.bpm)
    setSelectedBeatIndex(beatIndex)
    selectedBeatIndexRef.current = beatIndex
  }, [])

  const waitForLoad = useCallback(() => {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (isLoadedRef.current) resolve()
        else setTimeout(check, 50)
      }
      check()
    })
  }, [])

  const togglePlay = useCallback(async () => {
    await Tone.start()

    if (!isLoadedRef.current && !playerRef.current) {
      await loadBeat(selectedBeatIndexRef.current)
      await waitForLoad()
    }

    const transport = Tone.getTransport()
    if (transport.state === 'started') {
      transport.pause()
      setIsPlaying(false)
    } else {
      transport.start()
      setIsPlaying(true)
    }
  }, [loadBeat, waitForLoad])

  const changeBeat = useCallback(
    async (beatIndex: number) => {
      const wasPlaying = Tone.getTransport().state === 'started'
      if (wasPlaying) {
        Tone.getTransport().stop()
      }

      isLoadedRef.current = false
      await loadBeat(beatIndex)

      if (wasPlaying) {
        await waitForLoad()
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    },
    [loadBeat, waitForLoad]
  )

  const stop = useCallback(() => {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      if (playerRef.current) {
        playerRef.current.dispose()
      }
      if (metronomeRef.current) {
        metronomeRef.current.dispose()
      }
    }
  }, [])

  return {
    isPlaying,
    bpm,
    selectedBeatIndex,
    togglePlay,
    changeBeat,
    stop,
  }
}
