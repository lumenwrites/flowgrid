export const BEATS_PER_BAR = 4

// Dark-medium background colors for rhyme word cells — white text on colored bg
// Active state: bright border + dark fill for high-contrast glow effect
export const RHYME_COLORS = [
  { bg: '#991b1b', border: '#b91c1c', bright: '#dc2626', dark: '#450a0a' }, // red
  { bg: '#155e75', border: '#0e7490', bright: '#0891b2', dark: '#083344' }, // cyan
  { bg: '#854d0e', border: '#a16207', bright: '#ca8a04', dark: '#422006' }, // yellow
  { bg: '#3730a3', border: '#4338ca', bright: '#6366f1', dark: '#1e1b4b' }, // indigo
  { bg: '#9d174d', border: '#be185d', bright: '#ec4899', dark: '#500724' }, // pink
  { bg: '#065f46', border: '#047857', bright: '#10b981', dark: '#022c22' }, // emerald
  { bg: '#92400e', border: '#b45309', bright: '#d97706', dark: '#451a03' }, // amber
  { bg: '#5b21b6', border: '#6d28d9', bright: '#8b5cf6', dark: '#2e1065' }, // violet
]

export type Beat = {
  label: string
  bpm: number
  file: string
  bars: number // how many bars the loop contains
}

export const AVAILABLE_BEATS: Beat[] = [
  { label: 'Drums 60', bpm: 60, file: '/beats/drums-loop-60bpm.wav', bars: 1 },
  { label: 'Drums 80', bpm: 80, file: '/beats/drums-loop-80bpm.wav', bars: 1 },
  { label: 'Drums 100', bpm: 100, file: '/beats/drums-loop-100bpm.wav', bars: 1 },
  { label: 'Drums 120', bpm: 120, file: '/beats/drums-loop-120bpm.wav', bars: 1 },
  { label: 'Scene to Rap 100', bpm: 100, file: '/beats/scene-to-rap-loop-100bpm.m4a', bars: 8 },
]

export const METRONOME_FILES: Record<number, string> = {
  60: '/beats/metronome-loop-60bpm.wav',
  80: '/beats/metronome-loop-80bpm.wav',
  100: '/beats/metronome-loop-100bpm.wav',
  120: '/beats/metronome-loop-120bpm.wav',
}

export const NONE_BEAT_INDEX = -1
export const DEFAULT_BEAT_INDEX = 1 // Drums 80
export const DEFAULT_BPM = 80 // Used when no beat is selected

export const INTRO_BAR_OPTIONS = [0, 2, 4, 6, 8]
export const METRONOME_BPM_OPTIONS = [60, 80, 100, 120]

export const DEFAULT_SEED = 42

export const DEFAULT_BAR_COUNT = 0 // 0 = infinite
export const BAR_COUNT_OPTIONS = [0, 8, 16, 24, 32, 48, 64]
export const INFINITE_INITIAL_BARS = 48 // initial bars in infinite mode (fill the screen)
export const INFINITE_EXTEND_CHUNK = 24 // how many more to generate when running low
export const BARS_BUFFER = 16 // extend when fewer than this many bars remain ahead
export const BARS_BEHIND_KEEP = 4

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

export type BarsPerLine = 1 | 2
export const BARS_PER_LINE_OPTIONS: { value: BarsPerLine; label: string }[] = [
  { value: 1, label: '1 bar — Rap' },
  { value: 2, label: '2 bars — Musical' },
]
