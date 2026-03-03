import { RHYME_COLORS } from './constants'

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
}

export type BarData = {
  id: string
  index: number
  rhymeWord: string
  rhymeColor: RhymeColor
  familyId: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBars(
  wordList: WordList,
  count: number,
  startIndex: number = 0
): BarData[] {
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

  const bars: BarData[] = []
  let colorIndex = 0
  let familyPool = shuffle(families)
  let poolIndex = 0

  for (let i = 0; i < count; i += 2) {
    if (poolIndex >= familyPool.length) {
      familyPool = shuffle(families)
      poolIndex = 0
    }

    const [familyId, words] = familyPool[poolIndex++]
    const shuffledWords = shuffle(words)
    const color = RHYME_COLORS[colorIndex % RHYME_COLORS.length]
    colorIndex++

    bars.push({
      id: uid(),
      index: startIndex + i,
      rhymeWord: shuffledWords[0],
      rhymeColor: color,
      familyId,
    })

    if (i + 1 < count) {
      bars.push({
        id: uid(),
        index: startIndex + i + 1,
        rhymeWord: shuffledWords[1],
        rhymeColor: color,
        familyId,
      })
    }
  }

  return bars
}

export async function loadWordLists(): Promise<WordList[]> {
  const res = await fetch('/data/word-lists.json')
  return res.json()
}
