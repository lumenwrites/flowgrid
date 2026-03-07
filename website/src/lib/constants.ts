export const BEATS_PER_BAR = 4

// Rhyme cell colors — dim = default, active = when playhead is on it
export const RHYME_COLORS = [
  { bg: '#7f1d1d', border: '#991b1b', activeBg: '#991b1b', activeBorder: '#ef4444' }, // red
  { bg: '#164e63', border: '#155e75', activeBg: '#155e75', activeBorder: '#06b6d4' }, // cyan
  { bg: '#713f12', border: '#854d0e', activeBg: '#854d0e', activeBorder: '#eab308' }, // yellow
  { bg: '#312e81', border: '#3730a3', activeBg: '#3730a3', activeBorder: '#6366f1' }, // indigo
  { bg: '#831843', border: '#9d174d', activeBg: '#9d174d', activeBorder: '#ec4899' }, // pink
  { bg: '#064e3b', border: '#065f46', activeBg: '#065f46', activeBorder: '#10b981' }, // emerald
  { bg: '#78350f', border: '#92400e', activeBg: '#92400e', activeBorder: '#f59e0b' }, // amber
  { bg: '#4c1d95', border: '#5b21b6', activeBg: '#5b21b6', activeBorder: '#8b5cf6' }, // violet
]

export type Loop = {
  name: string
  file: string
  bars: number
}

export type Track = {
  label: string
  bpm: number
  loops: Loop[]
}

export const AVAILABLE_TRACKS: Track[] = [
  { label: 'Basic Drums 80bpm', bpm: 80, loops: [
    { name: 'Verse', file: '/tracks/basic-drums-80bpm/verse-4bars.wav', bars: 4 },
    { name: 'Chorus', file: '/tracks/basic-drums-80bpm/chorus-4bars.wav', bars: 4 },
  ]},
  { label: 'Drums 60bpm', bpm: 60, loops: [{ name: 'Loop', file: '/tracks/drums-loop-60bpm.wav', bars: 1 }] },
  { label: 'Drums 80bpm', bpm: 80, loops: [{ name: 'Loop', file: '/tracks/drums-loop-80bpm.wav', bars: 1 }] },
  { label: 'Drums 100bpm', bpm: 100, loops: [{ name: 'Loop', file: '/tracks/drums-loop-100bpm.wav', bars: 1 }] },
  { label: 'Drums 120bpm', bpm: 120, loops: [{ name: 'Loop', file: '/tracks/drums-loop-120bpm.wav', bars: 1 }] },
  { label: 'Scene to Rap 100bpm', bpm: 100, loops: [{ name: 'Loop', file: '/tracks/scene-to-rap-loop-100bpm.m4a', bars: 8 }] },
  { label: 'YCCA 80bpm', bpm: 80, loops: [{ name: 'Loop', file: '/tracks/ycca-80bpm-8bars.m4a', bars: 8 }] },
  { label: 'Freestyle Drums 100bpm', bpm: 100, loops: [{ name: 'Loop', file: '/tracks/freestyle-drums-100bpm-4bars.wav', bars: 4 }] },
]

export const METRONOME_FILES: Record<number, string> = {
  60: '/tracks/metronome-loop-60bpm.wav',
  80: '/tracks/metronome-loop-80bpm.wav',
  100: '/tracks/metronome-loop-100bpm.wav',
  120: '/tracks/metronome-loop-120bpm.wav',
}

export const NONE_TRACK_INDEX = -1
export const DEFAULT_TRACK_INDEX = 0 // Basic Drums 80 (multi-loop)
export const DEFAULT_BPM = 80 // Used when no track is selected

export const INTRO_BAR_OPTIONS = [0, 1, 2, 4, 6, 8]
export const METRONOME_BPM_OPTIONS = [60, 80, 100, 120]

export const DEFAULT_SEED = 42

export const INFINITE_INITIAL_BARS = 48
export const INFINITE_EXTEND_CHUNK = 24
export const BARS_BUFFER = 16

export type RhymePattern = 'AABB' | 'ABAB'
export const RHYME_PATTERNS: { value: RhymePattern; label: string }[] = [
  { value: 'AABB', label: 'AABB — Couplets' },
  { value: 'ABAB', label: 'ABAB — Alternating' },
]

export type FillMode = 'all' | 'setup-punchline' | 'off-the-cliff' | 'all-blanks'
export const FILL_MODES: { value: FillMode; label: string }[] = [
  { value: 'all', label: 'All Rhymes' },
  { value: 'setup-punchline', label: 'Setup Punchline' },
  { value: 'off-the-cliff', label: 'Off the Cliff' },
  { value: 'all-blanks', label: 'All Blanks' },
]

export type SectionStart = { bar: number; loopIndex: number }

export type LoopInfo = {
  sectionStarts: SectionStart[]
  loops: Loop[]
}

export type BarsPerLine = 1 | 2
export const BARS_PER_LINE_OPTIONS: { value: BarsPerLine; label: string }[] = [
  { value: 1, label: '1 bar — Rap' },
  { value: 2, label: '2 bars — Musical' },
]
