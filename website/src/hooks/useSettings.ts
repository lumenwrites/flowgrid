'use client'

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_TRACK_INDEX, DEFAULT_BPM, DEFAULT_SEED, AVAILABLE_TRACKS, NONE_TRACK_INDEX, type RhymePattern, type FillMode, type TrackCategory } from '@/lib/constants'

const STORAGE_KEY = 'flowgrid-settings'

export type Settings = {
  metronomeEnabled: boolean
  selectedTrackIndex: number
  selectedListId: string
  rhymePattern: RhymePattern
  fillMode: FillMode
  countdownLines: number
  metronomeBpm: number
  seed: number
  trackVolume: number
  metronomeVolume: number
  audioOffset: number
  trackBpm: number
  trackModalTab: TrackCategory
}

const DEFAULTS: Settings = {
  metronomeEnabled: false,
  selectedTrackIndex: DEFAULT_TRACK_INDEX,
  selectedListId: 'elementary',
  rhymePattern: 'AABB',
  fillMode: 'all',
  countdownLines: 0,
  metronomeBpm: DEFAULT_BPM,
  seed: DEFAULT_SEED,
  trackVolume: 100,
  metronomeVolume: 100,
  audioOffset: 0,
  trackBpm: DEFAULT_BPM,
  trackModalTab: 'rap',
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULTS
    const parsed = JSON.parse(stored)
    const settings = { ...DEFAULTS, ...parsed }
    if (!settings.trackBpm || settings.trackBpm < 1) {
      const track = settings.selectedTrackIndex !== NONE_TRACK_INDEX
        ? AVAILABLE_TRACKS[settings.selectedTrackIndex]
        : null
      settings.trackBpm = track ? track.bpm : settings.metronomeBpm
    }
    return settings
  } catch {
    return DEFAULTS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage after mount
  useEffect(() => {
    setSettings(loadSettings())
    setLoaded(true)
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Storage full or unavailable — ignore
    }
  }, [settings, loaded])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  return { settings, update, loaded }
}
