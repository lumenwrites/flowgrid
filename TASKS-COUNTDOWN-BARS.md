# Countdown Bars Refactor

Replace the current `introBars` system (which bakes placeholder bars into the rhyme generation array and shifts all indices) with a cleaner transport-level countdown that's completely decoupled from content.

## Current behavior (problems)

- `introBars` is passed into `generateBars()` and `generateBarsFromPreset()`, which prepend placeholder entries into the `BarData[]` array
- This shifts all rhyme indices — the rhyme pattern has to "start fresh" after the intro, adding complexity to the generation logic
- `Grid.tsx` receives an `introBars` prop and marks bars with `index < introBars` as `isIntro`, suppressing rhyme display
- `Bar.tsx` has an `isIntro` prop that controls whether rhymes are shown
- The playhead rhyme highlight checks `index >= introBars`
- For mixes, `introBars` is forced to 0 in page.tsx (`introBars={activeMix ? 0 : settings.introBars}`)
- Intro bars are entangled with rhyme generation, grid rendering, and playhead — three separate systems all aware of the concept

## New behavior

Countdown is a **transport-level delay** — content data knows nothing about it.

### How it works

1. `BarData[]` (from both auto-generation and grid parsing) always starts at index 0 with real content. No placeholder entries, no `introBars` parameter.

2. When play is pressed with countdown > 0 (say N bars):
   - Transport starts at bar 0 as normal
   - Track audio player is synced to start at transport bar N (delayed start)
   - Metronome **always plays during countdown**, regardless of the global metronome setting — the count-in is the whole point
   - After countdown, metronome respects the global enabled/disabled setting as usual

3. Grid rendering maps transport position to content:
   - Transport bars 0 through N-1 are countdown bars → render as blank cells (no rhymes, no color)
   - Transport bar N onward → render `displayBars[transportBar - countdownBars]`
   - Playhead moves through countdown bars normally with beat highlighting — it's visible, not a hidden delay

4. Works identically for loops, mixes, and presets — countdown is orthogonal to content type.

### What changes

**Remove `introBars` from rhyme generation:**
- `generateBars()` in `rhymes.ts` — remove `introBars` parameter and all intro line logic
- `generateBarsFromPreset()` — remove `introBars` parameter (and this function may already be gone if grid format lands first)
- `useRhymes()` — remove `introBars` from hook params and calls to `generateBars()`

**Remove `introBars`/`isIntro` from grid rendering:**
- `Grid.tsx` — remove `introBars` prop. Add `countdownBars` prop. Bars with `index < countdownBars` render as blank countdown cells. Content bars index into `displayBars` with offset.
- `Bar.tsx` — remove `isIntro` prop. Countdown bars are a separate rendering path in Grid.tsx (they don't even use Bar component — just blank cells).

**Audio engine changes:**
- `useAudioEngine` — when starting playback, if countdown > 0, delay the track player's `.start()` by N bars worth of transport time. Metronome starts immediately.
- Force metronome unmuted during countdown bars, then restore to user setting when countdown ends. This could be a `Transport.schedule()` callback at the countdown boundary.

**Page.tsx:**
- Remove `introBars` from `useRhymes()` call
- Remove `introBars` from `generateBarsFromPreset()` / `generateBarsFromGrid()` calls
- Pass `countdownBars` to Grid instead of `introBars`
- Pass countdown info to audio engine

**Settings:**
- Keep `introBars` in settings (rename to `countdownBars` for clarity), keep the sidebar dropdown
- Works for both loops and mixes now (no more `activeMix ? 0 : settings.introBars` special case)

## TODO

- [ ] Remove `introBars` param from `generateBars()` and all intro line logic in `rhymes.ts`
- [ ] Remove `introBars` param from `generateBarsFromPreset()` (or `generateBarsFromGrid()` if grid format is done)
- [ ] Remove `introBars` from `useRhymes()` hook
- [ ] Update `Grid.tsx`: replace `introBars` prop with `countdownBars`, render blank countdown cells with offset
- [ ] Remove `isIntro` prop from `Bar.tsx`
- [ ] Update `useAudioEngine`: delay track player start by countdown bars, force metronome during countdown
- [ ] Update `page.tsx`: pass `countdownBars` instead of `introBars`, remove special-casing for mixes
- [ ] Rename setting from `introBars` to `countdownBars` in `useSettings.ts` and `Sidebar.tsx`
- [ ] Update SPEC.md and PLAN.md

## DONE

(none yet)
