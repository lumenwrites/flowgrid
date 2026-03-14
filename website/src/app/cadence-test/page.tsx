'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'

// --- Sample definitions ---
const SAMPLES = {
  'da-short': '/audio/scat/da-short-normal-1.mp3',
  'da-short-2': '/audio/scat/da-short-normal-2.mp3',
  'da-short-3': '/audio/scat/da-short-normal-3.mp3',
  'da-med': '/audio/scat/da-medium-normal-1.mp3',
  'da-med-2': '/audio/scat/da-medium-normal-2.mp3',
  'da-long': '/audio/scat/da-long-normal-1.mp3',
  'da-long-quiet': '/audio/scat/da-long-quiet-1.mp3',
  'muh-short': '/audio/scat/muh-short-normal-1.mp3',
  'muh-long': '/audio/scat/muh-long-normal-1.mp3',
} as const

type SampleKey = keyof typeof SAMPLES

// --- Cadence note definition ---
type CadenceNote = {
  sample: SampleKey
  time: string       // Tone.js transport time e.g. "0:0:0", "0:1:2"
  duration?: number  // playback duration in seconds (trim long samples)
  velocity?: number  // 0-1, maps to volume
}

// Time helper: bar:beat:sixteenth
function t(bar: number, beat: number, sixteenth: number = 0): string {
  return `${bar}:${beat}:${sixteenth}`
}

// Pick a random "da-short" variant for natural feel
function daShort(): SampleKey {
  const variants: SampleKey[] = ['da-short', 'da-short-2', 'da-short-3']
  return variants[Math.floor(Math.random() * variants.length)]
}

function daMed(): SampleKey {
  const variants: SampleKey[] = ['da-med', 'da-med-2']
  return variants[Math.floor(Math.random() * variants.length)]
}

// --- Hardcoded cadence patterns ---
// Pattern 1: Classic boom-bap flow (2 bars)
// "da da da-da da / da . da-da daaah"
const PATTERN_BOOM_BAP: CadenceNote[] = [
  // Bar 0: da da da-da da . da-da da
  { sample: daShort(), time: t(0, 0), velocity: 1.0 },          // Beat 1: strong
  { sample: daShort(), time: t(0, 1), velocity: 0.8 },          // Beat 2
  { sample: daShort(), time: t(0, 2, 0), velocity: 0.7 },       // Beat 3 first 8th
  { sample: daShort(), time: t(0, 2, 2), velocity: 0.7 },       // Beat 3 second 8th
  { sample: daMed(), time: t(0, 3), velocity: 0.9 },            // Beat 4

  // Bar 1: da . da-da daaah
  { sample: daShort(), time: t(1, 0), velocity: 1.0 },          // Beat 1: strong
  // Beat 2: rest
  { sample: daShort(), time: t(1, 2, 0), velocity: 0.7 },       // Beat 3 first 8th
  { sample: daShort(), time: t(1, 2, 2), velocity: 0.7 },       // Beat 3 second 8th
  { sample: 'da-long', time: t(1, 3), velocity: 0.9 },          // Beat 4: sustained
]

// Pattern 2: Triplet flow (Migos-style, 2 bars)
// Triplets are 3 notes per beat = each at 0, 1.33, 2.66 sixteenths
// Tone.js: one beat = 4 sixteenths, so triplet = 0, ~1.33, ~2.66
// We'll use "0:0:0", "0:0:1.33", "0:0:2.66" — Tone supports decimal
const PATTERN_TRIPLET: CadenceNote[] = [
  // Bar 0: triplet triplet triplet rest
  { sample: daShort(), time: '0:0:0', velocity: 1.0 },
  { sample: daShort(), time: '0:0:1.33', velocity: 0.6 },
  { sample: daShort(), time: '0:0:2.66', velocity: 0.6 },
  { sample: daShort(), time: '0:1:0', velocity: 0.9 },
  { sample: daShort(), time: '0:1:1.33', velocity: 0.6 },
  { sample: daShort(), time: '0:1:2.66', velocity: 0.6 },
  { sample: daShort(), time: '0:2:0', velocity: 0.9 },
  { sample: daShort(), time: '0:2:1.33', velocity: 0.6 },
  { sample: daShort(), time: '0:2:2.66', velocity: 0.6 },
  // Beat 4: rest or held note
  { sample: 'da-long', time: '0:3:0', velocity: 0.8 },

  // Bar 1: same idea, slight variation
  { sample: daShort(), time: '1:0:0', velocity: 1.0 },
  { sample: daShort(), time: '1:0:1.33', velocity: 0.6 },
  { sample: daShort(), time: '1:0:2.66', velocity: 0.6 },
  { sample: daShort(), time: '1:1:0', velocity: 0.9 },
  { sample: daShort(), time: '1:1:1.33', velocity: 0.6 },
  { sample: daShort(), time: '1:1:2.66', velocity: 0.6 },
  { sample: 'muh-short', time: '1:2:0', velocity: 0.5 },
  { sample: daShort(), time: '1:2:2', velocity: 0.7 },
  { sample: 'da-long', time: '1:3:0', velocity: 0.9 },
]

// Pattern 3: Dense 16th note flow (fast Eminem-style)
const PATTERN_DENSE: CadenceNote[] = [
  // Bar 0: 16th notes on beats 1-2, then 8th notes beats 3-4
  { sample: daShort(), time: t(0, 0, 0), velocity: 1.0 },
  { sample: daShort(), time: t(0, 0, 1), velocity: 0.5 },
  { sample: daShort(), time: t(0, 0, 2), velocity: 0.7 },
  { sample: daShort(), time: t(0, 0, 3), velocity: 0.5 },
  { sample: daShort(), time: t(0, 1, 0), velocity: 0.9 },
  { sample: daShort(), time: t(0, 1, 1), velocity: 0.5 },
  { sample: daShort(), time: t(0, 1, 2), velocity: 0.7 },
  { sample: daShort(), time: t(0, 1, 3), velocity: 0.5 },
  { sample: daMed(), time: t(0, 2, 0), velocity: 0.9 },
  { sample: daShort(), time: t(0, 2, 2), velocity: 0.7 },
  { sample: daMed(), time: t(0, 3, 0), velocity: 0.9 },
  { sample: daShort(), time: t(0, 3, 2), velocity: 0.7 },

  // Bar 1: 8ths with a rest and ending on a long note
  { sample: daShort(), time: t(1, 0, 0), velocity: 1.0 },
  { sample: daShort(), time: t(1, 0, 2), velocity: 0.7 },
  { sample: daShort(), time: t(1, 1, 0), velocity: 0.8 },
  { sample: daShort(), time: t(1, 1, 2), velocity: 0.7 },
  // Beat 3: rest
  { sample: 'muh-short', time: t(1, 2, 2), velocity: 0.4 },
  { sample: 'da-long', time: t(1, 3, 0), velocity: 1.0 },
]

// Pattern 4: Simple / beginner (mostly quarter + 8th notes)
const PATTERN_SIMPLE: CadenceNote[] = [
  { sample: daMed(), time: t(0, 0), velocity: 1.0 },
  { sample: daMed(), time: t(0, 1), velocity: 0.8 },
  { sample: daMed(), time: t(0, 2), velocity: 0.8 },
  { sample: daMed(), time: t(0, 3), velocity: 0.9 },

  { sample: daMed(), time: t(1, 0), velocity: 1.0 },
  { sample: daMed(), time: t(1, 1), velocity: 0.8 },
  { sample: daShort(), time: t(1, 2, 0), velocity: 0.7 },
  { sample: daShort(), time: t(1, 2, 2), velocity: 0.7 },
  { sample: 'da-long', time: t(1, 3), velocity: 0.9 },
]

const PATTERNS: { name: string; notes: CadenceNote[]; bars: number }[] = [
  { name: 'Boom Bap', notes: PATTERN_BOOM_BAP, bars: 2 },
  { name: 'Triplet Flow', notes: PATTERN_TRIPLET, bars: 2 },
  { name: 'Dense 16ths', notes: PATTERN_DENSE, bars: 2 },
  { name: 'Simple', notes: PATTERN_SIMPLE, bars: 2 },
]

const BPM_OPTIONS = [70, 80, 90, 100, 110, 120]

function volumeToDb(v: number): number {
  return v === 0 ? -Infinity : 20 * Math.log10(v)
}

export default function CadenceTestPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(90)
  const [patternIndex, setPatternIndex] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loop, setLoop] = useState(true)

  const playersRef = useRef<Map<string, Tone.Player>>(new Map())
  const scheduledEventsRef = useRef<number[]>([])
  const beatLoopRef = useRef<Tone.Loop | null>(null)

  // Load all samples on mount
  useEffect(() => {
    const players = new Map<string, Tone.Player>()
    let loaded = 0
    const total = Object.keys(SAMPLES).length

    for (const [key, url] of Object.entries(SAMPLES)) {
      const player = new Tone.Player({
        url,
        onload: () => {
          loaded++
          if (loaded === total) setIsLoaded(true)
        },
        onerror: (e) => setLoadError(`Failed to load ${key}: ${e}`),
      }).toDestination()
      players.set(key, player)
    }

    playersRef.current = players

    return () => {
      for (const p of players.values()) p.dispose()
    }
  }, [])

  function schedulePattern(pattern: typeof PATTERNS[number]) {
    const transport = Tone.getTransport()

    // Clear previously scheduled events
    for (const id of scheduledEventsRef.current) transport.clear(id)
    scheduledEventsRef.current = []

    for (const note of pattern.notes) {
      const id = transport.schedule((time) => {
        const player = playersRef.current.get(note.sample)
        if (!player || !player.loaded) return

        const vol = volumeToDb(note.velocity ?? 1)
        player.volume.value = vol

        // For long samples, we could stop after duration
        // For now, just trigger — the samples are short enough
        player.start(time)
      }, note.time)
      scheduledEventsRef.current.push(id)
    }
  }

  const handlePlay = useCallback(async () => {
    await Tone.start()
    const transport = Tone.getTransport()

    if (isPlaying) {
      transport.stop()
      transport.position = 0
      transport.cancel()
      if (beatLoopRef.current) {
        beatLoopRef.current.dispose()
        beatLoopRef.current = null
      }
      setIsPlaying(false)
      setCurrentBeat(-1)
      return
    }

    const pattern = PATTERNS[patternIndex]
    transport.bpm.value = bpm
    transport.position = 0
    transport.cancel()
    transport.loop = loop
    transport.loopStart = 0
    transport.loopEnd = `${pattern.bars}:0:0`

    schedulePattern(pattern)

    // Beat tracker for visual feedback
    const beatLoop = new Tone.Loop((time) => {
      Tone.getDraw().schedule(() => {
        const pos = transport.position as string
        const parts = pos.split(':')
        const bar = parseInt(parts[0], 10)
        const beat = parseInt(parts[1], 10)
        setCurrentBeat(bar * 4 + beat)
      }, time)
    }, '4n')
    beatLoop.start(0)
    beatLoopRef.current = beatLoop

    transport.start()
    setIsPlaying(true)
  }, [isPlaying, bpm, patternIndex, loop])

  const handlePatternChange = useCallback((index: number) => {
    if (isPlaying) {
      const transport = Tone.getTransport()
      transport.stop()
      transport.position = 0
      transport.cancel()
      if (beatLoopRef.current) {
        beatLoopRef.current.dispose()
        beatLoopRef.current = null
      }
      setIsPlaying(false)
      setCurrentBeat(-1)
    }
    setPatternIndex(index)
  }, [isPlaying])

  const pattern = PATTERNS[patternIndex]

  // Build a visual grid representation of the pattern
  function buildGrid(p: typeof PATTERNS[number]) {
    const grid: { active: boolean; velocity: number; label: string }[][] = []
    for (let bar = 0; bar < p.bars; bar++) {
      const beats: { active: boolean; velocity: number; label: string }[] = []
      for (let beat = 0; beat < 4; beat++) {
        // Check if any notes fall on this beat (any sixteenth within beat)
        const notesOnBeat = p.notes.filter(n => {
          const parts = n.time.split(':')
          const b = parseInt(parts[0], 10)
          const bt = parseInt(parts[1], 10)
          return b === bar && bt === beat
        })
        if (notesOnBeat.length === 0) {
          beats.push({ active: false, velocity: 0, label: '.' })
        } else if (notesOnBeat.length === 1) {
          const n = notesOnBeat[0]
          const sub = n.time.split(':')[2]
          const isOnBeat = sub === '0' || sub === undefined
          beats.push({
            active: true,
            velocity: n.velocity ?? 1,
            label: isOnBeat ? n.sample.replace(/-\d$/, '') : `${n.sample.replace(/-\d$/, '')}+`,
          })
        } else {
          const maxVel = Math.max(...notesOnBeat.map(n => n.velocity ?? 1))
          beats.push({
            active: true,
            velocity: maxVel,
            label: `${notesOnBeat.length}×`,
          })
        }
      }
      grid.push(beats)
    }
    return grid
  }

  const grid = buildGrid(pattern)

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mt-0">Cadence Prototype</h1>
        <p className="text-foreground-muted mt-2">
          Testing scat samples with Tone.js. Pick a pattern, set BPM, hit play.
        </p>

        {loadError && (
          <div className="bg-red-900/50 text-red-300 p-3 rounded mt-4">{loadError}</div>
        )}

        {/* Pattern selector */}
        <div className="mt-6">
          <label className="text-sm text-foreground-muted">Pattern</label>
          <div className="flex gap-2 mt-2">
            {PATTERNS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => handlePatternChange(i)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  i === patternIndex
                    ? 'bg-accent text-white'
                    : 'bg-surface-light text-foreground-muted hover:text-foreground'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* BPM selector */}
        <div className="mt-4">
          <label className="text-sm text-foreground-muted">BPM</label>
          <div className="flex gap-2 mt-2">
            {BPM_OPTIONS.map(b => (
              <button
                key={b}
                onClick={() => {
                  setBpm(b)
                  if (isPlaying) Tone.getTransport().bpm.value = b
                }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  b === bpm
                    ? 'bg-accent text-white'
                    : 'bg-surface-light text-foreground-muted hover:text-foreground'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Loop toggle */}
        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-foreground-muted">Loop</label>
          <button
            onClick={() => setLoop(v => !v)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              loop ? 'bg-accent text-white' : 'bg-surface-light text-foreground-muted'
            }`}
          >
            {loop ? 'On' : 'Off'}
          </button>
        </div>

        {/* Visual grid */}
        <div className="mt-6">
          <label className="text-sm text-foreground-muted">Grid</label>
          <div className="mt-2 space-y-1">
            {grid.map((bar, barIdx) => (
              <div key={barIdx} className="flex gap-1">
                <span className="text-foreground-muted text-xs w-8 pt-2 text-right mr-1">
                  {barIdx + 1}
                </span>
                {bar.map((cell, beatIdx) => {
                  const globalBeat = barIdx * 4 + beatIdx
                  const isActive = isPlaying && currentBeat === globalBeat
                  return (
                    <div
                      key={beatIdx}
                      className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-mono transition-colors ${
                        cell.active
                          ? isActive
                            ? 'bg-accent text-white'
                            : 'bg-surface-light text-foreground'
                          : isActive
                            ? 'bg-accent/30 text-foreground-muted'
                            : 'bg-surface text-foreground-muted/40'
                      }`}
                      style={cell.active ? { opacity: 0.4 + cell.velocity * 0.6 } : undefined}
                    >
                      {cell.active ? cell.label : '.'}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Play button */}
        <div className="mt-6">
          <button
            onClick={handlePlay}
            disabled={!isLoaded}
            className={`px-8 py-3 rounded-lg text-lg font-bold transition-colors ${
              !isLoaded
                ? 'bg-surface-light text-foreground-muted cursor-not-allowed'
                : isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-accent hover:bg-accent-hover text-white'
            }`}
          >
            {!isLoaded ? 'Loading samples...' : isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>

        {/* Debug info */}
        <div className="mt-8 text-xs text-foreground-muted/60">
          <p>Samples loaded: {isLoaded ? 'Yes' : 'Loading...'}</p>
          <p>Notes in pattern: {pattern.notes.length}</p>
          <p>Pattern bars: {pattern.bars}</p>
          <p>Transport BPM: {bpm}</p>
        </div>
      </div>
    </div>
  )
}
