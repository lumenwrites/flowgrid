# Countdown Bars Refactor — COMPLETE

Replaced the old `introBars` system (which baked placeholder bars into rhyme generation arrays and shifted all indices) with a clean transport-level countdown completely decoupled from content.

## What was built

- **Countdown lines** (not bars) — `countdownBars = countdownLines * barsPerLine`, so it works correctly with 2-bars-per-line tracks
- **Transport-level delay** — track audio starts at `countdown:0:0`, content data always starts at index 0
- **Blank BarData prepending** — page.tsx prepends blank entries to displayBars so Grid/Bar have zero countdown awareness
- **Transport-relative sectionStarts** — all section starts offset by countdownBars, eliminating manual coordinate conversion
- **Forced metronome during countdown** — 10-line helper, auto-restores user setting at boundary
- **Metronome popup** — countdown setting (0/1/2 line buttons) moved to metronome popup in PlaybackToolbar alongside on/off toggle, BPM, and volume

## DONE

- Remove `introBars` param from `generateBars()` and all intro line logic in `rhymes.ts`
- Remove `introBars` from `useRhymes()` hook
- Remove `isIntro` prop from `Bar.tsx`
- Grid.tsx unchanged — renders displayBars directly (includes countdown entries from page.tsx)
- `useAudioEngine`: delay track player start by countdown bars, `forceMetronomeDuringCountdown` helper with Transport.schedule
- `usePlayhead`: added `contentBar` to PlayheadPosition
- `page.tsx`: displayBars memo prepends blank BarData entries + re-indexes content, transport-relative sectionStarts
- Renamed `introBars` → `countdownLines` in settings, `INTRO_BAR_OPTIONS` → `COUNTDOWN_LINE_OPTIONS`
- Moved countdown setting to metronome popup in PlaybackToolbar (0/1/2 line toggle buttons)
- Removed countdown from Sidebar
- Fixed: countdown change during playback (useEffect with prevRef stops and resets)
- Fixed: metronome not playing after stop+play (stop() calls Transport.cancel() + re-schedules)
- Fixed: playhead disappearing on last countdown beat (added rhymeWord check)
- Fixed: metronome playing during verse after toggling settings (restore user setting before re-scheduling)
