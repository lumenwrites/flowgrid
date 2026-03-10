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

export type AudioFile = { file: string; bpm: number }

export type Loop = {
  name: string
  files: AudioFile[]
  bars: number
  // When true, bars in this loop show no rhyme words and don't consume from the
  // rhyme pool — so rhyme pairing (AABB/ABAB) stays intact across the gap.
  instrumental?: boolean
}

export type MixSection = {
  name: string
  bars: number
  instrumental?: boolean
}

export type Mix = {
  name: string
  files: AudioFile[]
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
    label: 'Basic Drums', dir: '/tracks/basic-drums', bpm: 80, barsPerLine: 1,
    loops: [
      { name: 'Verse', bars: 4, files: [
        { file: '01-verse-4bars-60bpm.wav', bpm: 60 },
        { file: '01-verse-4bars-80bpm.wav', bpm: 80 },
        { file: '01-verse-4bars-100bpm.wav', bpm: 100 },
        { file: '01-verse-4bars-120bpm.wav', bpm: 120 },
      ]},
      { name: 'Chorus', bars: 4, files: [
        { file: '02-chorus-4bars-60bpm.wav', bpm: 60 },
        { file: '02-chorus-4bars-80bpm.wav', bpm: 80 },
        { file: '02-chorus-4bars-100bpm.wav', bpm: 100 },
        { file: '02-chorus-4bars-120bpm.wav', bpm: 120 },
      ]},
    ],
  },
  {
    label: 'Whose Line Rap', dir: '/tracks/whose-line-rap', bpm: 100, barsPerLine: 1,
    loops: [
      { name: 'Loop', bars: 8, files: [
        { file: '01-loop-8bars-80bpm.wav', bpm: 80 },
        { file: '01-loop-8bars-100bpm.wav', bpm: 100 },
      ]},
    ],
    mixes: [
      { name: 'Nerd Rap', sections: [
        { name: 'Verse', bars: 8 },
      ], files: [
        { file: 'nerd-rap-80bpm.wav', bpm: 80 },
        { file: 'nerd-rap-100bpm.wav', bpm: 100 },
      ], rhymes: [
        'grapple', 'apple', 'fool', 'school',
        'desk', 'pest', 'look', 'book',
      ]},
      { name: 'Camp Rap', sections: [
        { name: 'Verse', bars: 8 }, { name: 'Verse', bars: 8 },
        { name: 'Verse', bars: 4 }, { name: 'Verse', bars: 4 },
        { name: 'Verse', bars: 2 },
      ], files: [
        { file: 'camp-rap-100bpm.wav', bpm: 100 },
      ], rhymes: [
        'do', 'canoe', 'away', 'spray',
        'burn', 'learn', 'spf', 'jeff',
        'man', 'glad', 'camp', 'ramp',
        'see', 'me', 'minjana', 'pinjata',
        'you', 'do', 'ask', 'mask',
        'racing', 'jason', 'wife', 'knife',
        'already', 'machete',
      ]},
    ],
  },
  {
    label: 'Laura Rap', dir: '/tracks/laura-rap', bpm: 80, barsPerLine: 1,
    loops: [
      { name: 'Verse', bars: 4, files: [
        { file: '01-verse-4bars-60bpm.wav', bpm: 60 },
        { file: '01-verse-4bars-70bpm.wav', bpm: 70 },
        { file: '01-verse-4bars-80bpm.wav', bpm: 80 },
      ]},
      { name: 'Chorus', bars: 4, files: [
        { file: '02-chorus-4bars-60bpm.wav', bpm: 60 },
        { file: '02-chorus-4bars-70bpm.wav', bpm: 70 },
        { file: '02-chorus-4bars-80bpm.wav', bpm: 80 },
      ]},
    ],
    mixes: [
      { name: 'Instrumental', sections: [
        { name: 'Verse 1', bars: 16 }, { name: 'Chorus', bars: 8 },
        { name: 'Verse 2', bars: 16 }, { name: 'Chorus', bars: 8 },
        { name: 'Verse 3', bars: 16 },
      ], files: [
        { file: 'instrumental-60bpm.wav', bpm: 60 },
        { file: 'instrumental-70bpm.wav', bpm: 70 },
        { file: 'instrumental-80bpm.wav', bpm: 80 },
      ]},
    ],
  },
  {
    label: 'Yucca', dir: '/tracks/yucca-80bpm', bpm: 80, barsPerLine: 1,
    loops: [{ name: 'Loop', bars: 8, files: [{ file: '01-loop-8bars-80bpm.m4a', bpm: 80 }] }],
  },
  {
    label: 'Hoedown', dir: '/tracks/hoedown', bpm: 120, barsPerLine: 2,
    loops: [
      { name: 'Intro', bars: 4, instrumental: true, files: [{ file: '01-intro-4bars-120bpm.wav', bpm: 120 }] },
      { name: 'Verse', bars: 8, files: [{ file: '02-verse-8bars-120bpm.wav', bpm: 120 }] },
      { name: 'Break', bars: 2, instrumental: true, files: [{ file: '03-break-2bars-120bpm.wav', bpm: 120 }] },
    ],
    mixes: [
      { name: 'Instrumental', sections: [
        { name: 'Intro', bars: 4, instrumental: true }, { name: 'Verse', bars: 8 }, { name: 'Break', bars: 2, instrumental: true },
        { name: 'Verse', bars: 8 }, { name: 'Break', bars: 2, instrumental: true },
        { name: 'Verse', bars: 8 }, { name: 'Break', bars: 2, instrumental: true }, { name: 'Verse', bars: 8 }, { name: 'Outro', bars: 3, instrumental: true },
      ], files: [{ file: 'instrumental.wav', bpm: 120 }] },
    ],
  },
  {
    label: 'Villain Song', dir: '/tracks/villain-song-80bpm', bpm: 80, barsPerLine: 2,
    loops: [
      { name: 'Verse', bars: 8, files: [{ file: '01-verse-8bars-80bpm.wav', bpm: 80 }] },
      { name: 'Chorus', bars: 8, files: [{ file: '02-chorus-8bars-80bpm.wav', bpm: 80 }] },
    ],
    mixes: [
      { name: 'Instrumental', sections: VILLAIN_SONG_SECTIONS, files: [{ file: 'instrumental.wav', bpm: 80 }] },
      { name: 'Lyrics', sections: VILLAIN_SONG_SECTIONS, rhymes: VILLAIN_SONG_RHYMES, files: [{ file: 'lyrics.wav', bpm: 80 }] },
      { name: 'Scat', sections: VILLAIN_SONG_SECTIONS, files: [{ file: 'scat.wav', bpm: 80 }] },
    ],
  },
]

export const METRONOME_FILES: Record<number, string> = {
  60:  '/tracks/metronome/60bpm.wav',
  80:  '/tracks/metronome/80bpm.wav',
  100: '/tracks/metronome/100bpm.wav',
  120: '/tracks/metronome/120bpm.wav',
}

// Get the list of available BPMs from a loop or mix's files
export function getBpmVariants(item: Loop | Mix): number[] | undefined {
  if (item.files.length <= 1) return undefined
  return item.files.map(f => f.bpm)
}

// Find the closest matching file for a given BPM
export function getFileForBpm(files: AudioFile[], bpm: number): AudioFile {
  let best = files[0]
  for (const f of files) {
    if (Math.abs(f.bpm - bpm) < Math.abs(best.bpm - bpm)) best = f
  }
  return best
}

export function loopFileUrl(track: Track, audioFile: AudioFile): string {
  return `${track.dir}/loops/${audioFile.file}`
}

export function mixFileUrl(track: Track, audioFile: AudioFile): string {
  return `${track.dir}/mixes/${audioFile.file}`
}

export const NONE_TRACK_INDEX = -1
export const DEFAULT_TRACK_INDEX = 0
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

// Finds which loop a given absolute bar position belongs to, by walking
// sectionStarts to find the last section that starts at or before barIdx.
export function getLoopForBar(barIdx: number, loopInfo: LoopInfo): Loop | null {
  const { sectionStarts, loops } = loopInfo
  let loopIndex = sectionStarts[0]?.loopIndex ?? 0
  for (const s of sectionStarts) {
    if (s.bar <= barIdx) loopIndex = s.loopIndex
    else break
  }
  return loops[loopIndex] ?? null
}

export type BarsPerLine = 1 | 2
export const BARS_PER_LINE_OPTIONS: { value: BarsPerLine; label: string }[] = [
  { value: 1, label: '1 bar — Rap' },
  { value: 2, label: '2 bars — Musical' },
]
