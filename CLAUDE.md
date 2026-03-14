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
- `website/src/lib/grid-format.ts` — Grid text format parser/serializer (`parseGrid`, `serializeGrid`, `deriveSectionsFromGrid`); types: `BeatData`, `GridLine`, `GridData`
- `website/src/lib/rhymes.ts` — `generateBars()` with seeded PRNG (mulberry32), `generateBarsFromGrid()` for grid-based mixes, `buildDisplayBars()` remaps rhyme pool around instrumental sections
- `website/public/sw.js` — Service worker with precaching for offline PWA support
- `website/public/manifest.webmanifest` — PWA web manifest
- `website/src/components/ServiceWorkerRegistrar.tsx` — Client component to register service worker

## References

- `references/nextjs-starter-description.md` — What's in the website/ starter: file structure, layout system, theming, error handling, utilities.
- `references/nextjs-patterns.md` — Next.js + Supabase app patterns: API layer, error handling, forms, toasts, proxy/auth, layouts, components.
- `references/sql-schemas.md` — Supabase SQL standards (not needed yet).
- `references/rhyme-finder.md` — Rhyme finder tool, word list editing/generating, CMU dictionary docs.

## Playwright Tests

Tests live in `website/tests/app.spec.ts`. Run with `cd website && npm test` (headless) or `npm run test:ui` (interactive).

- **Run tests** after changing UI behavior (components, controls, modals, buttons).
- **Write new tests** when adding new UI features.
- **Fix failures** — don't skip or delete tests without understanding why they failed.

## Conventions

- **TODO lists**: Create a `TASKS.md` with goal summary at top, `## TODO` and `## DONE` sections. Move completed items from TODO to DONE (don't cross out or use checkboxes).
- **Self-improving docs**: Update CLAUDE.md, SPEC, PLAN, references, and task lists proactively when learning or changing something important.
- Write descriptive comments in the code, so that me and you in the future chats had a good understanding of what's going on.