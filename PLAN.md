# FlowGrid — Architecture & Implementation

## Overview

FlowGrid is a Next.js 16 app using Tone.js for audio, Tailwind for styling. All source is in `website/src/`. The app is a single page (`page.tsx`) that composes hooks and components.

## File Structure

```
website/src/
├── app/
│   ├── layout.tsx                      — Root layout, dark theme, metadata
│   └── (main-layout)/
│       ├── layout.tsx                  — Minimal shell (flex column, full height)
│       └── page.tsx                    — Main app: composes all hooks + components
│
├── components/
│   ├── FlowGrid/
│   │   ├── Grid.tsx                    — Scrolling grid, bars, section headers, loop dividers, playhead, auto-scroll
│   │   ├── Bar.tsx                     — Single bar row (4 beat cells), rhyme on last beat
│   │   ├── BeatCell.tsx                — One beat cell, highlights when active
│   │   └── Timeline.tsx                — Beat numbers + subdivision ticks above grid
│   ├── Toolbar.tsx                     — Top bar: logo, metronome toggle, hamburger
│   ├── HamburgerButton.tsx             — SVG hamburger icon button
│   ├── Sidebar.tsx                     — Slide-over settings panel (audio offset / latency compensation)
│   ├── LoopSelector.tsx                — Loop buttons + mix buttons row above play button
│   └── PlaybackToolbar.tsx             — Play/pause + stop at bottom center, track picker modal with preview
│
├── hooks/
│   ├── useAudioEngine.ts               — Tone.js: Transport, Player (track + metronome), play/pause/stop
│   ├── usePlayhead.ts                  — Tone.Loop + RAF for beat position + smooth playhead line
│   ├── useRhymes.ts                    — Word list loading, bar generation, extending
│   └── useSettings.ts                  — localStorage persistence for all user settings
│
├── lib/
│   ├── constants.ts                    — Track/Loop/Mix/SectionStart/LoopInfo types, path helpers, getLoopForBar(), metronome files, color palette, all config
│   ├── grid-format.ts                  — Grid text format parser/serializer (parseGrid, serializeGrid, BeatData/GridLine/GridData types)
│   ├── rhymes.ts                       — Word list types, generateBars() (rhyme pool), generateBarsFromGrid() (grid→bars), buildDisplayBars() (instrumental remapping)
│   ├── __tests__/grid-format.test.ts   — Tests for grid format parsing and grid→bar conversion
│   └── utils.ts                        — cn() utility
│
└── styles/
    └── globals.css                     — Dark theme CSS variables, Tailwind config
```

## Audio Engine (`useAudioEngine`)

- Uses **Tone.js** Transport as master clock
- Tracks have one or more loops; all loop audio buffers are pre-loaded on track selection
- **Dual player strategy** based on track type:
  - Tracks with `bpmVariants`: uses `Tone.Player` — loads pre-rendered audio files at the closest available BPM for artifact-free playback
  - Tracks without variants: uses `Tone.GrainPlayer` (granular synthesis, `grainSize=0.1`, `overlap=0.05`) — adjusts `playbackRate` for pitch-preserving tempo changes
  - Mixes always use `Tone.GrainPlayer` with the same playbackRate logic
- Active loop plays via a synced player with `loop: true`
- Loop transitions: a new player is created and synced to start at the boundary bar; the old player is stopped/disposed in a `Transport.schedule()` callback — seamless gapless switching
- Pending transitions can be cancelled (user re-queues) via `Transport.clear()` + player disposal
- `stop()` re-syncs active player and metronome to bar 0 so playback resumes immediately from the beginning
- Separate `Tone.Player` for metronome (synced, muted/unmuted live)
- Track index `-1` = "None" (metronome-only mode, BPM user-selectable from 60/80/100/120)
- BPM set from the track's config when a track is selected; from `metronomeBpm` setting when "None"
- Metronome files matched by BPM via `METRONOME_FILES` record
- `loadMix(audioUrl)` loads a one-shot (non-looping) audio file, replacing the current loop player (does not auto-play)
- `seekToBar(targetBar, beat?, loopIndex?, syncStartBar?)` — pauses transport, swaps player buffer if crossing section boundaries, re-syncs player to section start bar, seeks transport to `bar:beat:0`, resumes if was playing. For mixes (no loopIndex), just seeks transport position
- Returns `currentLoopIndex`, `seekToBar()`, `scheduleTransition()`, `cancelTransition()`, `setLoopIndex()`, `loadMix()`

## Playhead (`usePlayhead`)

- RAF loop reads `transport.seconds` every frame → computes bar/beat/globalBeat → React state update only on beat change
- Smooth sub-beat playhead line position (direct DOM mutation for performance)
- Supports `barsPerLine` parameter — playhead position calculated across full row width
- `seekTo(bar, beat?)` — manual position update for seeking (sets position, playhead line, scroll tracking, and a brief guard window to prevent RAF from overwriting the position before the transport stabilizes)
- Returns `position` (bar, beat, globalBeat), refs for playhead/timeline lines, `resetPosition`, `seekTo`

## Rhyme Generation (`useRhymes` + `lib/rhymes.ts`)

Two modes: **random rhymes** (infinite pool from word lists) and **grid-based** (fixed layout from grid text format). Both feed into the same display layer.

### Random mode: Rhyme pool (`generateBars`)

- Loads word lists from `/data/word-lists.json` (9 curated lists with words grouped by `familyId`)
- `generateBars()` is a pure function that produces a flat sequence of `BarData` — it has no knowledge of sections/loops
- Operates at the **line** level (not individual bars):
  - Builds `lineRhymes` array based on pattern (AABB or ABAB)
  - Expands each line into `barsPerLine` bars sharing the same rhyme word/color/family
  - With 2 bars per line, only the last bar in each row shows the rhyme word
  - `rhymeHidden` flag set per bar based on fill mode and line position in pair
  - Uses seeded PRNG (mulberry32) — `seed + startIndex` ensures extension chunks are deterministic but different
- Grid is always infinite — generates initial 48 bars, then extends in chunks of 24 as playback progresses
- 8 rotating colors with 4 shades each: dim bg/border (default), active bg/border (playhead on it, with vivid ~500 borders)
- Fill modes: all, setup-punchline, off-the-cliff, all-blanks — hidden cells still show color

### Grid mode: `generateBarsFromGrid` + `lib/grid-format.ts`

- Used by mixes with a `grid` field — provides exact per-beat word placement instead of random rhymes
- **Grid text format** — human-readable text where each line = one UI row:
  - `_` = empty beat, `[word]` = plain word (no rhyme color), `[:N word]` = rhymed word in group N
  - `[SectionName]` on its own line = section header
  - Example: `_ _ _ [:1 time]` → 3 empty beats, then "time" in rhyme group 1
- `parseGrid()` converts grid text (string or string[]) → `GridData` (array of `GridLine` with `BeatData[]`)
- `serializeGrid()` converts `GridData` back to text
- `generateBarsFromGrid(grid, fillMode)` converts `GridData` → `BarData[]`:
  - Each line's beats are split into bars (4 beats per bar)
  - Last rhymed beat in each bar determines `rhymeWord`/`rhymeColor`
  - Per-beat words stored in `BarData.beatWords` as `(BeatWord | null)[]` for precise placement
  - Fill modes apply the same way (AABB-style pair position)
- `BarData` extended with optional `beatWords?: (BeatWord | null)[]` — `BeatWord` has `{ word, rhymeGroup, rhymeColor }`
- `Mix.grid` field: optional `string | string[]` — when present, used instead of random rhymes

### Layer 2: Display bars (`buildDisplayBars`)

- Remaps the flat rhyme pool into absolute bar positions, accounting for instrumental sections
- Walks absolute positions 0, 1, 2, ... and for each position:
  - If the position falls in an instrumental section → inserts a blank `BarData` (`instrumental: true`)
  - Otherwise → takes the next entry from the rhyme pool
- The rhyme cursor only advances for non-instrumental bars, so AABB/ABAB pairing stays intact across instrumental gaps (e.g. a Break between two Verses)
- Applied in `page.tsx` via `useMemo` for both loop mode and mix mode
- `getLoopForBar()` helper resolves which loop a given bar position belongs to using `LoopInfo.sectionStarts`
- For mixes: the pool is sized to `mixNonInstrumentalBars` (excluding instrumental sections); `buildDisplayBars` expands it back to `mixTotalBars`
- For loops: the pool comes from `useRhymes` (infinite, auto-extending); `buildDisplayBars` produces a longer display array since instrumental positions are added. Has a `maxBarPos` guard (3x pool size) to prevent infinite iteration when the tail section is instrumental

## Settings (`useSettings`)

- Single `flowgrid-settings` key in localStorage
- Persisted: metronomeEnabled, selectedTrackIndex, selectedListId, rhymePattern, fillMode, countdownLines, metronomeBpm, trackBpm, seed, trackVolume, metronomeVolume, audioOffset, trackModalTab
- Loads on mount with defaults fallback, saves on every change
- `loaded` flag prevents rendering before hydration (avoids flash)

## UI Layout

```
┌─────────────────────────────────────┐
│ [☰] FLOWGRID    [🎲] [Metronome ○]  │  ← Toolbar
├─────────────────────────────────────┤
│  1    2    3    4                    │  ← Timeline (or 1-8 for 2 bars/line)
│  ┊    ┊    ┊    ┊                   │  ← Subdivision ticks + playhead
├─────────────────────────────────────┤
│ [    ] [    ] [    ] [time]         │  ← Grid rows (auto-scrolling)
│ [    ] [    ] [    ] [lime]         │
│ [    ] [    ] [    ] [money]        │
│ [    ] [    ] [    ] [honey]        │
│           ...                       │
├─────────────────────────────────────┤
│  [Verse] [Chorus] | [Inst] [Lyr]    │  ← LoopSelector (loops + mixes)
├─────────────────────────────────────┤
│     [🎵][▶ / ⏸][⏹] [🔊]           │  ← PlaybackToolbar (track picker + audio popup)
└─────────────────────────────────────┘

Sidebar (slides from left):          Audio popup (bottom sheet):
┌──────────────┐                     ┌──────────────────┐
│ SETTINGS  [✕] │                     │ Track vol  [===] │
│               │                     │ Metro vol  [===] │
│ Latency [===] │                     │ BPM        [▼]  │
└──────────────┘                     │ Count-in   [▼]  │
                                     │ Metro BPM  [▼]  │
                                     └──────────────────┘
```

## Adding New Tracks

### Quick reference

All you need to do is:
1. Put audio files in `website/public/tracks/{slug}/`
2. Add an entry to `AVAILABLE_TRACKS` in `website/src/lib/constants.ts`
3. Add audio files to `website/public/sw.js` PRECACHE_ASSETS for offline support

### Audio file setup

```
website/public/tracks/{slug}/
├── loops/                                    — repeating loop files
│   └── {NN}-{name}-{bars}bars-{bpm}bpm.wav   — e.g. 01-verse-4bars-80bpm.wav
└── mixes/                                    — full-length audio (optional)
    └── {name}-{bpm}bpm.wav                    — e.g. lyrics-clean-80bpm.wav
```

Loop file naming: `{NN}-{name}-{bars}bars-{bpm}bpm.{ext}` — NN is a two-digit sort prefix.

### Track entry in constants.ts

Add to the `AVAILABLE_TRACKS` array. The `Track` type:
```ts
{
  label: string          // Display name
  dir: string            // Path to track directory, e.g. '/tracks/my-track'
  bpm: number            // Native BPM
  barsPerLine?: 1 | 2    // 1 = rap (default), 2 = musicals
  category: 'rap' | 'musicals'
  public?: boolean       // Set to false to hide from track picker (tutorials)
  loops: Loop[]          // At least one loop required
  mixes?: Mix[]          // Optional full-length versions
}
```

### Examples by track type

**Simple single-loop track:**
```ts
{
  label: 'My Beat', dir: '/tracks/my-beat', bpm: 90, category: 'rap',
  loops: [
    { name: 'Loop', bars: 4, files: [{ file: '01-loop-4bars-90bpm.wav', bpm: 90 }] },
  ],
}
```

**Multi-loop track (Verse/Chorus buttons appear):**
```ts
{
  label: 'My Song', dir: '/tracks/my-song', bpm: 120, category: 'rap',
  loops: [
    { name: 'Verse', bars: 8, files: [{ file: '01-verse-8bars-120bpm.wav', bpm: 120 }] },
    { name: 'Chorus', bars: 4, files: [{ file: '02-chorus-4bars-120bpm.wav', bpm: 120 }] },
  ],
}
```

**Variant track (BPM dropdown, switches between pre-rendered files):**
```ts
{
  label: 'Drums', dir: '/tracks/drums', bpm: 80, category: 'rap',
  loops: [
    { name: 'Verse', bars: 4, files: [
      { file: '01-verse-4bars-60bpm.wav', bpm: 60 },
      { file: '01-verse-4bars-80bpm.wav', bpm: 80 },
      { file: '01-verse-4bars-100bpm.wav', bpm: 100 },
    ]},
  ],
}
```

**Track with instrumental loops (no rhyme words during breaks):**
```ts
{
  label: 'Hoedown', dir: '/tracks/hoedown', bpm: 120, barsPerLine: 2, category: 'musicals',
  loops: [
    { name: 'Intro', bars: 4, instrumental: true, files: [{ file: '01-intro-4bars-120bpm.wav', bpm: 120 }] },
    { name: 'Verse', bars: 8, files: [{ file: '02-verse-8bars-120bpm.wav', bpm: 120 }] },
    { name: 'Break', bars: 2, instrumental: true, files: [{ file: '03-break-2bars-120bpm.wav', bpm: 120 }] },
  ],
}
```

### Mixes

Mixes are full-length audio files with a defined structure. Mix buttons appear next to loop buttons. The `Mix` type:
```ts
{
  name: string                    // Button label
  files: AudioFile[]              // Audio file(s) — multiple for BPM variants
  sections?: MixSection[]         // Optional when grid has section headers
  grid?: string | string[]        // Grid text format for custom word placement
}
```

**Two ways to define sections:**

1. **Grid-derived sections (preferred for scripted content)** — Put `[Section Name]` headers in the grid. Sections are derived automatically. The grid includes ALL bars (including blank/instrumental ones). No `sections` array needed.

2. **Explicit sections** — Use the `sections` array on the Mix. The grid (if present) should only contain non-instrumental bars; `buildDisplayBars` will insert instrumental blank bars at the right positions.

Use grid-derived sections when the mix has scripted lyrics/words. Use explicit sections for instrumental-only mixes (no grid) or when you need the grid to only contain vocal content.

### Grid text format

The grid defines what words appear on which beats. Each line = 1 bar (4 beats for barsPerLine=1) or 1 row (8 beats for barsPerLine=2).

**Token types:**
- `_` — empty beat
- `[word or phrase]` — plain text (no rhyme color), displayed dimmer
- `[:N word]` — rhymed word in group N (colored, groups with same N share color)
- `[Section Name]` on its own line — section header (shown in UI, NOT a beat)

**Section headers and instrumental detection:**
- Sections named `Intro`, `Break`, or `Outro` where ALL beats are `_` are automatically marked instrumental (blank bars, no rhyme content)
- Any other section name (e.g. `Verse`, `Chorus`, `Lyrics`, `Step 1: Listen`) is non-instrumental
- Section headers can contain colons (e.g. `[Step 1: Listen to this example]`)

**Rhyme groups:** Words with the same `:N` number share a color. Use pairs for rhyming: `[:1 cat]` / `[:1 hat]`, `[:2 day]` / `[:2 away]`. Colors cycle through 8 options based on `(N-1) % 8`.

**Example — tutorial with lyrics, scat, and freestyle:**
```ts
const MY_GRID = [
  '[Intro]',
  '_ _ _ _',
  '_ _ _ _',
  '[Listen to the example]',
  "[There's a mouse] [in my house] [and he's] [:1 fat]",
  '[He ate all] [my cheese] [and my] [:1 hat]',
  '[He sits on] [the couch] [all] [:2 day]',
  "[And he won't] [ever go] _ [:2 away]",
  '[Break]',
  '_ _ _ _',
  '[Now you try]',
  '_ _ _ [:3 cat]',
  '_ _ _ [:3 bat]',
  '_ _ _ [:4 play]',
  '_ _ _ [:4 stay]',
  '[Outro]',
  '_ _ _ _',
  '_ _ _ _',
]
```

**Example — mix with grid-derived sections (no `sections` array needed):**
```ts
mixes: [
  { name: 'Tutorial', files: [{ file: 'tutorial-80bpm.wav', bpm: 80 }], grid: MY_GRID },
]
```

**Example — mix with explicit sections (grid only has vocal bars):**
```ts
mixes: [
  { name: 'Instrumental', sections: [
    { name: 'Intro', bars: 4, instrumental: true },
    { name: 'Verse', bars: 8 },
    { name: 'Chorus', bars: 8 },
  ], files: [{ file: 'instrumental.wav', bpm: 80 }] },
]
```

### Metronome

If a metronome click at the track's BPM exists, add it to `METRONOME_FILES` in constants.ts:
```ts
90: '/tracks/metronome/90bpm.wav',
```

### Checklist

- [ ] Audio files in `website/public/tracks/{slug}/loops/` and/or `mixes/`
- [ ] Track entry in `AVAILABLE_TRACKS` array in `constants.ts`
- [ ] Audio files added to `PRECACHE_ASSETS` in `website/public/sw.js`
- [ ] If hidden from picker: `public: false`
- [ ] If metronome at that BPM exists: add to `METRONOME_FILES`

## Key Design Decisions

- **Tone.js transport as single source of truth** — all timing derives from Transport position, preventing audio/visual drift
- **Line-level rhyme generation** — patterns (AABB/ABAB) apply to lines not individual bars, so they work correctly regardless of bars-per-line setting
- **Settings in page.tsx** — all state lives at the page level and flows down via props (no context needed for this scale)
- **localStorage for persistence** — simplest cross-platform solution, works in PWA contexts on all platforms
- **Custom BPM with dual strategy** — variant tracks (pre-rendered at multiple BPMs) use a dropdown and swap audio files; non-variant tracks use GrainPlayer with a slider (40-200, step 10) for live pitch-preserving tempo changes
- **Seeded PRNG** — mulberry32 for deterministic rhyme generation; seed persisted so reloads produce the same sequence
- **Two-layer instrumental handling** — `generateBars()` stays pure/section-unaware (flat rhyme pool), while `buildDisplayBars()` handles section logic at the page level where `LoopInfo` already exists. This avoids coupling rhyme generation to track structure
