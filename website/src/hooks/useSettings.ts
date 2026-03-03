'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_BEAT_INDEX, DEFAULT_BAR_COUNT, type RhymePattern, type BarsPerLine } from '@/lib/constants'

const STORAGE_KEY = 'flowgrid-settings'

export type Settings = {
  metronomeEnabled: boolean
  selectedBeatIndex: number
  selectedListId: string
  barsPerLine: BarsPerLine
  rhymePattern: RhymePattern
  barCount: number
}

const DEFAULTS: Settings = {
  metronomeEnabled: false,
  selectedBeatIndex: DEFAULT_BEAT_INDEX,
  selectedListId: 'elementary',
  barsPerLine: 1,
  rhymePattern: 'AABB',
  barCount: DEFAULT_BAR_COUNT,
}

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS
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
  // Initialize synchronously from localStorage so hooks get correct initial values
  const initializedRef = useRef(false)
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return DEFAULTS
    initializedRef.current = true
    return loadSettings()
  })
  const loaded = initializedRef.current

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
