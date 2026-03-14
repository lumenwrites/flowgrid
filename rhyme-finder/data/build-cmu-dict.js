/**
 * build-cmu-dict.js
 *
 * Downloads the official CMU Pronouncing Dictionary and a word frequency list,
 * then merges them into data/cmu-dict.json in the same format the app expects:
 *
 *   { "word": { "p": ["K", "AE1", "T"], "r": 7891 }, ... }
 *
 * Sources:
 *   - CMU dict: https://github.com/cmusphinx/cmudict (BSD license)
 *   - Frequency: https://norvig.com/ngrams/count_1w.txt (Google Web Trillion Word Corpus)
 *
 * Usage:
 *   node build-cmu-dict.js
 */

const fs = require("fs");
const path = require("path");

const CMU_DICT_URL =
  "https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict";
const FREQ_URL = "https://norvig.com/ngrams/count_1w.txt";
const OUTPUT = path.join(__dirname, "cmu-dict.json");

async function fetchText(url) {
  console.log(`Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function parseCmuDict(text) {
  const dict = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";;;")) continue;

    // Strip inline comments: "aalborg(2) AA1 L B AO0 R G # place"
    const noComment = trimmed.split("#")[0].trim();
    if (!noComment) continue;

    // Split into word and phonemes (tab or double-space separated)
    const parts = noComment.split(/\s+/);
    if (parts.length < 2) continue;

    const rawWord = parts[0];

    // Skip alternate pronunciations like "word(2)", "word(3)"
    if (/\(\d+\)$/.test(rawWord)) continue;

    const word = rawWord.toLowerCase();
    const phonemes = parts.slice(1);

    dict[word] = { p: phonemes };
  }
  return dict;
}

function parseFrequencies(text) {
  // Sort by count descending, assign rank 1..N
  const entries = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [word, countStr] = trimmed.split("\t");
    if (!word || !countStr) continue;
    entries.push({ word: word.toLowerCase(), count: parseInt(countStr, 10) });
  }
  // Already sorted by count descending in the source, but let's be safe
  entries.sort((a, b) => b.count - a.count);

  const ranks = new Map();
  for (let i = 0; i < entries.length; i++) {
    const w = entries[i].word;
    if (!ranks.has(w)) ranks.set(w, i + 1);
  }
  return ranks;
}

async function main() {
  const [cmuText, freqText] = await Promise.all([
    fetchText(CMU_DICT_URL),
    fetchText(FREQ_URL),
  ]);

  const dict = parseCmuDict(cmuText);
  const ranks = parseFrequencies(freqText);

  // Merge frequency ranks into dict
  let matched = 0;
  for (const [word, entry] of Object.entries(dict)) {
    const rank = ranks.get(word);
    if (rank !== undefined) {
      entry.r = rank;
      matched++;
    }
  }

  // Sort keys alphabetically for stable output
  const sorted = {};
  for (const key of Object.keys(dict).sort()) {
    sorted[key] = dict[key];
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(sorted));

  const total = Object.keys(sorted).length;
  console.log(`\nDone!`);
  console.log(`  Words: ${total}`);
  console.log(`  With frequency rank: ${matched}`);
  console.log(`  Without rank: ${total - matched}`);
  console.log(`  Written to: ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
