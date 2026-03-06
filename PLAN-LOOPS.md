# Loop System — Plan

## Goal

Transform tracks from single looping audio files into multi-loop structures. Each track has named loops (e.g. Verse, Chorus). The user queues loops during playback; when the current loop finishes its cycle, the queued loop starts seamlessly. The grid shows section headers, loop-repetition dividers, and upcoming queued sections. A row of loop buttons sits above the bottom bar.

## Test Audio

`tracks/basic-drums-80bpm/` contains:
- `verse-4bars.wav` — 4-bar verse loop
- `chorus-4bars.wav` — 4-bar chorus loop

Both at 80 BPM. Copy into `website/public/loops/basic-drums-80bpm/` for serving.

---

## Data Model

### `constants.ts` — Types

```ts
type Loop = {
  name: string   // "Verse", "Chorus", "Bridge"
  file: string   // "/loops/basic-drums-80bpm/verse-4bars.wav"
  bars: number   // how many bars one repetition of this loop lasts
}

type Track = {
  label: string
  bpm: number
  loops: Loop[]
}
```

Old single-loop tracks become `loops: [{ name: 'Loop', file, bars }]`. Tracks with one loop behave exactly as before — no loop selector shown, no section headers, same UX.

### Test track entry

```ts
{
  label: 'Basic Drums 80bpm',
  bpm: 80,
  loops: [
    { name: 'Verse', file: '/loops/basic-drums-80bpm/verse-4bars.wav', bars: 4 },
    { name: 'Chorus', file: '/loops/basic-drums-80bpm/chorus-4bars.wav', bars: 4 },
  ],
}
```

### Settings — `useSettings.ts`

No new persisted settings. Loop queue is ephemeral playback state. `selectedTrackIndex` already persists.

Bar count modes are removed — the grid is always infinite.

---

## Loop State (Minimal)

Three values drive everything:

```ts
currentLoopIndex: number        // which loop is actively playing
loopEpochBar: number            // bar where the current loop section started
queuedLoopIndex: number | null  // what plays next at the boundary (null = repeat current)
```

Queue depth is 1 — the user queues one upcoming loop at a time.

### Derived values

Given the current loop's `bars` count:
```
nextBoundaryBar = loopEpochBar + Math.ceil((currentBar - loopEpochBar + 1) / loop.bars) * loop.bars
```

The `transitionBar` is computed and locked in when the user queues a loop.

### Queuing flow

1. Play starts → `currentLoopIndex = 0`, `loopEpochBar = 0`, `queuedLoopIndex = null`
2. User clicks "Chorus" → compute `transitionBar`, set `queuedLoopIndex = 1`, schedule audio transition
3. Playhead reaches `transitionBar` → audio swaps, `currentLoopIndex = 1`, `loopEpochBar = transitionBar`, `queuedLoopIndex = null`
4. If nothing queued, current loop repeats via `loop: true` — no action needed.

### Stop behavior

Stop keeps `currentLoopIndex` (pressing play restarts from that loop). Clears `queuedLoopIndex` and resets `loopEpochBar` to 0.

---

## Audio Engine

### Buffer pre-loading

On track selection, load ALL loop audio files as `Tone.ToneAudioBuffer` objects upfront. Store in a ref array indexed by loop index. Create one `Tone.Player` for the initial loop (synced, `loop: true`).

### Transition approach

When the user queues a different loop:

1. Compute `transitionBar` (next loop boundary)
2. Create a new `Tone.Player` with the queued loop's buffer, `loop: true`
3. `newPlayer.sync().start(\`${transitionBar}:0:0\`)` — scheduled to start at boundary
4. `Transport.schedule()` at the same bar to: stop/dispose old player, update playerRef, update React state via `Tone.Draw.schedule()`
5. Store the Transport event ID + pending player ref so we can cancel if user re-queues

### Cancelling a queued transition

If user changes their mind before the boundary:
1. `Transport.clear(pendingEventId)` — cancel the scheduled callback
2. `pendingPlayer.unsync()` + `pendingPlayer.dispose()` — clean up the standby player
3. Reset queue state

### Same-loop repeat

When `queuedLoopIndex` is null, `loop: true` on the player handles repetition — zero code needed.

### What `useAudioEngine` exposes

```ts
{
  isPlaying, selectedTrackIndex, togglePlay, changeTrack, stop,  // existing
  currentLoopIndex,           // NEW: which loop is playing
  scheduleTransition,         // NEW: (loopIndex, transitionBar) → schedule audio swap
  cancelTransition,           // NEW: cancel pending swap
}
```

---

## Grid Changes

### Separator computation

The grid receives three values: `currentLoopIndex`, `loopEpochBar`, and `queuedLoopIndex` (+ `transitionBar`). Combined with the track's loop definitions, it computes separators on the fly:

For each bar index, check:
1. **Bar 0** (or first bar after intro): section header with initial loop name
2. **Bar === transitionBar** (if queued): section header with queued loop name
3. **Bar is at a loop-repetition boundary** (every `loop.bars` bars within same section): dashed divider
4. After the transition, the new loop's `bars` count drives subsequent dividers

For single-loop tracks (1 loop): no headers, just dashed dividers every `loop.bars` bars.

### Visual elements

Section header (loop changes):
```tsx
<div className="flex items-center gap-2 px-1 py-1">
  <span className="text-xs font-semibold text-accent uppercase tracking-wide">{loopName}</span>
  <div className="flex-1 border-t border-accent/40" />
</div>
```

Loop-repeat divider (same loop continues):
```tsx
<div className="border-t border-dashed border-border my-1" />
```

### Grid display

```
[Verse]─────────────────────        ← section header
[    ] [    ] [    ] [time]
[    ] [    ] [    ] [lime]
[    ] [    ] [    ] [money]
[    ] [    ] [    ] [honey]
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄        ← dashed divider (verse repeats)
[    ] [    ] [    ] [fire]
[    ] [    ] [    ] [wire]
[    ] [    ] [    ] [sunny]
[    ] [    ] [    ] [bunny]
[Chorus]────────────────────        ← section header (queued loop)
[    ] [    ] [    ] [cake]
[    ] [    ] [    ] [lake]
[    ] [    ] [    ] [stop]
[    ] [    ] [    ] [drop]
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄        ← dashed divider (chorus repeats)
[    ] [    ] [    ] [...]
```

The grid extends as far as it needs to fill the screen. The last section repeats indefinitely — dashed dividers mark each loop repetition.

When the user queues a new loop, the next separator (which was a dashed divider) is replaced with a section header for the new loop.

---

## Loop Selector UI

### New component: `LoopSelector.tsx`

Positioned between the Grid and PlayButton. Only rendered when the selected track has more than one loop.

```
┌─────────────────────────────────────────┐
│  [ Verse ]  [[ Chorus ]]  [ Bridge ]    │  ← loop buttons
├─────────────────────────────────────────┤
│  [stop]  [play]           Basic Drums ▼ │  ← existing PlayButton
└─────────────────────────────────────────┘
```

- **Current loop**: filled/highlighted button (accent bg)
- **Queued loop**: pulsing border or "next" indicator
- **Click during playback**: queue that loop for next boundary
- **Click while stopped**: set it as the starting loop immediately
- **Click current loop while something is queued**: clears the queue

### Props

```ts
type LoopSelectorProps = {
  loops: Loop[]
  currentLoopIndex: number
  queuedLoopIndex: number | null
  onQueueLoop: (index: number) => void
}
```

---

## Rhyme Generation — No Changes

Rhymes generate independently of loops. Loop boundaries are a visual/audio overlay. Infinite mode always, bars extend as playhead advances.

---

## Page Wiring (`page.tsx`)

```
FlowGrid component:
  useSettings()          — unchanged (barCount removed)
  useAudioEngine()       — updated: multi-buffer, transition scheduling
  usePlayhead()          — unchanged
  useRhymes()            — unchanged (always infinite)

  <Toolbar />            — unchanged
  <Timeline />           — unchanged
  <Grid />               — new props: loop state for separators
  <LoopSelector />       — NEW: only shown when track has >1 loop
  <PlayButton />         — unchanged
  <Sidebar />            — barCount dropdown removed
```

---

## Migration Path

Convert all existing tracks from `{ label, bpm, file, bars }` to `{ label, bpm, loops: [{ name: 'Loop', file, bars }] }`.

Single-loop tracks: loop selector hidden, no section headers, behavior identical to current.

---

## Edge Cases

- **Stop while loop queued**: Clear the queue, cancel pending transition. Keep currentLoopIndex.
- **Change track while playing**: Stop, load new track, start from loop 0.
- **Pause/resume with queued loop**: Queue + pending transition persist. Fires at boundary.
- **Intro bars**: Play before the first loop section header.
- **No track (None)**: No loops, no loop selector. Metronome-only unchanged.
- **Preset mode**: Presets bypass the loop system entirely.
- **User re-queues before boundary**: Cancel old transition, schedule new one.

---

## Implementation Order

1. **Data model** — Update `Track` type, convert existing tracks, add test track, remove bar count
2. **Copy test audio** — `tracks/basic-drums-80bpm/*.wav` → `website/public/loops/basic-drums-80bpm/`
3. **Audio engine** — Multi-buffer loading, transition scheduling, cancel support
4. **Loop state** — `currentLoopIndex` + `queuedLoopIndex` + `loopEpochBar` in page.tsx
5. **Loop selector component** — Button row UI
6. **Grid separators** — Section headers and dashed dividers computed from loop state
7. **Page wiring** — Connect everything
8. **Polish** — Auto-scroll through separators, edge cases, visual refinement
