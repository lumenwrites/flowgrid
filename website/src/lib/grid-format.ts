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

const SECTION_RE = /^\[([^\]:]+)\]$/

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
