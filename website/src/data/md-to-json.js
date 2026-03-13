#!/usr/bin/env node
// Converts word-lists/*.md → word-lists.json

const fs = require('fs');
const path = require('path');

const DATA_DIR = __dirname;
const MD_DIR = path.join(DATA_DIR, 'word-lists');
const JSON_FILE = path.join(DATA_DIR, 'word-lists.json');

// Read the existing JSON to preserve ordering
const existingData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf-8'));
const existingOrder = existingData.map(d => d.id);

const files = fs.readdirSync(MD_DIR).filter(f => f.endsWith('.md'));
const lists = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(MD_DIR, file), 'utf-8');

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    console.warn(`  Skipping ${file}: no frontmatter found`);
    continue;
  }

  const fmText = fmMatch[1];
  const body = fmMatch[2].trim();

  // Parse frontmatter key-value pairs
  const meta = {};
  for (const line of fmText.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // Parse typed values
    if (value.startsWith('[')) {
      value = JSON.parse(value);
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (/^-?\d+$/.test(value)) {
      value = parseInt(value, 10);
    } else if (/^-?\d+\.\d+$/.test(value)) {
      value = parseFloat(value);
    }

    meta[key] = value;
  }

  // Parse body: each non-empty line is a rhyme family
  const words = [];
  let familyId = 1;
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const wordList = trimmed.split(',').map(w => w.trim()).filter(Boolean);
    for (const word of wordList) {
      words.push({ word, familyId });
    }
    familyId++;
  }

  // Build the list object with id first, then other meta, then words
  const { id, ...restMeta } = meta;
  const listObj = { id, ...restMeta, words };

  lists.push(listObj);
  console.log(`  ${file} → ${id} (${familyId - 1} families, ${words.length} words)`);
}

// Sort to match existing order, new lists go at the end
lists.sort((a, b) => {
  const ai = existingOrder.indexOf(a.id);
  const bi = existingOrder.indexOf(b.id);
  if (ai === -1 && bi === -1) return 0;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
});

fs.writeFileSync(JSON_FILE, JSON.stringify(lists, null, 2) + '\n');
console.log(`\nDone. ${lists.length} lists written to word-lists.json`);
