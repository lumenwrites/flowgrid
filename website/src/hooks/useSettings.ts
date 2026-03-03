'use client'

import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_BEAT_INDEX, DEFAULT_BAR_COUNT, DEFAULT_BPM, DEFAULT_SEED, type RhymePattern, type BarsPerLine, type FillMode } from '@/lib/constants'

const STORAGE_KEY = 'flowgrid-settings'

export type Settings = {
  metronomeEnabled: boolean
  selectedBeatIndex: number
  selectedListId: string
  barsPerLine: BarsPerLine
  rhymePattern: RhymePattern
  barCount: number
  fillMode: FillMode
  introBars: number
  metronomeBpm: number
  seed: number
  beatVolume: number
  metronomeVolume: number
  audioOffset: number
}

const DEFAULTS: Settings = {
  metronomeEnabled: false,
  selectedBeatIndex: DEFAULT_BEAT_INDEX,
  selectedListId: 'elementary',
  barsPerLine: 1,
  rhymePattern: 'AABB',
  barCount: DEFAULT_BAR_COUNT,
  fillMode: 'all',
  introBars: 0,
  metronomeBpm: DEFAULT_BPM,
  seed: DEFAULT_SEED,
  beatVolume: 100,
  metronomeVolume: 100,
  audioOffset: 0,
}

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULTS
    const parsed = JSON.parse(stored)
    return { ...DEFAULTS, ...parsed }
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
