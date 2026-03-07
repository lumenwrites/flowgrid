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
│   ├── Sidebar.tsx                     — Slide-over settings panel (words, bars/line, intro bars, rhyme pattern, fill mode, seed, volumes, BPM)
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
│   ├── constants.ts                    — Track/Loop/Mix/SectionStart/LoopInfo types, path helpers, metronome files, color palette, all config
│   ├── rhymes.ts                       — Word list types, generateBars() with pattern + barsPerLine support
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
- Returns `currentLoopIndex`, `scheduleTransition()`, `cancelTransition()`, `setLoopIndex()`, `loadMix()`

## Playhead (`usePlayhead`)

- `Tone.Loop` at `"4n"` interval fires on every beat → `Tone.Draw.schedule` → React state update
- RAF loop for smooth sub-beat playhead line position (direct DOM mutation for performance)
- Supports `barsPerLine` parameter — playhead position calculated across full row width
- Returns `position` (bar, beat, globalBeat), refs for playhead/timeline lines, `resetPosition`

## Rhyme Generation (`useRhymes` + `lib/rhymes.ts`)

- Loads word lists from `/data/word-lists.json` (9 curated lists with words grouped by `familyId`)
- `generateBars()` operates at the **line** level (not individual bars):
  - Builds `lineRhymes` array based on pattern (AABB or ABAB)
  - Expands each line into `barsPerLine` bars sharing the same rhyme word/color/family
  - With 2 bars per line, only the last bar in each row shows the rhyme word
  - `rhymeHidden` flag set per bar based on fill mode and line position in pair
  - Uses seeded PRNG (mulberry32) — `seed + startIndex` ensures extension chunks are deterministic but different
- Grid is always infinite — generates initial 48 bars, then extends in chunks of 24 as playback progresses
- 8 rotating colors with 4 shades each: dim bg/border (default), active bg/border (playhead on it, with vivid ~500 borders)
- Fill modes: all, setup-punchline, off-the-cliff, all-blanks — hidden cells still show color

## Settings (`useSettings`)

- Single `flowgrid-settings` key in localStorage
- Persisted: metronomeEnabled, selectedTrackIndex, selectedListId, barsPerLine, rhymePattern, fillMode, introBars, metronomeBpm, trackBpm, seed, trackVolume, metronomeVolume, audioOffset
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
│           [▶ / ⏸] [⏹]              │  ← PlaybackToolbar
└─────────────────────────────────────┘

Sidebar (slides from left):
┌──────────────┐
│ SETTINGS  [✕] │
│               │
│ Track     [▼] │
│ BPM       [▼] │  ← only when track=None
│ Words     [▼] │
│ Bars/line [▼] │
│ Intro     [▼] │
│ Rhyme     [▼] │
│ Fill mode [▼] │
│ Seed [____][↻]│
└──────────────┘
```

## Adding New Tracks

1. Create directory `website/public/tracks/{slug}/loops/` and place loop audio files there
2. Name loop files: `{NN}-{name}-{bars}bars-{bpm}bpm.{ext}` (e.g. `01-verse-8bars-120bpm.wav`)
3. For tracks with mixes, also create `website/public/tracks/{slug}/mixes/`
4. Add entry to `AVAILABLE_TRACKS` in `website/src/lib/constants.ts`:
   ```ts
   // Single-loop track (file includes full name with BPM)
   { label: 'My Track 90bpm', dir: '/tracks/my-track-90bpm', bpm: 90,
     loops: [{ name: 'Loop', file: '01-loop-4bars-90bpm.wav', bars: 4 }] }
   // Multi-loop track
   { label: 'My Song 120bpm', dir: '/tracks/my-song-120bpm', bpm: 120,
     loops: [
       { name: 'Verse', file: '01-verse-8bars-120bpm.wav', bars: 8 },
       { name: 'Chorus', file: '02-chorus-4bars-120bpm.wav', bars: 4 },
     ] }
   // Variant track (file omits BPM — loopUrl appends it dynamically)
   { label: 'Drums', dir: '/tracks/drums', bpm: 80, bpmVariants: [60, 80, 100, 120],
     loops: [
       { name: 'Verse', file: '01-verse-4bars.wav', bars: 4 },
       { name: 'Chorus', file: '02-chorus-4bars.wav', bars: 4 },
     ] }
   // Track with mixes (optional rhymes array per mix)
   { label: 'Song 80bpm', dir: '/tracks/song-80bpm', bpm: 80, barsPerLine: 2,
     loops: [...],
     mixes: [
       { name: 'Instrumental', file: 'instrumental.wav',
         sections: [{ name: 'Intro', bars: 4 }, { name: 'Verse', bars: 8 }] },
       { name: 'Lyrics', file: 'lyrics.wav',
         sections: [...], rhymes: ['time', 'lime', 'money', 'honey', ...] },
     ] }
   ```
5. If a metronome at that BPM exists, add to `METRONOME_FILES`:
   ```ts
   90: '/tracks/metronome/90bpm.wav',
   ```
6. Add new audio files to `website/public/sw.js` PRECACHE_ASSETS for offline support

## Key Design Decisions

- **Tone.js transport as single source of truth** — all timing derives from Transport position, preventing audio/visual drift
- **Line-level rhyme generation** — patterns (AABB/ABAB) apply to lines not individual bars, so they work correctly regardless of bars-per-line setting
- **Settings in page.tsx** — all state lives at the page level and flows down via props (no context needed for this scale)
- **localStorage for persistence** — simplest cross-platform solution, works in PWA contexts on all platforms
- **Custom BPM with dual strategy** — variant tracks (pre-rendered at multiple BPMs) use a dropdown and swap audio files; non-variant tracks use GrainPlayer with a slider (40-200, step 10) for live pitch-preserving tempo changes
- **Seeded PRNG** — mulberry32 for deterministic rhyme generation; seed persisted so reloads produce the same sequence
