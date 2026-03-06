'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_TRACKS, METRONOME_FILES, DEFAULT_TRACK_INDEX, DEFAULT_BPM, NONE_TRACK_INDEX } from '@/lib/constants'

function volumeToDb(v: number): number {
  return v === 0 ? -Infinity : 20 * Math.log10(v / 100)
}

type PendingTransition = {
  eventId: number
  player: Tone.Player
}

export function useAudioEngine(metronomeEnabled: boolean = false, initialTrackIndex: number = DEFAULT_TRACK_INDEX, metronomeBpm: number = DEFAULT_BPM, trackVolume: number = 100, metronomeVolume: number = 100) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(initialTrackIndex)
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0)
  const selectedTrackIndexRef = useRef(initialTrackIndex)
  const playerRef = useRef<Tone.Player | null>(null)
  const metronomeRef = useRef<Tone.Player | null>(null)
  const buffersRef = useRef<Tone.ToneAudioBuffer[]>([])
  const pendingRef = useRef<PendingTransition | null>(null)
  const isLoadedRef = useRef(false)
  const metronomeEnabledRef = useRef(metronomeEnabled)
  metronomeEnabledRef.current = metronomeEnabled
  const metronomeBpmRef = useRef(metronomeBpm)
  metronomeBpmRef.current = metronomeBpm
  const trackVolumeRef = useRef(trackVolume)
  trackVolumeRef.current = trackVolume
  const metronomeVolumeRef = useRef(metronomeVolume)
  metronomeVolumeRef.current = metronomeVolume
  const currentLoopIndexRef = useRef(0)

  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = metronomeEnabled ? volumeToDb(metronomeVolumeRef.current) : -Infinity
    }
  }, [metronomeEnabled])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume.value = volumeToDb(trackVolume)
    }
  }, [trackVolume])

  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolume) : -Infinity
    }
  }, [metronomeVolume])

  useEffect(() => {
    if (!isLoadedRef.current) return
    if (selectedTrackIndexRef.current !== NONE_TRACK_INDEX) return
    const wasPlaying = Tone.getTransport().state === 'started'
    loadTrack(NONE_TRACK_INDEX, 0).then(() => {
      if (wasPlaying) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metronomeBpm])

  function cancelPendingTransition() {
    const pending = pendingRef.current
    if (!pending) return
    Tone.getTransport().clear(pending.eventId)
    pending.player.unsync()
    pending.player.dispose()
    pendingRef.current = null
  }

  const loadTrack = useCallback(async (trackIndex: number, loopIndex: number = 0) => {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0

    cancelPendingTransition()

    if (playerRef.current) {
      playerRef.current.unsync()
      playerRef.current.dispose()
      playerRef.current = null
    }
    if (metronomeRef.current) {
      metronomeRef.current.dispose()
      metronomeRef.current = null
    }
    buffersRef.current = []
    isLoadedRef.current = false

    const track = trackIndex === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[trackIndex]
    const bpm = track ? track.bpm : metronomeBpmRef.current

    function loadBuffer(url: string): Promise<Tone.ToneAudioBuffer> {
      return new Promise((resolve, reject) => {
        const buf = new Tone.ToneAudioBuffer(url, () => resolve(buf), (e) => reject(e))
      })
    }

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

    try {
      // Load all loop buffers + the initial player + metronome in parallel
      const loopBufferPromises = track ? track.loops.map(l => loadBuffer(l.file)) : []
      const metronomeFile = METRONOME_FILES[bpm]
      const metronomePromise = metronomeFile ? createPlayer(metronomeFile, true) : null

      const [loopBuffers, metronome] = await Promise.all([
        Promise.all(loopBufferPromises),
        metronomePromise,
      ])

      buffersRef.current = loopBuffers

      // Create the initial loop player
      if (track && loopBuffers.length > 0) {
        const player = new Tone.Player(loopBuffers[loopIndex]).toDestination()
        player.loop = true
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
      setCurrentLoopIndex(loopIndex)
      currentLoopIndexRef.current = loopIndex
    } catch (e) {
      console.error('Failed to load audio:', e)
    }
  }, [])

  const scheduleTransition = useCallback((loopIndex: number, atBar: number) => {
    const buffers = buffersRef.current
    if (!buffers[loopIndex]) return

    cancelPendingTransition()

    const newPlayer = new Tone.Player(buffers[loopIndex]).toDestination()
    newPlayer.loop = true
    newPlayer.volume.value = volumeToDb(trackVolumeRef.current)
    newPlayer.sync().start(`${atBar}:0:0`)

    const eventId = Tone.getTransport().schedule((time) => {
      if (playerRef.current) {
        playerRef.current.unsync()
        playerRef.current.stop()
        playerRef.current.dispose()
      }
      playerRef.current = newPlayer
      pendingRef.current = null

      Tone.getDraw().schedule(() => {
        setCurrentLoopIndex(loopIndex)
        currentLoopIndexRef.current = loopIndex
      }, time)
    }, `${atBar}:0:0`)

    pendingRef.current = { eventId, player: newPlayer }
  }, [])

  const cancelTransition = useCallback(() => {
    cancelPendingTransition()
  }, [])

  const togglePlay = useCallback(async () => {
    await Tone.start()

    if (!isLoadedRef.current) {
      await loadTrack(selectedTrackIndexRef.current, currentLoopIndexRef.current)
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
      await loadTrack(trackIndex, 0)

      if (wasPlaying) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    },
    [loadTrack]
  )

  const setLoopIndex = useCallback((loopIndex: number) => {
    setCurrentLoopIndex(loopIndex)
    currentLoopIndexRef.current = loopIndex
  }, [])

  const stop = useCallback(() => {
    cancelPendingTransition()
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
    currentLoopIndex,
    togglePlay,
    changeTrack,
    stop,
    scheduleTransition,
    cancelTransition,
    setLoopIndex,
  }
}
