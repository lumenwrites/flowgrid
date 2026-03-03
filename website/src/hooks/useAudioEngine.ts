'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_BEATS, METRONOME_FILES, DEFAULT_BEAT_INDEX } from '@/lib/constants'

export function useAudioEngine(metronomeEnabled: boolean = false) {
  const [isPlaying, setIsPlaying] = useState(false)
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

    // Stop and reset transport position (don't cancel — that kills the playhead loop)
    Tone.getTransport().stop()
    Tone.getTransport().position = 0

    if (playerRef.current) {
      playerRef.current.dispose()
      playerRef.current = null
    }
    if (metronomeRef.current) {
      metronomeRef.current.dispose()
      metronomeRef.current = null
    }

    isLoadedRef.current = false

    // Create players
    const player = new Tone.Player({
      url: beat.file,
      loop: true,
    }).toDestination()

    const metronomeFile = METRONOME_FILES[beat.bpm]
    let metronome: Tone.Player | null = null
    if (metronomeFile) {
      metronome = new Tone.Player({
        url: metronomeFile,
        loop: true,
      }).toDestination()
      metronome.mute = !metronomeEnabledRef.current
    }

    // Wait for all buffers to load
    try {
      const loadPromises = [player.loaded]
      if (metronome) loadPromises.push(metronome.loaded)
      await Promise.all(loadPromises)
    } catch (e) {
      console.error('Failed to load audio:', e)
      player.dispose()
      metronome?.dispose()
      return
    }

    // Now sync to transport
    player.sync().start(0)
    playerRef.current = player

    if (metronome) {
      metronome.sync().start(0)
      metronomeRef.current = metronome
    }

    Tone.getTransport().bpm.value = beat.bpm
    isLoadedRef.current = true
    setSelectedBeatIndex(beatIndex)
    selectedBeatIndexRef.current = beatIndex
  }, [])

  const togglePlay = useCallback(async () => {
    await Tone.start()

    if (!isLoadedRef.current) {
      await loadBeat(selectedBeatIndexRef.current)
    }

    const transport = Tone.getTransport()
    if (transport.state === 'started') {
      transport.pause()
      setIsPlaying(false)
    } else {
      transport.start()
      setIsPlaying(true)
    }
  }, [loadBeat])

  const changeBeat = useCallback(
    async (beatIndex: number) => {
      const wasPlaying = Tone.getTransport().state === 'started'
      await loadBeat(beatIndex)

      if (wasPlaying) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    },
    [loadBeat]
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
    selectedBeatIndex,
    togglePlay,
    changeBeat,
    stop,
  }
}
