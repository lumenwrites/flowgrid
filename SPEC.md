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

- **Track selection** — Choose from available tracks (drums at various BPMs, scene-to-rap, etc.) or "None" for metronome-only mode. Each track has its own BPM, and the transport matches it automatically.
- **Multi-loop tracks** — Tracks can have multiple loops (e.g. Verse, Chorus), each with its own audio file and bar count. A row of loop buttons appears above the play bar for multi-loop tracks. Tapping a loop queues it to start after the current loop's next cycle boundary (queue depth of 1). Tapping the current loop while something is queued cancels the queue. The grid shows section headers (e.g. "[Chorus]") at loop transitions and thin dividers where a loop repeats. Single-loop tracks work identically to before — no loop buttons shown.
- **Example tracks** — Tracks can optionally have example versions (e.g. Instrumental, Lyrics, Scat) — full-length audio files with a defined section structure. Example buttons appear next to loop buttons, separated by a vertical divider, with squarish corners. Clicking an example plays the full audio once (non-looping), with section headers in the grid matching the song structure. Examples can optionally provide a `rhymes` array for custom words; otherwise normal random rhymes are used. Auto-stops at the end and returns to loop mode. Clicking a loop button or stop during example playback exits example mode.
- **Metronome toggle** — Enable/disable a metronome click that plays alongside the track (separate loop files matched by BPM). Toggle lives in the toolbar for quick access.
- **Word list selection** — Pick from 9 curated word lists (elementary, rapper's toolkit, etc.) sourced from the rhyme-finder.
- **Bars per line** — 1 bar per line (4 beats, suited for rap) or 2 bars per line (8 beats, suited for improv musicals). Timeline, playhead, and rhyme placement all adapt.
- **Rhyme patterns** — AABB (couplets: consecutive lines rhyme) or ABAB (alternating: lines 1&3 rhyme, 2&4 rhyme). Patterns work correctly with both 1 and 2 bars per line.
- **Infinite grid** — The grid always appears infinite, generating bars ahead as playback progresses. Bars extend automatically in chunks.
- **Intro bars** — Optional 1/2/4/6/8 intro bars where the track plays but rhyme words are hidden, giving time to get into the groove. Rhyme patterns start fresh after intro bars so the first visible line always begins a complete pair.
- **Fill modes** — Controls which rhyme words are revealed:
  - *All Rhymes* — every line shows its word (default)
  - *Setup Punchline* — first line shows `????`, second reveals the word
  - *Off the Cliff* — first line shows the word, second shows `????`
  - *All Blanks* — every line shows `????` (full freestyle)
  - Hidden cells still show their rhyme color so you can see the pattern.
- **Seeded randomization** — Rhyme generation uses a deterministic seed (mulberry32 PRNG). Same seed = same rhymes every time. Seed shown in sidebar with a Shuffle button; dice icon in toolbar for quick re-roll.
- **Metronome BPM** — When track is "None", a BPM dropdown (60/80/100/120) appears in the sidebar to control metronome speed.
- **Settings sidebar** — Hamburger menu (left) opens a slide-over panel with all settings: track, volumes, metronome BPM, words, bars per line, intro bars, rhyme pattern, fill mode, seed, audio offset.
- **Settings persistence** — All settings saved to localStorage and restored on reload. Works in PWA contexts.
- **Playhead sync** — Smooth playhead line tracks position via RAF, with beat-level highlighting via Tone.Loop + Draw.schedule. Playhead stays visible when paused. Turns the rhyme's color when over the rhyme cell.
- **Auto-scroll** — Grid smoothly scrolls to keep the current bar near the top. Scroll starts one beat early so the animation completes before the next row begins.
- **Color-coded rhymes** — Rhyme pairs share the same background color (8 rotating colors). Dim by default, brighten when the playhead activates them. Active borders are vivid (~500 shade) for strong contrast.
- **Volume controls** — Separate track volume and metronome volume sliders (0-100%) in the sidebar. Values persist across sessions.
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
- **Loop selector** (above play bar): Loop buttons for multi-loop tracks + example buttons for tracks with examples (hidden when neither applies)
- **Play button** (bottom center): Play/pause and stop controls
- **Sidebar** (left slide-over): All settings dropdowns, volume sliders. Scrollable on small screens. Respects safe area insets.

## Audio files

`./loops/` (repo root) and `website/public/loops/` contain:
- `drums-loop-{bpm}bpm.wav` — drum loops at 60, 80, 100, 120 BPM (1 bar each)
- `metronome-loop-{bpm}bpm.wav` — metronome clicks at matching BPMs
- `scene-to-rap-loop-100bpm.m4a` — 8-bar musical loop at 100 BPM
- `basic-drums-80bpm/verse-4bars.wav`, `chorus-4bars.wav` — multi-loop drum track (Verse + Chorus)

Track files in `website/public/tracks/` are served directly. Multi-loop tracks use subdirectories. New tracks should be added there and registered in `website/src/lib/constants.ts` (`AVAILABLE_TRACKS` array). Tracks with examples have an `examples/` subdirectory with full-length audio files plus a `loops/` subdirectory for the loop files. Metronome files are matched by BPM via the `METRONOME_FILES` map.
