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
│   │   ├── Grid.tsx                    — Scrolling grid, renders bars, playhead overlay, auto-scroll
│   │   ├── Bar.tsx                     — Single bar row (4 beat cells), rhyme on last beat
│   │   ├── BeatCell.tsx                — One beat cell, highlights when active
│   │   └── Timeline.tsx                — Beat numbers + subdivision ticks above grid
│   ├── Toolbar.tsx                     — Top bar: logo, metronome toggle, hamburger
│   ├── HamburgerButton.tsx             — SVG hamburger icon button
│   ├── Sidebar.tsx                     — Slide-over settings panel (track, BPM, words, bars/line, bar count, intro bars, rhyme pattern, fill mode, seed)
│   └── PlayButton.tsx                  — Play/pause + stop at bottom center
│
├── hooks/
│   ├── useAudioEngine.ts               — Tone.js: Transport, Player (track + metronome), play/pause/stop
│   ├── usePlayhead.ts                  — Tone.Loop + RAF for beat position + smooth playhead line
│   ├── useRhymes.ts                    — Word list loading, bar generation, extending
│   └── useSettings.ts                  — localStorage persistence for all user settings
│
├── lib/
│   ├── constants.ts                    — Track definitions, metronome files, color palette, all config types
│   ├── rhymes.ts                       — Word list types, generateBars() with pattern + barsPerLine support
│   └── utils.ts                        — cn() utility
│
└── styles/
    └── globals.css                     — Dark theme CSS variables, Tailwind config
```

## Audio Engine (`useAudioEngine`)

- Uses **Tone.js** Transport as master clock
- `Tone.Player` for track loop (synced to transport, looping)
- Separate `Tone.Player` for metronome (synced, muted/unmuted live)
- Track index `-1` = "None" (metronome-only mode, BPM user-selectable from 60/80/100/120)
- Players created with `onload` callback → `Promise` wrapper → `await` before `.sync().start(0)`
- BPM set from the track's config when a track is selected; from `metronomeBpm` setting when "None"
- Metronome files matched by BPM via `METRONOME_FILES` record
- Reloads metronome when BPM changes while track is "None"

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
- Bar count: fixed (8–64) generates exactly that many; `0` = infinite mode (generates chunks of 24, extends during playback)
- 8 rotating colors with 4 shades each: dim bg/border (default), active bg/border (playhead on it, with vivid ~500 borders)
- Fill modes: all, setup-punchline, off-the-cliff, all-blanks — hidden cells still show color

## Settings (`useSettings`)

- Single `flowgrid-settings` key in localStorage
- Persisted: metronomeEnabled, selectedTrackIndex, selectedListId, barsPerLine, rhymePattern, barCount, fillMode, introBars, metronomeBpm, seed
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
│           [▶ / ⏸] [⏹]              │  ← PlayButton
└─────────────────────────────────────┘

Sidebar (slides from left):
┌──────────────┐
│ SETTINGS  [✕] │
│               │
│ Track     [▼] │
│ BPM       [▼] │  ← only when track=None
│ Words     [▼] │
│ Bars/line [▼] │
│ Bars      [▼] │
│ Intro     [▼] │
│ Rhyme     [▼] │
│ Fill mode [▼] │
│ Seed [____][↻]│
└──────────────┘
```

## Adding New Tracks

1. Place audio file in `website/public/loops/`
2. Add entry to `AVAILABLE_TRACKS` in `website/src/lib/constants.ts`:
   ```ts
   { label: 'My Track 90', bpm: 90, file: '/loops/my-track-90bpm.wav', bars: 4 }
   ```
3. If a metronome at that BPM exists, add to `METRONOME_FILES`:
   ```ts
   90: '/loops/metronome-loop-90bpm.wav',
   ```

## Key Design Decisions

- **Tone.js transport as single source of truth** — all timing derives from Transport position, preventing audio/visual drift
- **Line-level rhyme generation** — patterns (AABB/ABAB) apply to lines not individual bars, so they work correctly regardless of bars-per-line setting
- **Settings in page.tsx** — all state lives at the page level and flows down via props (no context needed for this scale)
- **localStorage for persistence** — simplest cross-platform solution, works in PWA contexts on all platforms
- **No BPM control when track selected** — each track file has its own tempo; BPM only user-selectable in "None" mode for metronome
- **Seeded PRNG** — mulberry32 for deterministic rhyme generation; seed persisted so reloads produce the same sequence
