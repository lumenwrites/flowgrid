#!/usr/bin/env node
// Converts word-lists.json → individual .md files in word-lists/

const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const JSON_FILE = path.join(DATA_DIR, 'word-lists.json');
const OUT_DIR = path.join(DATA_DIR, 'word-lists');

// Main/general lists get underscore prefix; topic lists don't
const MAIN_IDS = new Set([
  'elementary',
  '1-syllable-words',
  '2-syllable-words',
  '3-syllable-words',
  'all-rhymes',
  'rap-dictionary',
]);

const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const list of data) {
  const { id, words, ...meta } = list;

  // Group words by familyId, preserving order
  const families = [];
  const familyMap = new Map();
  for (const { word, familyId } of words) {
    if (!familyMap.has(familyId)) {
      const group = [];
      familyMap.set(familyId, group);
      families.push(group);
    }
    familyMap.get(familyId).push(word);
  }

  // Build frontmatter
  const fm = { id, ...meta };
  const fmLines = ['---'];
  for (const [key, value] of Object.entries(fm)) {
    if (Array.isArray(value)) {
      fmLines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (typeof value === 'string') {
      fmLines.push(`${key}: ${value}`);
    } else {
      fmLines.push(`${key}: ${value}`);
    }
  }
  fmLines.push('---');

  // Build body: one line per rhyme family
  const bodyLines = families.map(group => group.join(', '));

  const content = fmLines.join('\n') + '\n' + bodyLines.join('\n') + '\n';

  const prefix = MAIN_IDS.has(id) ? '_' : '';
  const filename = `${prefix}${id}.md`;
  const filepath = path.join(OUT_DIR, filename);

  fs.writeFileSync(filepath, content);
  console.log(`  ${filename} (${families.length} families, ${words.length} words)`);
}

console.log(`\nDone. ${data.length} files written to word-lists/`);
