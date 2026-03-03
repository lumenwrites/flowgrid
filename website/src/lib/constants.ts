export const BEATS_PER_BAR = 4

// Dark-medium background colors for rhyme word cells — white text on colored bg
export const RHYME_COLORS = [
  { bg: '#991b1b', border: '#b91c1c' }, // red-800
  { bg: '#155e75', border: '#0e7490' }, // cyan-800
  { bg: '#854d0e', border: '#a16207' }, // yellow-800
  { bg: '#3730a3', border: '#4338ca' }, // indigo-800
  { bg: '#9d174d', border: '#be185d' }, // pink-800
  { bg: '#065f46', border: '#047857' }, // emerald-800
  { bg: '#92400e', border: '#b45309' }, // amber-800
  { bg: '#5b21b6', border: '#6d28d9' }, // violet-800
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

export type BarsPerLine = 1 | 2
export const BARS_PER_LINE_OPTIONS: { value: BarsPerLine; label: string }[] = [
  { value: 1, label: '1 bar — Rap' },
  { value: 2, label: '2 bars — Musical' },
]
