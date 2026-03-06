'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_TRACKS, METRONOME_FILES, DEFAULT_TRACK_INDEX, DEFAULT_BPM, NONE_TRACK_INDEX } from '@/lib/constants'

function volumeToDb(v: number): number {
  return v === 0 ? -Infinity : 20 * Math.log10(v / 100)
}

export function useAudioEngine(metronomeEnabled: boolean = false, initialTrackIndex: number = DEFAULT_TRACK_INDEX, metronomeBpm: number = DEFAULT_BPM, trackVolume: number = 100, metronomeVolume: number = 100) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(initialTrackIndex)
  const selectedTrackIndexRef = useRef(initialTrackIndex)
  const playerRef = useRef<Tone.Player | null>(null)
  const metronomeRef = useRef<Tone.Player | null>(null)
  const isLoadedRef = useRef(false)
  const metronomeEnabledRef = useRef(metronomeEnabled)
  metronomeEnabledRef.current = metronomeEnabled
  const metronomeBpmRef = useRef(metronomeBpm)
  metronomeBpmRef.current = metronomeBpm
  const trackVolumeRef = useRef(trackVolume)
  trackVolumeRef.current = trackVolume
  const metronomeVolumeRef = useRef(metronomeVolume)
  metronomeVolumeRef.current = metronomeVolume

  // Sync metronome mute state — apply volume or silence
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = metronomeEnabled ? volumeToDb(metronomeVolumeRef.current) : -Infinity
    }
  }, [metronomeEnabled])

  // Sync track volume (0-100 → dB, 0 = -Infinity)
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume.value = volumeToDb(trackVolume)
    }
  }, [trackVolume])

  // Sync metronome volume
  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolume) : -Infinity
    }
  }, [metronomeVolume])

  // Reload when metronomeBpm changes and track is None (different metronome file needed)
  useEffect(() => {
    if (!isLoadedRef.current) return
    if (selectedTrackIndexRef.current !== NONE_TRACK_INDEX) return
    const wasPlaying = Tone.getTransport().state === 'started'
    loadTrack(NONE_TRACK_INDEX).then(() => {
      if (wasPlaying) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metronomeBpm])

  const loadTrack = useCallback(async (trackIndex: number) => {
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

    const track = trackIndex === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[trackIndex]
    const bpm = track ? track.bpm : metronomeBpmRef.current

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

    // Create track player (if a track is selected)
    let player: Tone.Player | null = null
    let metronome: Tone.Player | null = null

    try {
      const loadPromises: Promise<Tone.Player>[] = []

      if (track) {
        loadPromises.push(createPlayer(track.file, true))
      }

      const metronomeFile = METRONOME_FILES[bpm]
      if (metronomeFile) {
        loadPromises.push(createPlayer(metronomeFile, true))
      }

      const results = await Promise.all(loadPromises)
      let idx = 0
      if (track) player = results[idx++]
      if (METRONOME_FILES[bpm]) {
        metronome = results[idx]
      }
    } catch (e) {
      console.error('Failed to load audio:', e)
      return
    }

    // Apply current volume and sync to transport
    if (player) {
      player.volume.value = volumeToDb(trackVolumeRef.current)
      player.sync().start(0)
      playerRef.current = player
    }

    if (metronome) {
      metronome.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolumeRef.current) : -Infinity
      metronome.sync().start(0)
      metronomeRef.current = metronome
    }

    Tone.getTransport().bpm.value = bpm
    isLoadedRef.current = true
    setSelectedTrackIndex(trackIndex)
    selectedTrackIndexRef.current = trackIndex
  }, [])

  const togglePlay = useCallback(async () => {
    await Tone.start()

    if (!isLoadedRef.current) {
      await loadTrack(selectedTrackIndexRef.current)
    }

    const transport = Tone.getTransport()
    if (transport.state === 'started') {
      transport.pause()
      setIsPlaying(false)
    } else {
      transport.start()
      setIsPlaying(true)
    }
  }, [loadTrack])

  const changeTrack = useCallback(
    async (trackIndex: number) => {
      const wasPlaying = Tone.getTransport().state === 'started'
      await loadTrack(trackIndex)

      if (wasPlaying) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    },
    [loadTrack]
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
    selectedTrackIndex,
    togglePlay,
    changeTrack,
    stop,
  }
}
