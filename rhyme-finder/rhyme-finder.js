/**
 * Rhyme Finder — faithful recreation of the CMUDictionaryProvider from rhymegame.
 *
 * Usage:
 *   node rhyme-finder.js <word> [--types perfect,near] [--limit 50] [--syllables 2] [--min-strength 1]
 *   node rhyme-finder.js --list elementary
 *   node rhyme-finder.js --list the-rappers-toolkit --family 3
 *   node rhyme-finder.js --lists
 *
 * The dictionary lives in data/cmu-dict.json (extracted from the app).
 * Word lists live in data/word-lists.json (extracted from the app).
 */

const fs = require('fs');
const path = require('path');

// ARPAbet vowel phonemes (without stress markers)
const VOWELS = ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'];

class CMURhymeFinder {
  constructor(dictPath) {
    this._dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
    this._wordCount = Object.keys(this._dictionary).length;
    this._rhymeIndex = { strict: {}, loose: {} };
    this._buildRhymeIndex();
  }

  // Strip stress marker (trailing 0, 1, or 2) from a phoneme
  _stripStress(phoneme) {
    return phoneme.replace(/[0-2]$/, '');
  }

  // Check if a phoneme (with or without stress marker) is a vowel
  _isVowel(phoneme) {
    return VOWELS.includes(this._stripStress(phoneme));
  }

  /**
   * Find the index of the last stressed vowel (stress 1 or 2) in a phoneme array.
   * If none found, fall back to searching for any vowel from the end.
   * Returns -1 if no vowel found at all.
   */
  _getLastStressedVowelIndex(phonemes) {
    // First pass: scan from end for stress markers 1 or 2
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if ((phonemes[i].endsWith('1') || phonemes[i].endsWith('2')) && this._isVowel(phonemes[i])) {
        return i;
      }
    }
    // Fallback: scan from end for any vowel
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (this._isVowel(phonemes[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Strict rhyme ending: from the last stressed vowel to the end, joined by '|'.
   * e.g. for "cat" (K AE1 T) → "AE1|T"
   */
  _getStrictRhymeEnding(phonemes) {
    const idx = this._getLastStressedVowelIndex(phonemes);
    if (idx === -1) return null;
    return phonemes.slice(idx).join('|');
  }

  /**
   * Loose rhyme ending: incorporates vowel sound context before the stressed vowel.
   *
   * Finds the last stressed vowel, then scans backward from the end to find the
   * next-to-last vowel. If that vowel is at a different position than the stressed
   * vowel, the ending is: stressedVowel + "||" + slice(from that second vowel).join('|')
   * Otherwise it's the same as the strict ending.
   */
  _getLooseRhymeEnding(phonemes) {
    const stressIdx = this._getLastStressedVowelIndex(phonemes);
    if (stressIdx === -1) return null;

    const stressedVowel = phonemes[stressIdx];

    // Scan backward from end to find a vowel (not necessarily stressed)
    let secondVowelIdx = -1;
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (this._isVowel(phonemes[i])) {
        secondVowelIdx = i;
        break;
      }
    }

    if (stressIdx !== secondVowelIdx) {
      // There's a vowel after the stressed vowel — build a combined key
      const tail = phonemes.slice(secondVowelIdx).join('|');
      return stressedVowel + '||' + tail;
    }

    // Same vowel — just use strict-style ending
    return phonemes.slice(stressIdx).join('|');
  }

  /**
   * Build the rhyme index: maps rhyme endings → arrays of words.
   */
  _buildRhymeIndex() {
    for (const [word, entry] of Object.entries(this._dictionary)) {
      const phonemes = entry.p;
      if (!phonemes || phonemes.length === 0) continue;

      const strictEnding = this._getStrictRhymeEnding(phonemes);
      if (strictEnding) {
        if (!this._rhymeIndex.strict[strictEnding]) this._rhymeIndex.strict[strictEnding] = [];
        this._rhymeIndex.strict[strictEnding].push(word);
      }

      const looseEnding = this._getLooseRhymeEnding(phonemes);
      if (looseEnding) {
        if (!this._rhymeIndex.loose[looseEnding]) this._rhymeIndex.loose[looseEnding] = [];
        this._rhymeIndex.loose[looseEnding].push(word);
      }
    }

    const strictGroups = Object.keys(this._rhymeIndex.strict).length;
    const looseGroups = Object.keys(this._rhymeIndex.loose).length;
    console.log(`Rhyme index built: ${strictGroups} strict groups, ${looseGroups} loose groups (${this._wordCount} words)`);
  }

  _getSyllableCount(word) {
    const entry = this._dictionary[word];
    if (!entry || !entry.p) return null;
    let count = 0;
    for (const phoneme of entry.p) {
      if (this._isVowel(phoneme)) count++;
    }
    return count;
  }

  _getFrequencyRank(word) {
    const entry = this._dictionary[word.toLowerCase().trim()];
    if (!entry) return null;
    return entry.r || null;
  }

  _createMatch(word, type, strength, syllableCount, phonemes) {
    const match = { word, type, strength, syllableCount, sourceProvider: 'CMU' };
    if (phonemes) match.phonemes = phonemes;
    return match;
  }

  /**
   * Find perfect rhymes: words sharing the same strict rhyme ending.
   * Strength = 5.
   */
  _findPerfectRhymes(inputWord, phonemes) {
    const ending = this._getStrictRhymeEnding(phonemes);
    if (!ending) return [];
    const words = this._rhymeIndex.strict[ending] || [];
    return words
      .filter(w => w !== inputWord)
      .map(w => {
        const entry = this._dictionary[w];
        return this._createMatch(
          w, 'perfect', 5,
          this._getSyllableCount(w),
          entry ? entry.p : undefined
        );
      });
  }

  /**
   * Find near rhymes: words sharing the same loose rhyme ending,
   * excluding words that are already perfect rhymes.
   * Strength = 4.
   */
  _findNearRhymes(inputWord, phonemes) {
    const looseEnding = this._getLooseRhymeEnding(phonemes);
    if (!looseEnding) return [];
    const looseWords = this._rhymeIndex.loose[looseEnding] || [];

    // Exclude perfect rhymes (same strict ending)
    const strictEnding = this._getStrictRhymeEnding(phonemes);
    const perfectSet = new Set(this._rhymeIndex.strict[strictEnding] || []);

    return looseWords
      .filter(w => w !== inputWord && !perfectSet.has(w))
      .map(w => {
        const entry = this._dictionary[w];
        return this._createMatch(
          w, 'near', 4,
          this._getSyllableCount(w),
          entry ? entry.p : undefined
        );
      });
  }

  /**
   * Apply filters to match results.
   */
  _applyFilters(matches, filters) {
    return matches.filter(m => {
      if (filters.syllableCount !== undefined && m.syllableCount !== filters.syllableCount) return false;
      if (filters.syllableRange) {
        if (m.syllableCount < filters.syllableRange.min) return false;
        if (m.syllableCount > filters.syllableRange.max) return false;
      }
      if (filters.minStrength && m.strength < filters.minStrength) return false;
      if (filters.maxRank) {
        const rank = this._getFrequencyRank(m.word);
        if (!rank || rank > filters.maxRank) return false;
      }
      if (filters.minRank) {
        const rank = this._getFrequencyRank(m.word);
        if (!rank || rank < filters.minRank) return false;
      }
      return true;
    });
  }

  /**
   * Main entry point — find rhymes for a word.
   * Mirrors the app's findRhymes() method exactly.
   */
  findRhymes({
    word,
    types = ['perfect'],
    limit = 50,
    minStrength = 1,
    syllableCount,
    syllableRange,
    maxRank,
    minRank,
  } = {}) {
    const normalized = word.toLowerCase().trim();
    const entry = this._dictionary[normalized];
    if (!entry) {
      console.log(`Word not found: "${normalized}"`);
      return [];
    }

    const phonemes = entry.p;
    let results = [];

    if (types.includes('perfect')) {
      results.push(...this._findPerfectRhymes(normalized, phonemes));
    }

    if (types.includes('near') && phonemes.length >= 3) {
      results.push(...this._findNearRhymes(normalized, phonemes));
    }

    // Deduplicate by word
    const seen = new Set([normalized]);
    results = results.filter(m => {
      if (seen.has(m.word)) return false;
      seen.add(m.word);
      return true;
    });

    // Apply filters
    results = this._applyFilters(results, {
      syllableCount,
      syllableRange,
      minStrength,
      maxRank,
      minRank,
    });

    // Sort: higher strength first, then by frequency rank (lower rank = more common)
    results.sort((a, b) => {
      if (b.strength === a.strength) {
        const rankA = this._getFrequencyRank(a.word) || 999999;
        const rankB = this._getFrequencyRank(b.word) || 999999;
        return rankA - rankB;
      }
      return b.strength - a.strength;
    });

    return results.slice(0, limit);
  }

  hasWord(word) {
    return !!this._dictionary[word.toLowerCase().trim()];
  }

  getPhonemes(word) {
    const entry = this._dictionary[word.toLowerCase().trim()];
    return entry?.p || null;
  }
}


/**
 * WordListManager — loads and queries the curated word lists from the app.
 *
 * Each word list contains words grouped into "rhyme families" (familyId).
 * Words in the same family rhyme with each other.
 *
 * The app uses these lists during gameplay: it picks a random rhyme family
 * from the selected list, shows one word, and the player must freestyle
 * rhymes from that family.
 */
class WordListManager {
  constructor(wordListsPath) {
    this._lists = JSON.parse(fs.readFileSync(wordListsPath, 'utf8'));
    this._byId = {};
    for (const list of this._lists) {
      this._byId[list.id] = list;
    }
  }

  getAllLists() {
    return this._lists.map(l => ({
      id: l.id,
      name: l.name,
      description: l.description,
      difficulty: l.difficulty,
      freepaid: l.freepaid,
      wordCount: l.words.length,
      familyCount: new Set(l.words.map(w => w.familyId)).size,
      tags: l.tags,
      publicList: l.publicList,
    }));
  }

  getList(listId) {
    return this._byId[listId] || null;
  }

  /**
   * Get all rhyme families in a list, grouped by familyId.
   * Returns: Map<familyId, string[]>
   */
  getFamilies(listId) {
    const list = this._byId[listId];
    if (!list) return null;
    const families = new Map();
    for (const entry of list.words) {
      if (!families.has(entry.familyId)) families.set(entry.familyId, []);
      families.get(entry.familyId).push(entry.word);
    }
    return families;
  }

  /**
   * Get words in a specific rhyme family within a list.
   */
  getWordsByFamily(listId, familyId) {
    const list = this._byId[listId];
    if (!list) return [];
    return list.words
      .filter(w => w.familyId === familyId)
      .map(w => w.word);
  }

  /**
   * Find all words that rhyme with a given word within a specific list.
   * Looks up the word's familyId, then returns all other words in that family.
   */
  getRhymesFor(word, listId) {
    const normalized = word.toLowerCase();
    const list = listId ? this._byId[listId] : null;
    const searchIn = list ? list.words : this._lists.flatMap(l => l.words.map(w => ({ ...w, packId: l.id })));

    const match = searchIn.find(w => w.word.toLowerCase() === normalized);
    if (!match) return [];

    return searchIn
      .filter(w => w.familyId === match.familyId && w.word.toLowerCase() !== normalized)
      .map(w => w.word);
  }

  /**
   * Get a random rhyme family from a list. Returns { familyId, words }.
   */
  getRandomFamily(listId) {
    const families = this.getFamilies(listId);
    if (!families || families.size === 0) return null;
    const keys = Array.from(families.keys());
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return { familyId: randomKey, words: families.get(randomKey) };
  }
}


// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`Usage:
  node rhyme-finder.js <word> [--types perfect,near] [--limit 50] [--syllables N]
  node rhyme-finder.js --lists
  node rhyme-finder.js --list <list-id>
  node rhyme-finder.js --list <list-id> --family <familyId>
  node rhyme-finder.js --list <list-id> --rhymes-for <word>
  node rhyme-finder.js --list <list-id> --random`);
    process.exit(1);
  }

  const dictPath = path.join(__dirname, 'data', 'cmu-dict.json');
  const wordListsPath = path.join(__dirname, 'data', 'word-lists.json');

  // Parse args
  let word = null;
  let types = ['perfect', 'near'];
  let limit = 50;
  let syllableCount;
  let minStrength = 1;
  let showLists = false;
  let listId = null;
  let familyId = null;
  let rhymesForWord = null;
  let randomFamily = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lists') { showLists = true; }
    else if (args[i] === '--list' && args[i + 1]) { listId = args[++i]; }
    else if (args[i] === '--family' && args[i + 1]) { familyId = parseInt(args[++i], 10); }
    else if (args[i] === '--rhymes-for' && args[i + 1]) { rhymesForWord = args[++i]; }
    else if (args[i] === '--random') { randomFamily = true; }
    else if (args[i] === '--types' && args[i + 1]) { types = args[++i].split(','); }
    else if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[++i], 10); }
    else if (args[i] === '--syllables' && args[i + 1]) { syllableCount = parseInt(args[++i], 10); }
    else if (args[i] === '--min-strength' && args[i + 1]) { minStrength = parseInt(args[++i], 10); }
    else if (!args[i].startsWith('--')) { word = args[i]; }
  }

  // --- Word list commands ---
  if (showLists || listId) {
    const wlm = new WordListManager(wordListsPath);

    if (showLists) {
      console.log('Available word lists:\n');
      for (const l of wlm.getAllLists()) {
        console.log(`  ${l.id.padEnd(22)} | ${String(l.wordCount).padStart(5)} words | ${String(l.familyCount).padStart(4)} families | ${l.freepaid.padEnd(4)} | "${l.name}"`);
        console.log(`  ${''.padEnd(22)} | ${l.description}`);
      }
      process.exit(0);
    }

    const list = wlm.getList(listId);
    if (!list) {
      console.log(`List not found: "${listId}". Use --lists to see available lists.`);
      process.exit(1);
    }

    if (randomFamily) {
      const fam = wlm.getRandomFamily(listId);
      console.log(`Random family from "${list.name}" (family ${fam.familyId}):\n`);
      for (const w of fam.words) console.log(`  ${w}`);
      process.exit(0);
    }

    if (rhymesForWord) {
      const rhymes = wlm.getRhymesFor(rhymesForWord, listId);
      if (rhymes.length === 0) {
        console.log(`"${rhymesForWord}" not found in "${list.name}".`);
      } else {
        console.log(`Rhymes for "${rhymesForWord}" in "${list.name}":\n`);
        for (const w of rhymes) console.log(`  ${w}`);
      }
      process.exit(0);
    }

    if (familyId != null) {
      const words = wlm.getWordsByFamily(listId, familyId);
      if (words.length === 0) {
        console.log(`Family ${familyId} not found in "${list.name}".`);
      } else {
        console.log(`Family ${familyId} in "${list.name}":\n`);
        for (const w of words) console.log(`  ${w}`);
      }
      process.exit(0);
    }

    // Default: show all families in the list
    const families = wlm.getFamilies(listId);
    console.log(`"${list.name}" — ${list.words.length} words, ${families.size} rhyme families\n`);
    for (const [fid, words] of families) {
      console.log(`  Family ${String(fid).padStart(3)}: ${words.join(', ')}`);
    }
    process.exit(0);
  }

  // --- CMU dictionary rhyme lookup ---
  if (!word) {
    console.log('Please provide a word to look up rhymes for, or use --lists / --list.');
    process.exit(1);
  }

  console.log('Loading dictionary...');
  const finder = new CMURhymeFinder(dictPath);

  console.log(`\nFinding rhymes for "${word}" (types: ${types.join(', ')}, limit: ${limit}):\n`);

  const results = finder.findRhymes({ word, types, limit, syllableCount, minStrength });

  if (results.length === 0) {
    console.log('No rhymes found.');
  } else {
    for (const r of results) {
      const rank = finder._getFrequencyRank(r.word);
      const rankStr = rank ? ` (rank: ${rank})` : '';
      console.log(`  ${r.type.padEnd(7)} | strength: ${r.strength} | ${r.syllableCount || '?'} syl | ${r.word}${rankStr}`);
    }
    console.log(`\n${results.length} results`);
  }
}

module.exports = { CMURhymeFinder, WordListManager };
