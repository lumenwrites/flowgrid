'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { type WordList, type BarData, getWordLists, generateBars } from '@/lib/rhymes'
import { BARS_BUFFER, INFINITE_INITIAL_BARS, INFINITE_EXTEND_CHUNK, type RhymePattern, type BarsPerLine, type FillMode } from '@/lib/constants'

export function useRhymes(rhymePattern: RhymePattern = 'AABB', barsPerLine: BarsPerLine = 1, initialListId: string = 'elementary', fillMode: FillMode = 'all', seed: number = 42) {
  const rhymePatternRef = useRef(rhymePattern)
  rhymePatternRef.current = rhymePattern
  const barsPerLineRef = useRef(barsPerLine)
  barsPerLineRef.current = barsPerLine
  const fillModeRef = useRef(fillMode)
  fillModeRef.current = fillMode
  const seedRef = useRef(seed)
  seedRef.current = seed
  const [wordLists] = useState<WordList[]>(() => getWordLists())
  const [selectedListId, setSelectedListId] = useState<string>(initialListId)
  const [bars, setBars] = useState<BarData[]>([])
  const selectedListRef = useRef<WordList | undefined>(undefined)

  // Keep ref in sync
  const selectedList = wordLists.find((l) => l.id === selectedListId)
  selectedListRef.current = selectedList

  // Generate initial bars when word list or rhyme pattern changes
  useEffect(() => {
    if (!selectedList) return
    const newBars = generateBars(selectedList, INFINITE_INITIAL_BARS, 0, rhymePattern, barsPerLine, fillMode, seed)
    setBars(newBars)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListId, wordLists, rhymePattern, barsPerLine, fillMode, seed])

  const extendBars = useCallback(
    (currentBar: number) => {
      const list = selectedListRef.current
      if (!list) return
      setBars((prev) => {
        const lastBar = prev[prev.length - 1]
        const remaining = lastBar ? lastBar.index - currentBar + 1 : 0
        if (remaining < BARS_BUFFER) {
          const startIdx = lastBar ? lastBar.index + 1 : currentBar
          const newBars = generateBars(list, INFINITE_EXTEND_CHUNK, startIdx, rhymePatternRef.current, barsPerLineRef.current, fillModeRef.current, seedRef.current)
          return [...prev, ...newBars]
        }
        return prev
      })
    },
    []
  )

  const changeWordList = useCallback((listId: string) => {
    setSelectedListId(listId)
  }, [])

  const regenerate = useCallback(() => {
    const list = selectedListRef.current
    if (!list) return
    const count = INFINITE_INITIAL_BARS
    const newBars = generateBars(list, count, 0, rhymePatternRef.current, barsPerLineRef.current, fillModeRef.current, seedRef.current)
    setBars(newBars)
  }, [])

  return {
    wordLists,
    selectedListId,
    bars,
    changeWordList,
    extendBars,
    regenerate,
  }
}
