'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_TRACKS, METRONOME_FILES, DEFAULT_TRACK_INDEX, DEFAULT_BPM, NONE_TRACK_INDEX, loopUrl } from '@/lib/constants'

function volumeToDb(v: number): number {
  return v === 0 ? -Infinity : 20 * Math.log10(v / 100)
}

function closestVariant(bpm: number, variants: number[]): number {
  let best = variants[0]
  for (const v of variants) {
    if (Math.abs(v - bpm) < Math.abs(best - bpm)) best = v
  }
  return best
}

type PendingTransition = {
  eventId: number
  player: Tone.Player | Tone.GrainPlayer
}

export function useAudioEngine(metronomeEnabled: boolean = false, initialTrackIndex: number = DEFAULT_TRACK_INDEX, metronomeBpm: number = DEFAULT_BPM, trackVolume: number = 100, metronomeVolume: number = 100, trackBpm: number = DEFAULT_BPM) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(initialTrackIndex)
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0)
  const selectedTrackIndexRef = useRef(initialTrackIndex)
  const playerRef = useRef<Tone.Player | Tone.GrainPlayer | null>(null)
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
  const trackBpmRef = useRef(trackBpm)
  trackBpmRef.current = trackBpm
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

  // Live BPM adjustment
  useEffect(() => {
    if (!isLoadedRef.current) return
    if (selectedTrackIndexRef.current === NONE_TRACK_INDEX) return
    const track = AVAILABLE_TRACKS[selectedTrackIndexRef.current]
    if (!track) return

    if (track.bpmVariants) {
      // Variant track: reload with the new audio files
      const wasPlaying = Tone.getTransport().state === 'started'
      loadTrack(selectedTrackIndexRef.current, currentLoopIndexRef.current, trackBpm).then(() => {
        if (wasPlaying) {
          Tone.getTransport().start()
          setIsPlaying(true)
        }
      })
    } else {
      // Non-variant: live GrainPlayer rate adjustment
      const rate = trackBpm / track.bpm
      Tone.getTransport().bpm.value = trackBpm
      if (playerRef.current instanceof Tone.GrainPlayer) {
        playerRef.current.playbackRate = rate
      }
      if (metronomeRef.current) {
        metronomeRef.current.playbackRate = rate
      }
      if (pendingRef.current?.player instanceof Tone.GrainPlayer) {
        pendingRef.current.player.playbackRate = rate
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackBpm])

  function cancelPendingTransition() {
    const pending = pendingRef.current
    if (!pending) return
    Tone.getTransport().clear(pending.eventId)
    pending.player.unsync()
    pending.player.dispose()
    pendingRef.current = null
  }

  const loadTrack = useCallback(async (trackIndex: number, loopIndex: number = 0, bpmOverride?: number) => {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    Tone.getTransport().cancel()

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
    const nativeBpm = track ? track.bpm : metronomeBpmRef.current
    const effectiveBpm = bpmOverride ?? (track ? trackBpmRef.current : metronomeBpmRef.current)
    const hasVariants = !!track?.bpmVariants
    const variantBpm = hasVariants ? closestVariant(effectiveBpm, track!.bpmVariants!) : undefined
    const transportBpm = variantBpm ?? effectiveBpm
    const rate = hasVariants ? 1 : (track ? effectiveBpm / nativeBpm : 1)

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
      const loopBufferPromises = track
        ? track.loops.map(l => loadBuffer(loopUrl(track, l, variantBpm)))
        : []
      const metronomeFile = METRONOME_FILES[variantBpm ?? nativeBpm]
      const metronomePromise = metronomeFile ? createPlayer(metronomeFile, true) : null

      const [loopBuffers, metronome] = await Promise.all([
        Promise.all(loopBufferPromises),
        metronomePromise,
      ])

      buffersRef.current = loopBuffers

      if (track && loopBuffers.length > 0) {
        if (hasVariants) {
          const player = new Tone.Player(loopBuffers[loopIndex]).toDestination()
          player.loop = true
          player.volume.value = volumeToDb(trackVolumeRef.current)
          player.sync().start(0)
          playerRef.current = player
        } else {
          const player = new Tone.GrainPlayer(loopBuffers[loopIndex]).toDestination()
          player.loop = true
          player.grainSize = 0.1
          player.overlap = 0.05
          player.playbackRate = rate
          player.volume.value = volumeToDb(trackVolumeRef.current)
          player.sync().start(0)
          playerRef.current = player
        }
      }

      if (metronome) {
        if (!hasVariants) metronome.playbackRate = rate
        metronome.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolumeRef.current) : -Infinity
        metronome.sync().start(0)
        metronomeRef.current = metronome
      }

      Tone.getTransport().bpm.value = transportBpm
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

    const track = selectedTrackIndexRef.current === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[selectedTrackIndexRef.current]
    let newPlayer: Tone.Player | Tone.GrainPlayer

    if (track?.bpmVariants) {
      const p = new Tone.Player(buffers[loopIndex]).toDestination()
      p.loop = true
      newPlayer = p
    } else {
      const rate = track ? trackBpmRef.current / track.bpm : 1
      const p = new Tone.GrainPlayer(buffers[loopIndex]).toDestination()
      p.loop = true
      p.grainSize = 0.1
      p.overlap = 0.05
      p.playbackRate = rate
      newPlayer = p
    }

    newPlayer.volume.value = volumeToDb(trackVolumeRef.current)
    newPlayer.sync().start(`${atBar}:0:0`)

    const eventId = Tone.getTransport().schedule((time) => {
      if (playerRef.current) {
        playerRef.current.unsync()
        playerRef.current.stop(time)
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
    async (trackIndex: number, customBpm?: number) => {
      const wasPlaying = Tone.getTransport().state === 'started'
      await loadTrack(trackIndex, 0, customBpm)

      if (wasPlaying) {
        Tone.getTransport().start()
        setIsPlaying(true)
      }
    },
    [loadTrack]
  )

  const loadMix = useCallback(async (audioUrl: string) => {
    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
    transport.cancel()

    cancelPendingTransition()

    if (playerRef.current) {
      playerRef.current.unsync()
      playerRef.current.dispose()
      playerRef.current = null
    }

    const track = selectedTrackIndexRef.current === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[selectedTrackIndexRef.current]
    const nativeBpm = track ? track.bpm : metronomeBpmRef.current
    const effectiveBpm = track ? trackBpmRef.current : metronomeBpmRef.current
    const rate = track ? effectiveBpm / nativeBpm : 1

    // Re-sync metronome after cancel cleared its transport events
    if (metronomeRef.current) {
      metronomeRef.current.playbackRate = rate
      metronomeRef.current.unsync()
      metronomeRef.current.sync().start(0)
    }

    transport.bpm.value = effectiveBpm

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

    const metronomeFile = METRONOME_FILES[nativeBpm]
    const [mixBuffer, metronome] = await Promise.all([
      loadBuffer(audioUrl),
      !metronomeRef.current && metronomeFile
        ? createPlayer(metronomeFile, true)
        : null,
    ])

    const player = new Tone.GrainPlayer(mixBuffer).toDestination()
    player.loop = false
    player.grainSize = 0.1
    player.overlap = 0.05
    player.playbackRate = rate
    player.volume.value = volumeToDb(trackVolumeRef.current)
    player.sync().start(0)
    playerRef.current = player
    isLoadedRef.current = true

    if (metronome) {
      metronome.playbackRate = rate
      metronome.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolumeRef.current) : -Infinity
      metronome.sync().start(0)
      metronomeRef.current = metronome
    }

    setIsPlaying(false)
  }, [])

  const setLoopIndex = useCallback((loopIndex: number) => {
    setCurrentLoopIndex(loopIndex)
    currentLoopIndexRef.current = loopIndex
  }, [])

  const stop = useCallback(() => {
    cancelPendingTransition()
    Tone.getTransport().stop()
    Tone.getTransport().position = 0

    // Re-sync player to bar 0 (it may have been synced to a later bar from a loop transition)
    if (playerRef.current) {
      playerRef.current.unsync()
      playerRef.current.sync().start(0)
    }
    if (metronomeRef.current) {
      metronomeRef.current.unsync()
      metronomeRef.current.sync().start(0)
    }

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
    loadMix,
  }
}
