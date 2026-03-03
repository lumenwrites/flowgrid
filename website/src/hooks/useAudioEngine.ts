'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_BEATS, METRONOME_FILES, DEFAULT_BEAT_INDEX, DEFAULT_BPM, NONE_BEAT_INDEX } from '@/lib/constants'

export function useAudioEngine(metronomeEnabled: boolean = false, initialBeatIndex: number = DEFAULT_BEAT_INDEX, metronomeBpm: number = DEFAULT_BPM, beatVolume: number = 100, metronomeVolume: number = 100, audioOffset: number = 0) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(initialBeatIndex)
  const selectedBeatIndexRef = useRef(initialBeatIndex)
  const playerRef = useRef<Tone.Player | null>(null)
  const metronomeRef = useRef<Tone.Player | null>(null)
  const isLoadedRef = useRef(false)
  const metronomeEnabledRef = useRef(metronomeEnabled)
  metronomeEnabledRef.current = metronomeEnabled
  const metronomeBpmRef = useRef(metronomeBpm)
  metronomeBpmRef.current = metronomeBpm
  const audioOffsetRef = useRef(audioOffset)
  audioOffsetRef.current = audioOffset

  // Sync metronome mute state
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.mute = !metronomeEnabled
    }
  }, [metronomeEnabled])

  // Sync beat volume (0-100 → dB, 0 = -Infinity)
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume.value = beatVolume === 0 ? -Infinity : 20 * Math.log10(beatVolume / 100)
    }
  }, [beatVolume])

  // Sync metronome volume
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = metronomeVolume === 0 ? -Infinity : 20 * Math.log10(metronomeVolume / 100)
    }
  }, [metronomeVolume])

  // Re-sync players when audio offset changes
  useEffect(() => {
    const offsetSec = audioOffset / 1000
    if (playerRef.current) {
      playerRef.current.unsync()
      playerRef.current.sync().start(offsetSec)
    }
    if (metronomeRef.current) {
      metronomeRef.current.unsync()
      metronomeRef.current.sync().start(offsetSec)
    }
  }, [audioOffset])

  // Reload when metronomeBpm changes and beat is None (different metronome file needed)
  useEffect(() => {
    if (!isLoadedRef.current) return
    if (selectedBeatIndexRef.current !== NONE_BEAT_INDEX) return
    const wasPlaying = Tone.getTransport().state === 'started'
    loadBeat(NONE_BEAT_INDEX).then(() => {
      if (wasPlaying) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metronomeBpm])

  const loadBeat = useCallback(async (beatIndex: number) => {
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

    const beat = beatIndex === NONE_BEAT_INDEX ? null : AVAILABLE_BEATS[beatIndex]
    const bpm = beat ? beat.bpm : metronomeBpmRef.current

    // Helper: create a player and return a promise that resolves when loaded
    function createPlayer(url: string, loop: boolean): Promise<Tone.Player> {
      return new Promise((resolve, reject) => {
        const p = new Tone.Player({
          url,
          loop,
          onload: () => resolve(p),
          onerror: (e) => reject(e),
        }).toDestination()
      })
    }

    // Create beat player (if a beat is selected)
    let player: Tone.Player | null = null
    let metronome: Tone.Player | null = null

    try {
      const loadPromises: Promise<Tone.Player>[] = []

      if (beat) {
        loadPromises.push(createPlayer(beat.file, true))
      }

      const metronomeFile = METRONOME_FILES[bpm]
      if (metronomeFile) {
        loadPromises.push(createPlayer(metronomeFile, true))
      }

      const results = await Promise.all(loadPromises)
      let idx = 0
      if (beat) player = results[idx++]
      if (METRONOME_FILES[bpm]) {
        metronome = results[idx]
        metronome.mute = !metronomeEnabledRef.current
      }
    } catch (e) {
      console.error('Failed to load audio:', e)
      return
    }

    // Now sync to transport (offset shifts audio relative to transport timeline)
    const offsetSec = audioOffsetRef.current / 1000
    if (player) {
      player.sync().start(offsetSec)
      playerRef.current = player
    }

    if (metronome) {
      metronome.sync().start(offsetSec)
      metronomeRef.current = metronome
    }

    Tone.getTransport().bpm.value = bpm
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
