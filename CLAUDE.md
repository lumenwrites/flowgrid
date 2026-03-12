# Project Instructions

Read `SPEC.md` for what we're building and what's implemented.
Read `PLAN.md` for the technical architecture and file structure.

All app source is in `website/src/`. The app is Next.js 16 + Tone.js + Tailwind. Single-page app at `(main-layout)/page.tsx`.

## Key files to understand the app

- `website/src/lib/constants.ts` — All config: tracks (with loops + mixes + bpmVariants + instrumental sections), path helpers (`loopUrl`, `mixUrl`, `getLoopForBar`), metronome files, rhyme colors, fill modes, types
- `website/src/hooks/useAudioEngine.ts` — Tone.js audio playback (Player for variant tracks, GrainPlayer for non-variant, transition scheduling, mix loading, metronome, volume, custom BPM)
- `website/src/components/LoopSelector.tsx` — Loop buttons + mix buttons (queue next loop during playback, or load a full mix)
- `website/src/hooks/usePlayhead.ts` — Beat tracking and smooth playhead position
- `website/src/hooks/useRhymes.ts` — Word list loading, bar generation, infinite extending (seed-aware)
- `website/src/hooks/useSettings.ts` — localStorage persistence (all settings including seed, fill mode, countdown lines, metronome BPM, track BPM, track/metronome volume)
- `website/src/lib/grid-format.ts` — Grid text format parser/serializer (`parseGrid`, `serializeGrid`); types: `BeatData`, `GridLine`, `GridData`
- `website/src/lib/rhymes.ts` — `generateBars()` with seeded PRNG (mulberry32), `generateBarsFromGrid()` for grid-based mixes, `buildDisplayBars()` remaps rhyme pool around instrumental sections
- `website/public/sw.js` — Service worker with precaching for offline PWA support
- `website/public/manifest.webmanifest` — PWA web manifest
- `website/src/components/ServiceWorkerRegistrar.tsx` — Client component to register service worker

## References

- `references/nextjs-starter-description.md` — What's in the website/ starter: file structure, layout system, theming, error handling, utilities.
- `references/nextjs-patterns.md` — Next.js + Supabase app patterns: API layer, error handling, forms, toasts, proxy/auth, layouts, components.
- `references/sql-schemas.md` — Supabase SQL standards (not needed yet).

# Rhyme Finder
In ./rhyme-finder:
Reverse-engineered rhyme dictionary and word lists from the Android app `com.creativerhythmllc.rhymegame2026.apk` — a freestyle rap practice game built with React Native + Hermes.

## Structure

```
./rhyme-finder/               — standalone rhyme finder
  rhyme-finder.js  — CMURhymeFinder + WordListManager classes, with CLI
  data/cmu-dict.json    — 125,812 words with ARPAbet phonemes + frequency ranks
  data/word-lists.json  — 9 curated word lists (7,027 words in rhyme families)
  RHYME-FINDER-DOCS.md  — full technical documentation

./rhyme-finder/original/          — decompiled APK and extraction scripts
  com.creativerhythmllc.rhymegame2026.apk
  apktool-output/  — APK resources (smali, manifest, assets)
  jadx-output/     — Java layer decompilation
  decompiled.js    — Hermes bytecode → JS (1.4M lines, hbc-decompiler)
  extract-dict.js  — extracts CMU dictionary from decompiled.js
  extract-wordlists.js — extracts word lists from decompiled.js

```

## Quick start

```bash
cd app

# Find rhymes using the CMU dictionary (phoneme-based, 125K words)
node rhyme-finder.js fire
node rhyme-finder.js money --types perfect,near --limit 20

# Browse curated word lists
node rhyme-finder.js --lists
node rhyme-finder.js --list the-rappers-toolkit
node rhyme-finder.js --list the-rappers-toolkit --random
```

## How rhyming works

The app uses the CMU Pronouncing Dictionary. Each word maps to ARPAbet phonemes (e.g. `cat → K AE1 T`). Two rhyme indices are built at startup:

- **Strict (perfect rhymes)**: key = from last stressed vowel to end (`AE1|T`). Words sharing this key are perfect rhymes.
- **Loose (near rhymes)**: key = stressed vowel + last vowel tail (`AW1||AH0|N` for "mountain"). Captures broader sound patterns.

The 9 curated word lists are separate — hand-picked words pre-grouped into rhyme families by `familyId`. Used during gameplay to give the player a prompt word and its rhyme group.

See `app/RHYME-FINDER-DOCS.md` for the full algorithm breakdown.


## TODO Lists

If I ask you to make a todo list, create a TASKS.md file, summarizing our goal at the top (including all the important details), and then having `## TODO` and `## DONE` lists. As you complete the tasks, move the completed items into the DONE list (do not cross them out or mark them as checkboxes, items should be simply deleted from TODO and added to DONE).

## Self-improving documentation
Update this file, SPEC, TODO, references, and task lists proactively as needed. You should your own judgement to update the files, when you learn or change something important in the chat, build a new feature, when we establish best practices, etc.
