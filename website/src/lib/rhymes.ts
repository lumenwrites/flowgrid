import { RHYME_COLORS, type RhymePattern, type BarsPerLine, type FillMode } from './constants'

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

export type BarData = {
  id: string
  index: number
  rhymeWord: string
  rhymeColor: RhymeColor
  familyId: number
  rhymeHidden: boolean
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
  seed: number = 42
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

  if (rhymePattern === 'AABB') {
    // Lines rhyme in consecutive pairs: AA BB CC ...
    for (let i = 0; i < lineCount; i += 2) {
      const [familyId, words] = nextFamily()
      const shuffled = shuffle(words, random)
      const color = RHYME_COLORS[colorIndex % RHYME_COLORS.length]
      colorIndex++
      lineRhymes.push({ word: shuffled[0], color, familyId })
      if (i + 1 < lineCount) {
        lineRhymes.push({ word: shuffled[1 % shuffled.length], color, familyId })
      }
    }
  } else {
    // ABAB — lines 1&3 share a rhyme, lines 2&4 share a rhyme
    for (let i = 0; i < lineCount; i += 4) {
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
      for (let j = 0; j < 4 && i + j < lineCount; j++) {
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

export async function loadWordLists(): Promise<WordList[]> {
  const res = await fetch('/data/word-lists.json')
  return res.json()
}
