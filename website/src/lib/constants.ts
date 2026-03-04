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

export type Beat = {
  label: string
  bpm: number
  file: string
  bars: number // how many bars the loop contains
}

export const AVAILABLE_BEATS: Beat[] = [
  { label: 'Drums 60bpm', bpm: 60,  bars: 1, file: '/loops/drums-loop-60bpm.wav', },
  { label: 'Drums 80bpm', bpm: 80, bars: 1, file: '/loops/drums-loop-80bpm.wav', },
  { label: 'Drums 100bpm', bpm: 100, bars: 1, file: '/loops/drums-loop-100bpm.wav', },
  { label: 'Drums 120bpm', bpm: 120, bars: 1, file: '/loops/drums-loop-120bpm.wav', },
  { label: 'Scene to Rap 100bpm', bpm: 100, bars: 8, file: '/loops/scene-to-rap-loop-100bpm.m4a', },
  { label: 'YCCA 80bpm', bpm: 80, bars: 8, file: '/loops/ycca-80bpm-8bars.m4a', },
  { label: 'Freestyle Drums 100bpm', bpm: 100, bars: 4, file: '/loops/freestyle-drums-100bpm-4bars.wav', },
]

export const METRONOME_FILES: Record<number, string> = {
  60: '/loops/metronome-loop-60bpm.wav',
  80: '/loops/metronome-loop-80bpm.wav',
  100: '/loops/metronome-loop-100bpm.wav',
  120: '/loops/metronome-loop-120bpm.wav',
}

export const NONE_BEAT_INDEX = -1
export const DEFAULT_BEAT_INDEX = 1 // Drums 80
export const DEFAULT_BPM = 80 // Used when no beat is selected

export const INTRO_BAR_OPTIONS = [0, 1, 2, 4, 6, 8]
export const METRONOME_BPM_OPTIONS = [60, 80, 100, 120]

export const DEFAULT_SEED = 42

export const DEFAULT_BAR_COUNT = 0 // 0 = infinite
export const BAR_COUNT_OPTIONS = [0, 8, 16, 24, 32, 48, 64]
export const INFINITE_INITIAL_BARS = 48 // initial bars in infinite mode (fill the screen)
export const INFINITE_EXTEND_CHUNK = 24 // how many more to generate when running low
export const BARS_BUFFER = 16 // extend when fewer than this many bars remain ahead

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
