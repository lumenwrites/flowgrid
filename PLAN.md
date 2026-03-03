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
│   ├── Sidebar.tsx                     — Slide-over settings panel (beat, words, bars per line, bar count, rhyme pattern)
│   └── PlayButton.tsx                  — Play/pause + stop at bottom center
│
├── hooks/
│   ├── useAudioEngine.ts               — Tone.js: Transport, Player (beat + metronome), play/pause/stop
│   ├── usePlayhead.ts                  — Tone.Loop + RAF for beat position + smooth playhead line
│   ├── useRhymes.ts                    — Word list loading, bar generation, extending
│   └── useSettings.ts                  — localStorage persistence for all user settings
│
├── lib/
│   ├── constants.ts                    — Beat definitions, metronome files, color palette, all config types
│   ├── rhymes.ts                       — Word list types, generateBars() with pattern + barsPerLine support
│   └── utils.ts                        — cn() utility
│
└── styles/
    └── globals.css                     — Dark theme CSS variables, Tailwind config
```

## Audio Engine (`useAudioEngine`)

- Uses **Tone.js** Transport as master clock
- `Tone.Player` for beat loop (synced to transport, looping)
- Separate `Tone.Player` for metronome (synced, muted/unmuted live)
- Beat index `-1` = "None" (metronome-only mode at default 80 BPM)
- Players created with `onload` callback → `Promise` wrapper → `await` before `.sync().start(0)`
- BPM set from the beat's config, not user-adjustable independently
- Metronome files matched by BPM via `METRONOME_FILES` record

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
- Bar count: fixed (8–64) generates exactly that many; `0` = infinite mode (generates chunks of 24, extends during playback)
- 8 rotating dark accent colors for rhyme pair highlighting

## Settings (`useSettings`)

- Single `flowgrid-settings` key in localStorage
- Persisted: metronomeEnabled, selectedBeatIndex, selectedListId, barsPerLine, rhymePattern, barCount
- Loads on mount with defaults fallback, saves on every change
- `loaded` flag prevents rendering before hydration (avoids flash)

## UI Layout

```
┌─────────────────────────────────────┐
│ FLOWGRID    [Metronome ○]    [☰]    │  ← Toolbar
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

Sidebar (slides from right):
┌──────────────┐
│ SETTINGS  [✕] │
│               │
│ Beat      [▼] │
│ Words     [▼] │
│ Bars/line [▼] │
│ Bars      [▼] │
│ Rhyme     [▼] │
└──────────────┘
```

## Adding New Beats

1. Place audio file in `website/public/beats/`
2. Add entry to `AVAILABLE_BEATS` in `website/src/lib/constants.ts`:
   ```ts
   { label: 'My Beat 90', bpm: 90, file: '/beats/my-beat-90bpm.wav', bars: 4 }
   ```
3. If a metronome at that BPM exists, add to `METRONOME_FILES`:
   ```ts
   90: '/beats/metronome-loop-90bpm.wav',
   ```

## Key Design Decisions

- **Tone.js transport as single source of truth** — all timing derives from Transport position, preventing audio/visual drift
- **Line-level rhyme generation** — patterns (AABB/ABAB) apply to lines not individual bars, so they work correctly regardless of bars-per-line setting
- **Settings in page.tsx** — all state lives at the page level and flows down via props (no context needed for this scale)
- **localStorage for persistence** — simplest cross-platform solution, works in PWA contexts on all platforms
- **No BPM control** — each beat file has its own tempo; BPM is derived from the file, not user-adjustable
