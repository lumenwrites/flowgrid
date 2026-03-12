# Grid Text Format

A human-readable text format for representing FlowGrid grids — the words/rhymes placed on beats. This replaces both the `Preset` system (flat `words[]` + `pattern`) and the mix `rhymes[]` arrays with something more expressive: words can go on any beat, rhyme groups are explicit (not inferred from position), and the whole thing is easy to read and edit as plain text.

## Two modes, side by side

The app has two fundamentally different ways bars get their content:

1. **Auto-generated (loop mode)** — `useRhymes` + `generateBars()` produces an infinite stream of `BarData[]` from word lists with seeded PRNG. Bars auto-extend as playback progresses. `buildDisplayBars()` remaps around instrumental sections. This stays exactly as-is — no changes needed.

2. **Grid (scripted content)** — A hand-authored grid of words placed on specific beats. Used by **mixes with custom words** and **presets**. The grid text is parsed into `BarData[]` (the same type auto-generation produces), so everything downstream (Grid.tsx, Bar.tsx, BeatCell.tsx, playhead, etc.) works identically for both modes.

The key design constraint: both modes produce `BarData[]`. The grid system adds an optional `beatWords` field to `BarData` for per-beat word placement, but everything else flows through the same pipeline. In `page.tsx`, the `displayBars` memo already picks between `mixBars`, `presetBars`, and auto-generated `bars` — grid just changes how `mixBars`/`presetBars` are produced.

**Current flow in page.tsx:**
```
displayBars = mixBars ?? presetBars ?? buildDisplayBars(bars, loopInfo)
```
- `mixBars`: if mix has `rhymes` → `generateBarsFromPreset()`; else → slice from auto `bars`
- `presetBars`: `generateBarsFromPreset()` from preset JSON
- `bars`: auto-generated infinite stream from `useRhymes`

**New flow (same shape, different producers):**
```
displayBars = mixBars ?? presetBars ?? buildDisplayBars(bars, loopInfo)
```
- `mixBars`: if mix has `grid` → `generateBarsFromGrid(parseGrid(grid))`; else → slice from auto `bars`
- `presetBars`: `generateBarsFromGrid(parseGrid(grid))` from preset JSON
- `bars`: auto-generated infinite stream from `useRhymes` (unchanged)

The only difference is `generateBarsFromPreset` → `generateBarsFromGrid(parseGrid(...))`. Same output type. Everything downstream is untouched.

## barsPerLine is now track-intrinsic (already done)

`barsPerLine` has been removed as a user setting. It's now derived from the current track's `barsPerLine` property (defaulting to 1). Every track declares whether it's rap-style (1) or musical-style (2). For tracks like Basic Drums that work both ways, there are two track entries pointing at the same audio files: "Basic Drums" (barsPerLine=1) and "Basic Drums (Musical)" (barsPerLine=2).

This simplifies the grid format — grid line width is always fixed per track, determined by `barsPerLine * BEATS_PER_BAR`.

## The Format

Each text line = one UI row = `barsPerLine` bars. Beats are space-separated tokens.

For rap tracks (barsPerLine=1): 4 tokens per line.
For musical tracks (barsPerLine=2): 8 tokens per line.

### Token types

- `_` — empty beat (no word)
- `[word]` — a word with no rhyme color (plain cue word)
- `[:N word]` — a rhymed word in rhyme group N (matching N = matching color)
- Section headers: `[SectionName]` on its own line (e.g. `[Verse]`, `[Chorus]`, `[Break]`)

### Examples

Typical AABB rap grid (barsPerLine=1, 4 tokens per line):
```
_ _ _ [:1 time]
_ _ _ [:1 lime]
_ _ _ [:2 money]
_ _ _ [:2 honey]
```

Musical track (barsPerLine=2, 8 tokens per line):
```
[Verse 1]
_ _ _ _ _ _ _ [:1 dawn]
_ _ _ _ _ _ _ [:1 gone]
_ _ _ _ _ _ _ [:2 made]
_ _ _ _ _ _ _ [:2 laid]

[Chorus]
_ _ _ _ _ _ _ [:3 squid]
_ _ _ _ _ _ _ [:3 did]
_ _ _ _ _ _ _ [:4 okay]
_ _ _ _ _ _ _ [:4 Ray]
```

Words on arbitrary beats:
```
_ [hello] _ [:1 time]
_ _ _ [:1 lime]
_ [cash] _ [:2 money]
_ _ _ [:2 honey]
```

With sections:
```
[Verse]
_ _ _ [:1 time]
_ _ _ [:1 lime]

[Chorus]
_ _ _ [:2 money]
_ _ _ [:2 honey]

[Break]
_ _ _ _
_ _ _ _
```

Instrumental break (all blanks):
```
_ _ _ _
_ _ _ _
```

## What Changes

### 1. New parser + serializer in `website/src/lib/grid-format.ts`

Create a new file with:

```ts
type BeatData = {
  word: string | null       // null = empty beat
  rhymeGroup: number | null // null = not a rhyme (plain word or empty)
}

type GridLine = {
  beats: BeatData[]          // length = barsPerLine * BEATS_PER_BAR
  section?: string           // section header attached to this line
}

type GridData = {
  lines: GridLine[]
}

function parseGrid(text: string): GridData
function serializeGrid(grid: GridData): string
```

**Parser rules:**
- Input is a string (lines separated by `\n`) or string[] (one entry per line)
- Blank lines / whitespace-only lines are ignored (visual separators)
- A line matching `[SomeName]` (bracketed name, no `:` prefix, on its own) is a section header — attaches as `section` on the next grid line
- Everything else is a bar line: split by spaces, but bracket tokens like `[:1 word]` are a single token despite containing a space. So the parser needs to handle bracket grouping: scan for `[`, collect until `]`, that's one token. Everything outside brackets separated by whitespace.
- Token `_` → `{ word: null, rhymeGroup: null }`
- Token `[word]` → `{ word: "word", rhymeGroup: null }`
- Token `[:N word]` → `{ word: "word", rhymeGroup: N }`
- N is a positive integer
- The number of beat tokens per line is flexible (4 for barsPerLine=1, 8 for barsPerLine=2). The parser does NOT need a barsPerLine param — it just counts tokens per line. `generateBarsFromGrid` handles splitting lines into bars.

**Serializer**: inverse of parser. Produces canonical text. Section headers get a blank line before them (except the first).

### 2. New function: `generateBarsFromGrid()` in `website/src/lib/rhymes.ts`

```ts
function generateBarsFromGrid(
  grid: GridData,
  fillMode: FillMode = 'all',
): BarData[]
```

Replaces `generateBarsFromPreset()`. Converts `GridData` → `BarData[]`.

Key logic:
- Each `GridLine` has N beats. N / BEATS_PER_BAR = how many bars per line (usually 1 or 2).
- For a line with 8 beats: beats[0..3] = bar 0, beats[4..7] = bar 1.
- Rhyme group N maps to `RHYME_COLORS[(N - 1) % RHYME_COLORS.length]`
- `familyId` = rhyme group number
- The **last beat that has a rhymed word** in each bar becomes `rhymeWord`/`rhymeColor` on that bar's `BarData` (preserving current behavior for the common case)
- All beats with words get stored in `beatWords` array on the `BarData`
- Section headers: lines where section is "Break"/"Intro"/"Outro" and all beats are empty → `instrumental: true`
- `fillMode` applies to rhymed words: `rhymeHidden` set per line based on position in pair (same logic as current code)
- Section headers from the grid can be used to build `LoopInfo` / `sectionStarts` for display — but this is already handled by the mix's `sections` array. The grid sections are mainly for human readability. However, for presets that don't have a separate sections definition, the grid sections could drive the section headers in the UI.

### 3. Extend `BarData` to support words on any beat

Add optional field to `BarData`:

```ts
type BeatWord = {
  word: string
  rhymeGroup: number | null
  rhymeColor: RhymeColor | null
}

type BarData = {
  // ... existing fields stay (backward compat for auto-generated bars) ...
  beatWords?: (BeatWord | null)[]  // length BEATS_PER_BAR, one per beat. null = empty
}
```

When `beatWords` is present, `Bar.tsx` uses it. When absent (auto-generated bars), existing logic applies. This means auto-generated bars need zero changes.

### 4. Update `Bar.tsx` to render per-beat words

When `bar.beatWords` exists:
- For each beat, check `bar.beatWords[beatIdx]`
- If it has a word, pass it to `BeatCell` as `rhymeWord`/`rhymeColor`
- This replaces the current `showRhyme` check that only shows words on the last beat of the last bar in a line

When `bar.beatWords` is absent: existing behavior unchanged.

`BeatCell.tsx` needs no changes — it already accepts optional word/color props.

### 5. Replace mix `rhymes` with `grid` on the `Mix` type

In `constants.ts`, change:
```ts
type Mix = {
  name: string
  files: AudioFile[]
  sections: MixSection[]
  rhymes?: string[]         // REMOVE
  grid?: string | string[]  // ADD — grid format text
}
```

Convert all existing mix `rhymes` arrays to grid format strings. The mixes that currently have `rhymes` are:
- **Whose Line Rap → Nerd Rap**: `['grapple', 'apple', 'fool', 'school', 'desk', 'pest', 'look', 'book']` (barsPerLine=1, so 4 tokens per line)
- **Whose Line Rap → Camp Rap**: `['do', 'canoe', 'away', 'spray', ...]` (27 words, barsPerLine=1)
- **Tutorial**: `['cat', 'hat', 'sun', 'fun', ...]` (64 words, barsPerLine=1)
- **Villain Song → Lyrics**: uses `VILLAIN_SONG_RHYMES` (16 words, barsPerLine=2, so 8 tokens per line)

In `page.tsx`, the `mixBars` memo changes from:
```ts
if (activeMix.rhymes) {
  return generateBarsFromPreset(
    { words: activeMix.rhymes, pattern: settings.rhymePattern },
    barsPerLine, settings.fillMode, 0,
  )
}
```
to:
```ts
if (activeMix.grid) {
  const gridText = Array.isArray(activeMix.grid) ? activeMix.grid.join('\n') : activeMix.grid
  return generateBarsFromGrid(parseGrid(gridText), settings.fillMode)
}
```

Mixes without `grid` still fall back to slicing from the auto-generated `bars` pool (unchanged).

### 6. Replace `Preset` type with grid format

Change `Preset` type in `rhymes.ts`:
```ts
type Preset = {
  grid: string | string[]  // grid format text
  audio?: string
}
```

Remove `generateBarsFromPreset()` entirely (replaced by `generateBarsFromGrid`).

Update preset JSON files and `page.tsx` preset loading.

Convert `website/public/presets/example.json` from:
```json
{ "words": ["boat", "coat", ...], "pattern": "AABB", "audio": "..." }
```
to:
```json
{
  "grid": [
    "_ _ _ [:1 boat]",
    "_ _ _ [:1 coat]",
    "_ _ _ [:2 now]",
    "_ _ _ [:2 how]",
    "_ _ _ [:3 gold]",
    "_ _ _ [:3 old]",
    "_ _ _ [:4 eat]",
    "_ _ _ [:4 asleep]",
    "_ _ _ [:5 island]",
    "_ _ _ [:5 smiling]",
    "_ _ _ [:6 hook]",
    "_ _ _ [:6 book]",
    "_ _ _ [:7 cry]",
    "_ _ _ [:7 by]",
    "_ _ _ [:8 book]",
    "_ _ _ [:8 look]"
  ],
  "audio": "/examples/vocals-test.mp3"
}
```

### 7. Write tests

Add `website/src/lib/__tests__/grid-format.test.ts`:
- Parse basic 4-beat grid
- Parse 8-beat grid (barsPerLine=2)
- Parse grid with words on non-last beats
- Parse grid with section headers
- Blank lines ignored
- Roundtrip: `serializeGrid(parseGrid(text))` produces equivalent text
- `generateBarsFromGrid` produces correct `BarData[]` with proper colors, familyIds, beatWords
- Error handling: wrong token count, malformed brackets

## TODO

- [ ] Create `website/src/lib/grid-format.ts` with `parseGrid()` and `serializeGrid()`
- [ ] Add `BeatWord` type and `beatWords` optional field to `BarData` in `rhymes.ts`
- [ ] Create `generateBarsFromGrid()` in `rhymes.ts` that converts `GridData` → `BarData[]`
- [ ] Update `Bar.tsx` to render `beatWords` when present (words on any beat)
- [ ] Replace `rhymes?: string[]` with `grid?: string | string[]` on `Mix` type in `constants.ts`
- [ ] Convert all existing mix `rhymes` arrays to grid format (Nerd Rap, Camp Rap, Tutorial, Villain Song Lyrics)
- [ ] Update `mixBars` memo in `page.tsx` to use `parseGrid` + `generateBarsFromGrid`
- [ ] Replace `Preset` type with grid-based version, remove `generateBarsFromPreset()`
- [ ] Update preset loading in `page.tsx` to use new format
- [ ] Convert `website/public/presets/example.json` to grid format
- [ ] Write tests in `website/src/lib/__tests__/grid-format.test.ts`
- [ ] Update SPEC.md and PLAN.md to document the grid format

## DONE

- [x] Remove `barsPerLine` from user settings — now derived from track's `barsPerLine` property
- [x] Remove "Bars per line" dropdown from Sidebar
- [x] Add "Basic Drums (Musical)" duplicate track entry with barsPerLine=2
- [x] Remove unused `BARS_PER_LINE_OPTIONS` constant
