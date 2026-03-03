'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { type WordList, type BarData, loadWordLists, generateBars } from '@/lib/rhymes'
import { DEFAULT_BAR_COUNT, BARS_BUFFER, INFINITE_INITIAL_BARS, INFINITE_EXTEND_CHUNK, type RhymePattern, type BarsPerLine, type FillMode } from '@/lib/constants'

export function useRhymes(rhymePattern: RhymePattern = 'AABB', barsPerLine: BarsPerLine = 1, barCount: number = DEFAULT_BAR_COUNT, initialListId: string = 'elementary', fillMode: FillMode = 'all', seed: number = 42) {
  const barCountRef = useRef(barCount)
  barCountRef.current = barCount
  const rhymePatternRef = useRef(rhymePattern)
  rhymePatternRef.current = rhymePattern
  const barsPerLineRef = useRef(barsPerLine)
  barsPerLineRef.current = barsPerLine
  const fillModeRef = useRef(fillMode)
  fillModeRef.current = fillMode
  const seedRef = useRef(seed)
  seedRef.current = seed
  const [wordLists, setWordLists] = useState<WordList[]>([])
  const [selectedListId, setSelectedListId] = useState<string>(initialListId)
  const [bars, setBars] = useState<BarData[]>([])
  const selectedListRef = useRef<WordList | undefined>(undefined)

  // Keep ref in sync
  const selectedList = wordLists.find((l) => l.id === selectedListId)
  selectedListRef.current = selectedList

  useEffect(() => {
    let cancelled = false
    loadWordLists().then((lists) => {
      if (!cancelled) setWordLists(lists)
    })
    return () => { cancelled = true }
  }, [])

  // Generate initial bars when word list or rhyme pattern changes
  useEffect(() => {
    if (!selectedList) return
    const count = barCount === 0 ? INFINITE_INITIAL_BARS : barCount
    const newBars = generateBars(selectedList, count, 0, rhymePattern, barsPerLine, fillMode, seed)
    setBars(newBars)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListId, wordLists, rhymePattern, barsPerLine, barCount, fillMode, seed])

  const extendBars = useCallback(
    (currentBar: number) => {
      // Only extend in infinite mode
      if (barCountRef.current !== 0) return
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
    const count = barCountRef.current === 0 ? INFINITE_INITIAL_BARS : barCountRef.current
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
