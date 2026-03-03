# FlowGrid Prototype v0.1

## Goal
Build the simplest working version of FlowGrid: a freestyle rap practice app with a beat-synced scrolling grid showing rhyme words.

## What the prototype does
1. User selects a beat (60/80/100/120 BPM drum loop)
2. User selects a word list (elementary, rapper's toolkit, etc.)
3. User presses play
4. A drum loop plays on repeat
5. A grid of bars scrolls by — 4 beats per bar, rhyme word on the last beat
6. A playhead highlights the current beat in time with the music
7. The grid auto-scrolls to keep the current bar near the top quarter of the screen
8. Rhyme pairs (AABB) are color-coded so you can see which words rhyme

## What's deferred (not in this prototype)
- BPM adjustment / tempo stretching (just pick a loop at a fixed BPM)
- ABAB rhyme pattern (prototype uses AABB only)
- Fill modes (setup/punchline, off the cliff)
- 2 bars per line mode
- Audio recording
- PWA support
- Metronome toggle
- CMU dictionary-based rhyming (use pre-grouped word lists instead)

---

## Technical Architecture

### Audio — Tone.js
We use **Tone.js** instead of raw Web Audio API. It gives us:
- `Tone.Transport` — master clock with native BPM, bar/beat position, loop control
- `Tone.Player` — audio file playback, `.sync().start(0)` locks to Transport, `.loop = true` for gapless looping
- `Tone.Loop` — fire callbacks at musical intervals (e.g. every quarter note)
- `Tone.Draw.schedule` — bridges audio time → animation frame for drift-free visual sync

This replaces several hundred lines of manual AudioContext/RAF/timing code.

### Timing & Playhead
- `Transport.bpm.value` sets the tempo
- `Transport.position` gives current `"bars:beats:sixteenths"`
- `Tone.Loop` with `"4n"` interval fires a callback every beat
- `Tone.Draw.schedule` syncs each beat callback to the nearest animation frame
- Playhead highlights derived from Transport time — can't drift out of sync

### Grid & Rhymes
- Pre-generate bars with rhyme words from the selected word list
- Word lists have words grouped by `familyId` — words with the same familyId rhyme
- AABB pattern: pick a rhyme family, use 2 words from it for bars N and N+1, then a different family for N+2 and N+3, etc.
- Each bar = row of 4 cells; last cell shows the rhyme word
- Color-code rhyme pairs (same family = same accent color)
- Generate more bars as the user approaches the end (infinite scroll)

### Auto-scroll
- When playhead moves to a new bar, smoothly scroll the grid
- Target position: current bar at ~25% from the top of the visible grid area

### UI
- Dark, minimalist theme (complete retheme from the parchment starter)
- Clean sans-serif font (Inter, already loaded in the starter)
- Toolbar at top: beat/BPM selector, word list selector
- Grid takes up most of the screen
- Beat timeline above the grid with numbered beats (1, 2, 3, 4)
- Play/pause button centered at the bottom

---

## File Plan

### New / modified files in `website/src/`

```
app/
  layout.tsx                     -- update: dark theme, new metadata
  (main-layout)/
    layout.tsx                   -- simplify: just a minimal shell, no header/footer
    page.tsx                     -- main app: toolbar + grid + controls

components/
  FlowGrid/
    Grid.tsx                     -- scrolling grid container, renders bars
    Bar.tsx                      -- single bar row (4 beat cells + rhyme word)
    BeatCell.tsx                 -- one beat cell, highlights when active
    Timeline.tsx                 -- beat number indicators above the grid
  Toolbar.tsx                    -- top bar with selectors
  PlayButton.tsx                 -- play/pause button at the bottom

hooks/
  useAudioEngine.ts              -- Tone.js: Transport, Player, play/pause
  usePlayhead.ts                 -- Tone.Loop + Draw.schedule → currentBar, currentBeat
  useRhymes.ts                   -- load word list, generate AABB bar content

lib/
  rhymes.ts                      -- word list types, AABB pair generation algorithm
  constants.ts                   -- beat info, colors, etc.

styles/
  globals.css                    -- complete retheme: dark palette
```

### Data files to copy into `website/public/`

```
public/
  beats/
    drums-loop-60bpm.wav
    drums-loop-80bpm.wav
    drums-loop-100bpm.wav
    drums-loop-120bpm.wav
  data/
    word-lists.json              -- from rhyme-finder/data/
```

---

## Implementation Order

1. **Theme & shell** — Dark theme in globals.css, update root layout, strip starter content
2. **Data setup** — Copy beats + word-lists.json to public/, build rhyme generation logic in `lib/rhymes.ts`
3. **Static grid** — Grid/Bar/BeatCell components rendering bars with rhyme words (no animation yet)
4. **Audio engine** — `useAudioEngine` hook: Tone.Player + Transport, play/pause
5. **Playhead sync** — `usePlayhead` hook: Tone.Loop + Draw.schedule for beat callbacks, highlight active cells
6. **Auto-scroll** — Smooth scroll to keep current bar in the upper quarter
7. **Toolbar** — Beat selector (BPM dropdown), word list selector
8. **Wire it all together** — Main page composes everything, state flows through
9. **Polish** — Rhyme pair colors, responsive sizing, edge cases
