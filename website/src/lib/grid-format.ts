export type BeatData = {
  word: string | null
  rhymeGroup: number | null
}

export type GridLine = {
  beats: BeatData[]
  section?: string
}

export type GridData = {
  lines: GridLine[]
}

// Matches a full-line section header like [Verse] or [Step 1: Listen].
// Must NOT match rhyme tokens like [:1 word] — those start with `:digit`.
const SECTION_RE = /^\[(?!:\d)([^\]]+)\]$/

function tokenize(line: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < line.length) {
    // Skip whitespace
    if (line[i] === ' ' || line[i] === '\t') { i++; continue }
    if (line[i] === '[') {
      // Bracket token — collect until ']'
      const start = i
      i++
      while (i < line.length && line[i] !== ']') i++
      if (i < line.length) i++ // consume ']'
      tokens.push(line.slice(start, i))
    } else {
      // Plain token (e.g. '_')
      const start = i
      while (i < line.length && line[i] !== ' ' && line[i] !== '\t') i++
      tokens.push(line.slice(start, i))
    }
  }
  return tokens
}

function parseBeatToken(token: string): BeatData {
  if (token === '_') return { word: null, rhymeGroup: null }

  // [:N word]
  const rhymeMatch = token.match(/^\[:(\d+)\s+(.+)\]$/)
  if (rhymeMatch) {
    return { word: rhymeMatch[2], rhymeGroup: parseInt(rhymeMatch[1], 10) }
  }

  // [word]
  const wordMatch = token.match(/^\[(.+)\]$/)
  if (wordMatch) {
    return { word: wordMatch[1], rhymeGroup: null }
  }

  // Bare word (treat as plain word)
  return { word: token, rhymeGroup: null }
}

export function parseGrid(text: string | string[]): GridData {
  const rawLines = Array.isArray(text) ? text : text.split('\n')
  const lines: GridLine[] = []
  let pendingSection: string | undefined

  for (const raw of rawLines) {
    const trimmed = raw.trim()
    if (!trimmed) continue

    // Check for section header
    const sectionMatch = trimmed.match(SECTION_RE)
    if (sectionMatch) {
      pendingSection = sectionMatch[1]
      continue
    }

    // Beat line
    const tokens = tokenize(trimmed)
    const beats = tokens.map(parseBeatToken)
    const line: GridLine = { beats }
    if (pendingSection !== undefined) {
      line.section = pendingSection
      pendingSection = undefined
    }
    lines.push(line)
  }

  return { lines }
}

export function serializeGrid(grid: GridData): string {
  const output: string[] = []
  let isFirst = true

  for (const line of grid.lines) {
    if (line.section !== undefined) {
      if (!isFirst) output.push('')
      output.push(`[${line.section}]`)
    }
    isFirst = false

    const tokens = line.beats.map(beat => {
      if (beat.word === null) return '_'
      if (beat.rhymeGroup !== null) return `[:${beat.rhymeGroup} ${beat.word}]`
      return `[${beat.word}]`
    })
    output.push(tokens.join(' '))
  }

  return output.join('\n')
}

export type DerivedSection = {
  name: string
  bars: number
  instrumental?: boolean
}

// Derive MixSection[] from grid section headers, so `sections` can be omitted
// on mixes that define everything in the grid.
export function deriveSectionsFromGrid(grid: GridData, beatsPerBar: number = 4): DerivedSection[] {
  const sections: DerivedSection[] = []
  let current: { name: string; lines: GridLine[] } | null = null

  function flush() {
    if (!current) return
    const bars = current.lines.reduce((sum, line) =>
      sum + Math.max(1, Math.floor(line.beats.length / beatsPerBar)), 0)
    const instrumental = (current.name === 'Break' || current.name === 'Intro' || current.name === 'Outro')
      && current.lines.every(l => l.beats.every(b => b.word === null))
    sections.push({ name: current.name, bars, ...(instrumental ? { instrumental: true } : {}) })
  }

  for (const line of grid.lines) {
    if (line.section !== undefined) {
      flush()
      current = { name: line.section, lines: [line] }
    } else if (current) {
      current.lines.push(line)
    } else {
      current = { name: 'Verse', lines: [line] }
    }
  }
  flush()
  return sections
}
