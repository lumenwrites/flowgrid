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
  sections?: MixSection[]
  grid?: string | string[]
}

export type TrackCategory = 'rap' | 'musicals'
export const TRACK_CATEGORIES: { id: TrackCategory; label: string }[] = [
  { id: 'rap', label: 'Rap' },
  { id: 'musicals', label: 'Musicals' },
]

export type Track = {
  label: string
  dir: string
  bpm: number
  loops?: Loop[]
  mixes?: Mix[]
  barsPerLine?: BarsPerLine
  public?: boolean
  category: TrackCategory
}

const MOUSE_FLOW_GRID = [
  '[Learn a new rap flow in 4 easy steps]',
  '_ _ _ _',
  '_ _ _ _',
  '[Step 1: Listen to this example]',
  "[There's] [a mouse in my] [house and he's] [:1 fat]",
  '[He ate] [all my] [cheese and my] [:1 hat]',
  '[He] [sits on the] [couch all] [:2 day]',
  "[And he] [won't ever] [go] [:2 away]",
  '[Step 2: Hum along with the rhythm]',
  '_ _ _ _',
  '[Ledda] [bah-dee bah] [POW sedda] [:1 FAK]',
  '[Dee-gah] [bah-dee] [PEE sedda] [:1 VAK]',
  '[Dee] [tah-gada] [COW bah-] [:2 DAY]',
  '[Tedda] [loh-gah] [boh-dah] [:2 WAY]',
  '[Step 3: Repeat the rhythm on your own]',
  '_ _ _ _',
  '[Ledda] [bah-dee bah] [POW sedda] [:1 FAK]',
  '[Dee-gah] [bah-dee] [PEE sedda] [:1 VAK]',
  '[Dee] [tah-gada] [COW bah-] [:2 DAY]',
  '[Tedda] [loh-gah] [boh-dah] [:2 WAY]',
  '[Step 4: Freestyle]',
  '_ _ _ _',
  '_ _ _ [:3 cat]',
  '_ _ _ [:3 bat]',
  '_ _ _ [:4 play]',
  '_ _ _ [:4 stay]',
  '_ _ _ [:5 sun]',
  '_ _ _ [:5 fun]',
  '_ _ _ [:6 big]',
  '_ _ _ [:6 pig]',
  '[Outro]',
  '_ _ _ _',
  '_ _ _ _',
  '_ _ _ _',
  '_ _ _ _',
  '_ _ _ _',
]

const EASIEST_EXERCISE_GRID = [
  // Bars 1-12
  '[Ba-da ba-da] [BAM] _ [:1 cat]',
  '[Ba-da ba-da] [BAM] _ [:1 hat]',
  '[Ba-da ba-da] [BAM] _ [:2 dog]',
  '[Ba-da ba-da] [BAM] _ [:2 fog]',
  '[Ba-da ba-da] [BAM] _ [:3 sun]',
  '[Ba-da ba-da] [BAM] _ [:3 fun]',
  '[Ba-da ba-da] [BAM] _ [:4 day]',
  '[Ba-da ba-da] [BAM] _ [:4 play]',
  '[Ba-da ba-da] [BAM] _ [:5 tree]',
  '[Ba-da ba-da] [BAM] _ [:5 free]',
  '[Ba-da ba-da] [BAM] _ [:6 ball]',
  '[Ba-da ba-da] [BAM] _ [:6 tall]',
  // Bars 13-16
  '[Ba-da ba-da] [BAM] _ [:7 toast]',
  '[Ba-da ba-da] [BAM] _ [:7 ghost]',
  '[Ba-da ba-da] [BAM] _ [:8 chair]',
  '[Ba-da ba-da] [BAM] _ [:8 there]',
  // Bars 17-41
  '[Ba-da ba-da] [BAM] _ [:9 bed]',
  '[Ba-da ba-da] [BAM] _ [:9 red]',
  '[Ba-da ba-da] [BAM] _ [:10 cool]',
  '[Ba-da ba-da] [BAM] _ [:10 school]',
  '[Ba-da ba-da] [BAM] _ [:11 cake]',
  '[Ba-da ba-da] [BAM] _ [:11 lake]',
  '[Ba-da ba-da] [BAM] _ [:12 right]',
  '[Ba-da ba-da] [BAM] _ [:12 night]',
  '[Ba-da ba-da] [BAM] _ [:13 rain]',
  '[Ba-da ba-da] [BAM] _ [:13 train]',
  '[Ba-da ba-da] [BAM] _ [:14 house]',
  '[Ba-da ba-da] [BAM] _ [:14 mouse]',
  '[Ba-da ba-da] [BAM] _ [:15 king]',
  '[Ba-da ba-da] [BAM] _ [:15 ring]',
  '[Ba-da ba-da] [BAM] _ [:16 door]',
  '[Ba-da ba-da] [BAM] _ [:16 floor]',
  '[Ba-da ba-da] [BAM] _ [:17 boat]',
  '[Ba-da ba-da] [BAM] _ [:17 coat]',
  '[Ba-da ba-da] [BAM] _ [:18 star]',
  '[Ba-da ba-da] [BAM] _ [:18 car]',
  '[Ba-da ba-da] [BAM] _ [:19 gold]',
  '[Ba-da ba-da] [BAM] _ [:19 cold]',
  '[Ba-da ba-da] [BAM] _ [:20 dream]',
  '[Ba-da ba-da] [BAM] _ [:20 team]',
  '[Ba-da ba-da] [BAM] _ [:21 rock]',
  '[Ba-da ba-da] [BAM] _ [:21 clock]',
  '[Ba-da ba-da] [BAM] _ [:22 phone]',
  '[Ba-da ba-da] [BAM] _ [:22 bone]',
  '[Ba-da ba-da] [BAM] _ [:23 fire]',
  '[Ba-da ba-da] [BAM] _ [:23 wire]',
  '[Ba-da ba-da] [BAM] _ [:24 name]',
  '[Ba-da ba-da] [BAM] _ [:24 game]',
  '[Ba-da ba-da] [BAM] _ [:25 shoe]',
  '[Ba-da ba-da] [BAM] _ [:25 blue]',
  '[Ba-da ba-da] [BAM] _ [:26 shop]',
  '[Ba-da ba-da] [BAM] _ [:26 stop]',
  '[Ba-da ba-da] [BAM] _ [:27 light]',
  '[Ba-da ba-da] [BAM] _ [:27 kite]',
  '[Ba-da ba-da] [BAM] _ [:28 face]',
  '[Ba-da ba-da] [BAM] _ [:28 place]',
  '[Ba-da ba-da] [BAM] _ [:29 song]',
  '[Ba-da ba-da] [BAM] _ [:29 long]',
  '[Ba-da ba-da] [BAM] _ [:30 hand]',
  '[Ba-da ba-da] [BAM] _ [:30 land]',
]

const VILLAIN_SONG_SECTIONS: MixSection[] = [
  { name: 'Verse 1', bars: 8 },
  { name: 'Chorus', bars: 8 },
  { name: 'Verse 2', bars: 8 },
  { name: 'Chorus', bars: 8 },
]

const VILLAIN_SONG_GRID = [
  '_ _ _ _ _ _ _ [:1 dawn]',
  '_ _ _ _ _ _ _ [:1 gone]',
  '_ _ _ _ _ _ _ [:2 made]',
  '_ _ _ _ _ _ _ [:2 laid]',
  '_ _ _ _ _ _ _ [:3 see]',
  '_ _ _ _ _ _ _ [:3 me]',
  '_ _ _ _ _ _ _ [:4 door]',
  '_ _ _ _ _ _ _ [:4 poor]',
  '_ _ _ _ _ _ _ [:5 squid]',
  '_ _ _ _ _ _ _ [:5 did]',
  '_ _ _ _ _ _ _ [:6 okay]',
  '_ _ _ _ _ _ _ [:6 Ray]',
  '_ _ _ _ _ _ _ [:7 see]',
  '_ _ _ _ _ _ _ [:7 me]',
  '_ _ _ _ _ _ _ [:8 door]',
  '_ _ _ _ _ _ _ [:8 poor]',
]

export const AVAILABLE_TRACKS: Track[] = [
  {
    label: 'Basic Drums', dir: '/tracks/basic-drums', bpm: 80, barsPerLine: 1, category: 'rap',
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
    label: 'Basic Drums', dir: '/tracks/basic-drums', bpm: 80, barsPerLine: 2, category: 'musicals',
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
    label: 'Whose Line Rap', dir: '/tracks/whose-line-rap', bpm: 100, barsPerLine: 1, category: 'rap',
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
      ], grid: [
        '_ _ _ [:1 grapple]',
        '_ _ _ [:1 apple]',
        '_ _ _ [:2 fool]',
        '_ _ _ [:2 school]',
        '_ _ _ [:3 desk]',
        '_ _ _ [:3 pest]',
        '_ _ _ [:4 look]',
        '_ _ _ [:4 book]',
      ]},
      { name: 'Camp Rap', sections: [
        { name: 'Verse', bars: 8 }, { name: 'Verse', bars: 8 },
        { name: 'Verse', bars: 4 }, { name: 'Verse', bars: 4 },
        { name: 'Verse', bars: 2 },
      ], files: [
        { file: 'camp-rap-100bpm.wav', bpm: 100 },
      ], grid: [
        '_ _ _ [:1 do]',
        '_ _ _ [:1 canoe]',
        '_ _ _ [:2 away]',
        '_ _ _ [:2 spray]',
        '_ _ _ [:3 burn]',
        '_ _ _ [:3 learn]',
        '_ _ _ [:4 spf]',
        '_ _ _ [:4 jeff]',
        '_ _ _ [:5 man]',
        '_ _ _ [:5 glad]',
        '_ _ _ [:6 camp]',
        '_ _ _ [:6 ramp]',
        '_ _ _ [:7 see]',
        '_ _ _ [:7 me]',
        '_ _ _ [:8 minjana]',
        '_ _ _ [:8 pinjata]',
        '_ _ _ [:9 you]',
        '_ _ _ [:9 do]',
        '_ _ _ [:10 ask]',
        '_ _ _ [:10 mask]',
        '_ _ _ [:11 racing]',
        '_ _ _ [:11 jason]',
        '_ _ _ [:12 wife]',
        '_ _ _ [:12 knife]',
        '_ _ _ [:13 already]',
        '_ _ _ [:13 machete]',
      ]},
    ],
  },
  {
    label: 'Laura Rap', dir: '/tracks/laura-rap', bpm: 80, barsPerLine: 1, category: 'rap',
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
    label: 'Tutorial', dir: '/tracks/tutorial', bpm: 80, barsPerLine: 1, public: false, category: 'rap',
    loops: [
      { name: 'Loop', bars: 4, files: [{ file: '/tracks/basic-drums/loops/01-verse-4bars-80bpm.wav', bpm: 80 }] },
    ],
    mixes: [
      { name: 'Tutorial', sections: [
        { name: 'Verse', bars: 64 },
      ], files: [
        { file: 'tutorial.wav', bpm: 80 },
      ], grid: [
        '_ _ _ [:1 cat]',
        '_ _ _ [:1 hat]',
        '_ _ _ [:2 sun]',
        '_ _ _ [:2 fun]',
        '_ _ _ [:3 sky]',
        '_ _ _ [:3 fly]',
        '_ _ _ [:4 tree]',
        '_ _ _ [:4 free]',
        '_ _ _ [:5 go]',
        '_ _ _ [:5 flow]',
        '_ _ _ [:6 along]',
        '_ _ _ [:6 wrong]',
        '_ _ _ [:7 light]',
        '_ _ _ [:7 night]',
        '_ _ _ [:8 dream]',
        '_ _ _ [:8 stream]',
        '_ _ _ [:9 rain]',
        '_ _ _ [:9 train]',
        '_ _ _ [:10 road]',
        '_ _ _ [:10 code]',
        '_ _ _ [:11 star]',
        '_ _ _ [:11 far]',
        '_ _ _ [:12 moon]',
        '_ _ _ [:12 tune]',
        '_ _ _ [:13 fire]',
        '_ _ _ [:13 higher]',
        '_ _ _ [:14 ground]',
        '_ _ _ [:14 sound]',
        '_ _ _ [:15 wave]',
        '_ _ _ [:15 brave]',
        '_ _ _ [:16 time]',
        '_ _ _ [:16 rhyme]',
        '_ _ _ [:17 soul]',
        '_ _ _ [:17 roll]',
        '_ _ _ [:18 beat]',
        '_ _ _ [:18 street]',
        '_ _ _ [:19 cool]',
        '_ _ _ [:19 school]',
        '_ _ _ [:20 stage]',
        '_ _ _ [:20 page]',
        '_ _ _ [:21 bright]',
        '_ _ _ [:21 sight]',
        '_ _ _ [:22 tall]',
        '_ _ _ [:22 call]',
        '_ _ _ [:23 king]',
        '_ _ _ [:23 ring]',
        '_ _ _ [:24 gold]',
        '_ _ _ [:24 bold]',
        '_ _ _ [:25 real]',
        '_ _ _ [:25 deal]',
        '_ _ _ [:26 game]',
        '_ _ _ [:26 fame]',
        '_ _ _ [:27 ride]',
        '_ _ _ [:27 side]',
        '_ _ _ [:28 high]',
        '_ _ _ [:28 sky]',
        '_ _ _ [:29 rock]',
        '_ _ _ [:29 clock]',
        '_ _ _ [:30 shine]',
        '_ _ _ [:30 mine]',
        '_ _ _ [:31 best]',
        '_ _ _ [:31 test]',
        '_ _ _ [:32 end]',
        '_ _ _ [:32 friend]',
      ]},
    ],
  },
  {
    label: 'Mouse Flow', dir: '/tracks/tutorial-02-mouse-flow', bpm: 80, barsPerLine: 1, public: true, category: 'rap',
    loops: [
      { name: 'Loop', bars: 4, files: [{ file: '01-verse-4bars-80bpm.wav', bpm: 80 }] },
    ],
    mixes: [
      { name: 'Mouse Flow', files: [
        { file: 'lyrics-clean-80bpm.wav', bpm: 80 },
      ], grid: MOUSE_FLOW_GRID },
    ],
  },
  {
    label: 'Easiest Exercise', dir: '/tracks/tutorial-03-easiest-exercise', bpm: 80, barsPerLine: 1, public: true, category: 'rap',
    loops: [
      { name: 'Loop', bars: 4, files: [
        { file: 'easy-loop-4bars-60bpm.wav', bpm: 60 },
        { file: 'easy-loop-4bars-80bpm.wav', bpm: 80 },
        { file: 'easy-loop-4bars-100bpm.wav', bpm: 100 },
      ]},
    ],
    mixes: [
      { name: 'Easiest Exercise', files: [
        { file: 'tutorial-easiest-exercise-80bpm.wav', bpm: 80 },
      ], grid: EASIEST_EXERCISE_GRID },
    ],
  },
  {
    label: 'Yucca', dir: '/tracks/yucca-80bpm', bpm: 80, barsPerLine: 1, category: 'rap',
    loops: [{ name: 'Loop', bars: 8, files: [{ file: '01-loop-8bars-80bpm.m4a', bpm: 80 }] }],
  },
  {
    label: 'Hoedown', dir: '/tracks/hoedown', bpm: 120, barsPerLine: 2, category: 'musicals',
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
    label: 'Villain Song', dir: '/tracks/villain-song-80bpm', bpm: 80, barsPerLine: 2, category: 'musicals',
    loops: [
      { name: 'Verse', bars: 8, files: [{ file: '01-verse-8bars-80bpm.wav', bpm: 80 }] },
      { name: 'Chorus', bars: 8, files: [{ file: '02-chorus-8bars-80bpm.wav', bpm: 80 }] },
    ],
    mixes: [
      { name: 'Instrumental', sections: VILLAIN_SONG_SECTIONS, files: [{ file: 'instrumental.wav', bpm: 80 }] },
      { name: 'Lyrics', sections: VILLAIN_SONG_SECTIONS, grid: VILLAIN_SONG_GRID, files: [{ file: 'lyrics.wav', bpm: 80 }] },
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
  if (audioFile.file.startsWith('/')) return audioFile.file
  return `${track.dir}/loops/${audioFile.file}`
}

export function mixFileUrl(track: Track, audioFile: AudioFile): string {
  if (audioFile.file.startsWith('/')) return audioFile.file
  return `${track.dir}/mixes/${audioFile.file}`
}

export const NONE_TRACK_INDEX = -1
export const DEFAULT_TRACK_INDEX = 0
export const DEFAULT_BPM = 80 // Used when no track is selected
export const BPM_MIN = 40
export const BPM_MAX = 200

export const COUNTDOWN_LINE_OPTIONS = [0, 1, 2]
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

// Names that count as instrumental when all beats are empty
const INSTRUMENTAL_SECTION_NAMES = new Set(['Break', 'Intro', 'Outro'])

export function isInstrumentalSection(sectionName: string, beats: { word: string | null }[]): boolean {
  return INSTRUMENTAL_SECTION_NAMES.has(sectionName) && beats.every(b => b.word === null)
}

export type BarsPerLine = 1 | 2
