import { describe, it, expect } from 'vitest'
import { parseGrid, serializeGrid } from '../grid-format'
import { generateBarsFromGrid } from '../rhymes'

describe('parseGrid', () => {
  it('parses basic 4-beat grid', () => {
    const grid = parseGrid('_ _ _ [:1 time]\n_ _ _ [:1 lime]')
    expect(grid.lines).toHaveLength(2)
    expect(grid.lines[0].beats).toHaveLength(4)
    expect(grid.lines[0].beats[3]).toEqual({ word: 'time', rhymeGroup: 1 })
    expect(grid.lines[0].beats[0]).toEqual({ word: null, rhymeGroup: null })
  })

  it('parses 8-beat grid (barsPerLine=2)', () => {
    const grid = parseGrid('_ _ _ _ _ _ _ [:1 dawn]')
    expect(grid.lines).toHaveLength(1)
    expect(grid.lines[0].beats).toHaveLength(8)
    expect(grid.lines[0].beats[7]).toEqual({ word: 'dawn', rhymeGroup: 1 })
  })

  it('parses words on non-last beats', () => {
    const grid = parseGrid('_ [hello] _ [:1 time]')
    expect(grid.lines[0].beats[1]).toEqual({ word: 'hello', rhymeGroup: null })
    expect(grid.lines[0].beats[3]).toEqual({ word: 'time', rhymeGroup: 1 })
  })

  it('parses section headers', () => {
    const grid = parseGrid('[Verse]\n_ _ _ [:1 time]\n_ _ _ [:1 lime]\n\n[Chorus]\n_ _ _ [:2 money]')
    expect(grid.lines).toHaveLength(3)
    expect(grid.lines[0].section).toBe('Verse')
    expect(grid.lines[1].section).toBeUndefined()
    expect(grid.lines[2].section).toBe('Chorus')
  })

  it('ignores blank lines', () => {
    const grid = parseGrid('\n_ _ _ [:1 time]\n\n\n_ _ _ [:1 lime]\n')
    expect(grid.lines).toHaveLength(2)
  })

  it('parses string array input', () => {
    const grid = parseGrid(['_ _ _ [:1 time]', '_ _ _ [:1 lime]'])
    expect(grid.lines).toHaveLength(2)
  })
})

describe('serializeGrid', () => {
  it('serializes basic grid', () => {
    const grid = parseGrid('_ _ _ [:1 time]\n_ _ _ [:1 lime]')
    expect(serializeGrid(grid)).toBe('_ _ _ [:1 time]\n_ _ _ [:1 lime]')
  })

  it('serializes grid with sections', () => {
    const grid = parseGrid('[Verse]\n_ _ _ [:1 time]\n\n[Chorus]\n_ _ _ [:2 money]')
    const result = serializeGrid(grid)
    expect(result).toBe('[Verse]\n_ _ _ [:1 time]\n\n[Chorus]\n_ _ _ [:2 money]')
  })

  it('serializes plain words', () => {
    const grid = parseGrid('_ [hello] _ [:1 time]')
    expect(serializeGrid(grid)).toBe('_ [hello] _ [:1 time]')
  })
})

describe('roundtrip', () => {
  it('parseGrid → serializeGrid produces equivalent text', () => {
    const text = [
      '[Verse]',
      '_ _ _ [:1 time]',
      '_ _ _ [:1 lime]',
      '',
      '[Chorus]',
      '_ _ _ [:2 money]',
      '_ _ _ [:2 honey]',
    ].join('\n')
    expect(serializeGrid(parseGrid(text))).toBe(text)
  })
})

describe('generateBarsFromGrid', () => {
  it('produces correct BarData for 4-beat lines', () => {
    const grid = parseGrid([
      '_ _ _ [:1 time]',
      '_ _ _ [:1 lime]',
      '_ _ _ [:2 money]',
      '_ _ _ [:2 honey]',
    ])
    const bars = generateBarsFromGrid(grid)
    expect(bars).toHaveLength(4)
    expect(bars[0].rhymeWord).toBe('time')
    expect(bars[1].rhymeWord).toBe('lime')
    expect(bars[0].rhymeColor).toBe(bars[1].rhymeColor) // same rhyme group
    expect(bars[2].rhymeColor).not.toBe(bars[0].rhymeColor) // different group
  })

  it('produces correct BarData for 8-beat lines (2 bars per line)', () => {
    const grid = parseGrid([
      '_ _ _ _ _ _ _ [:1 dawn]',
      '_ _ _ _ _ _ _ [:1 gone]',
    ])
    const bars = generateBarsFromGrid(grid)
    // 8 beats = 2 bars per line, so 4 bars total
    expect(bars).toHaveLength(4)
    // The rhyme word should be on the second bar of each line
    expect(bars[1].rhymeWord).toBe('dawn')
    expect(bars[3].rhymeWord).toBe('gone')
    // First bar of each line has no rhyme
    expect(bars[0].rhymeWord).toBe('')
  })

  it('sets beatWords on bars', () => {
    const grid = parseGrid(['_ [hello] _ [:1 time]'])
    const bars = generateBarsFromGrid(grid)
    expect(bars[0].beatWords).toHaveLength(4)
    expect(bars[0].beatWords![0]).toBeNull()
    expect(bars[0].beatWords![1]!.word).toBe('hello')
    expect(bars[0].beatWords![1]!.rhymeColor).toBeNull()
    expect(bars[0].beatWords![3]!.word).toBe('time')
    expect(bars[0].beatWords![3]!.rhymeColor).not.toBeNull()
  })

  it('sets familyId from rhyme group', () => {
    const grid = parseGrid(['_ _ _ [:3 test]'])
    const bars = generateBarsFromGrid(grid)
    expect(bars[0].familyId).toBe(3)
  })

  it('marks instrumental sections', () => {
    const grid = parseGrid(['[Break]', '_ _ _ _'])
    const bars = generateBarsFromGrid(grid)
    expect(bars[0].instrumental).toBe(true)
  })

  it('applies fill mode setup-punchline', () => {
    const grid = parseGrid([
      '_ _ _ [:1 time]',
      '_ _ _ [:1 lime]',
    ])
    const bars = generateBarsFromGrid(grid, 'setup-punchline')
    expect(bars[0].rhymeHidden).toBe(true) // first line hidden
    expect(bars[1].rhymeHidden).toBe(false) // second line visible
  })

  it('applies fill mode off-the-cliff', () => {
    const grid = parseGrid([
      '_ _ _ [:1 time]',
      '_ _ _ [:1 lime]',
    ])
    const bars = generateBarsFromGrid(grid, 'off-the-cliff')
    expect(bars[0].rhymeHidden).toBe(false) // first visible
    expect(bars[1].rhymeHidden).toBe(true) // second hidden
  })

  it('applies fill mode all-blanks', () => {
    const grid = parseGrid(['_ _ _ [:1 time]'])
    const bars = generateBarsFromGrid(grid, 'all-blanks')
    expect(bars[0].rhymeHidden).toBe(true)
  })
})
