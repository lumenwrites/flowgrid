# Rhyme Finder

In `./rhyme-finder`:
Reverse-engineered rhyme dictionary and word lists from the Android app `com.creativerhythmllc.rhymegame2026.apk` — a freestyle rap practice game built with React Native + Hermes.

## Structure

```
./rhyme-finder/               — standalone rhyme finder
  rhyme-finder.js  — CMURhymeFinder + WordListManager classes, with CLI
  data/cmu-dict.json    — 125,812 words with ARPAbet phonemes + frequency ranks
  data/word-lists.json  — 9 curated word lists (7,027 words in rhyme families)
  data/word-lists/      — editable .md files for each word list (see below)
  data/json-to-md.js    — converts word-lists.json → .md files
  data/md-to-json.js    — converts .md files → word-lists.json
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
cd rhyme-finder

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

See `rhyme-finder/RHYME-FINDER-DOCS.md` for the full algorithm breakdown.

## Editing word lists

Word lists live in `website/src/data/word-lists.json` but can be edited as markdown files in `website/src/data/word-lists/`.

```bash
cd website/src/data

# Generate .md files from JSON (run once, or to reset from JSON)
node json-to-md.js

# Edit the .md files as needed, then regenerate JSON
node md-to-json.js
```

Each `.md` file has YAML frontmatter (id, name, description, difficulty, etc.) and a body where each line is a rhyme family:
```
---
id: animals-nature
name: Animals & Nature
description: Get wild with this nature-themed word pack!
difficulty: 1
freepaid: PAID
publicList: false
tags: []
---
cat, bat, rat, sat
dog, frog, log, bog, hog
bee, tree, spree, flee, sea, free, glee
```

Naming: main/general lists have `_` prefix (`_elementary.md`, `_1-syllable-words.md`), topic lists don't (`animals-nature.md`, `pirates.md`).

## Generating new word lists

When asked to create a new word list, follow the prompt in `website/src/data/GENERATING-RHYME-LISTS.md`. It covers the format (frontmatter + comma-separated rhyme groups), quality rules (clean rhymes, common words, topic association), and the batch-then-review process. Create the file in `website/src/data/word-lists/`.
