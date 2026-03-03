# Spec

A practice app for freestyle rap and improvising musicals.

Shows a grid of bars (4 beats per bar), with a playhead running through them row by row. The grid smoothly scrolls to keep the current bar near the top of the screen. Rhyme words appear at the end of each line, color-coded by rhyme family.

```
[        ] [        ] [        ] [time]     <- red
[        ] [        ] [        ] [lime]     <- red
[        ] [        ] [        ] [money]    <- cyan
[        ] [        ] [        ] [honey]    <- cyan
```

App comes with loops of beats. Each loop runs forever. The user selects a beat, a word list, presses play, and practices rapping/singing along.

Needs to be responsive and work equally well on desktop, tablet, phone.

## Implemented features

- **Beat selection** — Choose from available loops (drums at various BPMs, scene-to-rap, etc.) or "None" for metronome-only mode. Each loop has its own BPM baked into the filename, and the transport matches it automatically.
- **Metronome toggle** — Enable/disable a metronome click that plays alongside the beat (separate loop files matched by BPM). Toggle lives in the toolbar for quick access.
- **Word list selection** — Pick from 9 curated word lists (elementary, rapper's toolkit, etc.) sourced from the rhyme-finder.
- **Bars per line** — 1 bar per line (4 beats, suited for rap) or 2 bars per line (8 beats, suited for improv musicals). Timeline, playhead, and rhyme placement all adapt.
- **Rhyme patterns** — AABB (couplets: consecutive lines rhyme) or ABAB (alternating: lines 1&3 rhyme, 2&4 rhyme). Patterns work correctly with both 1 and 2 bars per line.
- **Bar count** — Generate a fixed number of bars (8, 16, 24, 32, 48, 64) or infinite (generates ahead continuously as you play).
- **Settings sidebar** — Hamburger menu in the toolbar opens a slide-over panel with all settings: beat, words, bars per line, bar count, rhyme pattern.
- **Settings persistence** — All settings saved to localStorage and restored on reload. Works in PWA contexts.
- **Playhead sync** — Smooth playhead line tracks beat position via RAF, with beat-level highlighting via Tone.Loop + Draw.schedule.
- **Auto-scroll** — Grid smoothly scrolls to keep the current bar near the top.
- **Color-coded rhymes** — Rhyme pairs share the same background color (8 rotating dark accent colors).

## Future features

- Fill modes (setup/punchline, off the cliff — show `????` on some lines)
- Audio recording while playing
- PWA support (installable, offline)
- CMU dictionary-based live rhyme lookup (currently uses pre-grouped word lists only)

## UI

Minimalist dark theme.
- **Toolbar** (top): FLOWGRID label, metronome toggle, hamburger menu
- **Timeline**: Numbered beats (1-4 or 1-8 depending on bars per line) with subdivision ticks
- **Grid**: Scrolling bars with rhyme words, playhead overlay
- **Play button** (bottom center): Play/pause and stop controls
- **Sidebar** (right slide-over): All settings dropdowns

## Audio files

`./beats/` (repo root) and `website/public/beats/` contain:
- `drums-loop-{bpm}bpm.wav` — drum loops at 60, 80, 100, 120 BPM (1 bar each)
- `metronome-loop-{bpm}bpm.wav` — metronome clicks at matching BPMs
- `scene-to-rap-loop-100bpm.m4a` — 8-bar musical loop at 100 BPM

Beat files in `website/public/beats/` are served directly. New beats should be added there and registered in `website/src/lib/constants.ts` (`AVAILABLE_BEATS` array). Metronome files are matched by BPM via the `METRONOME_FILES` map.
