'use client'

import { useEffect, useRef } from 'react'
import * as Tone from 'tone'

// Plays an optional audio file synced to the Tone.js Transport.
// Completely standalone — doesn't touch useAudioEngine.
export function usePresetAudio(audioUrl: string | null) {
  const playerRef = useRef<Tone.Player | null>(null)

  useEffect(() => {
    if (!audioUrl) return

    const player = new Tone.Player({
      url: audioUrl,
      loop: false,
      onload: () => {
        player.sync().start(0)
      },
    }).toDestination()

    playerRef.current = player

    return () => {
      player.dispose()
      playerRef.current = null
    }
  }, [audioUrl])
}
