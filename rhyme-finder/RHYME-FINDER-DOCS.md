# Rhyme Finder — Reverse-Engineered from RhymeGame APK

## Overview

This project decompiles the Android app `com.creativerhythmllc.rhymegame2026.apk` (a freestyle rap practice game), extracts its embedded rhyme dictionary, and recreates its rhyme-finding algorithm as a standalone Node.js script.

---

## Decompilation Process

### 1. Identifying the app structure

The APK is a **React Native** app compiled with **Hermes** (Facebook's JavaScript engine for React Native). This means the JavaScript source code is not stored as plain `.js` files — it's compiled into **Hermes bytecode** (version 96), stored at:

```
apktool-output/assets/index.android.bundle
```

Two standard Android reverse-engineering tools were used initially:

- **apktool** — unpacks the APK, decodes resources, and extracts the assets folder (where the Hermes bytecode lives).
- **jadx** — decompiles the Java/Kotlin layer (mainly boilerplate React Native host code, not relevant to the rhyme logic).

### 2. Decompiling Hermes bytecode

Since the actual app logic is in the Hermes bytecode bundle, a specialized tool was needed:

- **hermes-dec** (`pip install hermes-dec`) — a Python tool that decompiles Hermes bytecode back into a (register-based) JavaScript representation.

```bash
hbc-decompiler apktool-output/assets/index.android.bundle decompiled.js
```

This produces `decompiled.js` — a 1.4M-line, 45MB file containing all the app's JavaScript modules in decompiled form. The output is register-based pseudocode (variables named `r0`, `r1`, etc.) with control flow expressed as labeled switch cases, not clean source code. But it's readable enough to reconstruct the original logic.

### 3. Locating the rhyme dictionary

Key identifiers found by searching the decompiled output:

| Identifier | What it is |
|---|---|
| `CMUDictionaryProvider` | The main class that loads and queries the dictionary |
| `_buildRhymeIndex` | Builds the rhyme lookup index at initialization |
| `_findPerfectRhymes` | Finds exact (strict) rhymes |
| `_findNearRhymes` | Finds loose/near rhymes |
| `_getStrictRhymeEnding` | Computes the strict rhyme key for a phoneme sequence |
| `_getLooseRhymeEnding` | Computes the loose rhyme key for a phoneme sequence |
| `_getLastStressedVowelIndex` | Finds the pivot vowel for rhyme matching |
| `../../../../data/rhymes/cmu-dict.json` | The original source path referenced in code |

The actual dictionary data is embedded as a giant module in the bundle (lines ~544,057–1,232,027 of the decompiled output). Each word is assigned as a property on an object with its phoneme array and optional frequency rank.

### 4. Extracting the dictionary

`extract-dict.js` parses the decompiled output line-by-line, matching patterns like:

```
r2 = ['K', 'AE1', 'T'];    // phoneme array
r0['p'] = r2;               // assign to entry.p
r2 = 1234;                  // frequency rank
r0['r'] = r2;               // assign to entry.r
r1['cat'] = r0;             // assign entry to word
```

This produces `data/cmu-dict.json` — **125,812 entries**, 6.8MB.

---

## The Dictionary Format

`data/cmu-dict.json` is a JSON object mapping lowercase words to entries:

```json
{
  "cat": { "p": ["K", "AE1", "T"], "r": 7891 },
  "hello": { "p": ["HH", "AH0", "L", "OW1"], "r": 2420 },
  "rhyme": { "p": ["R", "AY1", "M"], "r": 20531 }
}
```

### Fields

- **`p`** (phonemes) — Array of [ARPAbet](https://en.wikipedia.org/wiki/ARPABET) phoneme symbols. Vowels carry a stress marker suffix:
  - `0` = no stress (e.g. `AH0`)
  - `1` = primary stress (e.g. `AE1`)
  - `2` = secondary stress (e.g. `IY2`)
- **`r`** (rank) — Optional integer frequency rank. Lower = more common word. Rank 1 would be the most common word in the language. Not every word has a rank.

### ARPAbet Vowels

The following 15 base phonemes are classified as vowels (before stress markers are applied):

```
AA  AE  AH  AO  AW  AY  EH  ER  EY  IH  IY  OW  OY  UH  UW
```

Everything else (B, CH, D, F, G, HH, JH, K, L, M, N, NG, P, R, S, SH, T, TH, V, W, Y, Z, ZH) is a consonant.

---

## The Rhyme Algorithm

This is a faithful recreation of the app's `CMUDictionaryProvider` class. The entire rhyme system works in two phases: **index building** (once at startup) and **querying** (per lookup).

### Phase 1: Building the Rhyme Index

At initialization, every word in the dictionary is processed to compute two rhyme keys. These keys are used to group words that rhyme together.

#### Strict Rhyme Ending

Used for **perfect rhymes**. The key is everything from the last stressed vowel to the end of the word, joined by `|`.

Algorithm:
1. Scan the phoneme array from the end toward the beginning.
2. Find the last phoneme ending in `1` or `2` that is a vowel → this is the **last stressed vowel**.
3. If no stressed vowel found, fall back to the last vowel of any stress.
4. If no vowel at all, return `null` (word is skipped).
5. Slice from that index to end, join with `|`.

Examples:

| Word | Phonemes | Strict Ending |
|---|---|---|
| cat | K **AE1** T | `AE1\|T` |
| time | T **AY1** M | `AY1\|M` |
| mountain | M **AW1** N T AH0 N | `AW1\|N\|T\|AH0\|N` |
| hello | HH AH0 L **OW1** | `OW1` |

Words sharing the same strict ending are **perfect rhymes**: cat/hat/flat/that all produce `AE1|T`.

#### Loose Rhyme Ending

Used for **near rhymes**. Captures a wider pattern by combining the stressed vowel with the word's final vowel-to-end tail.

Algorithm:
1. Find the last stressed vowel index (same as strict).
2. Scan backward from the end to find the **last vowel** (any stress level).
3. If the last vowel is at a **different** position than the stressed vowel:
   - Key = `{stressed vowel}||{slice from last vowel to end, joined by |}`
   - The `||` is a separator distinguishing this from strict keys.
4. If the last vowel IS the stressed vowel (single-vowel word or stressed vowel is already last), the loose key equals the strict key.

Examples:

| Word | Phonemes | Stressed Vowel | Last Vowel | Loose Ending |
|---|---|---|---|---|
| cat | K AE1 T | AE1 (idx 1) | AE1 (idx 1) | `AE1\|T` (same as strict) |
| mountain | M AW1 N T AH0 N | AW1 (idx 1) | AH0 (idx 4) | `AW1\|\|AH0\|N` |
| orange | AO1 R AH0 N JH | AO1 (idx 0) | AH0 (idx 2) | `AO1\|\|AH0\|N\|JH` |

This means "mountain" and "fountain" share the same loose ending, but so do words like "cowan", "gaussian", etc. — anything with a stressed AW vowel followed by an unstressed AH-N tail.

#### The Index Structure

After processing all 125,812 words, the index looks like:

```
rhymeIndex = {
  strict: {
    "AE1|T": ["at", "bat", "cat", "chat", "fat", "flat", "hat", ...],
    "OW1":   ["ago", "below", "flow", "go", "hello", "know", ...],
    ...
  },
  loose: {
    "AW1||AH0|N": ["mountain", "fountain", "cowan", "gaussian", ...],
    "AO1||AH0|N|JH": ["orange", "lozenge", ...],
    ...
  }
}
```

Typical counts: ~33,900 strict groups, ~5,400 loose groups.

### Phase 2: Finding Rhymes

When you search for rhymes of a word:

#### Step 1 — Look up the input word

The input is lowercased and trimmed. Its phoneme array is retrieved from the dictionary. If the word isn't in the dictionary, an empty result is returned.

#### Step 2 — Find perfect rhymes (strength = 5)

1. Compute the strict ending for the input word's phonemes.
2. Look up all words in `rhymeIndex.strict[ending]`.
3. Filter out the input word itself.
4. Wrap each result as a match object with `type: 'perfect'`, `strength: 5`.

#### Step 3 — Find near rhymes (strength = 4)

Only attempted if the input word has **3 or more phonemes** (short words don't produce meaningful near rhymes).

1. Compute the loose ending for the input word's phonemes.
2. Look up all words in `rhymeIndex.loose[ending]`.
3. Compute the strict ending and build a `Set` of all perfect rhyme words.
4. Filter out: the input word itself, and any word already in the perfect rhymes set.
5. Wrap each result as a match object with `type: 'near'`, `strength: 4`.

#### Step 4 — Deduplicate

All results (perfect + near) are merged. A `Set` tracks seen words. If a word appears in both lists, only the first occurrence (perfect) is kept.

#### Step 5 — Apply filters

Optional filters can narrow results:

| Filter | Effect |
|---|---|
| `syllableCount` | Exact syllable count match |
| `syllableRange` | `{ min, max }` syllable range |
| `minStrength` | Minimum strength threshold |
| `maxRank` | Only words with rank ≤ this (filters out rare words) |
| `minRank` | Only words with rank ≥ this (filters out common words) |

Syllable count is computed by counting vowel phonemes in the word's phoneme array.

#### Step 6 — Sort

Results are sorted by:
1. **Strength descending** (perfect rhymes before near rhymes).
2. Within the same strength, **frequency rank ascending** (more common words first). Words without a rank are treated as rank 999,999 (sorted last).

#### Step 7 — Limit

The sorted results are sliced to the requested limit (default: 50).

---

## Curated Word Lists

Besides the full 125K-word CMU dictionary, the app ships **9 curated word lists** — hand-picked collections of words pre-grouped into "rhyme families." During gameplay, the app selects a list, picks a random family, shows one word, and the player freestyles rhymes.

### All Lists

| ID | Name | Words | Families | Free/Paid |
|---|---|---|---|---|
| `elementary` | Elementary | 706 | 109 | FREE |
| `1-syllable-words` | 1-Syllable Words | 1503 | 236 | FREE |
| `2-syllable-words` | 2-Syllable Words | 702 | 107 | FREE |
| `3-syllable-words` | 3-Syllable Words | 399 | 35 | PAID |
| `the-mega-list` | The MEGA List | 2604 | 378 | PAID |
| `the-rappers-toolkit` | The Rappers Toolkit | 467 | 79 | FREE |
| `animals-nature` | Animals & Nature | 295 | 52 | PAID |
| `food-cooking` | Food & Cooking | 345 | 62 | PAID |
| `childhood-memories` | Childhood Memories | 6 | 3 | PAID |

### Word List Data Format

`data/word-lists.json` is an array of list objects:

```json
{
  "id": "the-rappers-toolkit",
  "name": "The Rappers Toolkit",
  "description": "If you love to rap, you will use these words A LOT!",
  "difficulty": 2,
  "freepaid": "FREE",
  "publicList": true,
  "tags": ["serious", "rap"],
  "words": [
    { "word": "power", "familyId": 1 },
    { "word": "tower", "familyId": 1 },
    { "word": "flower", "familyId": 1 },
    { "word": "hustle", "familyId": 2 },
    { "word": "muscle", "familyId": 2 }
  ]
}
```

The `familyId` is what groups rhyming words together. All words sharing a `familyId` within the same list are meant to rhyme. For example, in "The Rappers Toolkit":
- Family 1: power, tower, flower, devour, hour
- Family 3: money, funny, honey, sunny
- Family 23: rhyme, time, climb, prime, crime, dime

### How the App Uses Word Lists

The `FirebaseWordListProvider` class manages these lists. At a high level:

1. Lists are bundled as hardcoded defaults and can also be fetched/synced from Firebase.
2. When the user starts a game session, they choose a word list (e.g. "Elementary" or "The Rappers Toolkit").
3. The game picks a random rhyme family from that list.
4. One word from the family is shown as a prompt.
5. The player freestyles, and the app checks if the words they use rhyme (using the CMU dictionary's `findRhymes()` for validation) or match other words in the same family.

---

## Using `rhyme-finder.js`

### CLI — CMU Dictionary Rhyme Lookup

```bash
# Basic usage — perfect + near rhymes, limit 50
node rhyme-finder.js cat

# Only perfect rhymes
node rhyme-finder.js fire --types perfect

# Near rhymes only, limit 10
node rhyme-finder.js mountain --types near --limit 10

# Filter to 2-syllable words
node rhyme-finder.js money --syllables 2

# All options
node rhyme-finder.js <word> [--types perfect,near] [--limit 50] [--syllables N] [--min-strength N]
```

### CLI — Word List Commands

```bash
# Show all available word lists
node rhyme-finder.js --lists

# Show all rhyme families in a list
node rhyme-finder.js --list the-rappers-toolkit

# Show words in a specific rhyme family
node rhyme-finder.js --list the-rappers-toolkit --family 3

# Find what rhymes with a word within a list
node rhyme-finder.js --list the-rappers-toolkit --rhymes-for money

# Pick a random rhyme family (for practice)
node rhyme-finder.js --list the-rappers-toolkit --random
```

### As a Module

```js
const { CMURhymeFinder, WordListManager } = require('./rhyme-finder.js');

// --- CMU Dictionary (125K words, phoneme-based) ---
const finder = new CMURhymeFinder('./data/cmu-dict.json');

const results = finder.findRhymes({
  word: 'fire',
  types: ['perfect', 'near'],
  limit: 20,
  // syllableCount: 1,
  // syllableRange: { min: 1, max: 3 },
  // minStrength: 4,
  // maxRank: 10000,
});

// Each result:
// {
//   word: 'higher',
//   type: 'perfect',
//   strength: 5,
//   syllableCount: 2,
//   sourceProvider: 'CMU',
//   phonemes: ['HH', 'AY1', 'ER0']
// }

finder.hasWord('cat');              // true
finder.getPhonemes('cat');          // ['K', 'AE1', 'T']
finder._getSyllableCount('cat');    // 1
finder._getFrequencyRank('cat');    // 7891

// --- Curated Word Lists ---
const wlm = new WordListManager('./data/word-lists.json');

wlm.getAllLists();                              // summary of all 9 lists
wlm.getList('the-rappers-toolkit');             // full list object with words
wlm.getFamilies('the-rappers-toolkit');         // Map<familyId, string[]>
wlm.getWordsByFamily('the-rappers-toolkit', 3); // ['money', 'funny', 'honey', 'sunny']
wlm.getRhymesFor('money', 'the-rappers-toolkit'); // ['funny', 'honey', 'sunny']
wlm.getRandomFamily('the-rappers-toolkit');     // { familyId: 23, words: ['rhyme', 'time', ...] }
```

### Match Object Shape

| Field | Type | Description |
|---|---|---|
| `word` | string | The rhyming word |
| `type` | `'perfect'` \| `'near'` | Rhyme type |
| `strength` | number | 5 for perfect, 4 for near |
| `syllableCount` | number \| null | Number of syllables |
| `sourceProvider` | string | Always `'CMU'` |
| `phonemes` | string[] \| undefined | ARPAbet phoneme array (when available) |

---

## File Inventory

| File | Description |
|---|---|
| `com.creativerhythmllc.rhymegame2026.apk` | Original APK |
| `apktool-output/` | apktool decompilation (resources, smali, manifest) |
| `jadx-output/` | jadx decompilation (Java source, mostly React Native boilerplate) |
| `decompiled.js` | Hermes bytecode decompiled to register-based JS (1.4M lines, 45MB) |
| `extract-dict.js` | Script that parses `decompiled.js` and extracts the CMU dictionary |
| `extract-wordlists.js` | Script that parses `decompiled.js` and extracts the curated word lists |
| `data/cmu-dict.json` | Extracted CMU Pronouncing Dictionary (125,812 words, 6.8MB) |
| `data/word-lists.json` | Extracted curated word lists (9 lists, 7,027 words total, 452KB) |
| `rhyme-finder.js` | Standalone rhyme finder + word list manager |
