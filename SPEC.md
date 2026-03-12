# Spec

A practice app for freestyle rap and improvising musicals.

Shows a grid of bars (4 beats per bar), with a playhead running through them row by row. The grid smoothly scrolls to keep the current bar near the top of the screen. Rhyme words appear at the end of each line, color-coded by rhyme family.

```
[        ] [        ] [        ] [time]     <- red
[        ] [        ] [        ] [lime]     <- red
[        ] [        ] [        ] [money]    <- cyan
[        ] [        ] [        ] [honey]    <- cyan
```

App comes with tracks, each containing one or more loops (e.g. Verse, Chorus). The user selects a track and a word list, presses play, and practices rapping/singing along. For multi-loop tracks, loop buttons appear above the play bar — tap one to queue it as the next loop after the current one finishes its cycle.

Needs to be responsive and work equally well on desktop, tablet, phone.

## Implemented features

- **Track selection** — Choose from available tracks (Villain Song, Basic Drums, Hoedown, Whose Line Rap, Yucca, etc.) or "None" for metronome-only mode. Each track has its own BPM, and the transport matches it automatically. Tracks are categorized as "Rap" or "Musicals" in the track picker modal, shown as tabs.
- **Multi-loop tracks** — Tracks can have multiple loops (e.g. Verse, Chorus), each with its own audio file and bar count. A row of loop buttons appears above the play bar for multi-loop tracks. Tapping a loop queues it to start after the current loop's next cycle boundary (queue depth of 1). Tapping the current loop while something is queued cancels the queue. The grid shows section headers (e.g. "[Chorus]") at loop transitions and thin dividers where a loop repeats. Single-loop tracks work identically to before — no loop buttons shown.
- **Instrumental sections** — Loops and mix sections can be marked `instrumental: true` (e.g. Hoedown's Break). Instrumental sections show blank bars with no rhyme words, and don't consume from the rhyme sequence — so rhyme pairing stays intact across instrumental gaps. Works in both loop mode (dynamic section transitions) and mix mode (fixed structure).
- **Mixes** — Tracks can optionally have mixes (e.g. Instrumental, Lyrics, Scat) — full-length audio files with a defined section structure. Mix buttons appear next to loop buttons, separated by a vertical divider, with squarish corners. Clicking a mix loads the full audio (non-looping) with section headers in the grid matching the song structure. Mixes can optionally provide a `grid` (grid text format) for custom word placement; otherwise normal random rhymes are used. Auto-stops at the end. Clicking a loop button exits mix mode.
- **Grid text format** — Human-readable format for placing words on specific beats. Each text line = one UI row. Tokens: `_` (empty), `[word]` (cue word), `[:N word]` (rhymed word in group N). Section headers like `[Verse]` or `[Step 1: Listen]` on their own line. Used by mix `grid` fields. Parsed by `parseGrid()`, converted to `BarData[]` by `generateBarsFromGrid()`. When a grid has section headers, `Mix.sections` can be omitted — sections are derived automatically via `deriveSectionsFromGrid()`. Sections named Intro/Break/Outro with all-blank beats are auto-detected as instrumental.
- **Track preview** — The track picker modal has a preview button on each track that plays the Lyrics mix (or first mix, or first loop as fallback) using a standalone Audio element — no interaction with the grid or transport.
- **Track-intrinsic barsPerLine** — Each track declares its `barsPerLine` (1 for rap, 2 for musicals). Not a user setting — determined by the track. For tracks that work both ways (e.g. Basic Drums), duplicate track entries exist with different `barsPerLine`.
- **Metronome toggle** — Enable/disable a metronome click that plays alongside the track (separate loop files matched by BPM). Toggle lives in the toolbar for quick access.
- **Word list selection** — Pick from 9 curated word lists (elementary, rapper's toolkit, etc.) sourced from the rhyme-finder.
- **Bars per line** — 1 bar per line (4 beats, suited for rap) or 2 bars per line (8 beats, suited for improv musicals). Timeline, playhead, and rhyme placement all adapt. Determined by the track's `barsPerLine` property.
- **Rhyme patterns** — AABB (couplets: consecutive lines rhyme) or ABAB (alternating: lines 1&3 rhyme, 2&4 rhyme). Patterns work correctly with both 1 and 2 bars per line.
- **Infinite grid** — The grid always appears infinite, generating bars ahead as playback progresses. Bars extend automatically in chunks.
- **Count-in** — Optional 0/1/2 countdown lines before content starts. The track audio is delayed and the grid shows blank cells. One "line" equals `barsPerLine` bars (1 bar for rap tracks, 2 for musicals), so the count-in always matches the visual row structure. Countdown is a transport-level delay completely decoupled from content — rhyme generation knows nothing about it. The metronome always plays during countdown regardless of the global metronome setting. Works identically for loops and mixes. Setting lives in the audio popup (volume/BPM panel).
- **Fill modes** — Controls which rhyme words are revealed:
  - *All Rhymes* — every line shows its word (default)
  - *Setup Punchline* — first line shows `????`, second reveals the word
  - *Off the Cliff* (chasing rhymes) — first line shows the word, second shows `????`
  - *All Blanks* — every line shows `????` (full freestyle)
  - Hidden cells still show their rhyme color so you can see the pattern.
- **Seeded randomization** — Rhyme generation uses a deterministic seed (mulberry32 PRNG). Same seed = same rhymes every time. Seed shown in sidebar with a Shuffle button; dice icon in toolbar for quick re-roll.
- **Custom BPM** — When a track is selected, a BPM control appears in the sidebar, defaulting to the track's native BPM. Tracks with `bpmVariants` (e.g. Basic Drums at 60/80/100/120) show a dropdown and switch between pre-rendered audio files for artifact-free playback. Other tracks show a slider (40-200, 10-step) that adjusts tempo in real time with pitch preservation via Tone.js GrainPlayer (granular synthesis). BPM resets to the track's native value when switching tracks. Persisted in settings.
- **Metronome BPM** — When track is "None", a BPM dropdown (60/80/100/120) appears in the sidebar to control metronome speed.
- **Settings sidebar** — Hamburger menu (left) opens a slide-over panel with audio offset (latency compensation) slider.
- **Audio popup** — Tap the speaker icon in the PlaybackToolbar to access volume sliders, BPM controls, countdown setting, and metronome BPM. Track and metronome volumes are separate.
- **Settings persistence** — All settings saved to localStorage and restored on reload. Works in PWA contexts.
- **Playhead sync** — Smooth playhead line tracks position via RAF, with beat-level highlighting via Tone.Loop + Draw.schedule. Playhead stays visible when paused. Turns the rhyme's color when over the rhyme cell.
- **Manual scroll + click-to-seek** — The grid is freely scrollable. Tapping/clicking any beat cell seeks playback to that exact beat, including across section boundaries (the correct loop audio is loaded automatically). During playback, manual scrolling temporarily pauses auto-scroll (re-engages after 5s or on next beat click). Works while playing or paused.
- **Auto-scroll** — Grid smoothly scrolls to keep the current bar near the top. Scroll starts one beat early so the animation completes before the next row begins. Suppressed while user is manually scrolling.
- **Color-coded rhymes** — Rhyme pairs share the same background color (8 rotating colors). Dim by default, brighten when the playhead activates them. Active borders are vivid (~500 shade) for strong contrast.
- **Volume controls** — Separate track volume and metronome volume sliders (0-100%) in the audio popup. Values persist across sessions.
- **Audio offset** — Slider (-200ms to +200ms, 10ms steps) to shift audio timing, compensating for Bluetooth/wireless headphone latency. Negative values play audio earlier. Applied by offsetting player sync start times on the Tone.js transport; re-syncs live when adjusted.
- **PWA support** — Installable as a standalone app on mobile/desktop. Service worker precaches all audio files, word lists, and app shell for full offline support. Web manifest with dark theme, portrait orientation, and multiple icon sizes.

## Future features

- Audio recording while playing
- CMU dictionary-based live rhyme lookup (currently uses pre-grouped word lists only)

## UI

Minimalist dark theme.
- **Toolbar** (top): hamburger menu, FLOWGRID label, dice (randomize seed), metronome toggle. Respects safe area insets on mobile.
- **Timeline**: Numbered beats (1-4 or 1-8 depending on bars per line) with subdivision ticks
- **Grid**: Scrolling bars with rhyme words, playhead overlay
- **Loop selector** (above play bar): Loop buttons for multi-loop tracks + mix buttons for tracks with mixes (hidden when neither applies)
- **PlaybackToolbar** (bottom center): Play/pause + stop buttons, track picker (opens categorized modal with Rap/Musicals tabs), audio popup (speaker icon — volumes, BPM, countdown)
- **Sidebar** (left slide-over): Audio offset / latency compensation slider. Respects safe area insets.
- **Dictionary modal**: Word list picker, rhyme pattern, fill mode, seed. Opened from toolbar.

## Audio files

All audio lives in `website/public/tracks/` with a standardized structure:

```
tracks/
├── metronome/                  — metronome clicks by BPM
│   └── {bpm}bpm.wav
├── {track-slug}/               — each track gets a directory
│   ├── loops/                  — repeating sections
│   │   └── {NN}-{name}-{bars}bars-{bpm}bpm.wav
│   └── mixes/                  — full-length versions (optional)
│       └── {name}.wav
```

### Loop file naming convention

Loop files follow the pattern: `{NN}-{name}-{bars}bars-{bpm}bpm.{ext}`

- `{NN}` — two-digit order prefix (01, 02, 03...) so files sort naturally
- `{name}` — section name (verse, chorus, intro, break, etc.)
- `{bars}bars` — number of bars in the loop (e.g. 4bars, 8bars)
- `{bpm}bpm` — BPM of the audio file

Examples: `01-verse-8bars-80bpm.wav`, `02-chorus-4bars-120bpm.wav`, `03-break-2bars-120bpm.wav`

For **variant tracks** (multiple pre-rendered BPMs), the Loop config `file` field omits the BPM suffix (e.g. `01-verse-4bars.wav`) and `loopUrl()` appends `-{bpm}bpm` dynamically based on the selected BPM. For **non-variant tracks**, the `file` field is the full filename including BPM.

Track `dir` field in constants.ts points to the directory; loop/mix `file` fields are just filenames. Path helpers `loopUrl()` and `mixUrl()` resolve full paths. New tracks should be added to `AVAILABLE_TRACKS` in `website/src/lib/constants.ts`.
