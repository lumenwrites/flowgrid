import { RHYME_COLORS, BEATS_PER_BAR, type RhymePattern, type BarsPerLine, type FillMode, type LoopInfo, getLoopForBar, isInstrumentalSection } from './constants'
import { type GridData } from './grid-format'

export type Word = {
  word: string
  familyId: number
}

export type WordList = {
  id: string
  name: string
  description: string
  difficulty: number
  words: Word[]
}

let barIdCounter = 0
function uid() { return `b${++barIdCounter}-${Date.now().toString(36)}` }

export type RhymeColor = {
  bg: string
  border: string
  activeBg: string
  activeBorder: string
}

export type BeatWord = {
  word: string
  rhymeGroup: number | null
  rhymeColor: RhymeColor | null
}

export type BarData = {
  id: string
  index: number
  rhymeWord: string
  rhymeColor: RhymeColor
  familyId: number
  rhymeHidden: boolean
  instrumental?: boolean
  beatWords?: (BeatWord | null)[]
}

// Mulberry32 — fast seeded 32-bit PRNG returning [0, 1)
function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBars(
  wordList: WordList,
  count: number,
  startIndex: number = 0,
  rhymePattern: RhymePattern = 'AABB',
  barsPerLine: BarsPerLine = 1,
  fillMode: FillMode = 'all',
  seed: number = 42,
): BarData[] {
  // Use seed + startIndex so extension chunks produce different sequences
  const random = mulberry32(seed + startIndex)

  const familyMap = new Map<number, string[]>()
  for (const w of wordList.words) {
    const list = familyMap.get(w.familyId) || []
    list.push(w.word)
    familyMap.set(w.familyId, list)
  }

  const families = Array.from(familyMap.entries()).filter(
    ([, words]) => words.length >= 2
  )

  if (families.length === 0) return []

  let colorIndex = 0
  let familyPool = shuffle(families, random)
  let poolIndex = 0

  function nextFamily(): [number, string[]] {
    if (poolIndex >= familyPool.length) {
      familyPool = shuffle(families, random)
      poolIndex = 0
    }
    return familyPool[poolIndex++]
  }

  // Build a sequence of line rhymes based on the pattern
  // Each "line" is barsPerLine bars; rhyme word shows on the last bar of each line
  const lineCount = Math.ceil(count / barsPerLine)
  const lineRhymes: { word: string; color: typeof RHYME_COLORS[0]; familyId: number }[] = []

  const visibleLines = lineCount

  if (rhymePattern === 'AABB') {
    // Lines rhyme in consecutive pairs: AA BB CC ...
    for (let i = 0; i < visibleLines; i += 2) {
      const [familyId, words] = nextFamily()
      const shuffled = shuffle(words, random)
      const color = RHYME_COLORS[colorIndex % RHYME_COLORS.length]
      colorIndex++
      lineRhymes.push({ word: shuffled[0], color, familyId })
      if (i + 1 < visibleLines) {
        lineRhymes.push({ word: shuffled[1 % shuffled.length], color, familyId })
      }
    }
  } else {
    // ABAB — lines 1&3 share a rhyme, lines 2&4 share a rhyme
    for (let i = 0; i < visibleLines; i += 4) {
      const [familyIdA, wordsA] = nextFamily()
      const [familyIdB, wordsB] = nextFamily()
      const shuffA = shuffle(wordsA, random)
      const shuffB = shuffle(wordsB, random)
      const colorA = RHYME_COLORS[colorIndex % RHYME_COLORS.length]
      colorIndex++
      const colorB = RHYME_COLORS[colorIndex % RHYME_COLORS.length]
      colorIndex++

      const group = [
        { word: shuffA[0], color: colorA, familyId: familyIdA },
        { word: shuffB[0], color: colorB, familyId: familyIdB },
        { word: shuffA[1 % shuffA.length], color: colorA, familyId: familyIdA },
        { word: shuffB[1 % shuffB.length], color: colorB, familyId: familyIdB },
      ]
      for (let j = 0; j < 4 && i + j < visibleLines; j++) {
        lineRhymes.push(group[j])
      }
    }
  }

  // Expand lines into bars
  const bars: BarData[] = []
  for (let lineIdx = 0; lineIdx < lineRhymes.length; lineIdx++) {
    const rhyme = lineRhymes[lineIdx]
    // Determine if rhyme is hidden based on fill mode and position in pair
    const posInPair = lineIdx % 2 // 0 = first line (setup), 1 = second line (punchline)
    const rhymeHidden =
      fillMode === 'all-blanks' ? true :
      fillMode === 'setup-punchline' ? posInPair === 0 :
      fillMode === 'off-the-cliff' ? posInPair === 1 :
      false
    for (let b = 0; b < barsPerLine; b++) {
      const barIdx = lineIdx * barsPerLine + b
      if (barIdx >= count) break
      bars.push({
        id: uid(),
        index: startIndex + barIdx,
        rhymeWord: rhyme.word,
        rhymeColor: rhyme.color,
        familyId: rhyme.familyId,
        rhymeHidden,
      })
    }
  }

  return bars
}

export function generateBarsFromGrid(
  grid: GridData,
  fillMode: FillMode = 'all',
): BarData[] {
  const bars: BarData[] = []
  let lineIdx = 0

  for (const line of grid.lines) {
    const beatsPerBar = BEATS_PER_BAR
    const barsInLine = Math.max(1, Math.floor(line.beats.length / beatsPerBar))
    const isInstrumental = line.section != null && isInstrumentalSection(line.section, line.beats)

    // Fill mode: position in pair (AABB-style)
    const posInPair = lineIdx % 2
    const rhymeHidden =
      fillMode === 'all-blanks' ? true :
      fillMode === 'setup-punchline' ? posInPair === 0 :
      fillMode === 'off-the-cliff' ? posInPair === 1 :
      false

    for (let b = 0; b < barsInLine; b++) {
      const barBeats = line.beats.slice(b * beatsPerBar, (b + 1) * beatsPerBar)

      // Find the last rhymed beat in this bar for rhymeWord/rhymeColor
      let lastRhymedBeat: { word: string; rhymeGroup: number } | null = null
      for (let i = barBeats.length - 1; i >= 0; i--) {
        if (barBeats[i].word !== null && barBeats[i].rhymeGroup !== null) {
          lastRhymedBeat = { word: barBeats[i].word!, rhymeGroup: barBeats[i].rhymeGroup! }
          break
        }
      }

      const rhymeColor = lastRhymedBeat
        ? RHYME_COLORS[(lastRhymedBeat.rhymeGroup - 1) % RHYME_COLORS.length]
        : { bg: 'transparent', border: 'transparent', activeBg: 'transparent', activeBorder: 'transparent' }

      const beatWords: (BeatWord | null)[] = barBeats.map(beat => {
        if (beat.word === null) return null
        const color = beat.rhymeGroup !== null
          ? RHYME_COLORS[(beat.rhymeGroup - 1) % RHYME_COLORS.length]
          : null
        return { word: beat.word, rhymeGroup: beat.rhymeGroup, rhymeColor: color }
      })

      bars.push({
        id: uid(),
        index: bars.length,
        rhymeWord: lastRhymedBeat?.word ?? '',
        rhymeColor,
        familyId: lastRhymedBeat?.rhymeGroup ?? -1,
        rhymeHidden,
        instrumental: isInstrumental || undefined,
        beatWords,
      })
    }

    lineIdx++
  }

  return bars
}

export const BLANK_COLOR: RhymeColor = { bg: 'transparent', border: 'transparent', activeBg: 'transparent', activeBorder: 'transparent' }

// Remaps a flat rhyme pool into display bars that account for instrumental sections.
//
// Problem: generateBars() produces a flat sequence where every line gets a rhyme.
// If an instrumental section (e.g. a 2-bar Break) falls between two Verses, it
// "consumes" a rhyme slot, shifting the AABB/ABAB pairing for all subsequent lines.
//
// Solution: this function walks absolute bar positions (0, 1, 2, ...) and for each:
//   - Instrumental section → inserts a blank bar (no rhyme, no color)
//   - Non-instrumental → pulls the next entry from rhymePool
// The rhyme cursor only advances for non-instrumental bars, so pairs stay intact.
//
// Example with barsPerLine=2, Verse(8) → Break(2) → Verse(8):
//   Positions 0-7 (Verse):  consume pool[0]..pool[7]
//   Positions 8-9 (Break):  blank bars inserted, pool not consumed
//   Positions 10-17 (Verse): consume pool[8]..pool[15]  ← pairing preserved
export function buildDisplayBars(rhymePool: BarData[], loopInfo: LoopInfo | null): BarData[] {
  if (!loopInfo) return rhymePool
  const hasInstrumental = loopInfo.loops.some(l => l.instrumental)
  if (!hasInstrumental) return rhymePool
  if (rhymePool.length === 0) return rhymePool

  const display: BarData[] = []
  let rhymeIdx = 0
  // Guard: if the tail section is instrumental (e.g. user switched to a Break
  // loop), barPos advances without consuming pool entries. Cap at 3x pool size
  // to prevent infinite iteration; extension will replenish the pool as needed.
  const maxBarPos = rhymePool.length * 3
  for (let barPos = 0; rhymeIdx < rhymePool.length && barPos < maxBarPos; barPos++) {
    const loop = getLoopForBar(barPos, loopInfo)
    if (loop?.instrumental) {
      display.push({ id: uid(), index: barPos, rhymeWord: '', rhymeColor: BLANK_COLOR, familyId: -1, rhymeHidden: false, instrumental: true })
    } else {
      display.push({ ...rhymePool[rhymeIdx], index: barPos })
      rhymeIdx++
    }
  }
  return display
}

import wordListsData from '@/data/word-lists.json'

type WordListRaw = WordList & { publicList?: boolean }

export function getWordLists(): WordList[] {
  const lists = wordListsData as WordListRaw[]
  return lists.filter((l) => l.publicList !== false)
}
