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

export type MixSection = {
  name: string
  bars: number
}

export type Mix = {
  name: string
  file: string
  sections: MixSection[]
  rhymes?: string[]
}

export type Track = {
  label: string
  dir: string
  bpm: number
  loops: Loop[]
  mixes?: Mix[]
  barsPerLine?: BarsPerLine
}

const VILLAIN_SONG_SECTIONS: MixSection[] = [
  { name: 'Verse 1', bars: 8 },
  { name: 'Chorus', bars: 8 },
  { name: 'Verse 2', bars: 8 },
  { name: 'Chorus', bars: 8 },
]

const VILLAIN_SONG_RHYMES = [
  'dawn', 'gone', 'made', 'laid',
  'see', 'me', 'door', 'poor',
  'squid', 'did', 'okay', 'Ray',
  'see', 'me', 'door', 'poor',
]

export const AVAILABLE_TRACKS: Track[] = [
  {
    label: 'Villain Song 80bpm', dir: '/tracks/villain-song-80bpm', bpm: 80, barsPerLine: 2,
    loops: [
      { name: 'Verse', file: 'verse.wav', bars: 8 },
      { name: 'Chorus', file: 'chorus.wav', bars: 8 },
    ],
    mixes: [
      { name: 'Instrumental', file: 'instrumental.wav', sections: VILLAIN_SONG_SECTIONS },
      { name: 'Lyrics', file: 'lyrics.wav', sections: VILLAIN_SONG_SECTIONS, rhymes: VILLAIN_SONG_RHYMES },
      { name: 'Scat', file: 'scat.wav', sections: VILLAIN_SONG_SECTIONS },
    ],
  },
  {
    label: 'Basic Drums 80bpm', dir: '/tracks/basic-drums-80bpm', bpm: 80, 
    loops: [
      { name: 'Verse', file: 'verse.wav', bars: 4 },
      { name: 'Chorus', file: 'chorus.wav', bars: 4 },
    ],
  },
  { label: 'Drums 60bpm',  dir: '/tracks/drums-60bpm',  bpm: 60,  loops: [{ name: 'Loop', file: 'loop.wav', bars: 1 }] },
  { label: 'Drums 80bpm',  dir: '/tracks/drums-80bpm',  bpm: 80,  loops: [{ name: 'Loop', file: 'loop.wav', bars: 1 }] },
  { label: 'Drums 100bpm', dir: '/tracks/drums-100bpm', bpm: 100, loops: [{ name: 'Loop', file: 'loop.wav', bars: 1 }] },
  { label: 'Drums 120bpm', dir: '/tracks/drums-120bpm', bpm: 120, loops: [{ name: 'Loop', file: 'loop.wav', bars: 1 }] },
  { label: 'Scene to Rap 100bpm',    dir: '/tracks/scene-to-rap-100bpm',    bpm: 100, barsPerLine: 1, loops: [{ name: 'Loop', file: 'loop.m4a', bars: 8 }] },
  { label: 'YCCA 80bpm',             dir: '/tracks/ycca-80bpm',             bpm: 80,  loops: [{ name: 'Loop', file: 'loop.m4a', bars: 8 }] },
  { label: 'Freestyle Drums 100bpm', dir: '/tracks/freestyle-drums-100bpm', bpm: 100, loops: [{ name: 'Loop', file: 'loop.wav', bars: 4 }] },
]

export const METRONOME_FILES: Record<number, string> = {
  60:  '/tracks/metronome/60bpm.wav',
  80:  '/tracks/metronome/80bpm.wav',
  100: '/tracks/metronome/100bpm.wav',
  120: '/tracks/metronome/120bpm.wav',
}

export function loopUrl(track: Track, loop: Loop): string {
  return `${track.dir}/loops/${loop.file}`
}

export function mixUrl(track: Track, mix: Mix): string {
  return `${track.dir}/mixes/${mix.file}`
}

export const NONE_TRACK_INDEX = -1
export const DEFAULT_TRACK_INDEX = 0 // Villain Song 80bpm (multi-loop + examples)
export const DEFAULT_BPM = 80 // Used when no track is selected
export const BPM_MIN = 40
export const BPM_MAX = 200

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
