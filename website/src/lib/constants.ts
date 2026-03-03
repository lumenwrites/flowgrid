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

export const AVAILABLE_BEATS = [
  { label: '60 BPM', bpm: 60, file: '/beats/drums-loop-60bpm.wav' },
  { label: '80 BPM', bpm: 80, file: '/beats/drums-loop-80bpm.wav' },
  { label: '100 BPM', bpm: 100, file: '/beats/drums-loop-100bpm.wav' },
  { label: '120 BPM', bpm: 120, file: '/beats/drums-loop-120bpm.wav' },
]

export const DEFAULT_BPM = 80

export const BARS_AHEAD = 16
export const BARS_BUFFER = 8
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
