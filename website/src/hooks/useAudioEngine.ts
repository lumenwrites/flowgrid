'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import * as Tone from 'tone'
import { AVAILABLE_TRACKS, METRONOME_FILES, DEFAULT_TRACK_INDEX, DEFAULT_BPM, NONE_TRACK_INDEX, getFileForBpm, loopFileUrl } from '@/lib/constants'

function volumeToDb(v: number): number {
  return v === 0 ? -Infinity : 20 * Math.log10(v / 100)
}

type PendingTransition = {
  eventId: number
  player: Tone.Player | Tone.GrainPlayer
}

export function useAudioEngine(metronomeEnabled: boolean = false, initialTrackIndex: number = DEFAULT_TRACK_INDEX, metronomeBpm: number = DEFAULT_BPM, trackVolume: number = 100, metronomeVolume: number = 100, trackBpm: number = DEFAULT_BPM, countdownBars: number = 0) {
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
  const countdownBarsRef = useRef(countdownBars)
  countdownBarsRef.current = countdownBars
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

  // Metronome-only BPM change (no track selected)
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

  // If countdown > 0 and metronome is off, unmute it and schedule re-mute at countdown end.
  // Safe to call multiple times — Transport.cancel() in loadTrack/loadMix clears prior schedules.
  function forceMetronomeDuringCountdown(metronome: Tone.Player, countdown: number) {
    if (countdown > 0 && !metronomeEnabledRef.current) {
      metronome.volume.value = volumeToDb(metronomeVolumeRef.current)
      Tone.getTransport().schedule(() => {
        if (metronomeRef.current && !metronomeEnabledRef.current) {
          metronomeRef.current.volume.value = -Infinity
        }
      }, `${countdown}:0:0`)
    }
  }

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
    const hasVariants = (track?.loops?.[0]?.files.length ?? 0) > 1
    const variantBpm = hasVariants ? getFileForBpm(track!.loops![0].files, effectiveBpm).bpm : undefined
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
      const loopBufferPromises = track?.loops
        ? track.loops.map(l => {
            const audioFile = getFileForBpm(l.files, effectiveBpm)
            return loadBuffer(loopFileUrl(track, audioFile))
          })
        : []
      const metronomeFile = METRONOME_FILES[variantBpm ?? nativeBpm]
      const metronomePromise = metronomeFile ? createPlayer(metronomeFile, true) : null

      const [loopBuffers, metronome] = await Promise.all([
        Promise.all(loopBufferPromises),
        metronomePromise,
      ])

      buffersRef.current = loopBuffers

      const countdown = countdownBarsRef.current
      if (track && loopBuffers.length > 0) {
        if (hasVariants) {
          const player = new Tone.Player(loopBuffers[loopIndex]).toDestination()
          player.loop = true
          player.volume.value = volumeToDb(trackVolumeRef.current)
          player.sync().start(`${countdown}:0:0`)
          playerRef.current = player
        } else {
          const player = new Tone.GrainPlayer(loopBuffers[loopIndex]).toDestination()
          player.loop = true
          player.grainSize = 0.1
          player.overlap = 0.05
          player.playbackRate = rate
          player.volume.value = volumeToDb(trackVolumeRef.current)
          player.sync().start(`${countdown}:0:0`)
          playerRef.current = player
        }
      }

      if (metronome) {
        if (!hasVariants) metronome.playbackRate = rate
        metronome.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolumeRef.current) : -Infinity
        metronome.sync().start(0)
        metronomeRef.current = metronome
        forceMetronomeDuringCountdown(metronome, countdown)
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
    const hasVariants = (track?.loops?.[0]?.files.length ?? 0) > 1
    let newPlayer: Tone.Player | Tone.GrainPlayer

    if (hasVariants) {
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

  const play = useCallback(async () => {
    await Tone.start()
    if (!isLoadedRef.current) {
      await loadTrack(selectedTrackIndexRef.current, currentLoopIndexRef.current)
    }
    Tone.getTransport().start()
    setIsPlaying(true)
  }, [loadTrack])

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

  // Load a mix file. Always plays at rate 1 at the file's native BPM.
  // Caller is responsible for picking the right file for the current BPM.
  const loadMix = useCallback(async (audioUrl: string, fileBpm: number) => {
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

    transport.bpm.value = fileBpm

    if (metronomeRef.current) {
      metronomeRef.current.playbackRate = 1
      metronomeRef.current.unsync()
      metronomeRef.current.sync().start(0)
    }

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

    const metronomeFile = METRONOME_FILES[fileBpm]
    const [mixBuffer, metronome] = await Promise.all([
      loadBuffer(audioUrl),
      !metronomeRef.current && metronomeFile
        ? createPlayer(metronomeFile, true)
        : null,
    ])

    const countdown = countdownBarsRef.current
    const player = new Tone.GrainPlayer(mixBuffer).toDestination()
    player.loop = false
    player.grainSize = 0.1
    player.overlap = 0.05
    player.playbackRate = 1
    player.volume.value = volumeToDb(trackVolumeRef.current)
    player.sync().start(`${countdown}:0:0`)
    playerRef.current = player
    isLoadedRef.current = true

    if (metronome) {
      metronome.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolumeRef.current) : -Infinity
      metronome.sync().start(0)
      metronomeRef.current = metronome
      forceMetronomeDuringCountdown(metronome, countdown)
    } else if (metronomeRef.current) {
      forceMetronomeDuringCountdown(metronomeRef.current, countdown)
    }

    setIsPlaying(false)
  }, [])

  // Live BPM adjustment for non-variant (GrainPlayer) playback.
  // Called imperatively from page.tsx — no effect needed.
  const adjustBpm = useCallback((newBpm: number, nativeBpm: number) => {
    const rate = newBpm / nativeBpm
    Tone.getTransport().bpm.value = newBpm
    if (playerRef.current instanceof Tone.GrainPlayer) {
      playerRef.current.playbackRate = rate
    }
    if (metronomeRef.current) {
      metronomeRef.current.playbackRate = rate
    }
    if (pendingRef.current?.player instanceof Tone.GrainPlayer) {
      pendingRef.current.player.playbackRate = rate
    }
  }, [])

  const setLoopIndex = useCallback((loopIndex: number) => {
    setCurrentLoopIndex(loopIndex)
    currentLoopIndexRef.current = loopIndex
  }, [])

  const seekToBar = useCallback((targetBar: number, beat: number = 0, loopIndex?: number, syncStartBar?: number) => {
    if (!isLoadedRef.current) return

    const transport = Tone.getTransport()
    const wasPlaying = transport.state === 'started'
    transport.pause()
    cancelPendingTransition()

    if (loopIndex !== undefined && loopIndex !== currentLoopIndexRef.current) {
      const buffers = buffersRef.current
      if (buffers[loopIndex]) {
        if (playerRef.current) {
          playerRef.current.unsync()
          playerRef.current.dispose()
        }

        const track = selectedTrackIndexRef.current === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[selectedTrackIndexRef.current]
        const hasVariants = (track?.loops?.[0]?.files.length ?? 0) > 1
        let newPlayer: Tone.Player | Tone.GrainPlayer

        if (hasVariants) {
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
        playerRef.current = newPlayer
        setCurrentLoopIndex(loopIndex)
        currentLoopIndexRef.current = loopIndex
      }
    }

    const countdown = countdownBarsRef.current
    const startBar = syncStartBar ?? 0
    // Only sync player to start if we're past countdown
    if (playerRef.current) {
      playerRef.current.unsync()
      const playerStartBar = Math.max(startBar, countdown)
      playerRef.current.sync().start(`${playerStartBar}:0:0`)
    }
    if (metronomeRef.current) {
      metronomeRef.current.unsync()
      metronomeRef.current.sync().start(0)
    }

    transport.position = `${targetBar}:${beat}:0`
    if (wasPlaying) transport.start()
  }, [])

  const stop = useCallback(() => {
    cancelPendingTransition()
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    Tone.getTransport().cancel()

    const countdown = countdownBarsRef.current
    if (playerRef.current) {
      playerRef.current.unsync()
      playerRef.current.sync().start(`${countdown}:0:0`)
    }
    if (metronomeRef.current) {
      metronomeRef.current.unsync()
      metronomeRef.current.sync().start(0)
      // Restore user's metronome setting (cancel() cleared any prior countdown schedule)
      metronomeRef.current.volume.value = metronomeEnabledRef.current ? volumeToDb(metronomeVolumeRef.current) : -Infinity
      forceMetronomeDuringCountdown(metronomeRef.current, countdown)
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

  const updateTrackIndex = useCallback((index: number) => {
    setSelectedTrackIndex(index)
    selectedTrackIndexRef.current = index
  }, [])

  return {
    isPlaying,
    selectedTrackIndex,
    currentLoopIndex,
    play,
    togglePlay,
    changeTrack,
    stop,
    seekToBar,
    scheduleTransition,
    cancelTransition,
    setLoopIndex,
    loadMix,
    adjustBpm,
    updateTrackIndex,
  }
}
