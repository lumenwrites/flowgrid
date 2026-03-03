# Project Instructions

Read `SPEC.md` for what we're building.
Read `PLAN.md` for the current implementation plan and technical architecture.

Read files in `./references/` as needed — they contain conventions and standards for code architecture, SQL schemas, patterns, etc.

## References

- `references/nextjs-starter-description.md` — What's in the website/ starter: file structure, layout system, theming, error handling, utilities.
- `references/nextjs-patterns.md` — Next.js + Supabase app patterns: API layer, error handling, forms, toasts, proxy/auth, layouts, components.

Not needed for the first version of this project:
- `references/sql-schemas.md` — Supabase SQL standards: file organization, table conventions, RPC patterns, triggers, RLS, CRUD.

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
