# FlowGrid — Full Plan

Three big things, in order:

1. **Mobile app** — Build the Expo (React Native) version of the existing web app
2. **Monetization** — Auth, payments, and Pro features across web + iOS + Android
3. **Video recording** — Camera background with grid overlay, record + share freestyle clips

Two independent codebases, no monorepo:

```
flowgrid/
├── website/          # Existing Next.js app
└── mobile/           # New Expo app
```

---
---

# Part 1 — Mobile App

Build an Expo app that replicates the FlowGrid web app for iOS and Android. Same core logic (copy-pasted), same audio assets, platform-native UI and audio.

## Mobile folder structure

```
mobile/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout (dark theme, status bar)
│   └── index.tsx               # Main screen — composes all components
├── components/
│   ├── Grid.tsx                # Scrollable bar grid (FlatList)
│   ├── BarRow.tsx              # One row: 1 or 2 bars side by side
│   ├── BeatCell.tsx            # Single beat cell
│   ├── Timeline.tsx            # Top beat counter + tick marks + playhead
│   ├── PlayButton.tsx          # Bottom play/pause/stop controls
│   ├── Toolbar.tsx             # Top bar (metronome toggle, settings, shuffle)
│   └── SettingsSheet.tsx       # Bottom sheet (replaces web sidebar)
├── hooks/
│   ├── useAudioEngine.ts       # expo-av based audio playback
│   ├── usePlayhead.ts          # Timing from audio position
│   ├── useRhymes.ts            # Bar generation (wraps generateBars)
│   └── useSettings.ts          # AsyncStorage persistence
├── lib/
│   ├── rhymes.ts               # Copy from website — generateBars, types
│   ├── constants.ts            # Copy from website — beats, colors, options
│   └── utils.ts                # Copy from website — randomSeed
├── data/
│   └── word-lists.json         # Copy from website
├── assets/
│   └── loops/                  # Same wav/m4a files from website/public/loops/
├── app.json
├── package.json
└── tsconfig.json
```

## Step 1 — Scaffold & static grid

### Goal: bars render on screen, settings work, no audio, no animation

**Init Expo project:**
- `npx create-expo-app mobile --template blank-typescript`
- Add Expo Router: `npx expo install expo-router`

**Copy shared files from website:**
- `lib/rhymes.ts` — move the `import wordListsData` to the top, change path to `@/data/word-lists.json`. Rest identical.
- `lib/constants.ts` — identical copy
- `lib/utils.ts` — copy `randomSeed`; drop `cn` or keep for convenience
- `data/word-lists.json` — identical copy

**Copy audio assets:**
- All files from `website/public/loops/` into `mobile/assets/loops/`

**Build UI components (React Native rewrites of web components):**

- `BeatCell.tsx` — `View` with conditional background/border colors. Shows `Text` with the rhyme word in the last cell. Uses `StyleSheet` instead of Tailwind. Fixed cell height (48-56pt).
- `BarRow.tsx` — Horizontal `View` with 4 `BeatCell` children (or 8 when barsPerLine=2). Same grid logic as web's `Bar.tsx`.
- `Grid.tsx` — `FlatList` rendering `BarRow` items. Use `getItemLayout` for fixed row heights so `scrollToIndex` works without measuring.
- `Timeline.tsx` — `View` showing beat numbers (1-4 or 1-8) and tick marks. Playhead is an `Animated.View` with `translateX`. Static for now.
- `PlayButton.tsx` — Bottom bar with play/pause and stop buttons. `Pressable` + SVG icons via `react-native-svg`.
- `Toolbar.tsx` — Top bar: hamburger, "FLOWGRID" text, shuffle button, metronome toggle.
- `SettingsSheet.tsx` — Bottom sheet (`@gorhom/bottom-sheet`) with all settings: beat picker, word list, bars per line, bar count, intro bars, rhyme pattern, fill mode, seed, volumes, latency.
- `app/index.tsx` — composes `Toolbar`, `Timeline`, `Grid`, `PlayButton`, `SettingsSheet` inside a `SafeAreaView`.

**Hook up hooks:**
- `useRhymes.ts` — copy from web, change import paths. Already platform-agnostic.
- `useSettings.ts` — rewrite: `AsyncStorage` instead of `localStorage`. Same `Settings` type, same `DEFAULTS`, same `update()` pattern.

### Checkpoint: app renders the grid with colored rhyme cells, settings sheet opens and changes affect the grid.

## Step 2 — Audio engine

### Goal: beats play, metronome works, transport controls functional

**`useAudioEngine.ts`** — full rewrite, same API surface.

Web uses Tone.js. Mobile uses `expo-av`.

The hook exposes the same interface: `{ isPlaying, selectedBeatIndex, togglePlay, changeBeat, stop }`

Implementation:
- **Load**: `Audio.Sound.createAsync(require('@/assets/loops/...'))` — one Sound for beat, one for metronome. Both `isLooping: true`.
- **Play/pause**: `sound.playAsync()` / `sound.pauseAsync()`. Play both together.
- **Volume**: `sound.setVolumeAsync(volume / 100)`. Metronome mute = volume 0.
- **Change beat**: `sound.unloadAsync()`, load new file, if was playing then `playAsync()`.
- **Stop**: `sound.stopAsync()` + `sound.setPositionAsync(0)`.
- **BPM**: `expo-av` just plays files at native tempo. The beat files are pre-recorded at their labeled BPM. BPM value is only used for playhead calculation, not audio.

Key difference from web: no transport clock. Playhead timing is derived from audio position (Step 3).

## Step 3 — Playhead & animation

### Goal: playhead moves across the grid in sync with audio, auto-scroll works

**`usePlayhead.ts`** — full rewrite, same API surface.

Web reads `Tone.getTransport().seconds` in a RAF loop. Mobile polls `sound.getStatusAsync()` to get `positionMillis`.

The hook exposes: `{ position, playheadProgress, resetPosition, scrollToBar }`

Where `playheadProgress` is a reanimated `SharedValue<number>` instead of a DOM ref.

Implementation:
- **Polling loop**: `requestAnimationFrame` on each frame:
  - Get `positionMillis` from the beat sound (or track elapsed time with `Date.now()` if no beat)
  - Compute `totalBeatsElapsed = (positionMillis / 1000) * (bpm / 60)`
  - Derive `bar`, `beat`, and row progress from that
- **Playhead animation**: `Animated.View` in `Timeline.tsx` and `Grid.tsx` driven by the `SharedValue`. Updated each frame.
- **Bar/beat state**: `setPosition({ bar, beat, globalBeat })` on each beat boundary. Used by Grid to highlight active cells.
- **Auto-scroll**: When progress >= 97% through the row, `flatListRef.scrollToIndex({ index: nextRow, animated: true })`.
- **Audio offset**: Subtract `audioOffsetMs` from `positionMillis` before computing position, same as web.

Alternative: `sound.setOnPlaybackStatusUpdate()` fires at ~500ms by default — too slow for smooth playhead. RAF polling is recommended.

## Step 4 — Polish

### Goal: feels like a finished app

- **Dark theme** — match the web's color scheme. `StatusBar` set to light content. Same hex values from `globals.css` theme variables.
- **Grid cell highlights** — swap styles instantly on beat (web uses `duration-75`, nearly instant). Or use `Animated.View` with color interpolation.
- **Timeline ticks** — light up as playhead passes them, same as web.
- **Settings sheet UX** — proper snap points (collapsed, half, full). `Switch` for toggles, `Slider` for volumes, segmented buttons or pickers for dropdowns.
- **Safe areas** — `useSafeAreaInsets` for notch/home-indicator on toolbar and play button bar.
- **Haptic feedback** — optional light haptic on each beat via `expo-haptics`. Add a toggle in settings.
- **App icon & splash** — use the logo from `website/public/img/logo.png`. Configure in `app.json`.

## Dependencies (Part 1)

```bash
# Core
npx expo install expo-router expo-av @react-native-async-storage/async-storage

# UI
npx expo install react-native-reanimated react-native-gesture-handler react-native-svg
npx expo install react-native-safe-area-context react-native-screens
npx expo install @gorhom/bottom-sheet
```

## File mapping: web -> mobile

- `lib/rhymes.ts` — copy, change import path for word-lists
- `lib/constants.ts` — copy verbatim
- `lib/utils.ts` — copy `randomSeed`; drop `cn` or keep
- `data/word-lists.json` — copy verbatim
- `hooks/useRhymes.ts` — copy, change import paths
- `hooks/useSettings.ts` — rewrite: `AsyncStorage` instead of `localStorage`
- `hooks/useAudioEngine.ts` — rewrite: `expo-av` instead of Tone.js
- `hooks/usePlayhead.ts` — rewrite: poll audio position instead of Tone transport
- `components/FlowGrid/Grid.tsx` -> `components/Grid.tsx` — rewrite: `FlatList` + `scrollToIndex`
- `components/FlowGrid/Bar.tsx` -> `components/BarRow.tsx` — rewrite: `View` + `StyleSheet`
- `components/FlowGrid/BeatCell.tsx` -> `components/BeatCell.tsx` — rewrite: `View` + `Text` + style props
- `components/FlowGrid/Timeline.tsx` -> `components/Timeline.tsx` — rewrite: `Animated.View` for playhead
- `components/PlayButton.tsx` -> `components/PlayButton.tsx` — rewrite: `Pressable` + SVG
- `components/Toolbar.tsx` -> `components/Toolbar.tsx` — rewrite: `View` + `Pressable` + `Switch`
- `components/Sidebar.tsx` -> `components/SettingsSheet.tsx` — rewrite: bottom sheet
- `app/(main-layout)/page.tsx` -> `app/index.tsx` — rewrite: `SafeAreaView` composition

4 files copied, 1 adapted, 11 rewritten for React Native.

## What you do manually (Part 1)

**Before starting:**
- Install Expo Go on your phone (free, App Store / Play Store) — for testing
- Install Xcode (free, Mac App Store, ~12GB) — Expo needs it for iOS builds. You never open it.
- Optionally install Android Studio (free, ~3GB) — for Android emulator, or skip and test on a physical Android device.

**During development:**
- Run `npx expo start` and scan the QR code to test on your phone
- Tell AI what looks wrong, what feels off, what you want changed
- Test audio timing with headphones vs speakers vs Bluetooth

---
---

# Part 2 — Monetization

Auth, payments, and Pro features across all three platforms (web, iOS, Android).

## Business model

- **Free tier**: 3-4 word lists, 3-4 beats, all grid features, video recording, full stats/streaks
- **Pro** ($2.99/month, $19.99/year, or $29.99 lifetime): all word lists, all beats, custom word lists, custom beat upload
- **7-day free trial** for Pro on first install

### What's free

- 3-4 word lists (Elementary, 1-Syllable, 2-Syllable, Rappers Toolkit)
- 3-4 beats
- All grid features (patterns, fill modes, bars per line, infinite mode, metronome)
- Video recording + sharing (with subtle "Made with FlowGrid" watermark)
- Full stats + streak tracking + practice heatmap
- Account creation (optional, for syncing across devices)

### What's Pro

- All word lists (15+, new ones added over time)
- All beats (new ones added over time)
- Custom word lists (create your own, group into rhyme families)
- Custom beat upload (pick audio file from device, set BPM + bar count)

## Auth model

- **No login required to use the app.** Anonymous users get all free features immediately.
- **"Sign in / Create account" in settings** — optional, framed as "sync your settings and stats across devices."
- **Nudge at natural moments** — after a practice session, after recording a video. Never blocking.
- **Purchasing Pro requires an account** — but account creation is part of the purchase flow, not a separate step.
- On mobile, Apple/Google handles payment (Face ID / fingerprint) — account created silently from Apple ID / Google account.
- On web, Stripe Checkout handles payment — user enters email + card, account created from that email.
- "Restore Purchase" button (required by Apple) — checks RevenueCat for active subscription.

## Tech stack

- **Supabase Auth** — email/password, Google Sign-In, Apple Sign-In. Same JS client on web and mobile.
- **Supabase Database** — `profiles` table with subscription status. Minimal schema.
- **Stripe** — web payments. Checkout page, webhook to update Supabase.
- **RevenueCat** — iOS + Android payments. Wraps StoreKit and Google Play Billing in one SDK. Handles receipt validation, renewals, cancellations. React Native SDK (`react-native-purchases`). Free tier up to $2.5K/month revenue.
- **Local-first entitlement caching** — `isPro` cached in AsyncStorage / localStorage. Checked instantly on app launch, refreshed from Supabase in background when online. App never waits for network.

## Payment flow per platform

**Web (Stripe):**
- User taps Pro feature -> paywall
- If not logged in: sign in / create account first
- Redirect to Stripe Checkout (email pre-filled)
- Stripe webhook -> updates `profiles.is_pro` in Supabase
- Redirect back, `isPro` cached locally, features unlock

**iOS (RevenueCat + Apple):**
- User taps Pro feature -> paywall
- RevenueCat shows native Apple purchase sheet (Face ID)
- Purchase confirmed -> RevenueCat webhook -> updates Supabase
- `isPro` cached locally, features unlock
- Account created silently from Apple ID if needed

**Android (RevenueCat + Google):**
- Same as iOS but Google Play Billing instead of StoreKit

## Database schema

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  is_pro boolean default false,
  pro_source text,            -- 'stripe', 'apple', 'google'
  pro_expires_at timestamptz, -- null for lifetime
  created_at timestamptz default now()
);
```

## Auth UI

One screen, both sign-in and sign-up:
- "Sign in with Apple" button (iOS only, required by Apple if you offer Google)
- "Sign in with Google" button (all platforms)
- Email + password fields
- "Sign in" / "Create account" buttons
- "Forgot password?" link

Supabase Auth handles OAuth flows, password reset emails, session management, token refresh.

## `useAuth` hook (all platforms)

Exposes: `{ user, isPro, signIn, signUp, signOut, loading }`

- On mount: check for existing Supabase session
- If session: user is signed in, check cached `isPro`, refresh from Supabase in background
- If no session: user is anonymous, `isPro = false`, free features work fully
- Supabase JS client handles token refresh automatically

## Mailing list

When a user creates an account, a Supabase Edge Function or database trigger adds their email to the mailing list provider (Resend, Loops, etc.). Tagged as "free" or "pro" for targeted emails.

## What you do manually (Part 2)

- **Create a Supabase project** (free tier, ~15 min) — supabase.com
- **Configure auth providers** in Supabase dashboard — enable Google and Apple, paste OAuth credentials
- **Create a Stripe account** (free, ~10 min) — stripe.com
- **Create a RevenueCat account** (free, ~10 min) — revenuecat.com
- **Apple Developer Account** ($99/year) — needed for App Store + Apple Sign-In. developer.apple.com
- **Google Play Developer Account** ($25 one-time) — needed for Play Store. play.google.com/console
- **Create products in App Store Connect** — one monthly subscription ($2.99), one yearly ($19.99), one lifetime non-consumable ($29.99)
- **Create matching products in Google Play Console** — same three
- **Link RevenueCat to App Store Connect and Google Play Console** — step-by-step in RevenueCat docs
- **Set up Stripe webhook** — point at your Next.js API route. Stripe dashboard walks you through it.
- **Set up RevenueCat webhook** — point at a Supabase Edge Function or API endpoint

---
---

# Part 3 — Video Recording

Camera background with grid overlay. Record yourself freestyling with rhyme prompts visible. Share clips to TikTok/Instagram.

This is free for all users — every shared video is marketing for the app.

## How it works

The app shows a live front-facing camera feed as the full-screen background. The grid, playhead, and rhyme words render on top as a semi-transparent overlay. Screen recording captures the entire composite (camera + overlay + mic audio).

```
┌──────────────────────────────┐
│                              │
│   [live camera feed of user] │
│                              │
│  ┌────┬────┬────┬──────────┐ │
│  │    │    │    │  BRAIN   │ │  <- semi-transparent row
│  └────┴────┴────┴──────────┘ │
│  ┌────┬────┬────┬──────────┐ │
│  │    │    │    │  PAIN    │ │
│  └────┴────┴────┴──────────┘ │
│  ┌────┬────┬────┬──────────┐ │
│  │ >> │    │    │  FLAME   │ │  <- playhead here
│  └────┴────┴────┴──────────┘ │
│                              │
│       [ STOP RECORDING ]     │
│                              │
└──────────────────────────────┘
```

The output video shows the user rapping with prompts overlaid — ready to post.

## Two app modes

- **Practice mode** (default) — full opaque dark grid, no camera. The current design.
- **Record mode** — camera background, semi-transparent grid overlay, simplified layout. Fewer visible rows, larger rhyme text, toolbar hidden or minimal.

User switches between modes via a camera/record button.

## Layer stack (bottom to top)

1. `expo-camera` — full-screen front-facing camera preview
2. Semi-transparent grid — same components with transparent backgrounds so camera shows through
3. Minimal controls — record/stop button, beat info

## Recording approach

Screen recording via native API captures everything visible on screen:
- iOS: ReplayKit — captures screen content + mic audio. System prompt to approve.
- Android: MediaProjection — same concept, system prompt.

Libraries to evaluate:
- `react-native-nitro-screen-recorder` — what Rhyme Game uses, supports both platforms via NitroModules
- Expo Modules API — build a thin native wrapper if needed

`expo-camera` alone won't work because `recordAsync()` only captures the camera feed, not the UI overlay on top.

## Flow

- User taps the Record/Camera button
- Camera preview goes full-screen, grid switches to transparent overlay mode
- User taps Record
- System prompt: "FlowGrid would like to record your screen"
- Beat starts playing, grid animates, mic captures the freestyle
- User taps Stop
- Screen recording saves video (camera + overlay + audio)
- Preview screen: watch playback, share to social, save to camera roll, or delete
- Subtle "Made with FlowGrid" watermark in corner of the video

## Implementation

- Add `expo-camera` for live preview
- Build record mode layout variant — camera background + transparent grid
- Integrate screen recording library (ReplayKit / MediaProjection)
- `RecordButton` component — toggles Record / Stop states
- `app/video-preview.tsx` — playback screen with share/delete via native share sheet
- Permissions: camera, microphone, screen recording (all prompted by system)

## Web version

The same feature can work on the web using browser APIs:
- `getUserMedia({ video: true })` for webcam feed
- Render webcam as background `<video>` element, grid overlaid on top
- `MediaRecorder` + `canvas.captureStream()` to record the composite
- Or `getDisplayMedia()` for full screen capture

Same UX: camera background, transparent grid, record, preview, download/share.

## Dependencies (Part 3)

```bash
npx expo install expo-camera expo-media-library
# + react-native-nitro-screen-recorder or custom Expo Module for screen recording
```

## What you do manually (Part 3)

- Test on a physical device (camera + screen recording don't work in simulators)
- Approve system permission prompts during testing
- Test the output video quality, check the watermark placement
- Try sharing to Instagram/TikTok to make sure the format works (aspect ratio, duration limits)
