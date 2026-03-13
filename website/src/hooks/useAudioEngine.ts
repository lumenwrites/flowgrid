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

function getTrackInfo(trackIndex: number) {
  return trackIndex === NONE_TRACK_INDEX ? null : AVAILABLE_TRACKS[trackIndex]
}

function hasVariantFiles(track: ReturnType<typeof getTrackInfo>) {
  return (track?.loops?.[0]?.files.length ?? 0) > 1
}

// Create a synced player from a buffer, configured for the given track type.
function createSyncedPlayer(
  buffer: Tone.ToneAudioBuffer,
  opts: { hasVariants: boolean; rate: number; loop: boolean; volume: number; startBar: string }
): Tone.Player | Tone.GrainPlayer {
  let player: Tone.Player | Tone.GrainPlayer
  if (opts.hasVariants) {
    const p = new Tone.Player(buffer).toDestination()
    p.loop = opts.loop
    player = p
  } else {
    const p = new Tone.GrainPlayer(buffer).toDestination()
    p.loop = opts.loop
    p.grainSize = 0.1
    p.overlap = 0.05
    p.playbackRate = opts.rate
    player = p
  }
  player.volume.value = volumeToDb(opts.volume)
  player.sync().start(opts.startBar)
  return player
}

function loadBuffer(url: string): Promise<Tone.ToneAudioBuffer> {
  return new Promise((resolve, reject) => {
    const buf = new Tone.ToneAudioBuffer(url, () => resolve(buf), (e) => reject(e))
  })
}

function loadPlayer(url: string, loop: boolean): Promise<Tone.Player> {
  return new Promise((resolve, reject) => {
    const p = new Tone.Player({
      url,
      loop,
      onload: () => resolve(p),
      onerror: (e) => reject(e),
    }).toDestination()
  })
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

  // Single source of truth for metronome volume.
  // Sets volume immediately and, if in countdown with metronome off, schedules mute at countdown end.
  // Must be called after transport.cancel() since cancel() clears scheduled events.
  function syncMetronomeState(positionBar: number) {
    const metronome = metronomeRef.current
    if (!metronome) return

    const countdown = countdownBarsRef.current
    const inCountdown = countdown > 0 && positionBar < countdown
    const userWantsMetronome = metronomeEnabledRef.current
    const audibleVolume = volumeToDb(metronomeVolumeRef.current)

    if (userWantsMetronome) {
      metronome.volume.value = audibleVolume
    } else if (inCountdown) {
      // Force metronome on during countdown, schedule mute at end
      metronome.volume.value = audibleVolume
      Tone.getTransport().schedule(() => {
        if (metronomeRef.current && !metronomeEnabledRef.current) {
          metronomeRef.current.volume.value = -Infinity
        }
      }, `${countdown - 1}:3:3`)
    } else {
      metronome.volume.value = -Infinity
    }
  }

  useEffect(() => {
    if (!metronomeRef.current) return
    // When toggling metronome, check if we're in countdown before applying
    const transport = Tone.getTransport()
    const pos = transport.position as string
    const currentBar = parseInt(pos.split(':')[0], 10) || 0
    const countdown = countdownBarsRef.current
    const inCountdown = countdown > 0 && currentBar < countdown

    if (metronomeEnabled || !inCountdown) {
      metronomeRef.current.volume.value = metronomeEnabled ? volumeToDb(metronomeVolumeRef.current) : -Infinity
    }
  }, [metronomeEnabled])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume.value = volumeToDb(trackVolume)
    }
  }, [trackVolume])

  useEffect(() => {
    if (!metronomeRef.current) return
    // Update volume if metronome is audible (user-enabled or forced on during countdown)
    if (metronomeRef.current.volume.value > -Infinity) {
      metronomeRef.current.volume.value = volumeToDb(metronomeVolume)
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

  function cancelPendingTransition() {
    const pending = pendingRef.current
    if (!pending) return
    Tone.getTransport().clear(pending.eventId)
    pending.player.unsync()
    pending.player.dispose()
    pendingRef.current = null
  }

  function getPlaybackRate(track: ReturnType<typeof getTrackInfo>, hasVariants: boolean, effectiveBpm: number) {
    if (hasVariants) return 1
    return track ? effectiveBpm / track.bpm : 1
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

    const track = getTrackInfo(trackIndex)
    const nativeBpm = track ? track.bpm : metronomeBpmRef.current
    const effectiveBpm = bpmOverride ?? (track ? trackBpmRef.current : metronomeBpmRef.current)
    const hasVariants = hasVariantFiles(track)
    const variantBpm = hasVariants ? getFileForBpm(track!.loops![0].files, effectiveBpm).bpm : undefined
    const transportBpm = variantBpm ?? effectiveBpm
    const rate = getPlaybackRate(track, hasVariants, effectiveBpm)

    try {
      const loopBufferPromises = track?.loops
        ? track.loops.map(l => {
            const audioFile = getFileForBpm(l.files, effectiveBpm)
            return loadBuffer(loopFileUrl(track, audioFile))
          })
        : []
      const metronomeFile = METRONOME_FILES[variantBpm ?? nativeBpm]
      const metronomePromise = metronomeFile ? loadPlayer(metronomeFile, true) : null

      const [loopBuffers, metronome] = await Promise.all([
        Promise.all(loopBufferPromises),
        metronomePromise,
      ])

      buffersRef.current = loopBuffers

      const countdown = countdownBarsRef.current
      if (track && loopBuffers.length > 0) {
        playerRef.current = createSyncedPlayer(loopBuffers[loopIndex], {
          hasVariants, rate, loop: true,
          volume: trackVolumeRef.current,
          startBar: `${countdown}:0:0`,
        })
      }

      if (metronome) {
        if (!hasVariants) metronome.playbackRate = rate
        metronome.sync().start(0)
        metronomeRef.current = metronome
        syncMetronomeState(0)
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

    const track = getTrackInfo(selectedTrackIndexRef.current)
    const hasVariants = hasVariantFiles(track)
    const rate = getPlaybackRate(track, hasVariants, trackBpmRef.current)

    const newPlayer = createSyncedPlayer(buffers[loopIndex], {
      hasVariants, rate, loop: true,
      volume: trackVolumeRef.current,
      startBar: `${atBar}:0:0`,
    })

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

    const metronomeFile = METRONOME_FILES[fileBpm]
    const [mixBuffer, metronome] = await Promise.all([
      loadBuffer(audioUrl),
      !metronomeRef.current && metronomeFile
        ? loadPlayer(metronomeFile, true)
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
      metronome.sync().start(0)
      metronomeRef.current = metronome
    }
    syncMetronomeState(0)

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
    transport.cancel()

    const countdown = countdownBarsRef.current
    const startBar = syncStartBar ?? 0
    const playerStartBar = `${Math.max(startBar, countdown)}:0:0`

    if (loopIndex !== undefined && loopIndex !== currentLoopIndexRef.current) {
      const buffers = buffersRef.current
      if (buffers[loopIndex]) {
        if (playerRef.current) {
          playerRef.current.unsync()
          playerRef.current.dispose()
        }

        const track = getTrackInfo(selectedTrackIndexRef.current)
        const hasVariants = hasVariantFiles(track)
        const rate = getPlaybackRate(track, hasVariants, trackBpmRef.current)

        playerRef.current = createSyncedPlayer(buffers[loopIndex], {
          hasVariants, rate, loop: true,
          volume: trackVolumeRef.current,
          startBar: playerStartBar,
        })
        setCurrentLoopIndex(loopIndex)
        currentLoopIndexRef.current = loopIndex
      }
    } else if (playerRef.current) {
      playerRef.current.unsync()
      playerRef.current.sync().start(playerStartBar)
    }

    if (metronomeRef.current) {
      metronomeRef.current.unsync()
      metronomeRef.current.sync().start(0)
    }
    syncMetronomeState(targetBar)

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
    }
    syncMetronomeState(0)

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
